import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, or 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { playSound } from '../utils/soundEffects';

const ProductivityContext = createContext();

export const useProductivity = () => useContext(ProductivityContext);

export const ProductivityProvider = ({ children }) => {
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
      setHabits(s.docs.map(d => ({ id: d.id, ...d.data() }))));

    const unsubHabitLogs = onSnapshot(baseQuery('habitLogs'), (s) => 
      setHabitLogs(s.docs.map(d => ({ id: d.id, ...d.data() }))));

    const unsubTodos = onSnapshot(baseQuery('todos'), (s) => 
      setTodos(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))));

    const unsubNotes = onSnapshot(baseQuery('notes'), (s) => 
      setNotes(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))));

    const unsubShopping = onSnapshot(baseQuery('shoppingList'), (s) => 
      setShoppingList(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))));

    const unsubTrips = onSnapshot(baseQuery('trips'), (s) => 
      setTrips(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))));

    setLoading(false);
    return () => { unsubHabits(); unsubHabitLogs(); unsubTodos(); unsubNotes(); unsubShopping(); unsubTrips(); };
  }, [user]);

  // Habits
  const addHabit = async (title) => await addDoc(collection(db, 'habits'), { userId: user.uid, uid: user.uid, title, createdAt: serverTimestamp() });
  const deleteHabit = async (id) => await deleteDoc(doc(db, 'habits', id));
  const toggleHabit = async (habitId, date) => {
    const log = habitLogs.find(l => l.habitId === habitId && l.date === date);
    if (log) await updateDoc(doc(db, 'habitLogs', log.id), { status: !log.status });
    else await addDoc(collection(db, 'habitLogs'), { userId: user.uid, uid: user.uid, habitId, date, status: true, createdAt: serverTimestamp() });
  };

  // Todos
  const addTodo = async (title, priority = 'Medium', dueDate = '') => 
    await addDoc(collection(db, 'todos'), { userId: user.uid, uid: user.uid, title, priority, dueDate, completed: false, createdAt: serverTimestamp() });

  const toggleTodo = async (todoId, currentStatus) => {
    await updateDoc(doc(db, 'todos', todoId), { completed: !currentStatus });
    if (!currentStatus) playSound('pop');
  };

  const deleteTodo = async (id) => await deleteDoc(doc(db, 'todos', id));

  // Notes
  const addNote = async (title, content, color = '#ffffff') => 
    await addDoc(collection(db, 'notes'), { userId: user.uid, uid: user.uid, title, content, color, pinned: false, createdAt: serverTimestamp() });

  const updateNote = async (id, data) => await updateDoc(doc(db, 'notes', id), data);
  const deleteNote = async (id) => await deleteDoc(doc(db, 'notes', id));

  // --- Smart Planner (Shopping & Trips) ---
  
  const addTrip = async (tripData) => {
    return await addDoc(collection(db, 'trips'), {
        userId: user.uid,
        uid: user.uid,
        passengers: 1,
        ...tripData,
        createdAt: serverTimestamp()
    });
  };

  const updateTrip = async (id, data) => await updateDoc(doc(db, 'trips', id), data);

  const deleteTrip = async (id) => {
    await deleteDoc(doc(db, 'trips', id));
    const tripItems = shoppingList.filter(i => i.tripId === id);
    for (const item of tripItems) await deleteDoc(doc(db, 'shoppingList', item.id));
  };

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
    return docRef;
  };

  const updateShoppingItem = async (id, data) => await updateDoc(doc(db, 'shoppingList', id), data);

  const toggleShoppingItem = async (id, currentStatus) => {
    await updateDoc(doc(db, 'shoppingList', id), { completed: !currentStatus });
    if (!currentStatus) playSound('pop');
  };

  const deleteShoppingItem = async (id) => await deleteDoc(doc(db, 'shoppingList', id));

  const clearCompletedShopping = async (tripId = null) => {
    const completed = shoppingList.filter(item => item.completed && (tripId ? item.tripId === tripId : !item.tripId));
    for (const item of completed) await deleteDoc(doc(db, 'shoppingList', item.id));
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