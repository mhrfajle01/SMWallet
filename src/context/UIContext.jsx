import React, { createContext, useContext, useState } from 'react';

const UIContext = createContext();

export const useUI = () => useContext(UIContext);

export const UIProvider = ({ children }) => {
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [transactionPreFill, setTransactionPreFill] = useState(null);

  const openTransactionModal = (preFill = null) => {
    setTransactionPreFill(preFill);
    setShowAddTransactionModal(true);
  };

  const closeTransactionModal = () => {
    setShowAddTransactionModal(false);
    setTransactionPreFill(null);
  };

  return (
    <UIContext.Provider value={{
      showAddTransactionModal,
      transactionPreFill,
      openTransactionModal,
      closeTransactionModal
    }}>
      {children}
    </UIContext.Provider>
  );
};