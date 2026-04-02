import React, { useState, useEffect, useMemo } from 'react';
import { Container, Button, Badge } from 'react-bootstrap';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useApp } from './context/AppContext';
import { useUI } from './context/UIContext';
import { useTheme } from './context/ThemeContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { AppContext, AppProvider } from './context/AppContext';
import { ProductivityProvider } from './context/ProductivityContext';
import { UIProvider } from './context/UIContext';
import { AIProvider } from './context/AIContext';
import { QuestProvider } from './context/QuestContext';
import { AchievementProvider } from './context/AchievementContext';

// Components
import WalletPanel from './components/WalletPanel';
import GoalsPanel from './components/GoalsPanel';
import BudgetPlanner from './components/BudgetPlanner';
import ReportPanel from './components/ReportPanel';
import SettingsPanel from './components/SettingsPanel';
import DashboardView from './components/DashboardView';
import UnifiedPlanner from './components/UnifiedPlanner';
import TrashView from './components/TrashView';
import UnifiedDashboard from './components/UnifiedDashboard';
import CategorySelection from './components/CategorySelection';
import HybridOverview from './components/HybridOverview';
import { ModuleProvider, useModule } from './context/ModuleContext';

// Productivity Components
import HabitTracker from './components/productivity/HabitTracker';
import TodoManager from './components/productivity/TodoManager';
import NotesApp from './components/productivity/NotesApp';
import DataTransfer from './components/DataTransfer';

import CreateWalletModal from './components/CreateWalletModal';
import AddGoalModal from './components/AddGoalModal';
import BottomNav from './components/BottomNav';
import Sidebar from './components/Sidebar';
import AuthView from './components/AuthView';
import AddTransactionModal from './components/AddTransactionModal';
import GlobalSearch from './components/GlobalSearch';
import PageLoader from './components/PageLoader';
import { FaPlus, FaMoon, FaSun, FaSignOutAlt, FaWifi, FaThLarge } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

import './App.css';

// Offline Monitor Hook
const useOffline = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOffline;
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="vh-100 d-flex justify-content-center align-items-center" style={{ background: 'var(--bg-color)' }}><PageLoader /></div>;
  return user ? children : <AuthView />;
};

