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
  FaMapMarkedAlt,
  FaTrash,
  FaBolt,
  FaList,
  FaStickyNote,
  FaThLarge,
  FaChartLine
} from 'react-icons/fa';
import { useModule } from '../context/ModuleContext';

const BottomNav = () => {
  const location = useLocation();
  const { activeModule } = useModule();
  
  return (
    <div className="bottom-nav shadow-lg border-top" style={{ overflowX: 'auto', justifyContent: 'flex-start', background: 'var(--nav-bg)', transition: 'all 0.5s ease' }}>
      
      <NavLink 
        to="/selection"
        className={({ isActive }) => `nav-item text-decoration-none ${isActive ? 'active' : ''}`}
      >
        <FaThLarge className="nav-icon" />
        <span>Hub</span>
      </NavLink>

      {activeModule === 'finance' && (
        <>
          <NavLink 
            to="/dashboard"
            className={({ isActive }) => `nav-item text-decoration-none ${isActive ? 'active' : ''}`}
          >
            <FaChartPie className="nav-icon" />
            <span>Wealth</span>
          </NavLink>

          <NavLink 
            to="/wallets"
            className={({ isActive }) => `nav-item text-decoration-none ${isActive ? 'active' : ''}`}
          >
            <FaWallet className="nav-icon" />
            <span>Vault</span>
          </NavLink>

          <NavLink 
            to="/history"
            className={({ isActive }) => `nav-item text-decoration-none ${isActive ? 'active' : ''}`}
          >
            <FaHistory className="nav-icon" />
            <span>Audit</span>
          </NavLink>

          <NavLink 
            to="/planner"
            className={({ isActive }) => `nav-item text-decoration-none ${isActive ? 'active' : ''}`}
          >
            <FaTasks className="nav-icon" />
            <span>Scheduler</span>
          </NavLink>

          <NavLink 
            to="/trash"
            className={({ isActive }) => `nav-item text-decoration-none ${isActive ? 'active' : ''}`}
          >
            <FaTrash className="nav-icon" />
            <span>Trash</span>
          </NavLink>
        </>
      )}

      {activeModule === 'productivity' && (
        <>
          <NavLink 
            to="/planner"
            className={({ isActive }) => `nav-item text-decoration-none ${isActive && location.pathname === '/planner' ? 'active' : ''}`}
          >
            <FaTasks className="nav-icon" />
            <span>Planner</span>
          </NavLink>

          <NavLink 
            to="/productivity/habits"
            className={({ isActive }) => `nav-item text-decoration-none ${isActive ? 'active' : ''}`}
          >
            <FaBolt className="nav-icon" />
            <span>Routines</span>
          </NavLink>

          <NavLink 
            to="/productivity/todos"
            className={({ isActive }) => `nav-item text-decoration-none ${isActive ? 'active' : ''}`}
          >
            <FaList className="nav-icon" />
            <span>Tasks</span>
          </NavLink>

          <NavLink 
            to="/productivity/notes"
            className={({ isActive }) => `nav-item text-decoration-none ${isActive ? 'active' : ''}`}
          >
            <FaStickyNote className="nav-icon" />
            <span>Mind</span>
          </NavLink>

          <NavLink 
            to="/trash"
            className={({ isActive }) => `nav-item text-decoration-none ${isActive ? 'active' : ''}`}
          >
            <FaTrash className="nav-icon" />
            <span>Trash</span>
          </NavLink>
        </>
      )}

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

