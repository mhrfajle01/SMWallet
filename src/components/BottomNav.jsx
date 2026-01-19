import React from 'react';
import { 
  FaWallet, 
  FaHistory, 
  FaPiggyBank, 
  FaChartPie, 
  FaFileAlt, 
  FaCog, 
  FaCalendarCheck, 
  FaTasks, 
  FaCheckCircle,
  FaExchangeAlt 
} from 'react-icons/fa';

const BottomNav = ({ activeTab, onTabChange, viewMode, onViewModeChange }) => {
  const walletNav = [
    { id: 'wallets', icon: FaWallet, label: 'Wallets' },
    { id: 'history', icon: FaHistory, label: 'History' },
    { id: 'goals', icon: FaPiggyBank, label: 'Goals' },
    { id: 'budget', icon: FaChartPie, label: 'Budget' },
    { id: 'reports', icon: FaFileAlt, label: 'Reports' },
  ];

  const plannerNav = [
    { id: 'planner-home', icon: FaCalendarCheck, label: 'Duty' },
    { id: 'tasks', icon: FaTasks, label: 'Tasks' },
    { id: 'habits', icon: FaCheckCircle, label: 'Habits' },
  ];

  const navItems = viewMode === 'wallet' ? walletNav : plannerNav;

  return (
    <div className="bottom-nav shadow-lg border-top" style={{ overflowX: 'auto', justifyContent: 'start', background: 'var(--nav-bg)' }}>
      {/* Switch Button */}
      <button 
        className="nav-item text-primary"
        onClick={() => onViewModeChange(viewMode === 'wallet' ? 'planner' : 'wallet')}
        style={{ minWidth: '70px', borderRight: '1px solid var(--border-color)' }}
      >
        <FaExchangeAlt className="nav-icon" />
        <span className="fw-bold">{viewMode === 'wallet' ? 'Planner' : 'Wallet'}</span>
      </button>

      {navItems.map(item => (
        <button 
          key={item.id}
          className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
          onClick={() => onTabChange(item.id)}
          style={{ minWidth: '70px' }}
        >
          <item.icon className="nav-icon" />
          <span>{item.label}</span>
        </button>
      ))}

      <button 
        className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
        onClick={() => onTabChange('settings')}
        style={{ minWidth: '70px' }}
      >
        <FaCog className="nav-icon" />
        <span>Settings</span>
      </button>
    </div>
  );
};

export default BottomNav;
