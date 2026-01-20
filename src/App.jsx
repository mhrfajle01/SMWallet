import React, { useState, useEffect } from 'react';
import { Container, Navbar, Button, Nav } from 'react-bootstrap';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { ProductivityProvider } from './context/ProductivityContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Finance Components
import WalletPanel from './components/WalletPanel';
import GoalsPanel from './components/GoalsPanel';
import BudgetPlanner from './components/BudgetPlanner';
import ReportPanel from './components/ReportPanel';
import SettingsPanel from './components/SettingsPanel';
import DashboardView from './components/DashboardView';

// Productivity Components
import GamifyDashboard from './components/productivity/GamifyDashboard';
import HabitTracker from './components/productivity/HabitTracker';
import TodoManager from './components/productivity/TodoManager';
import NotesApp from './components/productivity/NotesApp';
import DataTransfer from './components/DataTransfer';

// Shared Components
import CreateWalletModal from './components/CreateWalletModal';
import AddGoalModal from './components/AddGoalModal';
import BottomNav from './components/BottomNav';
import Sidebar from './components/Sidebar';
import AuthView from './components/AuthView';
import AddTransactionModal from './components/AddTransactionModal';
import PageLoader from './components/PageLoader';
import { FaPlus, FaMoon, FaSun, FaWallet, FaSignOutAlt, FaGamepad } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error("Panel Error:", error, errorInfo); }
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
    <Navbar className="bg-white border-bottom shadow-sm d-lg-none sticky-top" style={{ height: 'var(--header-height)', background: 'var(--nav-bg)', borderColor: 'var(--border-color)' }}>
      <Container>
        <Navbar.Brand 
          className="d-flex align-items-center fw-bold text-primary" 
          onClick={() => navigate(isProductivity ? '/wallets' : '/productivity/gamify')} 
          style={{ cursor: 'pointer' }}
        >
          <div className={`bg-opacity-10 rounded-circle p-2 me-2 ${isProductivity ? 'bg-indigo text-indigo' : 'bg-primary text-primary'}`} style={{ color: isProductivity ? '#6366f1' : '' }}>
            {isProductivity ? <FaGamepad size={20} /> : <FaWallet size={20} />}
          </div>
          {isProductivity ? 'Productivity' : 'SMWallet'}
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
      {/* Mobile Sub-Nav for Productivity */}
      {isProductivity && (
         <div className="w-100 overflow-auto d-flex gap-3 px-3 pb-2 border-top pt-2" style={{ background: 'var(--nav-bg)' }}>
            <Button variant={location.pathname.includes('gamify') ? 'primary' : 'light'} size="sm" className="rounded-pill flex-shrink-0" onClick={() => navigate('/productivity/gamify')}>Gamify</Button>
            <Button variant={location.pathname.includes('habits') ? 'primary' : 'light'} size="sm" className="rounded-pill flex-shrink-0" onClick={() => navigate('/productivity/habits')}>Habits</Button>
            <Button variant={location.pathname.includes('todos') ? 'primary' : 'light'} size="sm" className="rounded-pill flex-shrink-0" onClick={() => navigate('/productivity/todos')}>Tasks</Button>
            <Button variant={location.pathname.includes('notes') ? 'primary' : 'light'} size="sm" className="rounded-pill flex-shrink-0" onClick={() => navigate('/productivity/notes')}>Notes</Button>
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
  const location = useLocation();
  const [showCreateWalletModal, setShowCreateWalletModal] = useState(false);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
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
      {/* Sidebar for Desktop */}
      {isDesktop && (
        <Sidebar 
          onAddTransaction={() => setShowAddTransactionModal(true)}
        />
      )}

      {/* Main Content Area */}
      <div className="main-content d-flex flex-column p-0">
        {!isDesktop && <MobileHeader />}
        
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
                    
                    {/* Productivity Routes */}
                    <Route path="/productivity/gamify" element={<GamifyDashboard />} />
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
            onClick={() => setShowAddTransactionModal(true)}
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
          <ProductivityProvider>
            <HashRouter>
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            </HashRouter>
          </ProductivityProvider>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
