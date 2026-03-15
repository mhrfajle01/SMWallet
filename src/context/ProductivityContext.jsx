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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setHabits([]); setHabitLogs([]); setTodos([]); setNotes([]); setShoppingList([]); setTrips([]);
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

    setLoading(false);
    return () => { unsubHabits(); unsubHabitLogs(); unsubTodos(); unsubNotes(); unsubShopping(); unsubTrips(); };
  }, [user]);

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
  const addHabit = async (title) => {
    await addDoc(collection(db, 'habits'), { userId: user.uid, uid: user.uid, title, createdAt: serverTimestamp() });
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
  const addTodo = async (title, priority = 'Medium', dueDate = '') => {
    await addDoc(collection(db, 'todos'), { userId: user.uid, uid: user.uid, title, priority, dueDate, completed: false, createdAt: serverTimestamp() });
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

  const deleteTodo = async (id) => {
    const todo = todos.find(t => t.id === id);
    if (todo) await moveToTrash('todos', id, todo);
  };

  const deleteNote = async (id) => {
    const note = notes.find(n => n.id === note.id);
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
    habits, habitLogs, todos, notes, shoppingList, trips, loading,
    addHabit, deleteHabit, toggleHabit, 
    addTodo, toggleTodo, deleteTodo,
    addNote, updateNote, deleteNote,
    addTrip, updateTrip, deleteTrip, addShoppingItem, updateShoppingItem, toggleShoppingItem, deleteShoppingItem, clearCompletedShopping
  };

  return <ProductivityContext.Provider value={value}>{children}</ProductivityContext.Provider>;
};