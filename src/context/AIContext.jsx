import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

const AIContext = createContext();

export const useAI = () => useContext(AIContext);

export const AIProvider = ({ children }) => {
  const { user } = useAuth();
  const [aiSettings, setAiSettings] = useState({
    preferredModel: 'builtIn',
    geminiKey: '',
    deepseekKey: '',
    language: 'english',
    currency: 'BDT',
    soundsEnabled: true
  });

  useEffect(() => {
    if (!user) return;

    // Sync from Firestore (Single Source of Truth)
    const aiRef = doc(db, 'settings_ai', user.uid);
    const unsubscribe = onSnapshot(aiRef, (snapshot) => {
        if (snapshot.exists()) {
            setAiSettings(prev => ({ ...prev, ...snapshot.data() }));
        }
    });

    return () => unsubscribe();
  }, [user]);

  const updateAISettings = async (newSettings) => {
    if (!user) return;
    
    const updated = { ...aiSettings, ...newSettings };
    setAiSettings(updated);
    
    try {
        await setDoc(doc(db, 'settings_ai', user.uid), updated, { merge: true });
    } catch (e) {
        console.error("Failed to sync AI settings:", e);
    }
  };

  return (
    <AIContext.Provider value={{ aiSettings, updateAISettings }}>
      {children}
    </AIContext.Provider>
  );
};