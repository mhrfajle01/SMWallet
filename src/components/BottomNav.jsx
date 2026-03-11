import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  FaWallet, 
  FaChartPie, 
  FaCog, 
  FaTasks,
  FaHistory,
  FaPiggyBank,
  FaFileAlt,
  FaMapMarkedAlt
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
        to="/planner"
        className={({ isActive }) => `nav-item text-decoration-none ${isActive ? 'active' : ''}`}
      >
        <FaMapMarkedAlt className="nav-icon" />
        <span>Planner</span>
      </NavLink>

      <NavLink 
        to="/goals"
        className={({ isActive }) => `nav-item text-decoration-none ${isActive ? 'active' : ''}`}
      >
        <FaPiggyBank className="nav-icon" />
        <span>Goals</span>
      </NavLink>

      <NavLink 
        to="/reports"
        className={({ isActive }) => `nav-item text-decoration-none ${isActive ? 'active' : ''}`}
      >
        <FaFileAlt className="nav-icon" />
        <span>Reports</span>
      </NavLink>

      <NavLink 
        to="/productivity/habits"
        className={({ isActive }) => `nav-item text-decoration-none ${isActive || location.pathname?.includes('productivity') ? 'active' : ''}`}
      >
        <FaTasks className="nav-icon" />
        <span>Tools</span>
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