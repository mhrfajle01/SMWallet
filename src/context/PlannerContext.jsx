import React, { createContext, useState, useEffect, useContext } from 'react';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  query, 
  where,
  serverTimestamp 
} from 'firebase/firestore';

const PlannerContext = createContext();

export const usePlanner = () => useContext(PlannerContext);

export const PlannerProvider = ({ children }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [waterStats, setWaterStats] = useState({ current: 0, goal: 8 });
  const [loading, setLoading] = useState(true);

  // Helper: Get today's date string in local timezone YYYY-MM-DD
  const getTodayStr = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().split('T')[0];
  };

  // Fetch Tasks
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'planner_tasks'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => {
        // Sort by Date first
        if (a.date !== b.date) return new Date(a.date) - new Date(b.date);
        // Then by Time
        if (!a.time) return 1; 
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
      });
      setTasks(taskData);
    });
    return () => unsubscribe();
  }, [user]);

  // Fetch Habits
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'planner_habits'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const habitData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setHabits(habitData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // Fetch Water
  useEffect(() => {
    if (!user) return;
    const today = getTodayStr();
    const q = query(collection(db, 'planner_water'), where('uid', '==', user.uid), where('date', '==', today));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setWaterStats({ current: data.amount, goal: data.goal || 8, id: snapshot.docs[0].id });
      } else {
        setWaterStats({ current: 0, goal: 8, id: null });
      }
    });
    return () => unsubscribe();
  }, [user]);

  // --- Water Actions ---
  const updateWater = async (amount) => {
    const today = getTodayStr();
    const newAmount = Math.max(0, amount);
    
    if (waterStats.id) {
      await updateDoc(doc(db, 'planner_water', waterStats.id), {
        amount: newAmount
      });
    } else {
      await addDoc(collection(db, 'planner_water'), {
        uid: user.uid,
        date: today,
        amount: newAmount,
        goal: 8
      });
    }
  };

  // --- Task Actions ---

  const addTask = async (taskData) => {
    await addDoc(collection(db, 'planner_tasks'), {
      uid: user.uid,
      ...taskData,
      completed: false,
      createdAt: serverTimestamp()
    });
  };

  const updateTask = async (id, taskData) => {
    await updateDoc(doc(db, 'planner_tasks', id), {
      ...taskData
    });
  };

  const toggleTask = async (id, currentStatus) => {
    await updateDoc(doc(db, 'planner_tasks', id), {
      completed: !currentStatus
    });
  };

  const deleteTask = async (id) => {
    await deleteDoc(doc(db, 'planner_tasks', id));
  };

  // --- Habit Actions ---

  const addHabit = async (name, color) => {
    await addDoc(collection(db, 'planner_habits'), {
      uid: user.uid,
      name,
      color,
      streak: 0,
      completedDates: [],
      createdAt: serverTimestamp()
    });
  };

  const updateHabit = async (id, data) => {
    await updateDoc(doc(db, 'planner_habits', id), data);
  };

  const toggleHabitForToday = async (id) => {
    const today = getTodayStr();
    const habit = habits.find(h => h.id === id);
    if (!habit) return;

    let newDates = [...(habit.completedDates || [])];
    const isCompleted = newDates.includes(today);

    if (isCompleted) {
      // Unmark
      newDates = newDates.filter(d => d !== today);
    } else {
      // Mark as done
      newDates.push(today);
    }

    // Recalculate Streak
    // Simple logic: consecutive days ending today or yesterday
    let streak = 0;
    const sortedDates = [...newDates].sort((a, b) => new Date(b) - new Date(a)); // Newest first
    
    if (sortedDates.length > 0) {
      let currentCheck = new Date(getTodayStr());
      // Check if today is done, if not start checking from yesterday for streak continuity
      if (!newDates.includes(getTodayStr())) {
        currentCheck.setDate(currentCheck.getDate() - 1);
      }

      for (let i = 0; i < sortedDates.length; i++) {
        const checkStr = currentCheck.toISOString().split('T')[0];
        if (newDates.includes(checkStr)) {
          streak++;
          currentCheck.setDate(currentCheck.getDate() - 1);
        } else {
          break; 
        }
      }
    }

    await updateDoc(doc(db, 'planner_habits', id), {
      completedDates: newDates,
      streak: streak
    });
  };

  const deleteHabit = async (id) => {
    await deleteDoc(doc(db, 'planner_habits', id));
  };

  // Helper: Get today's stats
  const getDailyStats = () => {
    const today = getTodayStr();
    const todaysTasks = tasks.filter(t => t.date === today);
    const completedTasks = todaysTasks.filter(t => t.completed).length;
    
    const totalHabits = habits.length;
    const completedHabits = habits.filter(h => (h.completedDates || []).includes(today)).length;

    return {
      taskProgress: todaysTasks.length > 0 ? (completedTasks / todaysTasks.length) * 100 : 0,
      habitProgress: totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0,
      totalTasks: todaysTasks.length,
      completedTasks,
      today
    };
  };

  return (
    <PlannerContext.Provider value={{
      tasks,
      habits,
      waterStats,
      loading,
      getTodayStr,
      addTask,
      updateTask,
      toggleTask,
      deleteTask,
      addHabit,
      updateHabit,
      toggleHabitForToday,
      deleteHabit,
      getDailyStats,
      updateWater
    }}>
      {children}
    </PlannerContext.Provider>
  );
};
