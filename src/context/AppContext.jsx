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
  setDoc,
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';

const AppContext = createContext();

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
  const [loading, setLoading] = useState(true);

  // Global Stats
  const [globalStats, setGlobalStats] = useState({
    totalBalance: 0,
    totalSpent: 0,
    totalRemaining: 0
  });

  // Fetch Categories and Initialize Defaults
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'categories'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        // Initialize default categories for new user
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
            ...cat,
            uid: user.uid,
            createdAt: serverTimestamp()
          });
        }
      } else {
        const catData = snapshot.docs.map(doc => ({
          dbId: doc.id,
          ...doc.data()
        })).sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
        setCategories(catData);
      }
    });
    return () => unsubscribe();
  }, [user]);

  // Fetch Wallets
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'wallets'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const walletData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setWallets(walletData);
    });
    return () => unsubscribe();
  }, [user]);

  // Fetch Budgets
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'budgets'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const budgetData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBudgets(budgetData);
    });
    return () => unsubscribe();
  }, [user]);

  // Fetch Incomes
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'incomes'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const incomeData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => new Date(b.date) - new Date(a.date));
      setIncomes(incomeData);
    });
    return () => unsubscribe();
  }, [user]);

  // Fetch Transfers
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'transfers'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transferData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransfers(transferData);
    });
    return () => unsubscribe();
  }, [user]);

  // Fetch Goals
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'goals'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const goalData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setGoals(goalData);
    });
    return () => unsubscribe();
  }, [user]);

  // Fetch Meals
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'meals'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mealData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => new Date(b.date) - new Date(a.date));
      setMeals(mealData);
    });
    return () => unsubscribe();
  }, [user]);

  // Fetch Purchases
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'purchases'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const purchaseData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => new Date(b.date) - new Date(a.date));
      setPurchases(purchaseData);
    });
    return () => unsubscribe();
  }, [user]);

  // Fetch Goal Deposits
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'goal_deposits'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const depositData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setGoalDeposits(depositData);
    });
    return () => unsubscribe();
  }, [user]);

  // Stats calculation
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const totalBalance = wallets.reduce((acc, curr) => acc + Number(curr.balance), 0);
    const totalSpent = meals.reduce((acc, curr) => acc + Number(curr.amount), 0) + 
                       purchases.reduce((acc, curr) => acc + Number(curr.amount), 0);
    setGlobalStats({
      totalBalance, 
      totalSpent,
      totalRemaining: totalBalance - totalSpent 
    });
    setLoading(false);
  }, [wallets, meals, purchases, incomes, user]);

  const getCalculatedWallets = () => {
    const walletExpenses = {};
    meals.forEach(m => walletExpenses[m.walletId] = (walletExpenses[m.walletId] || 0) + Number(m.amount));
    purchases.forEach(p => walletExpenses[p.walletId] = (walletExpenses[p.walletId] || 0) + Number(p.amount));
    return wallets.map(w => ({
      ...w,
      spent: walletExpenses[w.id] || 0,
      remaining: Number(w.balance) - (walletExpenses[w.id] || 0)
    }));
  };

  // Actions
  const addCategory = async (label, icon, color) => {
    const id = label.replace(/\s+/g, '');
    await setDoc(doc(db, 'categories', `${user.uid}_${id}`), {
      uid: user.uid,
      id,
      label,
      icon,
      color,
      isDefault: false,
      createdAt: serverTimestamp()
    });
  };

  const deleteCategory = async (dbId, catId) => {
    await deleteDoc(doc(db, 'categories', dbId));
    // Also delete associated budget if exists
    const budgetId = `${user.uid}_${catId}`;
    await deleteDoc(doc(db, 'budgets', budgetId));
  };

  const addWallet = async (name, balance) => {
    await addDoc(collection(db, 'wallets'), {
      uid: user.uid,
      name,
      balance: Number(balance),
      createdAt: serverTimestamp()
    });
  };

  const deleteWallet = async (id) => {
    await deleteDoc(doc(db, 'wallets', id));
  };

  const addIncome = async (incomeData) => {
    const amount = Number(incomeData.amount);
    await addDoc(collection(db, 'incomes'), {
      uid: user.uid,
      ...incomeData,
      amount,
      createdAt: serverTimestamp()
    });
    const wallet = wallets.find(w => w.id === incomeData.walletId);
    if (wallet) {
      await updateDoc(doc(db, 'wallets', incomeData.walletId), {
        balance: Number(wallet.balance) + amount
      });
    }
  };

  const deleteIncome = async (id, walletId, amount) => {
    await deleteDoc(doc(db, 'incomes', id));
    const wallet = wallets.find(w => w.id === walletId);
    if (wallet) {
      await updateDoc(doc(db, 'wallets', walletId), {
        balance: Number(wallet.balance) - Number(amount)
      });
    }
  };

  const transferFunds = async (sourceId, destId, amount) => {
    const numAmount = Number(amount);
    const sourceWallet = wallets.find(w => w.id === sourceId);
    const destWallet = wallets.find(w => w.id === destId);
    if (sourceWallet && destWallet) {
      await updateDoc(doc(db, 'wallets', sourceId), {
        balance: Number(sourceWallet.balance) - numAmount
      });
      await updateDoc(doc(db, 'wallets', destId), {
        balance: Number(destWallet.balance) + numAmount
      });
      await addDoc(collection(db, 'transfers'), {
        uid: user.uid,
        sourceId,
        destId,
        sourceName: sourceWallet.name,
        destName: destWallet.name,
        amount: numAmount,
        date: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp()
      });
    }
  };

  const deleteTransfer = async (id, sourceId, destId, amount) => {
    await deleteDoc(doc(db, 'transfers', id));
    const sourceWallet = wallets.find(w => w.id === sourceId);
    const destWallet = wallets.find(w => w.id === destId);
    const numAmount = Number(amount);
    if (sourceWallet) {
      await updateDoc(doc(db, 'wallets', sourceId), {
        balance: Number(sourceWallet.balance) + numAmount
      });
    }
    if (destWallet) {
      await updateDoc(doc(db, 'wallets', destId), {
        balance: Number(destWallet.balance) - numAmount
      });
    }
  };

  const addGoal = async (goalData) => {
    await addDoc(collection(db, 'goals'), {
      uid: user.uid,
      ...goalData,
      targetAmount: Number(goalData.targetAmount),
      savedAmount: Number(goalData.savedAmount),
      createdAt: serverTimestamp()
    });
  };

  const updateGoal = async (id, goalData) => {
    await updateDoc(doc(db, 'goals', id), {
      ...goalData,
      targetAmount: Number(goalData.targetAmount),
      savedAmount: Number(goalData.savedAmount)
    });
  };

  const deleteGoal = async (id) => {
    await deleteDoc(doc(db, 'goals', id));
  };

  const depositToGoal = async (goalId, walletId, amount) => {
    const numAmount = Number(amount);
    const goal = goals.find(g => g.id === goalId);
    await addDoc(collection(db, 'goal_deposits'), {
      uid: user.uid,
      goalId,
      walletId,
      goalName: goal ? goal.name : 'Unknown Goal',
      amount: numAmount,
      date: new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp()
    });
    if (goal) {
      await updateDoc(doc(db, 'goals', goalId), {
        savedAmount: Number(goal.savedAmount) + numAmount
      });
    }
    const wallet = wallets.find(w => w.id === walletId);
    if (wallet) {
      await updateDoc(doc(db, 'wallets', walletId), {
        balance: Number(wallet.balance) - numAmount
      });
    }
  };

  const deleteGoalDeposit = async (id, goalId, walletId, amount) => {
    await deleteDoc(doc(db, 'goal_deposits', id));
    const wallet = wallets.find(w => w.id === walletId);
    const goal = goals.find(g => g.id === goalId);
    const numAmount = Number(amount);
    if (wallet) {
      await updateDoc(doc(db, 'wallets', walletId), {
        balance: Number(wallet.balance) + numAmount
      });
    }
    if (goal) {
      await updateDoc(doc(db, 'goals', goalId), {
        savedAmount: Number(goal.savedAmount) - numAmount
      });
    }
  };

  const addMeal = async (mealData) => {
    await addDoc(collection(db, 'meals'), {
      uid: user.uid,
      ...mealData,
      amount: Number(mealData.amount),
      createdAt: serverTimestamp()
    });
  };

  const deleteMeal = async (id) => {
    await deleteDoc(doc(db, 'meals', id));
  };

  const updateMeal = async (id, mealData) => {
    await updateDoc(doc(db, 'meals', id), {
      ...mealData,
      amount: Number(mealData.amount)
    });
  };

  const addPurchase = async (purchaseData) => {
    await addDoc(collection(db, 'purchases'), {
      uid: user.uid,
      ...purchaseData,
      amount: Number(purchaseData.amount),
      createdAt: serverTimestamp()
    });
  };

  const deletePurchase = async (id) => {
    await deleteDoc(doc(db, 'purchases', id));
  };

  const updatePurchase = async (id, purchaseData) => {
    await updateDoc(doc(db, 'purchases', id), {
      ...purchaseData,
      amount: Number(purchaseData.amount)
    });
  };

  const updateBudget = async (categoryId, limit) => {
    const budgetId = `${user.uid}_${categoryId}`;
    const budgetRef = doc(db, 'budgets', budgetId);
    const { getDoc } = await import('firebase/firestore');
    const docSnap = await getDoc(budgetRef);
    if (docSnap.exists()) {
      await updateDoc(budgetRef, { limit: Number(limit) });
    } else {
      await setDoc(budgetRef, { 
        uid: user.uid, 
        id: categoryId, 
        limit: Number(limit) 
      });
    }
  };

  const deleteBudget = async (id) => {
    await deleteDoc(doc(db, 'budgets', id));
  };

  const getSmartRecents = () => {
    const frequencyMap = {};
    
    // Combine all history
    const allHistory = [
      ...meals.map(m => ({ label: m.item, amount: m.amount, type: 'meal', cat: 'Food', mType: m.mealType })),
      ...purchases.map(p => ({ label: p.item, amount: p.amount, type: 'purchase', cat: p.category }))
    ];

    allHistory.forEach(item => {
      const key = `${item.label}_${item.amount}`;
      if (!frequencyMap[key]) {
        frequencyMap[key] = { ...item, count: 0 };
      }
      frequencyMap[key].count++;
    });

    return Object.values(frequencyMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  return (
    <AppContext.Provider value={{
      wallets: getCalculatedWallets(),
      meals,
      purchases,
      incomes,
      transfers,
      goals,
      goalDeposits,
      budgets,
      categories,
      globalStats,
      loading,
      getSmartRecents,
      addCategory,
      deleteCategory,
      addWallet,
      deleteWallet,
      addGoal,
      updateGoal,
      deleteGoal,
      depositToGoal,
      addMeal,
      deleteMeal,
      updateMeal,
      addPurchase,
      deletePurchase,
      updatePurchase,
      updateBudget,
      deleteBudget,
      addIncome,
      deleteIncome,
      transferFunds,
      deleteTransfer,
      deleteGoalDeposit
    }}>
      {children}
    </AppContext.Provider>
  );
};