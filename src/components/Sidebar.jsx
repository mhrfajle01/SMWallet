import React from 'react';
import { Nav, Button } from 'react-bootstrap';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  FaWallet, 
  FaBullseye, 
  FaChartPie, 
  FaHistory, 
  FaChartBar, 
  FaCog,
  FaPlus,
  FaMoon,
  FaSun,
  FaSignOutAlt,
  FaPiggyBank,
  FaFileAlt
} from 'react-icons/fa';

const Sidebar = ({ activeTab, onTabChange, onAddTransaction }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'wallets', icon: FaWallet, label: 'My Wallets' },
    { id: 'history', icon: FaHistory, label: 'Transactions' },
    { id: 'goals', icon: FaPiggyBank, label: 'Savings Goals' },
    { id: 'budget', icon: FaChartPie, label: 'Budget Plan' },
    { id: 'reports', icon: FaFileAlt, label: 'Reports' },
    { id: 'settings', icon: FaCog, label: 'Settings' },
  ];

  return (
    <motion.div 
      className="sidebar"
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 100 }}
    >
      <div className="d-flex align-items-center mb-5 px-2">
        <div className="bg-primary rounded-circle p-2 me-2 text-white">
          <FaWallet size={20} />
        </div>
        <h4 className="fw-bold mb-0 text-primary">SMWallet</h4>
      </div>

      <Nav className="flex-column mb-auto">
        {navItems.map((item) => (
          <Nav.Link
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`d-flex align-items-center mb-2 px-3 py-2 rounded ${
              activeTab === item.id 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-secondary hover-bg-light'
            }`}
            style={{ transition: 'all 0.2s' }}
          >
            <item.icon className="me-3" />
            <span className="fw-medium">{item.label}</span>
          </Nav.Link>
        ))}
      </Nav>

      <div className="mt-auto">
         <Button 
          variant="primary" 
          className="w-100 mb-4 btn-primary-custom d-flex align-items-center justify-content-center shadow-lg"
          onClick={onAddTransaction}
        >
          <FaPlus className="me-2" /> New Transaction
        </Button>

        <div className="pt-3 border-top border-secondary border-opacity-10">
          <div className="d-flex align-items-center mb-3 px-2">
            <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center text-primary fw-bold me-2" style={{ width: '38px', height: '38px', minWidth: '38px', fontSize: '0.9rem' }}>
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <div className="text-truncate small fw-bold">{user?.displayName || user?.email?.split('@')[0]}</div>
              <div className="text-truncate text-muted" style={{ fontSize: '0.7rem' }}>{user?.email}</div>
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
          
          <div className="text-center mt-3" style={{ fontSize: '0.65rem', opacity: 0.5 }}>
            &copy; 2026 SMWallet
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;
