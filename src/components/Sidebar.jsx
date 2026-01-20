import React from 'react';
import { Nav, Button, Badge } from 'react-bootstrap';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  FaWallet, 
  FaHistory, 
  FaChartPie, 
  FaCog,
  FaPlus,
  FaMoon,
  FaSun,
  FaSignOutAlt,
  FaPiggyBank,
  FaFileAlt,
  FaCalendarCheck,
  FaTasks,
  FaGamepad,
  FaStickyNote,
  FaExchangeAlt,
  FaDatabase
} from 'react-icons/fa';

const Sidebar = ({ onAddTransaction }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();

  const walletItems = [
    { path: '/wallets', icon: FaWallet, label: 'My Wallets' },
    { path: '/history', icon: FaHistory, label: 'Transactions' },
    { path: '/goals', icon: FaPiggyBank, label: 'Savings Goals' },
    { path: '/budget', icon: FaChartPie, label: 'Budget Plan' },
    { path: '/reports', icon: FaFileAlt, label: 'Reports' },
  ];

  const productivityItems = [
    { path: '/productivity/gamify', icon: FaGamepad, label: 'Gamify Center' },
    { path: '/productivity/habits', icon: FaCalendarCheck, label: 'Habit Tracker' },
    { path: '/productivity/todos', icon: FaTasks, label: 'To-Do Manager' },
    { path: '/productivity/notes', icon: FaStickyNote, label: 'Notes' },
    { path: '/productivity/data', icon: FaDatabase, label: 'Import / Export' },
  ];

  return (
    <motion.div 
      className="sidebar"
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 100 }}
    >
      <div className="d-flex align-items-center mb-4 px-2">
        <div className="bg-primary rounded-circle p-2 me-2 text-white shadow-sm">
          <FaWallet size={20} />
        </div>
        <h4 className="fw-bold mb-0 text-primary">SMPlatform</h4>
      </div>

      <div className="flex-grow-1 overflow-auto scrollbar-hidden">
        <div className="px-3 mb-2 small fw-bold text-muted opacity-50 uppercase tracking-wider">
          FINANCE
        </div>
        <Nav className="flex-column mb-4">
          {walletItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `d-flex align-items-center mb-1 px-3 py-2 rounded-4 text-decoration-none ${
                isActive 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-secondary hover-bg-light'
              }`}
            >
              <item.icon className="me-3" size={16} />
              <span className="fw-medium flex-grow-1 small">{item.label}</span>
            </NavLink>
          ))}
        </Nav>

        <div className="px-3 mb-2 small fw-bold text-muted opacity-50 uppercase tracking-wider">
          PRODUCTIVITY
        </div>
        <Nav className="flex-column mb-4">
          {productivityItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `d-flex align-items-center mb-1 px-3 py-2 rounded-4 text-decoration-none ${
                isActive 
                  ? 'bg-indigo text-white shadow-sm' 
                  : 'text-secondary hover-bg-light'
              }`}
              style={({ isActive }) => isActive ? { backgroundColor: '#6366f1' } : {}}
            >
              <item.icon className="me-3" size={16} />
              <span className="fw-medium flex-grow-1 small">{item.label}</span>
            </NavLink>
          ))}
        </Nav>

        <div className="px-3 mb-2 small fw-bold text-muted opacity-50 uppercase tracking-wider">
          SYSTEM
        </div>
        <Nav className="flex-column">
             <NavLink
              to="/settings"
              className={({ isActive }) => `d-flex align-items-center mb-1 px-3 py-2 rounded-4 text-decoration-none ${
                isActive 
                  ? 'bg-secondary text-white shadow-sm' 
                  : 'text-secondary hover-bg-light'
              }`}
            >
              <FaCog className="me-3" size={16} />
              <span className="fw-medium small">Settings</span>
            </NavLink>
        </Nav>
      </div>

      <div className="mt-auto pt-3">
         <Button 
            variant="primary" 
            className="w-100 mb-3 btn-primary-custom d-flex align-items-center justify-content-center shadow-lg rounded-pill py-2"
            onClick={onAddTransaction}
          >
            <FaPlus className="me-2" /> Quick Add
          </Button>

        <div className="pt-3 border-top border-secondary border-opacity-10">
          <div className="d-flex align-items-center mb-3 px-2">
            <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center text-primary fw-bold me-2" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <div className="text-truncate small fw-bold">{user?.displayName || user?.email?.split('@')[0]}</div>
            </div>
          </div>

          <div className="d-flex gap-2">
            <Button 
              variant="light" 
              className="flex-grow-1 d-flex align-items-center justify-content-center p-2 rounded-3 border-0"
              onClick={toggleTheme}
            >
              {isDarkMode ? <FaSun className="text-warning" /> : <FaMoon className="text-primary" />}
            </Button>
            <Button 
              variant="light" 
              className="flex-grow-1 d-flex align-items-center justify-content-center p-2 rounded-3 border-0 text-danger"
              onClick={logout}
            >
              <FaSignOutAlt />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;
