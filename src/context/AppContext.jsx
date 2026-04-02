import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { playSound } from '../utils/soundEffects';
import { getLocalISO, formatTimestampLocal } from '../utils/dateUtils';
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
  getDocs,
  increment,
  orderBy,
  limit,
  arrayUnion
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
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [avatarState, setAvatarState] = useState({
    level: 1,
    xp: 0,
    xp_frugality: 0,
    xp_consistency: 0,
    xp_wealth: 0,
    health: 100,
    streak: 0,
    multiplier: 1,
    shadowXP: 0,
    shadowLevel: 0,
    checkInHistory: [],
    lastUpdate: null,
    lastActivity: null,
    lastPassiveGrant: null,
    dailyStats: { lastReset: null, counts: {} }
  });
  const [loading, setLoading] = useState(true);

  // --- XP Constants & Formulas ---
  const XP_BASE = 100;
  const XP_EXPONENT = 1.5;

  const getLevelFromXP = (xp) => {
    if (xp < XP_BASE) return 1;
    return Math.floor(Math.pow(xp / XP_BASE, 1 / XP_EXPONENT)) + 1;
  };

  const getXPToReachLevel = (level) => {
    if (level <= 1) return 0;
    return Math.floor(XP_BASE * Math.pow(level - 1, XP_EXPONENT));
  };

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

  const isShieldActive = useMemo(() => {
    return goals.some(g => g.isEmergency && Number(g.savedAmount) >= Number(g.targetAmount));
  }, [goals]);

  const earnXP = async (amount, type = 'frugality', actionKey = null) => {
    if (!user || !avatarState?.id) return;
    
    const skillField = `xp_${type}`;
    let multiplier = avatarState.multiplier || 1;

    // Apply Wealth Perks (Passive Buffs)
    if (type === 'wealth') {
        if ((avatarState.xp_wealth || 0) >= 1500) multiplier *= 1.20;
        else if ((avatarState.xp_wealth || 0) >= 500) multiplier *= 1.10;
    }

    // Apply Consistency Perk (Early Riser)
    if (type === 'consistency' && (avatarState.xp_consistency || 0) >= 500) {
        const hour = new Date().getHours();
        if (hour < 10) multiplier *= 1.05; // 5% bonus before 10 AM
    }

    let finalAmount = Math.round(amount * multiplier);

    // Diminishing Returns / Anti-Spam Logic
    const daily = avatarState.dailyStats || { lastReset: null, counts: {} };
    const today = getLocalISO();
    const lastReset = formatTimestampLocal(daily.lastReset);
    
    let updatedCounts = { ...(daily.counts || {}) };
    
    if (lastReset !== today) {
        updatedCounts = {}; // Reset for new day
    }

    if (actionKey) {
        const count = updatedCounts[actionKey] || 0;
        if (count >= 6) {
            finalAmount = 1; // Minimal reward after 6 actions
        } else if (count >= 3) {
            finalAmount = Math.max(1, Math.round(finalAmount * 0.5)); // 50% reward after 3 actions
        }
        updatedCounts[actionKey] = count + 1;
    }
    
    // If earning positive XP, slightly reduce shadow if it exists
    const shadowReduction = Math.floor(finalAmount * 0.1);

    await updateDoc(doc(db, 'avatar', avatarState.id), {
      [skillField]: increment(finalAmount),
      shadowXP: increment(-shadowReduction),
      'dailyStats.counts': updatedCounts,
      'dailyStats.lastReset': serverTimestamp(),
      lastUpdate: serverTimestamp(),
      lastActivity: serverTimestamp()
    });
  };

  const increaseShadowXP = async (amount) => {
    if (!user || !avatarState?.id) return;
    await updateDoc(doc(db, 'avatar', avatarState.id), {
        shadowXP: increment(amount),
        lastUpdate: serverTimestamp()
    });
  };

  // Level Up Sound Effect
  useEffect(() => {
    const prevLevel = Number(localStorage.getItem('prev_level') || 1);
    if (avatarState.level > prevLevel) {
        playSound('levelUp');
    }
    localStorage.setItem('prev_level', avatarState.level);
  }, [avatarState.level]);

  // --- Daily Check-in & Session Logic (Duolingo Style) ---
  
  const hasTransactionToday = useMemo(() => {
    const today = getLocalISO();
    const madeMeal = meals.some(m => m.date === today);
    const madePurchase = purchases.some(p => p.date === today);
    const madeIncome = incomes.some(i => i.date === today);
    return madeMeal || madePurchase || madeIncome;
  }, [meals, purchases, incomes]);

  useEffect(() => {
    if (!user || !avatarState?.id) return;
    
    const today = getLocalISO();
    const hasCheckedIn = avatarState.checkInHistory?.includes(today);
    
    if (hasCheckedIn) {
        setSessionSeconds(120);
        return;
    }

    const key = `session_sec_${user.uid}_${today}`;
    let seconds = parseInt(localStorage.getItem(key) || '0');
    setSessionSeconds(Math.min(seconds, 120));

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        seconds++;
        if (seconds <= 120) {
            localStorage.setItem(key, seconds);
            setSessionSeconds(seconds);
            // Auto check-in if conditions are met
            if (seconds === 120 && hasTransactionToday) {
                completeCheckIn();
            }
        } else {
            clearInterval(interval);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user, avatarState?.id, avatarState.checkInHistory, hasTransactionToday]);

  // Manual trigger check-in if transaction made after 2 mins spent
  useEffect(() => {
    if (sessionSeconds >= 120 && hasTransactionToday) {
        const today = getLocalISO();
        if (!avatarState.checkInHistory?.includes(today)) {
            completeCheckIn();
        }
    }
  }, [hasTransactionToday, sessionSeconds, avatarState.checkInHistory]);

  const completeCheckIn = async () => {
    if (!user || !avatarState?.id) return;
    const today = getLocalISO();
    if (avatarState.checkInHistory?.includes(today)) return;

    try {
        const lastCheckIn = avatarState.lastCheckInDate; // YYYY-MM-DD
        let newStreak = avatarState.streak || 0;
        
        if (lastCheckIn) {
            const lastDate = new Date(lastCheckIn + 'T00:00:00');
            const todayDate = new Date(today + 'T00:00:00');
            const diffMs = todayDate.getTime() - lastDate.getTime();
            const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) newStreak += 1;
            else if (diffDays > 1) newStreak = 1;
            else if (diffDays === 0) return; // Already checked in
        } else {
            newStreak = 1;
        }

        await updateDoc(doc(db, 'avatar', avatarState.id), {
            checkInHistory: arrayUnion(today),
            lastCheckInDate: today,
            streak: newStreak,
            multiplier: Math.min(2, 1 + (newStreak * 0.1)),
            xp_consistency: increment(50),
            lastActivity: serverTimestamp()
        });
        playSound('success');
    } catch (e) { console.error("Check-in error:", e); }
  };

  // Passive XP Logic (Discipline)
  useEffect(() => {
    if (!user || !avatarState?.id) return;
    const now = new Date();
    const lastGrant = avatarState.lastPassiveGrant?.toDate ? avatarState.lastPassiveGrant.toDate() : (avatarState.lastPassiveGrant ? new Date(avatarState.lastPassiveGrant) : null);
    
    if (!lastGrant || Math.floor((now - lastGrant) / (1000 * 60 * 60 * 24)) >= 1) {
        const totalBudget = (budgets || []).reduce((a, c) => a + (Number(c.limit) || 0), 0);
        if (totalBudget > 0 && globalStats.totalSpent <= totalBudget) {
            earnXP(50, 'frugality', 'discipline');
            updateDoc(doc(db, 'avatar', avatarState.id), { lastPassiveGrant: serverTimestamp() });
        }
    }
  }, [avatarState.id, user, budgets, globalStats.totalSpent]);

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
      setWallets(s.docs.map(d => ({ ...d.data(), id: d.id })).sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))),
      (err) => { console.error("Wallets snapshot error:", err); });
    
    const unsubBudgets = onSnapshot(baseQuery('budgets'), (s) => setBudgets(s.docs.map(d => ({ ...d.data(), id: d.id }))),
      (err) => { console.error("Budgets snapshot error:", err); });
      
    const unsubIncomes = onSnapshot(baseQuery('incomes'), (s) => setIncomes(s.docs.map(d => ({ ...d.data(), id: d.id })).sort((a,b) => new Date(b.date) - new Date(a.date))),
      (err) => { console.error("Incomes snapshot error:", err); });
      
    const unsubTransfers = onSnapshot(baseQuery('transfers'), (s) => setTransfers(s.docs.map(d => ({ ...d.data(), id: d.id })).sort((a,b) => new Date(b.date) - new Date(a.date))),
      (err) => { console.error("Transfers snapshot error:", err); });
      
    const unsubGoals = onSnapshot(baseQuery('goals'), (s) => setGoals(s.docs.map(d => ({ ...d.data(), id: d.id })).sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))),
      (err) => { console.error("Goals snapshot error:", err); });
      
    const unsubMeals = onSnapshot(baseQuery('meals'), (s) => setMeals(s.docs.map(d => ({ ...d.data(), id: d.id })).sort((a,b) => new Date(b.date) - new Date(a.date))),
      (err) => { console.error("Meals snapshot error:", err); });
      
    const unsubPurchases = onSnapshot(baseQuery('purchases'), (s) => setPurchases(s.docs.map(d => ({ ...d.data(), id: d.id })).sort((a,b) => new Date(b.date) - new Date(a.date))),
      (err) => { console.error("Purchases snapshot error:", err); });
      
    const unsubDeposits = onSnapshot(baseQuery('goal_deposits'), (s) => setGoalDeposits(s.docs.map(d => ({ ...d.data(), id: d.id })).sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))),
      (err) => { console.error("Deposits snapshot error:", err); });
      
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
    }, (err) => { console.error("Trash snapshot error:", err); });
    
    const avatarRef = doc(db, 'avatar', user.uid);
    let initializing = false;
    const unsubAvatar = onSnapshot(avatarRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const totalXp = (data.xp || 0) + (data.xp_frugality || 0) + (data.xp_consistency || 0) + (data.xp_wealth || 0);
        
        // Shadow Level Calculation
        const shadowXP = Math.max(0, data.shadowXP || 0);
        const shadowLevel = Math.floor(shadowXP / 500);

        // Calculate level and progress
        const level = getLevelFromXP(totalXp);
        const xpToCurrent = getXPToReachLevel(level);
        const xpToNext = getXPToReachLevel(level + 1);
        const xpInLevel = totalXp - xpToCurrent;
        const nextLevelXp = xpToNext - xpToCurrent;

        setAvatarState({ 
          ...data, 
          totalXp, 
          level, 
          xpInLevel, 
          nextLevelXp, 
          shadowXP,
          shadowLevel,
          checkInHistory: data.checkInHistory || [],
          id: docSnap.id 
        });
      } else if (!initializing) {
        initializing = true;
        // Migration: Check if an old random-ID document exists
        const oldQuery = query(collection(db, 'avatar'), where('uid', '==', user.uid), orderBy('createdAt', 'desc'), limit(1));
        const initial = { 
          uid: user.uid, 
          userId: user.uid, 
          level: 1, 
          xp: 0, 
          xp_frugality: 0, 
          xp_consistency: 0, 
          xp_wealth: 0, 
          health: 100, 
          streak: 0, 
          multiplier: 1, 
          shadowXP: 0,
          shadowLevel: 0,
          checkInHistory: [],
          lastCheckInDate: null,
          lastActivity: serverTimestamp(), 
          createdAt: serverTimestamp(),
          dailyStats: { lastReset: serverTimestamp(), counts: {} }
        };
        
        getDocs(oldQuery).then(s => {
          if (!s.empty) {
            const oldDoc = s.docs[0];
            if (oldDoc.id !== user.uid) {
                const oldData = oldDoc.data();
                setDoc(avatarRef, { ...initial, ...oldData, uid: user.uid, userId: user.uid, createdAt: oldData.createdAt || serverTimestamp() });
                deleteDoc(doc(db, 'avatar', oldDoc.id));
            }
          } else {
            setDoc(avatarRef, initial);
          }
        }).catch(() => setDoc(avatarRef, initial));
      }
      setLoading(false); // Set loading to false immediately after snapshot
    }, (err) => {
        console.error("Avatar snapshot error:", err);
        setLoading(false);
    });

    return () => { 
        unsubCats(); unsubWallets(); unsubBudgets(); unsubIncomes(); unsubTransfers(); 
        unsubGoals(); unsubMeals(); unsubPurchases(); unsubDeposits(); unsubTrash(); unsubAvatar();
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

  // Derived Avatar Health Logic
  useEffect(() => {
    if (!user || !avatarState?.id) return;

    const totalBudget = (budgets || []).reduce((a, c) => a + (Number(c.limit) || 0), 0);
    const spent = globalStats.totalSpent || 0;
    let newHealth = 100;
    
    if (totalBudget > 0 && spent > totalBudget) {
        const overPercent = ((spent - totalBudget) / totalBudget) * 100;
        let penaltyMultiplier = 2;
        
        // Consistency Perk (Unstoppable) - Reduce health loss
        if ((avatarState.xp_consistency || 0) >= 1500) penaltyMultiplier = 1;
        
        // --- EMERGENCY SHIELD LOGIC ---
        if (isShieldActive) penaltyMultiplier *= 0.5; // Halve the penalty if shield is active
        
        newHealth = Math.max(10, 100 - (overPercent * penaltyMultiplier));

        // If taking significant damage, increase shadow!
        if (newHealth < (avatarState.health - 5)) {
            increaseShadowXP(100);
        }
    }
    
    const roundedHealth = Math.round(newHealth);
    if (Math.abs(roundedHealth - (avatarState.health || 100)) > 1) {
        updateDoc(doc(db, 'avatar', avatarState.id), {
            health: roundedHealth,
            lastUpdate: serverTimestamp()
        });
    }
  }, [budgets, globalStats.totalSpent, avatarState?.id, avatarState?.health, user, isShieldActive]);

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
    await earnXP(10, 'wealth', 'wallet');
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
    await earnXP(15, 'wealth', 'income');
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
        amount: numAmount, date: getLocalISO(), createdAt: serverTimestamp() 
      });
      await earnXP(5, 'wealth', 'transfer');
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
    await earnXP(10, 'wealth', 'goal');
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
    await addDoc(collection(db, 'goal_deposits'), { uid: user.uid, userId: user.uid, goalId, walletId, goalName: goal.name, amount: numAmount, date: getLocalISO(), createdAt: serverTimestamp() });
    await updateDoc(doc(db, 'goals', goalId), { savedAmount: newSaved });
    const wallet = wallets.find(w => w.id === walletId);
    if (wallet) await updateDoc(doc(db, 'wallets', walletId), { balance: Number(wallet.balance || 0) - numAmount });
    await earnXP(20, 'wealth', 'deposit');
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
    await earnXP(5, 'frugality', 'meal');
  };

  const updateMeal = async (id, mealData) => await updateDoc(doc(db, 'meals', id), { ...mealData, amount: Number(mealData.amount || 0) });
  const deleteMeal = async (id) => {
    const meal = meals.find(m => m.id === id);
    if (meal) await moveToTrash('meals', id, meal);
  };

  const addPurchase = async (purchaseData) => {
    await addDoc(collection(db, 'purchases'), { uid: user.uid, userId: user.uid, ...purchaseData, amount: Number(purchaseData.amount || 0), createdAt: serverTimestamp() });
    await earnXP(5, 'frugality', 'purchase');
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

  const factoryReset = async () => {
    if (!user) return;
    try {
        const collectionsToClear = [
            'categories', 'wallets', 'budgets', 'incomes', 'transfers', 
            'goals', 'meals', 'purchases', 'goal_deposits', 'trash',
            'habits', 'habitLogs', 'todos', 'notes', 'shoppingList', 
            'trips', 'planner_water', 'daily_quests', 'weekly_quests', 
            'user_achievements'
        ];

        for (const collName of collectionsToClear) {
            const q = query(collection(db, collName), where('uid', '==', user.uid));
            const snapshot = await getDocs(q);
            for (const docSnap of snapshot.docs) {
                await deleteDoc(doc(db, collName, docSnap.id));
            }
        }

        // Reset Avatar
        const avatarRef = doc(db, 'avatar', user.uid);
        await setDoc(avatarRef, { 
            uid: user.uid, 
            userId: user.uid, 
            level: 1, 
            xp: 0, 
            xp_frugality: 0, 
            xp_consistency: 0, 
            xp_wealth: 0, 
            health: 100, 
            streak: 0, 
            multiplier: 1, 
            shadowXP: 0,
            shadowLevel: 0,
            checkInHistory: [],
            lastCheckInDate: null,
            lastActivity: serverTimestamp(), 
            createdAt: serverTimestamp(),
            dailyStats: { lastReset: serverTimestamp(), counts: {} }
        });

        // Reset AI Settings
        await setDoc(doc(db, 'settings_ai', user.uid), {
            preferredModel: 'builtIn',
            geminiKey: '',
            deepseekKey: '',
            language: 'english',
            currency: 'BDT',
            soundsEnabled: true,
            hapticEnabled: true,
            notifEnabled: false
        });

        // Reset User Core Settings
        await setDoc(doc(db, 'users', user.uid), { 
            email: user.email, 
            pinnedWalletId: '',
            lastReset: serverTimestamp() 
        });

        playSound('pop');
        return true;
    } catch (e) {
        console.error("Factory Reset Error:", e);
        throw e;
    }
  };

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
      meals, purchases, incomes, transfers, goals, goalDeposits, budgets, categories, globalStats, trashItems, avatarState, loading, isShieldActive,
      addCategory, deleteCategory, addWallet, deleteWallet, addGoal, updateGoal, deleteGoal, depositToGoal, deleteGoalDeposit,
      addMeal, updateMeal, deleteMeal, addPurchase, updatePurchase, deletePurchase, updateBudget, deleteBudget, addIncome, updateIncome, deleteIncome, transferFunds, deleteTransfer, getSmartRecents,
      moveToTrash, restoreFromTrash, deletePermanently, emptyTrash, earnXP, increaseShadowXP, factoryReset, sessionSeconds, hasTransactionToday
    }}>
      {children}
    </AppContext.Provider>
  );
};