import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, Search, Facebook, ChevronDown } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

function Navbar() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();

  const pageTitles = {
    '/dashboard': 'Dashboard',
    '/posts': 'Publicações',
    '/scheduled': 'Agendados',
    '/messages': 'Mensagens',
    '/analytics': 'Análises',
    '/settings': 'Configurações',
    '/connect-facebook': 'Conectar Facebook'
  };

  const currentTitle = pageTitles[location.pathname] || 'Facebook Bot';

  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      // In a real app, you would fetch notifications from the API
      // For now, we'll just check for unread messages
      const response = await axios.get('/messages/unread');
      setUnreadCount(response.data.count);
      
      // Mock notifications
      if (response.data.count > 0) {
        setNotifications([
          {
            id: 1,
            type: 'message',
            title: 'Novas mensagens',
            message: `${response.data.count} novas mensagens não lidas`,
            time: 'Agora',
            read: false
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async () => {
    try {
      // Mark all notifications as read
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      setShowNotifications(false);
    } catch (error) {
      toast.error('Error marking notifications as read');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement search functionality
      toast.info(`Searching for: ${searchQuery}`);
    }
  };

  return (
    <motion.header
      className="navbar"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="navbar-left">
        <div className="breadcrumb">
          <Facebook size={20} color="#1877f2" />
          <span className="separator">/</span>
          <span className="title">{currentTitle}</span>
        </div>
      </div>

      <div className="navbar-right">
        <form className="search-form" onSubmit={handleSearch}>
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Pesquisar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>

        <div className="navbar-actions">
          <motion.div
            className="notification-center"
            whileHover={{ scale: 1.05 }}
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={22} />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}

            {showNotifications && (
              <motion.div
                className="notification-dropdown"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="notification-header">
                  <h4>Notificações</h4>
                  {unreadCount > 0 && (
                    <button className="mark-all-read" onClick={markAsRead}>
                      Marcar todas como lidas
                    </button>
                  )}
                </div>
                
                <div className="notification-list">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="notification-icon">
                          <Bell size={16} />
                        </div>
                        <div className="notification-content">
                          <h5>{notification.title}</h5>
                          <p>{notification.message}</p>
                          <span className="notification-time">{notification.time}</span>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="no-notifications">
                      <p>Nenhuma notificação</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>

          <motion.div
            className="user-menu"
            whileHover={{ scale: 1.05 }}
          >
            <Link to="/settings">
              <img
                src="https://via.placeholder.com/32x32/1877f2/ffffff?text=FB"
                alt="User"
                className="user-avatar"
              />
              <ChevronDown size={16} />
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}

export default Navbar;
