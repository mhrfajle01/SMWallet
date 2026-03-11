import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { playSound } from '../utils/soundEffects';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  query, 
  where,
  setDoc,
  serverTimestamp,
  getDoc,
  or 
} from 'firebase/firestore';

export const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const { user } = useAuth();
  
  const [wallets, setWallets] = useState([]);
  const [meals, setMeals] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [goals, setGoals] = useState([]);
  const [goalDeposits, setGoalDeposits] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [trashItems, setTrashItems] = useState([]);
  const [avatarState, setAvatarState] = useState({
    level: 1,
    xp: 0,
    health: 100,
    lastUpdate: null
  });
  const [loading, setLoading] = useState(true);

  // Global Stats
  const [globalStats, setGlobalStats] = useState({
    totalBalance: 0,
    totalRealBalance: 0,
    totalDebt: 0,
    totalSpent: 0,
    totalRemaining: 0,
    comparison: {
        lastMonthSpent: 0,
        spendChange: 0,
        savingsChange: 0
    }
  });

  const earnXP = async (amount) => {
    if (!user || !avatarState.id) return;
    const newXP = (avatarState.xp || 0) + amount;
    const newLevel = Math.floor(newXP / 100) + 1;
    const leveledUp = newLevel > (avatarState.level || 1);
    
    await updateDoc(doc(db, 'avatar', avatarState.id), {
      xp: newXP,
      level: newLevel,
      lastUpdate: serverTimestamp()
    });
    
    if (leveledUp) {
      playSound('levelUp');
    }
  };

  // Initialization & Categories
  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    }
    
    const catQuery = query(collection(db, 'categories'), where('uid', '==', user.uid));
    const unsubCats = onSnapshot(catQuery, async (snapshot) => {
      try {
        if (snapshot.empty) {
            const defaults = [
              { id: 'Food', label: 'Food & Meals', icon: '🍲', color: '#3b82f6', isDefault: true },
              { id: 'Groceries', label: 'Groceries', icon: '🛒', color: '#10b981', isDefault: true },
              { id: 'Travel', label: 'Travel & Transport', icon: '🚌', color: '#f59e0b', isDefault: true },
              { id: 'Medicine', label: 'Health & Medicine', icon: '💊', color: '#ef4444', isDefault: true },
              { id: 'Stationery', label: 'Education & Stationery', icon: '📚', color: '#8b5cf6', isDefault: true },
              { id: 'Other', label: 'Miscellaneous', icon: '📦', color: '#64748b', isDefault: true }
            ];
            for (const cat of defaults) {
              await setDoc(doc(db, 'categories', `${user.uid}_${cat.id}`), {
                ...cat, uid: user.uid, userId: user.uid, createdAt: serverTimestamp()
              });
            }
          } else {
            setCategories(snapshot.docs.map(doc => ({ dbId: doc.id, ...doc.data() })).sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)));
          }
      } catch (e) { console.error("Categories fetch error:", e); }
    });

    const baseQuery = (coll) => query(collection(db, coll), where('uid', '==', user.uid));

    const unsubWallets = onSnapshot(baseQuery('wallets'), (s) => 
      setWallets(s.docs.map(d => ({ ...d.data(), id: d.id })).sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))));
    
    const unsubBudgets = onSnapshot(baseQuery('budgets'), (s) => setBudgets(s.docs.map(d => ({ ...d.data(), id: d.id }))));
    const unsubIncomes = onSnapshot(baseQuery('incomes'), (s) => setIncomes(s.docs.map(d => ({ ...d.data(), id: d.id })).sort((a,b) => new Date(b.date) - new Date(a.date))));
    const unsubTransfers = onSnapshot(baseQuery('transfers'), (s) => setTransfers(s.docs.map(d => ({ ...d.data(), id: d.id })).sort((a,b) => new Date(b.date) - new Date(a.date))));
    const unsubGoals = onSnapshot(baseQuery('goals'), (s) => setGoals(s.docs.map(d => ({ ...d.data(), id: d.id })).sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))));
    const unsubMeals = onSnapshot(baseQuery('meals'), (s) => setMeals(s.docs.map(d => ({ ...d.data(), id: d.id })).sort((a,b) => new Date(b.date) - new Date(a.date))));
    const unsubPurchases = onSnapshot(baseQuery('purchases'), (s) => setPurchases(s.docs.map(d => ({ ...d.data(), id: d.id })).sort((a,b) => new Date(b.date) - new Date(a.date))));
    const unsubDeposits = onSnapshot(baseQuery('goal_deposits'), (s) => setGoalDeposits(s.docs.map(d => ({ ...d.data(), id: d.id })).sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))));
    const unsubTrash = onSnapshot(baseQuery('trash'), (s) => {
      try {
        setTrashItems(s.docs.map(d => ({ ...d.data(), id: d.id })).sort((a,b) => {
          const timeA = a.deletedAt?.seconds || 0;
          const timeB = b.deletedAt?.seconds || 0;
          return timeB - timeA;
        }));
      } catch (e) {
        console.error("Error in trash snapshot:", e);
      }
    });
    const unsubAvatar = onSnapshot(baseQuery('avatar'), (s) => {
      if (!s.empty) setAvatarState({ ...s.docs[0].data(), id: s.docs[0].id });
      else {
        const initial = { uid: user.uid, userId: user.uid, level: 1, xp: 0, health: 100, createdAt: serverTimestamp() };
        addDoc(collection(db, 'avatar'), initial);
      }
    });

    const timeout = setTimeout(() => setLoading(false), 1500);

    return () => { 
        unsubCats(); unsubWallets(); unsubBudgets(); unsubIncomes(); unsubTransfers(); 
        unsubGoals(); unsubMeals(); unsubPurchases(); unsubDeposits(); unsubTrash(); unsubAvatar();
        clearTimeout(timeout);
    };
  }, [user]);

  // Global Stats calculation
  useEffect(() => {
    if (!user) return;
    const walletExpenses = {};
    meals.forEach(m => { if(m.walletId) walletExpenses[m.walletId] = (walletExpenses[m.walletId] || 0) + Number(m.amount || 0); });
    purchases.forEach(p => { if(p.walletId) walletExpenses[p.walletId] = (walletExpenses[p.walletId] || 0) + Number(p.amount || 0); });

    let totalRealBalance = 0;
    let totalDebt = 0;
    wallets.forEach(w => {
      const spent = walletExpenses[w.id] || 0;
      const balance = Number(w.balance || 0);
      if (w.type === 'liability') totalDebt += (spent - balance);
      else totalRealBalance += (balance - spent);
    });

    const now = new Date();
    const currentMonth = now.toISOString().substring(0, 7);
    const lastMonthDate = new Date(now.setMonth(now.getMonth() - 1));
    const lastMonth = lastMonthDate.toISOString().substring(0, 7);

    const currentSpent = meals.filter(m => m.month === currentMonth).reduce((a,c) => a + Number(c.amount || 0), 0) + 
                         purchases.filter(p => p.month === currentMonth).reduce((a,c) => a + Number(c.amount || 0), 0);
    
    const lastMonthSpent = meals.filter(m => m.month === lastMonth).reduce((a,c) => a + Number(c.amount || 0), 0) + 
                           purchases.filter(p => p.month === lastMonth).reduce((a,c) => a + Number(c.amount || 0), 0);

    const spendChange = lastMonthSpent > 0 ? ((currentSpent - lastMonthSpent) / lastMonthSpent) * 100 : 0;

    const totalNetWorth = totalRealBalance - totalDebt;

    setGlobalStats({ 
        totalBalance: totalNetWorth, 
        totalRealBalance, 
        totalDebt, 
        totalSpent: currentSpent, 
        totalRemaining: totalNetWorth,
        comparison: {
            lastMonthSpent,
            spendChange,
            savingsChange: 0 
        }
    });
  }, [wallets, meals, purchases, user]);

  const calculatedWallets = useMemo(() => {
    const walletExpenses = {};
    meals.forEach(m => { if(m.walletId) walletExpenses[m.walletId] = (walletExpenses[m.walletId] || 0) + Number(m.amount || 0); });
    purchases.forEach(p => { if(p.walletId) walletExpenses[p.walletId] = (walletExpenses[p.walletId] || 0) + Number(p.amount || 0); });
    
    return wallets.map(w => {
      const spent = walletExpenses[w.id] || 0;
      const balance = Number(w.balance || 0);
      return { ...w, spent, remaining: w.type === 'liability' ? (spent - balance) : (balance - spent) };
    });
  }, [wallets, meals, purchases]);

  // --- ACTIONS ---

  const addCategory = async (label, icon, color) => {
    const id = label.replace(/\s+/g, '');
    await setDoc(doc(db, 'categories', `${user.uid}_${id}`), { uid: user.uid, id, label, icon, color, isDefault: false, createdAt: serverTimestamp() });
  };

  const deleteCategory = async (dbId, catId) => {
    await deleteDoc(doc(db, 'categories', dbId));
    await deleteDoc(doc(db, 'budgets', `${user.uid}_${catId}`));
  };

  const moveToTrash = async (collectionName, id, data) => {
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
        playSound('pop');
    } catch (e) {
        console.error(`Error moving ${collectionName} to trash:`, e);
    }
  };

  const restoreFromTrash = async (trashItem) => {
    const { originalCollection, originalId, data } = trashItem;
    await setDoc(doc(db, originalCollection, originalId), { ...data, updatedAt: serverTimestamp() });
    await deleteDoc(doc(db, 'trash', trashItem.id));
  };

  const deletePermanently = async (trashItemId) => {
    await deleteDoc(doc(db, 'trash', trashItemId));
  };

  const emptyTrash = async () => {
    for (const item of trashItems) {
      await deleteDoc(doc(db, 'trash', item.id));
    }
  };

  const addWallet = async (name, balance, type = 'asset') => {
    await addDoc(collection(db, 'wallets'), { uid: user.uid, userId: user.uid, name, balance: Number(balance), type, createdAt: serverTimestamp() });
    await earnXP(10);
  };

  const deleteWallet = async (id) => {
    const wallet = wallets.find(w => w.id === id);
    if (wallet) await moveToTrash('wallets', id, wallet);
  };

  const addIncome = async (incomeData) => {
    const amount = Number(incomeData.amount || 0);
    await addDoc(collection(db, 'incomes'), { uid: user.uid, userId: user.uid, ...incomeData, amount, createdAt: serverTimestamp() });
    const wallet = wallets.find(w => w.id === incomeData.walletId);
    if (wallet) await updateDoc(doc(db, 'wallets', incomeData.walletId), { balance: Number(wallet.balance || 0) + amount });
    await earnXP(15);
  };

  const updateIncome = async (id, oldData, newData) => {
    const amountDiff = Number(newData.amount || 0) - Number(oldData.amount || 0);
    if (oldData.walletId === newData.walletId) {
      const wallet = wallets.find(w => w.id === newData.walletId);
      if (wallet) await updateDoc(doc(db, 'wallets', newData.walletId), { balance: Number(wallet.balance || 0) + amountDiff });
    } else {
      const oldW = wallets.find(w => w.id === oldData.walletId);
      const newW = wallets.find(w => w.id === newData.walletId);
      if (oldW) await updateDoc(doc(db, 'wallets', oldData.walletId), { balance: Number(oldW.balance || 0) - Number(oldData.amount || 0) });
      if (newW) await updateDoc(doc(db, 'wallets', newData.walletId), { balance: Number(newW.balance || 0) + Number(newData.amount || 0) });
    }
    await updateDoc(doc(db, 'incomes', id), { ...newData, amount: Number(newData.amount || 0) });
  };

  const deleteIncome = async (id, walletId, amount) => {
    const income = incomes.find(i => i.id === id);
    if (income) await moveToTrash('incomes', id, income);
    const wallet = wallets.find(w => w.id === walletId);
    if (wallet) await updateDoc(doc(db, 'wallets', walletId), { balance: Number(wallet.balance || 0) - Number(amount || 0) });
  };

  const transferFunds = async (sourceId, destId, amount) => {
    const numAmount = Number(amount || 0);
    const sW = wallets.find(w => w.id === sourceId);
    const dW = wallets.find(w => w.id === destId);
    if (sW && dW) {
      await updateDoc(doc(db, 'wallets', sourceId), { balance: Number(sW.balance || 0) - numAmount });
      await updateDoc(doc(db, 'wallets', destId), { balance: Number(dW.balance || 0) + numAmount });
      await addDoc(collection(db, 'transfers'), { 
        uid: user.uid, userId: user.uid, sourceId, destId, sourceName: sW.name, destName: dW.name, 
        amount: numAmount, date: new Date().toISOString().split('T')[0], createdAt: serverTimestamp() 
      });
      await earnXP(5);
    }
  };

  const deleteTransfer = async (id, sourceId, destId, amount) => {
    const transfer = transfers.find(t => t.id === id);
    if (transfer) await moveToTrash('transfers', id, transfer);
    const sW = wallets.find(w => w.id === sourceId);
    const dW = wallets.find(w => w.id === destId);
    const numAmt = Number(amount || 0);
    if (sW) await updateDoc(doc(db, 'wallets', sourceId), { balance: Number(sW.balance || 0) + numAmt });
    if (dW) await updateDoc(doc(db, 'wallets', destId), { balance: Number(dW.balance || 0) - numAmt });
  };

  const addGoal = async (goalData) => {
    await addDoc(collection(db, 'goals'), { uid: user.uid, userId: user.uid, ...goalData, targetAmount: Number(goalData.targetAmount || 0), savedAmount: Number(goalData.savedAmount || 0), createdAt: serverTimestamp() });
    await earnXP(10);
  };

  const updateGoal = async (id, goalData) => {
    await updateDoc(doc(db, 'goals', id), { ...goalData, targetAmount: Number(goalData.targetAmount || 0), savedAmount: Number(goalData.savedAmount || 0) });
  };

  const deleteGoal = async (id) => {
    const goal = goals.find(g => g.id === id);
    if (goal) await moveToTrash('goals', id, goal);
  };

  const depositToGoal = async (goalId, walletId, amount) => {
    const numAmount = Number(amount || 0);
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const newSaved = Number(goal.savedAmount || 0) + numAmount;
    await addDoc(collection(db, 'goal_deposits'), { uid: user.uid, userId: user.uid, goalId, walletId, goalName: goal.name, amount: numAmount, date: new Date().toISOString().split('T')[0], createdAt: serverTimestamp() });
    await updateDoc(doc(db, 'goals', goalId), { savedAmount: newSaved });
    const wallet = wallets.find(w => w.id === walletId);
    if (wallet) await updateDoc(doc(db, 'wallets', walletId), { balance: Number(wallet.balance || 0) - numAmount });
    await earnXP(20);
  };

  const deleteGoalDeposit = async (id, goalId, walletId, amount) => {
    const deposit = goalDeposits.find(d => d.id === id);
    if (deposit) await moveToTrash('goal_deposits', id, deposit);
    const goal = goals.find(g => g.id === goalId);
    const wallet = wallets.find(w => w.id === walletId);
    const numAmt = Number(amount || 0);
    if (goal) await updateDoc(doc(db, 'goals', goalId), { savedAmount: Number(goal.savedAmount || 0) - numAmt });
    if (wallet) await updateDoc(doc(db, 'wallets', walletId), { balance: Number(wallet.balance || 0) + numAmt });
  };

  const addMeal = async (mealData) => {
    await addDoc(collection(db, 'meals'), { uid: user.uid, userId: user.uid, ...mealData, amount: Number(mealData.amount || 0), createdAt: serverTimestamp() });
    await earnXP(5);
  };

  const updateMeal = async (id, mealData) => await updateDoc(doc(db, 'meals', id), { ...mealData, amount: Number(mealData.amount || 0) });
  const deleteMeal = async (id) => {
    const meal = meals.find(m => m.id === id);
    if (meal) await moveToTrash('meals', id, meal);
  };

  const addPurchase = async (purchaseData) => {
    await addDoc(collection(db, 'purchases'), { uid: user.uid, userId: user.uid, ...purchaseData, amount: Number(purchaseData.amount || 0), createdAt: serverTimestamp() });
    await earnXP(5);
  };

  const updatePurchase = async (id, purchaseData) => await updateDoc(doc(db, 'purchases', id), { ...purchaseData, amount: Number(purchaseData.amount || 0) });
  const deletePurchase = async (id) => {
    const purchase = purchases.find(p => p.id === id);
    if (purchase) await moveToTrash('purchases', id, purchase);
  };

  const updateBudget = async (categoryId, limit) => {
    const bId = `${user.uid}_${categoryId}`;
    const snap = await getDoc(doc(db, 'budgets', bId));
    if (snap.exists()) await updateDoc(doc(db, 'budgets', bId), { limit: Number(limit || 0) });
    else await setDoc(doc(db, 'budgets', bId), { uid: user.uid, id: categoryId, limit: Number(limit || 0) });
  };

  const deleteBudget = async (id) => await deleteDoc(doc(db, 'budgets', id));

  const getSmartRecents = () => {
    const freq = {};
    const all = [
      ...meals.map(m => ({ label: m.item, amount: m.amount, type: 'meal', cat: 'Food', mType: m.mealType })),
      ...purchases.map(p => ({ label: p.item, amount: p.amount, type: 'purchase', cat: p.category }))
    ];
    all.forEach(item => {
      const key = `${item.label}_${item.amount}`;
      if (!freq[key]) freq[key] = { ...item, count: 0 };
      freq[key].count++;
    });
    return Object.values(freq).sort((a, b) => b.count - a.count).slice(0, 10);
  };

  return (
    <AppContext.Provider value={{
      wallets: calculatedWallets,
      meals, purchases, incomes, transfers, goals, goalDeposits, budgets, categories, globalStats, trashItems, avatarState, loading,
      addCategory, deleteCategory, addWallet, deleteWallet, addGoal, updateGoal, deleteGoal, depositToGoal, deleteGoalDeposit,
      addMeal, updateMeal, deleteMeal, addPurchase, updatePurchase, deletePurchase, updateBudget, deleteBudget, addIncome, updateIncome, deleteIncome, transferFunds, deleteTransfer, getSmartRecents,
      moveToTrash, restoreFromTrash, deletePermanently, emptyTrash, earnXP
    }}>
      {children}
    </AppContext.Provider>
  );
};