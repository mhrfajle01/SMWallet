import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  FaWallet, 
  FaChartPie, 
  FaCog, 
  FaGamepad,
  FaHistory,
  FaPiggyBank,
  FaFileAlt
} from 'react-icons/fa';

const BottomNav = () => {
  return (
    <div className="bottom-nav shadow-lg border-top" style={{ overflowX: 'auto', justifyContent: 'space-around', background: 'var(--nav-bg)' }}>
      
      <NavLink 
        to="/wallets"
        className={({ isActive }) => `nav-item text-decoration-none ${isActive ? 'active' : ''}`}
      >
        <FaWallet className="nav-icon" />
        <span>Wallets</span>
      </NavLink>

      <NavLink 
        to="/history"
        className={({ isActive }) => `nav-item text-decoration-none ${isActive ? 'active' : ''}`}
      >
        <FaHistory className="nav-icon" />
        <span>History</span>
      </NavLink>

      <NavLink 
        to="/goals"
        className={({ isActive }) => `nav-item text-decoration-none ${isActive ? 'active' : ''}`}
      >
        <FaPiggyBank className="nav-icon" />
        <span>Goals</span>
      </NavLink>

      <NavLink 
        to="/budget"
        className={({ isActive }) => `nav-item text-decoration-none ${isActive ? 'active' : ''}`}
      >
        <FaChartPie className="nav-icon" />
        <span>Budget</span>
      </NavLink>

      <NavLink 
        to="/reports"
        className={({ isActive }) => `nav-item text-decoration-none ${isActive ? 'active' : ''}`}
      >
        <FaFileAlt className="nav-icon" />
        <span>Reports</span>
      </NavLink>

      <NavLink 
        to="/productivity/gamify"
        className={({ isActive }) => `nav-item text-decoration-none ${isActive || location.pathname?.includes('productivity') ? 'active' : ''}`}
      >
        <FaGamepad className="nav-icon" />
        <span>Gamify</span>
      </NavLink>

      <NavLink 
        to="/settings"
        className={({ isActive }) => `nav-item text-decoration-none ${isActive ? 'active' : ''}`}
      >
        <FaCog className="nav-icon" />
        <span>Settings</span>
      </NavLink>
    </div>
  );
};

export default BottomNav;
