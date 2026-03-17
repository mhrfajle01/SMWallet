import React from 'react';
import { Nav, Button } from 'react-bootstrap';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  FaWallet, FaChartPie, FaFileAlt, FaTasks, FaList, 
  FaStickyNote, FaDatabase, FaCog, FaPlus, FaSignOutAlt,
  FaPiggyBank, FaHistory, FaMapMarkedAlt, FaTrash, FaBolt
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import FloatingBalance from './FloatingBalance';
import GlobalSearch from './GlobalSearch';

const Sidebar = ({ onAddTransaction }) => {
  const { logout } = useAuth();
  const location = useLocation();

  const financeItems = [
    { path: '/wallets', icon: FaWallet, label: 'My Wallets' },
    { path: '/planner', icon: FaTasks, label: 'Daily Hub / Plan' },
    { path: '/history', icon: FaHistory, label: 'Transactions' },
    { path: '/goals', icon: FaPiggyBank, label: 'Savings Goals' },
    { path: '/budget', icon: FaChartPie, label: 'Budget Plan' },
    { path: '/reports', icon: FaFileAlt, label: 'Reports' },
  ];

  const productivityItems = [
    { path: '/trash', icon: FaTrash, label: 'Trash Bin' },
    { path: '/productivity/data', icon: FaDatabase, label: 'Data Backup' },
  ];

  return (
    <div className="sidebar d-none d-lg-flex flex-column shadow-sm border-end" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
      <div className="sidebar-header p-4 text-center">
        <h4 className="fw-bold text-primary mb-0">SMWallet</h4>
        <small className="text-muted">Pro Finance Tool</small>
      </div>

      <div className="flex-grow-1 overflow-auto px-3">
        <Button 
          variant="primary" 
          className="w-100 rounded-pill mb-3 py-2 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
          onClick={onAddTransaction}
        >
          <FaPlus /> New Entry
        </Button>

        <FloatingBalance isMobile={false} />

        <div className="mb-4">
          <small className="text-uppercase fw-bold text-muted opacity-50 px-3 mb-2 d-block letter-spacing-1" style={{ fontSize: '0.7rem' }}>Finance</small>
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

        <div className="mb-4">
          <small className="text-uppercase fw-bold text-muted opacity-50 px-3 mb-2 d-block letter-spacing-1" style={{ fontSize: '0.7rem' }}>Productivity</small>
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