import React, { useState, useEffect } from 'react';
import { Container, Navbar, Button } from 'react-bootstrap';
import { AppProvider, useApp } from './context/AppContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import WalletPanel from './components/WalletPanel';
import GoalsPanel from './components/GoalsPanel';
import BudgetPlanner from './components/BudgetPlanner';
import ReportPanel from './components/ReportPanel';
import SettingsPanel from './components/SettingsPanel';
import CreateWalletModal from './components/CreateWalletModal';
import AddGoalModal from './components/AddGoalModal';
import DashboardView from './components/DashboardView';
import BottomNav from './components/BottomNav';
import Sidebar from './components/Sidebar';
import AuthView from './components/AuthView';
import AddTransactionModal from './components/AddTransactionModal';
import PageLoader from './components/PageLoader';
import { FaPlus, FaMoon, FaSun, FaWallet, FaSignOutAlt } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

// Mobile Header Component
const MobileHeader = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { logout } = useAuth();
  return (
    <Navbar className="bg-white border-bottom shadow-sm d-lg-none sticky-top" style={{ height: 'var(--header-height)', background: 'var(--nav-bg)', borderColor: 'var(--border-color)' }}>
      <Container>
        <Navbar.Brand className="d-flex align-items-center fw-bold text-primary">
          <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-2">
            <FaWallet size={20} />
          </div>
          SMWallet
        </Navbar.Brand>
        <div className="d-flex align-items-center gap-3">
          <Button variant="link" onClick={toggleTheme} className="text-secondary p-0">
            {isDarkMode ? <FaMoon size={20} className="text-warning" /> : <FaSun size={20} className="text-warning" />}
          </Button>
          <Button variant="link" onClick={logout} className="text-danger p-0">
            <FaSignOutAlt size={20} />
          </Button>
        </div>
      </Container>
    </Navbar>
  );
};

function AppContent() {
  const { loading } = useApp();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('wallets');
  const [isPreparing, setIsPreparing] = useState(false);
  const [showCreateWalletModal, setShowCreateWalletModal] = useState(false);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 992);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!user) {
    return <AuthView />;
  }

  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    setIsPreparing(true);
    setActiveTab(tab);
    setTimeout(() => setIsPreparing(false), 400); 
  };

  if (loading) {
    return (
      <div className="vh-100 d-flex justify-content-center align-items-center" style={{ background: 'var(--bg-color)' }}>
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar for Desktop */}
      {isDesktop && (
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
          onAddTransaction={() => setShowAddTransactionModal(true)}
        />
      )}

      {/* Main Content Area */}
      <div className="main-content d-flex flex-column p-0">
        {!isDesktop && <MobileHeader />}
        
        <div className="flex-grow-1 overflow-auto" style={{ padding: isDesktop ? '2rem' : '1rem', paddingBottom: isDesktop ? '2rem' : '100px' }}>
          <Container fluid={isDesktop} className={isDesktop ? "px-4" : "p-0"}>
            <AnimatePresence mode="wait">
              {isPreparing ? (
                <motion.div
                  key="preparing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="preparing-overlay"
                >
                  <PageLoader />
                </motion.div>
              ) : (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {activeTab === 'wallets' && (
                    <WalletPanel onOpenCreateModal={() => setShowCreateWalletModal(true)} />
                  )}
                  
                  {activeTab === 'goals' && (
                    <GoalsPanel onOpenCreateModal={() => setShowAddGoalModal(true)} />
                  )}

                  {activeTab === 'budget' && (
                    <BudgetPlanner />
                  )}
                  
                  {activeTab === 'reports' && (
                    <ReportPanel />
                  )}

                  {activeTab === 'settings' && (
                    <SettingsPanel />
                  )}
                  
                  {activeTab === 'history' && (
                    <DashboardView />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </Container>
        </div>
      </div>

      {/* Mobile Floating Action Button */}
      {!isDesktop && (
        <div className="fab-container">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="fab-btn" 
            onClick={() => setShowAddTransactionModal(true)}
            aria-label="Add Transaction"
          >
            <FaPlus />
          </motion.button>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      {!isDesktop && (
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      )}

      {/* Modals */}
      <CreateWalletModal 
        show={showCreateWalletModal} 
        onHide={() => setShowCreateWalletModal(false)} 
      />
      
      <AddGoalModal 
        show={showAddGoalModal} 
        onHide={() => setShowAddGoalModal(false)} 
      />

      <AddTransactionModal
        show={showAddTransactionModal}
        onHide={() => setShowAddTransactionModal(false)}
      />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
