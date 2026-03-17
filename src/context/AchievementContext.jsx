import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { useApp } from './AppContext';
import { useProductivity } from './ProductivityContext';
import { ACHIEVEMENTS } from '../utils/achievements';
import { playSound } from '../utils/soundEffects';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc,
  serverTimestamp
} from 'firebase/firestore';

const AchievementContext = createContext();

export const useAchievements = () => useContext(AchievementContext);

export const AchievementProvider = ({ children }) => {
    const { user } = useAuth();
    const { globalStats, goals, goalDeposits, budgets, meals, purchases, earnXP, avatarState } = useApp();
    const { todos, habitLogs } = useProductivity();
    
    const [earnedIds, setEarnedIds] = useState([]);
    const [loading, setLoading] = useState(true);

    const unlockAchievement = useCallback(async (achievement) => {
        if (!user) return;
        try {
            // Save to Firestore
            await addDoc(collection(db, 'user_achievements'), {
                uid: user.uid,
                userId: user.uid,
                achievementId: achievement.id,
                unlockedAt: serverTimestamp()
            });

            // Grant XP
            await earnXP(achievement.rewardXP, achievement.type, `achievement_${achievement.id}`);
            
            // UI Feedback
            playSound('levelUp'); 
            console.log(`Achievement Unlocked: ${achievement.title}`);
        } catch (error) {
            console.error("Achievement Unlock Error:", error);
        }
    }, [user, earnXP]);

    // 1. Fetch earned achievements from Firestore
    useEffect(() => {
        if (!user) return;

        const q = query(collection(db, 'user_achievements'), where('uid', '==', user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ids = snapshot.docs.map(doc => doc.data().achievementId);
            setEarnedIds(ids);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // 2. Logic to check and unlock achievements
    useEffect(() => {
        if (!user || loading || !avatarState?.id) return;

        const checkAchievements = async () => {
            for (const achievement of ACHIEVEMENTS) {
                if (earnedIds.includes(achievement.id)) continue;

                const isUnlocked = achievement.check(
                    globalStats, 
                    goals, 
                    goalDeposits, 
                    todos, 
                    habitLogs, 
                    budgets, 
                    meals, 
                    purchases
                );

                if (isUnlocked) {
                    await unlockAchievement(achievement);
                }
            }
        };

        const timer = setTimeout(checkAchievements, 2000); // Debounce check
        return () => clearTimeout(timer);
    }, [globalStats, goals, goalDeposits, todos, habitLogs, budgets, meals, purchases, earnedIds, avatarState?.id, user, loading, unlockAchievement]);

    const value = {
        earnedIds,
        loading,
        achievements: ACHIEVEMENTS.map(a => ({
            ...a,
            unlocked: earnedIds.includes(a.id)
        }))
    };

    return (
        <AchievementContext.Provider value={value}>
            {children}
        </AchievementContext.Provider>
    );
};
