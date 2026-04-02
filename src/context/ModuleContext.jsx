import React, { createContext, useContext, useState, useEffect } from 'react';

const ModuleContext = createContext();

export const useModule = () => useContext(ModuleContext);

export const ModuleProvider = ({ children }) => {
  const [activeModule, setActiveModule] = useState(() => {
    return localStorage.getItem('active_module') || null;
  });

  const setModule = (module) => {
    setActiveModule(module);
    if (module) {
      localStorage.setItem('active_module', module);
    } else {
      localStorage.removeItem('active_module');
    }
  };

  return (
    <ModuleContext.Provider value={{ activeModule, setModule }}>
      {children}
    </ModuleContext.Provider>
  );
};