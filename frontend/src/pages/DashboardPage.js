import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, MessageSquare, Calendar, Users, TrendingUp, Clock, Plus, Facebook, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function DashboardPage() {
  const { user } = useAuth();
  const socket = useSocket();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [facebookPages, setFacebookPages] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    
    // Listen for new messages
    if (socket) {
      socket.on('new-message', (data) => {
        toast.info(`Nova mensagem de ${data.senderId}`);
        fetchDashboardData();
      });
    }

    return () => {
      if (socket) {
        socket.off('new-message');
      }
    };
  }, [socket]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch analytics overview
      const overviewResponse = await axios.get('/analytics/overview?days=7');
      setStats(overviewResponse.data);
      
      // Fetch recent posts
      const postsResponse = await axios.get('/posts?limit=5');
      setRecentPosts(postsResponse.data.posts);
      
      // Fetch recent messages
      const messagesResponse = await axios.get('/messages?limit=5');
      setRecentMessages(messagesResponse.data.messages);
      
      // Get user's Facebook pages
      if (user?.facebookAccounts) {
        setFacebookPages(user.facebookAccounts);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.error || 'Error loading dashboard');
      toast.error('Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <motion.div
          className="loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        <p>Carregando dados...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <AlertTriangle size={48} color="#ef4444" />
        <h3>Error</h3>
        <p>{error}</p>
        <motion.button
          className="btn btn-primary"
          onClick={fetchDashboardData}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Tentar novamente
        </motion.button>
      </div>
    );
  }

  // Prepare chart data
  const engagementData = {
    labels: stats?.daily?.map(d => d.date) || [],
    datasets: [
      {
        label: 'Engajamento',
        data: stats?.daily?.map(d => d.engagement) || [],
        borderColor: '#1877f2',
        backgroundColor: 'rgba(24, 119, 242, 0.1)',
        tension: 0.4
      }
    ]
  };

  const postsData = {
    labels: ['Publicados', 'Agendados', 'Rascunhos', 'Falhados'],
    datasets: [
      {
        label: 'Publicações',
        data: [
          stats?.metrics?.totalPosts || 0,
          recentPosts.filter(p => p.status === 'scheduled').length,
          recentPosts.filter(p => p.status === 'draft').length,
          recentPosts.filter(p => p.status === 'failed').length
        ],
        backgroundColor: ['#4ade80', '#fbbf24', '#64748b', '#f87171'],
        borderWidth: 0
      }
    ]
  };

  const messagesData = {
    labels: ['Recebidas', 'Lidas', 'Respondidas', 'Arquivadas'],
    datasets: [
      {
        label: 'Mensagens',
        data: [
          stats?.metrics?.totalMessages || 0,
          stats?.metrics?.totalMessages - (stats?.metrics?.unreadMessages || 0),
          recentMessages.filter(m => m.isReplied).length,
          recentMessages.filter(m => m.status === 'archived').length
        ],
        backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981', '#6b7280']
      }
    ]
  };

  return (
    <div className="page dashboard-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="page-header">
          <div className="page-title">
            <h1>Dashboard</h1>
            <p>Visão geral do seu Facebook Bot</p>
          </div>
          <div className="page-actions">
            <motion.button
              className="btn btn-primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus size={18} />
              Nova Publicação
            </motion.button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <motion.div
            className="stat-card"
            whileHover={{ y: -5 }}
          >
            <div className="stat-icon total-posts">
              <FileText size={24} />
            </div>
            <div className="stat-info">
              <h3>{stats?.metrics?.totalPosts || 0}</h3>
              <p>Total Publicações</p>
            </div>
            <div className="stat-trend positive">
              <TrendingUp size={16} />
              <span>+12%</span>
            </div>
          </motion.div>

          <motion.div
            className="stat-card"
            whileHover={{ y: -5 }}
          >
            <div className="stat-icon total-messages">
              <MessageSquare size={24} />
            </div>
            <div className="stat-info">
              <h3>{stats?.metrics?.totalMessages || 0}</h3>
              <p>Total Mensagens</p>
            </div>
            <div className="stat-trend positive">
              <TrendingUp size={16} />
              <span>+8%</span>
            </div>
          </motion.div>

          <motion.div
            className="stat-card"
            whileHover={{ y: -5 }}
          >
            <div className="stat-icon scheduled">
              <Calendar size={24} />
            </div>
            <div className="stat-info">
              <h3>{recentPosts.filter(p => p.status === 'scheduled').length}</h3>
              <p>Publicações Agendadas</p>
            </div>
            <div className="stat-trend">
              <Clock size={16} />
              <span>Pendentes</span>
            </div>
          </motion.div>

          <motion.div
            className="stat-card"
            whileHover={{ y: -5 }}
          >
            <div className="stat-icon unread-messages">
              <Users size={24} />
            </div>
            <div className="stat-info">
              <h3>{stats?.metrics?.unreadMessages || 0}</h3>
              <p>Mensagens Não Lidas</p>
            </div>
            <div className="stat-trend negative">
              <AlertTriangle size={16} />
              <span>Novas</span>
            </div>
          </motion.div>
        </div>

        {/* Facebook Pages */}
        {facebookPages.length > 0 && (
          <motion.div
            className="section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="section-header">
              <h2>Suas Páginas do Facebook</h2>
            </div>
            <div className="pages-grid">
              {facebookPages.map((page) => (
                <motion.div
                  key={page.pageId}
                  className="page-card"
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                  <div className="page-icon">
                    <Facebook size={24} color="#1877f2" />
                  </div>
                  <div className="page-info">
                    <h4>{page.pageName}</h4>
                    <p>ID: {page.pageId}</p>
                  </div>
                  <div className="page-status">
                    <span className="status-badge connected">Conectado</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Charts Row */}
        <div className="charts-row">
          <motion.div
            className="chart-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3>Engajamento Diário</h3>
            <div className="chart-container">
              <Line
                data={engagementData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }}
              />
            </div>
          </motion.div>

          <motion.div
            className="chart-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3>Status das Publicações</h3>
            <div className="chart-container doughnut">
              <Doughnut
                data={postsData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }}
              />
            </div>
          </motion.div>

          <motion.div
            className="chart-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3>Status das Mensagens</h3>
            <div className="chart-container doughnut">
              <Doughnut
                data={messagesData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }}
              />
            </div>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <div className="activity-row">
          <motion.div
            className="activity-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="activity-header">
              <h3>Publicações Recentes</h3>
              <Link to="/posts" className="view-all">
                Ver todas
              </Link>
            </div>
            <div className="activity-list">
              {recentPosts.length > 0 ? (
                recentPosts.map((post) => (
                  <motion.div
                    key={post._id}
                    className="activity-item"
                    whileHover={{ x: 5 }}
                  >
                    <div className="activity-icon">
                      <FileText size={18} />
                    </div>
                    <div className="activity-content">
                      <p className="activity-text">
                        {post.content.substring(0, 50)}{post.content.length > 50 ? '...' : ''}
                      </p>
                      <div className="activity-meta">
                        <span className="activity-status">{post.status}</span>
                        <span className="activity-time">
                          {new Date(post.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="empty-state">
                  <FileText size={48} color="#9ca3af" />
                  <p>Nenhuma publicação encontrada</p>
                  <Link to="/posts/create" className="btn btn-primary">
                    Criar Publicação
                  </Link>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            className="activity-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="activity-header">
              <h3>Mensagens Recentes</h3>
              <Link to="/messages" className="view-all">
                Ver todas
              </Link>
            </div>
            <div className="activity-list">
              {recentMessages.length > 0 ? (
                recentMessages.map((message) => (
                  <motion.div
                    key={message._id}
                    className="activity-item"
                    whileHover={{ x: 5 }}
                  >
                    <div className="activity-icon message">
                      <MessageSquare size={18} />
                    </div>
                    <div className="activity-content">
                      <p className="activity-text">
                        {message.content.substring(0, 50)}{message.content.length > 50 ? '...' : ''}
                      </p>
                      <div className="activity-meta">
                        <span className={`activity-status ${message.isRead ? 'read' : 'unread'}`}>
                          {message.isRead ? 'Lida' : 'Não lida'}
                        </span>
                        <span className="activity-time">
                          {new Date(message.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="empty-state">
                  <MessageSquare size={48} color="#9ca3af" />
                  <p>Nenhuma mensagem encontrada</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        {facebookPages.length === 0 && (
          <motion.div
            className="quick-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="quick-actions-header">
              <h3>Comece agora</h3>
              <p>Conecte sua página do Facebook para começar a usar o bot</p>
            </div>
            <div className="quick-actions-grid">
              <Link to="/connect-facebook" className="quick-action-card">
                <div className="quick-action-icon">
                  <Facebook size={32} color="#1877f2" />
                </div>
                <div className="quick-action-content">
                  <h4>Conectar Facebook</h4>
                  <p>Conecte sua página do Facebook</p>
                </div>
              </Link>
              <Link to="/posts/create" className="quick-action-card">
                <div className="quick-action-icon">
                  <Plus size={32} color="#4ade80" />
                </div>
                <div className="quick-action-content">
                  <h4>Nova Publicação</h4>
                  <p>Crie sua primeira publicação</p>
                </div>
              </Link>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

export default DashboardPage;
