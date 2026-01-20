import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import confetti from 'canvas-confetti';
import { playSound } from '../utils/soundEffects';

const ProductivityContext = createContext();

export const useProductivity = () => useContext(ProductivityContext);

export const ProductivityProvider = ({ children }) => {
  const { user } = useAuth();
  
  const [habits, setHabits] = useState([]);
  const [habitLogs, setHabitLogs] = useState([]);
  const [todos, setTodos] = useState([]);
  const [notes, setNotes] = useState([]);
  const [gamifyData, setGamifyData] = useState({ points: 0, level: 1, badges: [], streak: 0, lastLogin: '' });
  const [loading, setLoading] = useState(true);

  // Gamification Constants
  const LEVEL_THRESHOLDS = Array.from({ length: 11 }, (_, i) => i * 500); // 0, 500, 1000, 1500...
  const BADGES = {
    BRONZE: { name: 'Bronze', threshold: 500, icon: '🥉' },
    SILVER: { name: 'Silver', threshold: 1500, icon: '🥈' },
    GOLD:   { name: 'Gold',   threshold: 3000, icon: '🥇' },
    PLATINUM: { name: 'Platinum', threshold: 5000, icon: '💎' },
    STREAK_7: { name: 'On Fire', threshold: 0, special: true, icon: '🔥' }
  };

  useEffect(() => {
    if (!user) {
      setHabits([]); setHabitLogs([]); setTodos([]); setNotes([]); 
      setGamifyData({ points: 0, level: 1, badges: [], streak: 0, lastLogin: '' });
      setLoading(false);
      return;
    }

    setLoading(true);

    const qHabits = query(collection(db, 'habits'), where('userId', '==', user.uid));
    const qHabitLogs = query(collection(db, 'habitLogs'), where('userId', '==', user.uid));
    const qTodos = query(collection(db, 'todos'), where('userId', '==', user.uid));
    const qNotes = query(collection(db, 'notes'), where('userId', '==', user.uid));
    const docGamify = doc(db, 'gamify', user.uid);

    const unsubHabits = onSnapshot(qHabits, (snapshot) => {
      setHabits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubHabitLogs = onSnapshot(qHabitLogs, (snapshot) => {
      setHabitLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubTodos = onSnapshot(qTodos, (snapshot) => {
      setTodos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => b.createdAt - a.createdAt));
    });

    const unsubNotes = onSnapshot(qNotes, (snapshot) => {
      setNotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => b.createdAt - a.createdAt));
    });

    const unsubGamify = onSnapshot(docGamify, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGamifyData(data);
        checkDailyLogin(data, docGamify);
      } else {
        // Initialize if not exists
        const initData = { points: 0, level: 1, badges: [], streak: 1, lastLogin: new Date().toISOString().split('T')[0] };
        setDoc(docGamify, initData);
        setGamifyData(initData);
      }
    });

    setLoading(false);

    return () => {
      unsubHabits(); unsubHabitLogs(); unsubTodos(); unsubNotes(); unsubGamify();
    };
  }, [user]);

  // --- Streak Logic ---
  const checkDailyLogin = async (currentData, docRef) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (currentData.lastLogin === today) return; // Already logged today

    let newStreak = currentData.streak || 0;
    
    if (currentData.lastLogin === yesterdayStr) {
        newStreak += 1; // Continuing streak
    } else {
        newStreak = 1; // Broken streak or first day
    }

    // Check Streak Badge
    let newBadges = [...(currentData.badges || [])];
    if (newStreak >= 7 && !newBadges.includes('On Fire')) {
        newBadges.push('On Fire');
        addPoints(100, '7 Day Streak!');
    }

    await updateDoc(docRef, {
        lastLogin: today,
        streak: newStreak,
        badges: newBadges
    });
  };

  // --- Actions ---

  const addPoints = async (amount, reason) => {
    if (!user) return;
    
    // Apply Multiplier based on streak
    const multiplier = (gamifyData.streak || 0) >= 7 ? 2 : 1;
    const finalAmount = amount * multiplier;

    const newPoints = (gamifyData.points || 0) + finalAmount;
    let newLevel = gamifyData.level || 1;
    let newBadges = [...(gamifyData.badges || [])];
    
    // Check Level Up
    if (newPoints >= LEVEL_THRESHOLDS[newLevel] && newLevel < 10) {
      newLevel++;
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      playSound('success'); 
    }

    // Check Badges
    Object.values(BADGES).forEach(badge => {
      if (!badge.special && newPoints >= badge.threshold && !newBadges.includes(badge.name)) {
        newBadges.push(badge.name);
      }
    });

    await updateDoc(doc(db, 'gamify', user.uid), {
      points: newPoints,
      level: newLevel,
      badges: newBadges
    });
  };

  // Habits
  const addHabit = async (title) => {
    await addDoc(collection(db, 'habits'), {
      userId: user.uid, title, createdAt: serverTimestamp()
    });
  };

  const deleteHabit = async (id) => {
    await deleteDoc(doc(db, 'habits', id));
  };

  const toggleHabit = async (habitId, date) => {
    // Check if already logged
    const existingLog = habitLogs.find(l => l.habitId === habitId && l.date === date);
    
    if (existingLog) {
      if (existingLog.status) {
        // Was true, make false
        await updateDoc(doc(db, 'habitLogs', existingLog.id), { status: false });
        // Deduct points? Maybe not, too punitive.
      } else {
        // Was false, make true
        await updateDoc(doc(db, 'habitLogs', existingLog.id), { status: true });
        addPoints(10, 'Habit Completed');
      }
    } else {
      // Create new log
      await addDoc(collection(db, 'habitLogs'), {
        userId: user.uid, habitId, date, status: true, createdAt: serverTimestamp()
      });
      addPoints(10, 'Habit Completed');
    }
  };

  // Todos
  const addTodo = async (title, priority = 'Medium', dueDate = '') => {
    await addDoc(collection(db, 'todos'), {
      userId: user.uid, title, priority, dueDate, completed: false, createdAt: serverTimestamp()
    });
  };

  const toggleTodo = async (todoId, currentStatus) => {
    await updateDoc(doc(db, 'todos', todoId), { completed: !currentStatus });
    if (!currentStatus) {
      addPoints(50, 'Task Completed');
      playSound('pop');
    }
  };

  const deleteTodo = async (id) => await deleteDoc(doc(db, 'todos', id));

  // Notes
  const addNote = async (title, content, color = '#ffffff') => {
    await addDoc(collection(db, 'notes'), {
      userId: user.uid, title, content, color, pinned: false, createdAt: serverTimestamp()
    });
  };

  const updateNote = async (id, data) => await updateDoc(doc(db, 'notes', id), data);
  const deleteNote = async (id) => await deleteDoc(doc(db, 'notes', id));

  const value = {
    habits, habitLogs, todos, notes, gamifyData, loading,
    addHabit, deleteHabit, toggleHabit,
    addTodo, toggleTodo, deleteTodo,
    addNote, updateNote, deleteNote,
    addPoints 
  };

  return <ProductivityContext.Provider value={value}>{children}</ProductivityContext.Provider>;
};