import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { useApp } from './AppContext';
import { useProductivity } from './ProductivityContext';
import { useAI } from './AIContext';
import { aiService } from '../utils/aiService';
import { getLocalISO, formatTimestampLocal } from '../utils/dateUtils';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  setDoc, 
  doc, 
  serverTimestamp
} from 'firebase/firestore';

const QuestContext = createContext();

export const useQuests = () => useContext(QuestContext);

export const QuestProvider = ({ children }) => {
  const { user } = useAuth();
  const { avatarState, earnXP, increaseShadowXP, globalStats, meals, purchases, goalDeposits } = useApp();
  const { todos, habitLogs } = useProductivity();
  const { aiSettings } = useAI();
  
  const [dailyQuests, setDailyQuests] = useState(null);
  const [weeklyQuest, setWeeklyQuest] = useState(null);
  const [loading, setLoading] = useState(true);
  const generationAttempted = React.useRef(false);
  const weeklyGenerationAttempted = React.useRef(false);

  const todayStr = useMemo(() => getLocalISO(), []);

  const currentWeek = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
    const monday = new Date(now.setDate(diff));
    return monday.toISOString().split('T')[0];
  }, []);

  const generateQuests = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    
    const context = {
        level: avatarState.level,
        shadowLevel: avatarState.shadowLevel || 0,
        stats: globalStats,
        pendingTodos: todos.filter(t => !t.completed).length,
        activeHabits: habitLogs.filter(l => l.date === todayStr).length,
        language: aiSettings.language || 'english'
    };

    const prompt = `Generate 3 unique financial/productivity "Daily Quests" for a Level ${context.level} user. 
    ${context.shadowLevel > 0 ? `IMPORTANT: The user has a Shadow Rival (Level ${context.shadowLevel}). Make one quest a "Redemption Quest" that is slightly harder but reduces shadow. Example title: "Shadow Cleansing".` : ''}
    Current Stats: Spent ${context.stats.totalSpent} BDT, ${context.pendingTodos} pending tasks.
    LANGUAGE: Output all titles and descriptions in ${context.language}.
    Return ONLY a JSON array of 3 objects: 
    { "id": string, "title": string, "description": string, "type": "frugal|data|wealth|productivity", "target": number, "xp": number, "rewardType": "frugality|wealth|consistency", "isRedemption": boolean }
    Example: { "id": "q1", "title": "Budget Hero", "description": "Spend less than 500 BDT today", "type": "frugal", "target": 500, "xp": 50, "rewardType": "frugality", "isRedemption": false }`;

    try {
        const response = await aiService.requestAI(aiSettings, [
            { role: "system", content: `You are a gamification engine. Output strictly JSON array in ${context.language}.` },
            { role: "user", content: prompt }
        ]);
        
        console.log("AI Quest Response:", response);
        let quests = [];
        try {
            const cleanJson = response.includes('```') ? response.match(/\[[\s\S]*\]/)?.[0] : response;
            quests = JSON.parse(cleanJson);
            if (!Array.isArray(quests) || quests.length === 0) throw new Error("Invalid format");
        } catch (e) {
            console.warn("AI Quest Parsing failed, using fallbacks:", e);
            if (context.language === 'bangla') {
                quests = [
                    { id: "f1", title: "সাশ্রয়ী শুরু", description: "আজ একটি খাবার লগ করুন", type: "frugal", target: 1, xp: 20, rewardType: "frugality" },
                    { id: "d1", title: "ধারাবাহিকতা পরীক্ষা", description: "একটি কাজ সম্পন্ন করুন", type: "productivity", target: 1, xp: 20, rewardType: "consistency" },
                    { id: "w1", title: "ভবিষ্যৎ সঞ্চয়কারী", description: "আপনার লক্ষ্যগুলো চেক করুন", type: "wealth", target: 1, xp: 20, rewardType: "wealth" }
                ];
            } else {
                quests = [
                    { id: "f1", title: "Frugal Start", description: "Log a meal today", type: "frugal", target: 1, xp: 20, rewardType: "frugality" },
                    { id: "d1", title: "Consistency Check", description: "Complete a task", type: "productivity", target: 1, xp: 20, rewardType: "consistency" },
                    { id: "w1", title: "Future Saver", description: "Check your goals", type: "wealth", target: 1, xp: 20, rewardType: "wealth" }
                ];
            }
        }

        const questDoc = {
            uid: user.uid,
            date: todayStr,
            language: context.language,
            tasks: quests.slice(0, 3).map((q, idx) => ({ 
                ...q, 
                id: q.id || `q_${idx}`,
                completed: false, 
                progress: 0 
            })),
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
  }, [user, avatarState.level, globalStats, todos, habitLogs, todayStr, aiSettings]);

  const generateWeeklyQuest = useCallback(async () => {
    if (!user) return;

    const language = aiSettings.language || 'english';
    const prompt = `Generate ONE "Weekly Mega Quest" for a Level ${avatarState.level} user.
    Stats: Total Debt ${globalStats.totalDebt}, Total Spent ${globalStats.totalSpent}.
    LANGUAGE: Output title and description in ${language}.
    Return ONLY a JSON object:
    { "title": string, "description": string, "type": "wealth|frugality|consistency", "target": number, "xp": number }
    Example: { "title": "Debt Crusher", "description": "Pay off 2,000 BDT of debt this week", "type": "wealth", "target": 2000, "xp": 500 }`;

    try {
        const response = await aiService.requestAI(aiSettings, [
            { role: "system", content: `You are a senior gamification designer. Output strictly JSON object in ${language}.` },
            { role: "user", content: prompt }
        ]);

        console.log("AI Weekly Quest Response:", response);
        let quest = null;
        try {
            const cleanJson = response.includes('```') ? response.match(/\{[\s\S]*\}/)?.[0] : response;
            quest = JSON.parse(cleanJson);
            if (!quest || !quest.title) throw new Error("Invalid format");
        } catch (e) {
            console.warn("AI Weekly Quest Parsing failed, using fallback:", e);
            if (language === 'bangla') {
                quest = { title: "সাপ্তাহিক প্রচেষ্টা", description: "এই সপ্তাহে ১৫টি কাজ সম্পন্ন করুন", type: "consistency", target: 15, xp: 400 };
            } else {
                quest = { title: "Weekly Hustle", description: "Complete 15 tasks this week", type: "consistency", target: 15, xp: 400 };
            }
        }

        const questDoc = {
            uid: user.uid,
            weekStart: currentWeek,
            language: language,
            ...quest,
            progress: 0,
            completed: false,
            claimed: false,
            createdAt: serverTimestamp()
        };

        await setDoc(doc(db, 'weekly_quests', `${user.uid}_${currentWeek}`), questDoc);
    } catch (error) {
        console.error("Weekly Quest Error:", error);
    }
  }, [user, avatarState.level, globalStats, aiSettings, currentWeek]);

  // 1. Fetch Today's Quests from Firestore
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'daily_quests'), 
      where('uid', '==', user.uid), 
      where('date', '==', todayStr)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const language = aiSettings.language || 'english';
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        // If language changed, regenerate
        if (data.language && data.language !== language) {
            generateQuests();
            return;
        }
        setDailyQuests({ id: snapshot.docs[0].id, ...data });
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
    }, (err) => {
        console.error("Daily Quests Snapshot Error:", err);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user, todayStr, generateQuests, aiSettings.language]);

  // 1.1 Fetch Weekly Quest
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'weekly_quests'), 
      where('uid', '==', user.uid), 
      where('weekStart', '==', currentWeek)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const language = aiSettings.language || 'english';
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        // If language changed, regenerate
        if (data.language && data.language !== language) {
            generateWeeklyQuest();
            return;
        }
        setWeeklyQuest({ id: snapshot.docs[0].id, ...data });
      } else {
        if (!weeklyGenerationAttempted.current) {
            weeklyGenerationAttempted.current = true;
            generateWeeklyQuest();
        }
      }
    }, (err) => {
        console.error("Weekly Quest Snapshot Error:", err);
    });

    return () => unsubscribe();
  }, [user, currentWeek, generateWeeklyQuest, aiSettings.language]);

  // 3. Automated Progress Tracker
  useEffect(() => {
    if (!dailyQuests || dailyQuests.claimed || !user || loading) return;

    let hasChanges = false;
    const updatedTasks = dailyQuests.tasks.map(task => {
        if (task.completed) return task;

        let progress = 0;
        let completed = false;

        switch (task.type) {
            case 'frugal': {
                const spentToday = meals.filter(m => m.date === todayStr).reduce((a,c) => a + Number(c.amount), 0) +
                                   purchases.filter(p => p.date === todayStr).reduce((a,c) => a + Number(c.amount), 0);
                
                let perkBonus = 1.0;
                if ((avatarState.xp_frugality || 0) >= 1500) perkBonus = 1.10;
                else if ((avatarState.xp_frugality || 0) >= 500) perkBonus = 1.05;
                
                const effectiveTarget = task.target * perkBonus;

                if (spentToday > 0 && spentToday <= effectiveTarget) {
                    progress = 1;
                    completed = true;
                } else if (spentToday > effectiveTarget) {
                    progress = 0;
                    completed = false;
                }
                break;
            }
            case 'productivity': {
                const doneToday = todos.filter(t => {
                    if (!t.completed) return false;
                    const doneDate = formatTimestampLocal(t.updatedAt);
                    return doneDate === todayStr;
                }).length;
                progress = Math.min(1, doneToday / task.target);
                completed = progress >= 1;
                break;
            }
            case 'wealth': {
                const savedToday = goalDeposits.filter(d => d.date === todayStr).reduce((a,c) => a + Number(c.amount), 0);
                progress = Math.min(1, savedToday / task.target);
                completed = progress >= 1;
                break;
            }
            case 'data': {
                const entries = meals.filter(m => m.date === todayStr).length + purchases.filter(p => p.date === todayStr).length;
                progress = Math.min(1, entries / task.target);
                completed = progress >= 1;
                break;
            }
        }

        if (progress !== task.progress || completed !== task.completed) {
            hasChanges = true;
            return { ...task, progress, completed };
        }
        return task;
    });

    if (hasChanges) {
        const isAllDone = updatedTasks.every(t => t.completed);
        setDoc(doc(db, 'daily_quests', dailyQuests.id), { 
            tasks: updatedTasks, 
            isAllCompleted: isAllDone 
        }, { merge: true });
    }
  }, [meals, purchases, todos, goalDeposits, dailyQuests?.id, todayStr, user, loading, avatarState.xp_frugality]);

  // 3.1 Weekly Progress Tracker
  useEffect(() => {
    if (!weeklyQuest || weeklyQuest.claimed || !user || loading) return;

    let progress = 0;
    let completed = false;

    const weekStart = new Date(currentWeek);
    const filterByWeek = (items) => items.filter(i => {
        const itemDateStr = i.date || formatTimestampLocal(i.createdAt);
        if (!itemDateStr) return false;
        return new Date(itemDateStr) >= weekStart;
    });

    switch (weeklyQuest.type) {
        case 'frugality': {
            const spentThisWeek = filterByWeek(meals).reduce((a,c) => a + Number(c.amount), 0) +
                                  filterByWeek(purchases).reduce((a,c) => a + Number(c.amount), 0);
            
            let perkBonus = 1.0;
            if ((avatarState.xp_frugality || 0) >= 1500) perkBonus = 1.10;
            else if ((avatarState.xp_frugality || 0) >= 500) perkBonus = 1.05;
            
            const effectiveTarget = weeklyQuest.target * perkBonus;

            if (spentThisWeek > 0 && spentThisWeek <= effectiveTarget) {
                progress = 1;
                completed = true;
            }
            break;
        }
        case 'consistency': {
            const doneThisWeek = todos.filter(t => {
                if (!t.completed || !t.updatedAt) return false;
                const doneDateStr = formatTimestampLocal(t.updatedAt);
                return doneDateStr && new Date(doneDateStr) >= weekStart;
            }).length;
            progress = Math.min(1, doneThisWeek / weeklyQuest.target);
            completed = progress >= 1;
            break;
        }
        case 'wealth': {
            const savedThisWeek = filterByWeek(goalDeposits).reduce((a,c) => a + Number(c.amount), 0);
            progress = Math.min(1, savedThisWeek / weeklyQuest.target);
            completed = progress >= 1;
            break;
        }
    }

    if (progress !== weeklyQuest.progress || completed !== weeklyQuest.completed) {
        setDoc(doc(db, 'weekly_quests', weeklyQuest.id), { 
            progress, 
            completed 
        }, { merge: true });
    }
  }, [meals, purchases, todos, goalDeposits, weeklyQuest?.id, currentWeek, user, loading, avatarState.xp_frugality]);

  const claimQuestReward = async (taskId) => {
    if (!dailyQuests || dailyQuests.claimed) return;

    const task = dailyQuests.tasks.find(t => t.id === taskId);
    if (task && task.completed && !task.rewardClaimed) {
        // 1. Grant XP
        await earnXP(task.xp || 50, task.type || 'frugality', 'quest');

        // 1.1 Shadow Redemption
        if (task.isRedemption) {
            await increaseShadowXP(-500); // Significant shadow reduction
        }

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

  const claimWeeklyReward = async () => {
    if (!weeklyQuest || weeklyQuest.claimed || !weeklyQuest.completed) return;
    
    await earnXP(weeklyQuest.xp, weeklyQuest.type, 'weekly_quest');
    await setDoc(doc(db, 'weekly_quests', weeklyQuest.id), { 
        claimed: true 
    }, { merge: true });
  };

  const forceRegenerate = async () => {
    setLoading(true);
    await generateQuests();
    await generateWeeklyQuest();
    setLoading(false);
  };

  return (
    <QuestContext.Provider value={{ dailyQuests, weeklyQuest, loading, claimQuestReward, claimWeeklyReward, generateQuests, generateWeeklyQuest, forceRegenerate }}>
      {children}
    </QuestContext.Provider>
  );
};