const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  useEffect(() => {
    const handleError = (e) => { 
        console.error("Critical Application Error:", e); 
        setHasError(true); 
    };
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);
    return () => {
        window.removeEventListener('error', handleError);
        window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  if (hasError) return (
    <div className="vh-100 d-flex flex-column justify-content-center align-items-center text-center p-4" style={{ background: '#f8fafc' }}>
      <div className="bg-white p-5 rounded-5 shadow-lg border" style={{ maxWidth: '500px' }}>
        <h2 className="fw-bold mb-3 text-danger">Something went wrong</h2>
        <p className="text-muted mb-4 text-center">The application encountered an unexpected error. We've been notified and are looking into it.</p>
        <Button variant="primary" className="rounded-pill px-5 py-3 fw-bold shadow-sm" onClick={() => window.location.reload()}>Refresh Application</Button>
      </div>
    </div>
  );
  return children;
};

function AppLayout() {
  const isOffline = useOffline();
  const { showAddTransactionModal, transactionPreFill, openTransactionModal, closeTransactionModal } = useUI();
  const { isDarkMode, toggleTheme } = useTheme();
  const { activeModule } = useModule();
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showCreateWalletModal, setShowCreateWalletModal] = useState(false);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 992);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isSelectionPage = location.pathname === '/selection';
  const isZenMode = activeModule === 'productivity';

  const mobileTitle = useMemo(() => {
    const path = location.pathname;
    if (path.includes('wallets')) return 'Wallets';
    if (path.includes('goals')) return 'Goals';
    if (path.includes('planner')) return 'Daily Planner';
    if (path.includes('history')) return 'History';
    if (path.includes('dashboard')) return 'Hub';
    if (path.includes('settings')) return 'Settings';
    if (path.includes('habits')) return 'Habits';
    if (path.includes('todos')) return 'Todos';
    if (path.includes('notes')) return 'Notes';
    if (path.includes('overview')) return 'Life Feed';
    return 'SMWallet';
  }, [location]);

  return (
    <div className={`app-container ${isZenMode ? 'zen-mode' : ''}`} style={{ fontFamily: 'var(--workspace-font)' }}>
      {/* Offline Status Bar */}
      <AnimatePresence>
        {isOffline && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-warning text-dark py-1 px-3 text-center small fw-bold d-flex align-items-center justify-content-center gap-2 sticky-top"
            style={{ zIndex: 9999, borderBottom: '1px solid rgba(0,0,0,0.1)' }}
          >
            <FaWifi /> Working Offline • Changes will sync later
          </motion.div>
        )}
      </AnimatePresence>

      {!isSelectionPage && <Sidebar onAddTransaction={openTransactionModal} />}

      <div className={`main-content d-flex flex-column p-0 ${isSelectionPage ? 'w-100' : ''}`}>
        {/* Desktop Top Header */}
        {!isSelectionPage && (
          <div className="d-none d-lg-flex align-items-center justify-content-between px-4 sticky-top border-bottom" 
               style={{ 
                 height: '70px', 
                 background: 'var(--nav-bg)', 
                 zIndex: 100, 
                 backdropFilter: 'blur(10px)',
                 borderColor: 'var(--border-color)'
               }}>
            <div style={{ width: '400px' }}>
              <GlobalSearch />
            </div>

            <div className="d-flex align-items-center gap-3">
              <Button variant="link" onClick={toggleTheme} className="text-secondary p-2 rounded-circle hover-bg">
                {isDarkMode ? <FaMoon size={18} className="text-warning" /> : <FaSun size={18} className="text-warning" />}
              </Button>
              <div className="vr opacity-10" style={{ height: '20px' }}></div>
              <Button variant="outline-danger" size="sm" className="rounded-pill px-3 border-0 fw-bold" onClick={logout}>
                <FaSignOutAlt className="me-2" /> Logout
              </Button>
            </div>
          </div>
        )}

        {/* Mobile Header */}
        {!isSelectionPage && (
          <div className="d-lg-none sticky-top bg-surface border-bottom px-3 d-flex align-items-center justify-content-between" style={{ height: '60px', zIndex: 1000, background: 'var(--nav-bg)' }}>
            <h5 className="mb-0 fw-bold text-primary">{mobileTitle}</h5>
            <Button variant="link" onClick={toggleTheme} className="text-secondary p-2">
              {isDarkMode ? <FaSun size={20} className="text-warning" /> : <FaMoon size={20} />}
            </Button>
          </div>
        )}

        <div className="flex-grow-1 overflow-auto" style={{ padding: isDesktop && !isSelectionPage ? '2rem' : '0', paddingBottom: isDesktop ? '2rem' : (isSelectionPage ? '0' : '100px') }}>
          <Container fluid={isDesktop} className={isDesktop && !isSelectionPage ? "px-4" : "p-0"}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Routes>
                  <Route path="/selection" element={<CategorySelection />} />
                  <Route path="/overview" element={<HybridOverview />} />
                  {/* Finance Routes */}
                  <Route path="/dashboard" element={<UnifiedDashboard />} />
                  <Route path="/wallets" element={<WalletPanel onOpenCreateModal={() => setShowCreateWalletModal(true)} />} />
                  <Route path="/goals" element={<GoalsPanel onOpenCreateModal={() => setShowAddGoalModal(true)} />} />
                  <Route path="/budget" element={<BudgetPlanner />} />
                  <Route path="/reports" element={<ReportPanel />} />
                  <Route path="/settings" element={<SettingsPanel />} />
                  <Route path="/history" element={<DashboardView />} />
                  <Route path="/planner" element={<UnifiedPlanner />} />
                  <Route path="/trash" element={<TrashView />} />
                  
                  {/* Productivity Routes */}
                  <Route path="/productivity/habits" element={<HabitTracker />} />
                  <Route path="/productivity/todos" element={<TodoManager />} />
                  <Route path="/productivity/notes" element={<NotesApp />} />
                  <Route path="/productivity/data" element={<DataTransfer />} />
                  
                  <Route path="*" element={<Navigate to="/selection" replace />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </Container>
        </div>
      </div>

      {/* Mobile Floating Action Button */}
      {!isDesktop && !isSelectionPage && !location.pathname.includes('/productivity') && (
        <div className="fab-container">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="fab-btn" 
            onClick={() => openTransactionModal()}
            aria-label="Add Transaction"
          >
            <FaPlus />
          </motion.button>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      {!isDesktop && !isSelectionPage && (
        <BottomNav />
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
        onHide={closeTransactionModal}
        preFill={transactionPreFill}
      />
    </div>
  );
}

const AutoSwitch = ({ children }) => {
  const { activeModule } = useModule();
  const location = useLocation();

  useEffect(() => {
    if (!activeModule && (location.pathname === '/' || location.pathname === '/selection')) {
      const hour = new Date().getHours();
      let target = (hour >= 6 && hour < 11) ? 'productivity' : (hour >= 18 ? 'finance' : null);
      if (target) console.log(`Smart Switch Recommendation: ${target}`);
    }
  }, [activeModule, location.pathname]);

  return children;
};

function App() {
  return (
    <AuthProvider>
      <AIProvider>
        <AppProvider>
          <AppContext.Consumer>
            {({ earnXP }) => (
              <ProductivityProvider onEarnXP={earnXP}>
                <AchievementProvider>
                  <QuestProvider>
                    <ModuleProvider>
                      <HashRouter>
                        <AutoSwitch>
                          <ThemeProvider>
                            <UIProvider>
                              <ProtectedRoute>
                                <ErrorBoundary>
                                  <AppLayout />
                                </ErrorBoundary>
                              </ProtectedRoute>
                            </UIProvider>
                          </ThemeProvider>
                        </AutoSwitch>
                      </HashRouter>
                    </ModuleProvider>
                  </QuestProvider>
                </AchievementProvider>
              </ProductivityProvider>
            )}
          </AppContext.Consumer>
        </AppProvider>
      </AIProvider>
    </AuthProvider>
  );
}

export default App;