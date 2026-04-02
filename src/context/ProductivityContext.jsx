import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, or 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { playSound } from '../utils/soundEffects';

const ProductivityContext = createContext();

export const useProductivity = () => useContext(ProductivityContext);

export const ProductivityProvider = ({ children, onEarnXP }) => {
  const { user } = useAuth();
  
  const [habits, setHabits] = useState([]);
  const [habitLogs, setHabitLogs] = useState([]);
  const [todos, setTodos] = useState([]);
  const [notes, setNotes] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [trips, setTrips] = useState([]);
  const [waterStats, setWaterStats] = useState({ current: 0, goal: 8, id: null });
  const [loading, setLoading] = useState(true);

  // Helper: Get today's date string in local timezone YYYY-MM-DD
  const getTodayStr = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().split('T')[0];
  };

  useEffect(() => {
    if (!user) {
      setHabits([]); setHabitLogs([]); setTodos([]); setNotes([]); setShoppingList([]); setTrips([]);
      setWaterStats({ current: 0, goal: 8, id: null });
      setLoading(false);
      return;
    }

    setLoading(true);

    const baseQuery = (coll) => query(collection(db, coll), where('uid', '==', user.uid));

    const unsubHabits = onSnapshot(baseQuery('habits'), (s) => 
      setHabits(s.docs.map(d => ({ ...d.data(), id: d.id }))));

    const unsubHabitLogs = onSnapshot(baseQuery('habitLogs'), (s) => 
      setHabitLogs(s.docs.map(d => ({ ...d.data(), id: d.id }))));

    const unsubTodos = onSnapshot(baseQuery('todos'), (s) => 
      setTodos(s.docs.map(d => ({ ...d.data(), id: d.id })).sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))));

    const unsubNotes = onSnapshot(baseQuery('notes'), (s) => 
      setNotes(s.docs.map(d => ({ ...d.data(), id: d.id })).sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))));

    const unsubShopping = onSnapshot(baseQuery('shoppingList'), (s) => 
      setShoppingList(s.docs.map(d => ({ ...d.data(), id: d.id })).sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))));

    const unsubTrips = onSnapshot(baseQuery('trips'), (s) => 
      setTrips(s.docs.map(d => ({ ...d.data(), id: d.id })).sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))));

    // Fetch Today's Water
    const today = getTodayStr();
    const waterQuery = query(collection(db, 'planner_water'), where('uid', '==', user.uid), where('date', '==', today));
    const unsubWater = onSnapshot(waterQuery, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setWaterStats({ current: data.amount, goal: data.goal || 8, id: snapshot.docs[0].id });
      } else {
        setWaterStats({ current: 0, goal: 8, id: null });
      }
    });

    setLoading(false);
    return () => { 
      unsubHabits(); unsubHabitLogs(); unsubTodos(); unsubNotes(); unsubShopping(); unsubTrips(); unsubWater();
    };
  }, [user]);

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
    
    if (newAmount > waterStats.current) {
        playSound('pop');
        if (onEarnXP) onEarnXP(2, 'consistency', 'water');
    }
  };

  const getDailyProgress = () => {
    const today = getTodayStr();
    
    // Todos for today or undated pending
    const todayTodos = todos.filter(t => !t.completed || (t.updatedAt?.seconds && new Date(t.updatedAt.seconds * 1000).toISOString().startsWith(today)));
    const doneTodos = todayTodos.filter(t => t.completed).length;
    const todoProgress = todayTodos.length > 0 ? (doneTodos / todayTodos.length) * 100 : 0;

    // Habits for today
    const doneHabits = habits.filter(h => habitLogs.some(l => l.habitId === h.id && l.date === today && l.status)).length;
    const habitProgress = habits.length > 0 ? (doneHabits / habits.length) * 100 : 0;

    // Water progress
    const waterProgress = (waterStats.current / waterStats.goal) * 100;

    return Math.round((todoProgress + habitProgress + Math.min(100, waterProgress)) / 3);
  };

  const deleteShoppingItem = async (id) => {
    const item = shoppingList.find(i => i.id === id);
    if (item) await moveToTrash('shoppingList', id, item);
  };

  const moveToTrash = async (collectionName, id, data, silent = false) => {
    try {
        const { id: _, ...cleanData } = data;
        await addDoc(collection(db, 'trash'), {
          uid: user.uid,
          userId: user.uid,
          originalCollection: collectionName,
          originalId: id,
          data: cleanData,
          deletedAt: serverTimestamp()
        });
        await deleteDoc(doc(db, collectionName, id));
        if (!silent) playSound('pop');
    } catch (e) {
        console.error(`Error moving ${collectionName} to trash:`, e);
    }
  };

  // Habits
  const addHabit = async (title, color = '#3b82f6', extra = {}) => {
    await addDoc(collection(db, 'habits'), { 
        userId: user.uid, 
        uid: user.uid, 
        title, 
        color,
        ...extra,
        createdAt: serverTimestamp() 
    });
    if (onEarnXP) onEarnXP(10, 'consistency', 'habit');
  };
  
  const toggleHabit = async (habitId, date) => {
    const log = habitLogs.find(l => l.habitId === habitId && l.date === date);
    if (log) {
        await updateDoc(doc(db, 'habitLogs', log.id), { status: !log.status });
        if (!log.status && onEarnXP) onEarnXP(5, 'consistency', 'habit');
    } else {
        await addDoc(collection(db, 'habitLogs'), { userId: user.uid, uid: user.uid, habitId, date, status: true, createdAt: serverTimestamp() });
        if (onEarnXP) onEarnXP(5, 'consistency', 'habit');
    }
  };

  // Todos
  const addTodo = async (title, priority = 'Medium', dueDate = '', extra = {}) => {
    await addDoc(collection(db, 'todos'), { 
        userId: user.uid, 
        uid: user.uid, 
        title, 
        priority, 
        dueDate, 
        ...extra,
        completed: false, 
        createdAt: serverTimestamp() 
    });
    if (onEarnXP) onEarnXP(10, 'consistency', 'todo');
  }

  const toggleTodo = async (todoId, currentStatus) => {
    await updateDoc(doc(db, 'todos', todoId), { 
        completed: !currentStatus,
        updatedAt: serverTimestamp()
    });
    if (!currentStatus) {
        playSound('pop');
        if (onEarnXP) onEarnXP(15, 'consistency', 'todo');
    }
  };

  // Notes
  const addNote = async (title, content, color = '#ffffff') => {
    await addDoc(collection(db, 'notes'), { userId: user.uid, uid: user.uid, title, content, color, pinned: false, createdAt: serverTimestamp() });
    if (onEarnXP) onEarnXP(5, 'consistency', 'note');
  }

  const updateNote = async (id, data) => await updateDoc(doc(db, 'notes', id), data);

  // --- Smart Planner (Shopping & Trips) ---
  
  const addTrip = async (tripData) => {
    const docRef = await addDoc(collection(db, 'trips'), {
        userId: user.uid,
        uid: user.uid,
        passengers: 1,
        ...tripData,
        createdAt: serverTimestamp()
    });
    if (onEarnXP) onEarnXP(20, 'wealth', 'trip');
    return docRef;
  };

  const updateTrip = async (id, data) => await updateDoc(doc(db, 'trips', id), data);

  const addShoppingItem = async (itemData) => {
    const docRef = await addDoc(collection(db, 'shoppingList'), {
      userId: user.uid,
      uid: user.uid,
      completed: false,
      itemType: 'buy', 
      bookingStatus: 'planned',
      ...itemData,
      estimatedPrice: Number(itemData.estimatedPrice || 0),
      createdAt: serverTimestamp()
    });

    if (itemData.targetDate) {
        addTodo(`Reminder: ${itemData.name}`, 'Medium', itemData.targetDate);
    }
    if (onEarnXP) onEarnXP(5, 'frugality', 'shopping');
    return docRef;
  };

  const updateShoppingItem = async (id, data) => await updateDoc(doc(db, 'shoppingList', id), data);

  const toggleShoppingItem = async (id, currentStatus) => {
    await updateDoc(doc(db, 'shoppingList', id), { completed: !currentStatus });
    if (!currentStatus) {
        playSound('pop');
        if (onEarnXP) onEarnXP(10, 'frugality', 'shopping');
    }
  };

  const deleteHabit = async (id) => {
    const habit = habits.find(h => h.id === id);
    if (habit) await moveToTrash('habits', id, habit);
  };

  const updateTodo = async (id, data) => {
    await updateDoc(doc(db, 'todos', id), {
        ...data,
        updatedAt: serverTimestamp()
    });
  };

  const deleteTodo = async (id) => {
    const todo = todos.find(t => t.id === id);
    if (todo) await moveToTrash('todos', id, todo);
  };

  const deleteNote = async (id) => {
    const note = notes.find(n => n.id === id);
    if (note) await moveToTrash('notes', id, note);
  };

  const deleteTrip = async (id) => {
    const trip = trips.find(t => t.id === id);
    if (trip) {
        await moveToTrash('trips', id, trip, true);
        const tripItems = shoppingList.filter(i => i.tripId === id);
        for (const item of tripItems) {
            await moveToTrash('shoppingList', item.id, item, true);
        }
        playSound('pop');
    }
  };

  const duplicateTrip = async (tripId) => {
    const originalTrip = trips.find(t => t.id === tripId);
    if (!originalTrip) return;

    // 1. Create New Trip
    const { id, createdAt, ...tripData } = originalTrip;
    const newTripRef = await addDoc(collection(db, 'trips'), {
        ...tripData,
        name: `${originalTrip.name} (Copy)`,
        uid: user.uid,
        userId: user.uid,
        createdAt: serverTimestamp()
    });

    // 2. Duplicate Shopping Items
    const itemsToCopy = shoppingList.filter(item => item.tripId === tripId);
    for (const item of itemsToCopy) {
        const { id: itemId, createdAt: itemCreatedAt, ...itemData } = item;
        await addDoc(collection(db, 'shoppingList'), {
            ...itemData,
            tripId: newTripRef.id,
            completed: false,
            bookingStatus: 'planned',
            uid: user.uid,
            userId: user.uid,
            createdAt: serverTimestamp()
        });
    }

    playSound('pop');
    if (onEarnXP) onEarnXP(10, 'wealth', 'trip');
    return newTripRef.id;
  };

  const clearCompletedShopping = async (tripId = null) => {
    const completed = shoppingList.filter(item => item.completed && (tripId ? item.tripId === tripId : !item.tripId));
    if (completed.length > 0) {
        for (const item of completed) {
            await moveToTrash('shoppingList', item.id, item, true);
        }
        playSound('pop');
    }
  };

  const value = {
    habits, habitLogs, todos, notes, shoppingList, trips, waterStats, loading,
    getTodayStr, updateWater, getDailyProgress,
    addHabit, deleteHabit, toggleHabit, 
    addTodo, toggleTodo, updateTodo, deleteTodo,
    addNote, updateNote, deleteNote,
    addTrip, updateTrip, deleteTrip, duplicateTrip, addShoppingItem, updateShoppingItem, toggleShoppingItem, deleteShoppingItem, clearCompletedShopping
  };

  return <ProductivityContext.Provider value={value}>{children}</ProductivityContext.Provider>;
};