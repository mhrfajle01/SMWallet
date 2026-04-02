import React from 'react';
import { Nav, Button, Badge } from 'react-bootstrap';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  FaWallet, FaChartPie, FaFileAlt, FaTasks, FaList, 
  FaStickyNote, FaDatabase, FaCog, FaPlus, FaSignOutAlt,
  FaPiggyBank, FaHistory, FaMapMarkedAlt, FaTrash, FaBolt, FaThLarge, FaChartLine
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useModule } from '../context/ModuleContext';
import FloatingBalance from './FloatingBalance';
import GlobalSearch from './GlobalSearch';

const Sidebar = ({ onAddTransaction }) => {
  const { logout } = useAuth();
  const { activeModule } = useModule();
  const location = useLocation();
  const navigate = useNavigate();

  const financeItems = [
    { path: '/dashboard', icon: FaChartPie, label: 'Wealth Hub' },
    { path: '/wallets', icon: FaWallet, label: 'Asset Management' },
    { path: '/history', icon: FaHistory, label: 'Transaction Audit' },
    { path: '/goals', icon: FaPiggyBank, label: 'Growth Targets' },
    { path: '/budget', icon: FaChartLine, label: 'Capital Control' },
    { path: '/reports', icon: FaFileAlt, label: 'Financial Analytics' },
    { path: '/planner', icon: FaTasks, label: 'Payment Scheduler' },
    { path: '/trash', icon: FaTrash, label: 'Recycle Bin' },
  ];

  const productivityItems = [
    { path: '/planner', icon: FaTasks, label: 'Focus Planner' },
    { path: '/productivity/habits', icon: FaBolt, label: 'Routine Mastery' },
    { path: '/productivity/todos', icon: FaList, label: 'Project Backlog' },
    { path: '/productivity/notes', icon: FaStickyNote, label: 'Brain Dump' },
    { path: '/trash', icon: FaTrash, label: 'Archive' },
  ];

  return (
    <div className="sidebar d-none d-lg-flex flex-column shadow-sm border-end" style={{ background: 'var(--nav-bg)', borderColor: 'var(--border-color)', transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}>
      <div className="sidebar-header p-4 text-center">
        <h4 className="fw-bold text-primary mb-0 letter-spacing-1">SMWALLET</h4>
        <Badge bg="primary" className="bg-opacity-10 text-primary mt-2 uppercase x-small">
          {activeModule === 'finance' ? 'Wealth Architect' : 'Peak Performance'}
        </Badge>
      </div>

      <div className="flex-grow-1 overflow-auto px-3">
        <Button 
          variant="outline-secondary" 
          className="w-100 rounded-pill mb-4 py-2 small fw-bold d-flex align-items-center justify-content-center gap-2 border-0 opacity-75 hover-opacity-100"
          onClick={() => navigate('/selection')}
        >
          <FaThLarge size={14} /> Global Hub
        </Button>

        {activeModule === 'finance' && (
          <Button 
            variant="primary" 
            className="w-100 rounded-pill mb-4 py-2 fw-bold shadow-lg d-flex align-items-center justify-content-center gap-2"
            onClick={onAddTransaction}
            style={{ background: 'var(--primary-gradient)', border: 'none' }}
          >
            <FaPlus /> Capital Entry
          </Button>
        )}

        {activeModule === 'finance' && <FloatingBalance isMobile={false} />}

        {activeModule === 'finance' && (
          <div className="mb-4">
            <Nav className="flex-column gap-1">
              {financeItems.map((item) => (
                <NavLink 
                  key={item.path} 
                  to={item.path} 
                  className={({ isActive }) => `sidebar-link rounded-3 px-3 py-2 d-flex align-items-center gap-3 text-decoration-none ${isActive ? 'active' : ''}`}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </Nav>
          </div>
        )}

        {activeModule === 'productivity' && (
          <div className="mb-4">
            <Nav className="flex-column gap-1">
              {productivityItems.map((item) => (
                <NavLink 
                  key={item.path} 
                  to={item.path} 
                  className={({ isActive }) => `sidebar-link rounded-3 px-3 py-2 d-flex align-items-center gap-3 text-decoration-none ${isActive ? 'active' : ''}`}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </Nav>
          </div>
        )}
      </div>

      <div className="sidebar-footer p-3 border-top" style={{ background: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
        <NavLink 
          to="/settings" 
          className={({ isActive }) => `sidebar-link rounded-3 px-3 py-2 d-flex align-items-center gap-3 text-decoration-none mb-2 ${isActive ? 'active' : ''}`}
        >
          <FaCog size={18} />
          <span>Settings</span>
        </NavLink>
        <Button 
          variant="link" 
          className="sidebar-link rounded-3 px-3 py-2 d-flex align-items-center gap-3 text-decoration-none w-100 text-danger"
          onClick={logout}
        >
          <FaSignOutAlt size={18} />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;

