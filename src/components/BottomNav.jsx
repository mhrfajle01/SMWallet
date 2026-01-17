import React from 'react';
import { FaWallet, FaHistory, FaPiggyBank, FaChartPie, FaFileAlt, FaCog } from 'react-icons/fa';

const BottomNav = ({ activeTab, onTabChange }) => {
  return (
    <div className="bottom-nav" style={{ overflowX: 'auto', justifyContent: 'start' }}>
      <button 
        className={`nav-item ${activeTab === 'wallets' ? 'active' : ''}`}
        onClick={() => onTabChange('wallets')}
        style={{ minWidth: '70px' }}
      >
        <FaWallet className="nav-icon" />
        <span>Wallets</span>
      </button>
      <button 
        className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
        onClick={() => onTabChange('history')}
        style={{ minWidth: '70px' }}
      >
        <FaHistory className="nav-icon" />
        <span>History</span>
      </button>
      <button 
        className={`nav-item ${activeTab === 'goals' ? 'active' : ''}`}
        onClick={() => onTabChange('goals')}
        style={{ minWidth: '70px' }}
      >
        <FaPiggyBank className="nav-icon" />
        <span>Goals</span>
      </button>
      <button 
        className={`nav-item ${activeTab === 'budget' ? 'active' : ''}`}
        onClick={() => onTabChange('budget')}
        style={{ minWidth: '70px' }}
      >
        <FaChartPie className="nav-icon" />
        <span>Budget</span>
      </button>
      <button 
        className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
        onClick={() => onTabChange('reports')}
        style={{ minWidth: '70px' }}
      >
        <FaFileAlt className="nav-icon" />
        <span>Reports</span>
      </button>
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
