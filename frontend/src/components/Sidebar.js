import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Home, FileText, Calendar, MessageSquare, BarChart3, Settings, LogOut, Facebook, UserPlus, Users } from 'lucide-react';

const sidebarItems = [
  { path: '/dashboard', icon: Home, label: 'Dashboard' },
  { path: '/posts', icon: FileText, label: 'Publicações' },
  { path: '/scheduled', icon: Calendar, label: 'Agendados' },
  { path: '/messages', icon: MessageSquare, label: 'Mensagens' },
  { path: '/analytics', icon: BarChart3, label: 'Análises' },
  { path: '/settings', icon: Settings, label: 'Configurações' },
];

const adminItems = [
  { path: '/connect-facebook', icon: Facebook, label: 'Conectar Facebook' },
];

function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <motion.aside
      className="sidebar"
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="sidebar-header">
        <motion.div
          className="logo"
          whileHover={{ scale: 1.05 }}
        >
          <Facebook size={24} color="#1877f2" />
          <span>Facebook Bot</span>
        </motion.div>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {sidebarItems.map((item) => (
            <motion.li key={item.path} whileHover={{ scale: 1.02 }}>
              <NavLink
                to={item.path}
                className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            </motion.li>
          ))}
        </ul>

        {user?.role === 'admin' && (
          <div className="sidebar-section">
            <h4>Admin</h4>
            <ul>
              {adminItems.map((item) => (
                <motion.li key={item.path} whileHover={{ scale: 1.02 }}>
                  <NavLink
                    to={item.path}
                    className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </NavLink>
                </motion.li>
              ))}
            </ul>
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <span className="user-name">{user?.name}</span>
            <span className="user-email">{user?.email}</span>
          </div>
        </div>
        
        <motion.button
          className="logout-btn"
          onClick={logout}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <LogOut size={18} />
          <span>Sair</span>
        </motion.button>
      </div>
    </motion.aside>
  );
}

export default Sidebar;
