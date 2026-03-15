import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { useApp } from './AppContext';
import { useProductivity } from './ProductivityContext';
import { useAI } from './AIContext';
import { aiService } from '../utils/aiService';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  setDoc, 
  doc, 
  serverTimestamp,
  getDocs,
  limit,
  orderBy
} from 'firebase/firestore';

const QuestContext = createContext();

export const useQuests = () => useContext(QuestContext);

export const QuestProvider = ({ children }) => {
  const { user } = useAuth();
  const { avatarState, earnXP, globalStats, meals, purchases, goalDeposits } = useApp();
  const { todos, habitLogs } = useProductivity();
  const { aiSettings } = useAI();
  
  const [dailyQuests, setDailyQuests] = useState(null);
  const [loading, setLoading] = useState(true);
  const generationAttempted = React.useRef(false);

  const todayStr = useMemo(() => {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().split('T')[0];
  }, []);

  // 1. Fetch Today's Quests from Firestore
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'daily_quests'), 
      where('uid', '==', user.uid), 
      where('date', '==', todayStr)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setDailyQuests({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
        setLoading(false);
      } else {
        setDailyQuests(null);
        if (!generationAttempted.current) {
            generationAttempted.current = true;
            generateQuests();
        } else {
            setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, [user, todayStr]);

  // 2. AI Generation Logic
  const generateQuests = async () => {
    if (!user) return;

    setLoading(true);
    
    const context = {
        level: avatarState.level,
        stats: globalStats,
        pendingTodos: todos.filter(t => !t.completed).length,
        activeHabits: habitLogs.filter(l => l.date === todayStr).length
    };

    const prompt = `Generate 3 unique financial/productivity "Daily Quests" for a Level ${context.level} user. 
    Current Stats: Spent ${context.stats.totalSpent} BDT, ${context.pendingTodos} pending tasks.
    Return ONLY a JSON array of 3 objects: 
    { "id": string, "title": string, "description": string, "type": "frugal|data|wealth|productivity", "target": number, "xp": number, "rewardType": "frugality|wealth|consistency" }
    Example: { "id": "q1", "title": "Budget Hero", "description": "Spend less than 500 BDT today", "type": "frugal", "target": 500, "xp": 50, "rewardType": "frugality" }`;

    try {
        const response = await aiService.requestAI(aiSettings, [
            { role: "system", content: "You are a gamification engine for a financial app. Output strictly JSON." },
            { role: "user", content: prompt }
        ]);
        
        let quests = [];
        try {
            const cleanJson = response.includes('```') ? response.match(/\[[\s\S]*\]/)?.[0] : response;
            quests = JSON.parse(cleanJson);
        } catch (e) {
            // Fallback default quests if AI fails
            quests = [
                { id: "f1", title: "Frugal Start", description: "Log a meal today", type: "frugal", target: 1, xp: 20, rewardType: "frugality" },
                { id: "d1", title: "Consistency Check", description: "Complete a task", type: "productivity", target: 1, xp: 20, rewardType: "consistency" },
                { id: "w1", title: "Future Saver", description: "Check your goals", type: "wealth", target: 1, xp: 20, rewardType: "wealth" }
            ];
        }

        const questDoc = {
            uid: user.uid,
            date: todayStr,
            tasks: quests.map(q => ({ ...q, completed: false, progress: 0 })),
            isAllCompleted: false,
            claimed: false,
            createdAt: serverTimestamp()
        };

        await setDoc(doc(db, 'daily_quests', `${user.uid}_${todayStr}`), questDoc);
    } catch (error) {
        console.error("Quest Generation Error:", error);
    } finally {
        setLoading(false);
    }
  };

  // 3. Automated Progress Tracker
  useEffect(() => {
    if (!dailyQuests || dailyQuests.claimed || !user) return;

    const updatedTasks = dailyQuests.tasks.map(task => {
        if (task.completed) return task;

        let progress = 0;
        let completed = false;

        switch (task.type) {
            case 'frugal':
                // Example: Spend less than target
                const spentToday = meals.filter(m => m.date === todayStr).reduce((a,c) => a + Number(c.amount), 0) +
                                   purchases.filter(p => p.date === todayStr).reduce((a,c) => a + Number(c.amount), 0);
                if (spentToday > 0 && spentToday <= task.target) {
                    progress = 1;
                    completed = true;
                }
                break;
            case 'productivity':
                const doneToday = todos.filter(t => t.completed && t.updatedAt?.toDate()?.toISOString().split('T')[0] === todayStr).length;
                progress = Math.min(1, doneToday / task.target);
                completed = progress >= 1;
                break;
            case 'wealth':
                const savedToday = goalDeposits.filter(d => d.date === todayStr).reduce((a,c) => a + Number(c.amount), 0);
                progress = Math.min(1, savedToday / task.target);
                completed = progress >= 1;
                break;
            case 'data':
                const entries = meals.filter(m => m.date === todayStr).length + purchases.filter(p => p.date === todayStr).length;
                progress = Math.min(1, entries / task.target);
                completed = progress >= 1;
                break;
        }

        return { ...task, progress, completed };
    });

    const isDifferent = JSON.stringify(updatedTasks) !== JSON.stringify(dailyQuests.tasks);
    
    if (isDifferent) {
        const isAllDone = updatedTasks.every(t => t.completed);
        setDoc(doc(db, 'daily_quests', dailyQuests.id), { 
            tasks: updatedTasks, 
            isAllCompleted: isAllDone 
        }, { merge: true });
    }
  }, [meals, purchases, todos, goalDeposits, dailyQuests, todayStr, user]);

  const claimQuestReward = async (taskId) => {
    if (!dailyQuests || dailyQuests.claimed) return;
    
    const task = dailyQuests.tasks.find(t => t.id === taskId);
    if (task && task.completed && !task.rewardClaimed) {
        // 1. Grant XP
        await earnXP(task.xp, task.rewardType, 'quest');
        
        // 2. Mark task as claimed locally
        const updatedTasks = dailyQuests.tasks.map(t => 
            t.id === taskId ? { ...t, rewardClaimed: true } : t
        );

        // 3. Update Firestore
        const allClaimed = updatedTasks.every(t => t.rewardClaimed);
        await setDoc(doc(db, 'daily_quests', dailyQuests.id), { 
            tasks: updatedTasks,
            claimed: allClaimed
        }, { merge: true });
    }
  };

  return (
    <QuestContext.Provider value={{ dailyQuests, loading, claimQuestReward, generateQuests }}>
      {children}
    </QuestContext.Provider>
  );
};