import React, { useState, useEffect } from 'react';
import { Container, Navbar, Button, Nav, Badge } from 'react-bootstrap';
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

// Components
import WalletPanel from './components/WalletPanel';
import GoalsPanel from './components/GoalsPanel';
import BudgetPlanner from './components/BudgetPlanner';
import ReportPanel from './components/ReportPanel';
import SettingsPanel from './components/SettingsPanel';
import DashboardView from './components/DashboardView';
import SmartPlanner from './components/SmartPlanner';
import TrashView from './components/TrashView';

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
import FloatingBalance from './components/FloatingBalance';
import { FaPlus, FaMoon, FaSun, FaWallet, FaSignOutAlt, FaList, FaHistory, FaTasks, FaStickyNote, FaTrash } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

import './App.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-5 text-center">
          <h5 className="text-danger mb-3">Something went wrong in this section.</h5>
          <Button variant="outline-primary" onClick={() => window.location.reload()}>Reload App</Button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Mobile Header Component
const MobileHeader = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isProductivity = location.pathname.includes('/productivity');

  return (
    <Navbar className="border-bottom shadow-sm d-lg-none sticky-top flex-column p-0" style={{ minHeight: 'var(--header-height)', background: 'var(--nav-bg)', borderColor: 'var(--border-color)' }}>
      <Container className="px-2 d-flex align-items-center" style={{ height: 'var(--header-height)' }}>
        <div className="d-flex align-items-center flex-grow-1 overflow-hidden">
            <Navbar.Brand 
            className="d-flex align-items-center fw-bold text-primary mb-0 me-2" 
            onClick={() => navigate('/wallets')} 
            style={{ cursor: 'pointer', fontSize: '1.1rem' }}
            >
            {isProductivity ? 'Tools' : 'SM'}
            </Navbar.Brand>
            <FloatingBalance />
        </div>
        <div className="d-flex align-items-center gap-2 ms-2">
          <Button variant="link" onClick={toggleTheme} className="text-secondary p-1">
            {isDarkMode ? <FaMoon size={18} className="text-warning" /> : <FaSun size={18} className="text-warning" />}
          </Button>
          <Button variant="link" onClick={logout} className="text-danger p-1">
            <FaSignOutAlt size={18} />
          </Button>
        </div>
      </Container>
      {/* Mobile Search Bar */}
      {!isProductivity && (
          <div className="w-100 px-3 pb-2">
              <GlobalSearch isMobile={true} />
          </div>
      )}
      {/* Mobile Sub-Nav for Productivity */}
      {isProductivity && (
         <div className="w-100 overflow-auto d-flex gap-3 px-3 pb-2 border-top pt-2" style={{ background: 'var(--nav-bg)' }}>
            <Button variant={location.pathname.includes('habits') ? 'primary' : 'light'} size="sm" className="rounded-pill flex-shrink-0" onClick={() => navigate('/productivity/habits')}>Habits</Button>
            <Button variant={location.pathname.includes('todos') ? 'primary' : 'light'} size="sm" className="rounded-pill flex-shrink-0" onClick={() => navigate('/productivity/todos')}>Tasks</Button>
            <Button variant={location.pathname.includes('notes') ? 'primary' : 'light'} size="sm" className="rounded-pill flex-shrink-0" onClick={() => navigate('/productivity/notes')}>Notes</Button>
            <Button variant={location.pathname === '/trash' ? 'primary' : 'light'} size="sm" className="rounded-pill flex-shrink-0" onClick={() => navigate('/trash')}>Trash</Button>
         </div>
      )}
    </Navbar>
  );
};

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="vh-100 d-flex justify-content-center align-items-center" style={{ background: 'var(--bg-color)' }}>
        <PageLoader />
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  return children;
}

function AppLayout() {
  const { loading } = useApp();
  const { showAddTransactionModal, transactionPreFill, openTransactionModal, closeTransactionModal } = useUI();
  const { isDarkMode, toggleTheme } = useTheme();
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

  if (loading) {
    return (
      <div className="vh-100 d-flex justify-content-center align-items-center" style={{ background: 'var(--bg-color)' }}>
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar onAddTransaction={openTransactionModal} />

      <div className="main-content d-flex flex-column p-0">
        {/* Desktop Top Header */}
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

        {/* Mobile Header */}
        <MobileHeader />

        <div className="flex-grow-1 overflow-auto" style={{ padding: isDesktop ? '2rem' : '1rem', paddingBottom: isDesktop ? '2rem' : '100px' }}>
          <Container fluid={isDesktop} className={isDesktop ? "px-4" : "p-0"}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ErrorBoundary>
                  <Routes>
                    {/* Finance Routes */}
                    <Route path="/wallets" element={<WalletPanel onOpenCreateModal={() => setShowCreateWalletModal(true)} />} />
                    <Route path="/goals" element={<GoalsPanel onOpenCreateModal={() => setShowAddGoalModal(true)} />} />
                    <Route path="/budget" element={<BudgetPlanner />} />
                    <Route path="/reports" element={<ReportPanel />} />
                    <Route path="/settings" element={<SettingsPanel />} />
                    <Route path="/history" element={<DashboardView />} />
                    <Route path="/planner" element={<SmartPlanner />} />
                    <Route path="/trash" element={<TrashView />} />
                    
                    {/* Productivity Routes */}
                    <Route path="/productivity/habits" element={<HabitTracker />} />
                    <Route path="/productivity/todos" element={<TodoManager />} />
                    <Route path="/productivity/notes" element={<NotesApp />} />
                    <Route path="/productivity/data" element={<DataTransfer />} />
                    
                    <Route path="*" element={<Navigate to="/wallets" replace />} />
                  </Routes>
                </ErrorBoundary>
              </motion.div>
            </AnimatePresence>
          </Container>
        </div>
      </div>

      {/* Mobile Floating Action Button */}
      {!isDesktop && !location.pathname.includes('/productivity') && (
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
      {!isDesktop && (
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

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AIProvider>
          <AppProvider>
            <AppContext.Consumer>
              {({ earnXP }) => (
                <ProductivityProvider onEarnXP={earnXP}>
                  <UIProvider>
                    <HashRouter>
                      <ProtectedRoute>
                        <AppLayout />
                      </ProtectedRoute>
                    </HashRouter>
                  </UIProvider>
                </ProductivityProvider>
              )}
            </AppContext.Consumer>
          </AppProvider>
        </AIProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;