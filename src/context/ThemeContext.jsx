import React, { createContext, useState, useEffect, useContext } from 'react';
import { useModule } from './ModuleContext';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const { activeModule } = useModule();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  // Handle Module-Specific Accent Colors & Atmosphere
  useEffect(() => {
    const root = document.documentElement;
    if (activeModule === 'finance') {
      root.style.setProperty('--primary-color', isDarkMode ? '#60a5fa' : '#2563eb');
      root.style.setProperty('--primary-gradient', 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)');
      root.style.setProperty('--accent-color', '#10b981'); // Success/Growth Green
      root.style.setProperty('--workspace-font', "'Inter', sans-serif");
      root.style.setProperty('--nav-bg', isDarkMode ? '#0f172a' : '#ffffff');
      root.style.setProperty('--card-shadow', '0 10px 25px -5px rgba(0, 0, 0, 0.1)');
    } else if (activeModule === 'productivity') {
      root.style.setProperty('--primary-color', isDarkMode ? '#a78bfa' : '#7c3aed');
      root.style.setProperty('--primary-gradient', 'linear-gradient(135deg, #6d28d9 0%, #8b5cf6 100%)');
      root.style.setProperty('--accent-color', '#f59e0b'); // Focus Orange
      root.style.setProperty('--workspace-font', "'Outfit', 'Inter', sans-serif");
      root.style.setProperty('--nav-bg', isDarkMode ? '#1e1b4b' : '#f5f3ff');
      root.style.setProperty('--card-shadow', '0 10px 25px -5px rgba(124, 58, 237, 0.1)');
    } else {
      // Hub / Selection State
      root.style.setProperty('--primary-color', '#3b82f6');
      root.style.setProperty('--primary-gradient', 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)');
      root.style.setProperty('--workspace-font', "'Inter', sans-serif");
      root.style.setProperty('--nav-bg', isDarkMode ? '#0f172a' : '#ffffff');
    }
  }, [activeModule, isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
