import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const AIContext = createContext();

export const useAI = () => useContext(AIContext);

export const AIProvider = ({ children }) => {
  const { user } = useAuth();
  const [aiSettings, setAiSettings] = useState({
    preferredModel: 'builtIn', // Default to builtIn for safety
    geminiKey: '',
    deepseekKey: ''
  });

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`smwallet_ai_settings_${user.uid}`);
      if (saved) {
        try {
            const parsed = JSON.parse(saved);
            
            // Migration: if preferredModel is 'local' or missing, change to 'builtIn'
            if (parsed.preferredModel === 'local' || !parsed.preferredModel) {
                parsed.preferredModel = 'builtIn';
            }
            
            // Cleanup old fields
            const { localEndpoint, ...clean } = parsed;
            setAiSettings(prev => ({ ...prev, ...clean }));
        } catch (e) {
            console.error("Failed to parse AI settings", e);
        }
      }
    }
  }, [user]);

  const updateAISettings = (newSettings) => {
    setAiSettings(prev => {
        const updated = { ...prev, ...newSettings };
        if (user) {
            localStorage.setItem(`smwallet_ai_settings_${user.uid}`, JSON.stringify(updated));
        }
        return updated;
    });
  };

  return (
    <AIContext.Provider value={{ aiSettings, updateAISettings }}>
      {children}
    </AIContext.Provider>
  );
};