import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const { updateUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');
    const provider = searchParams.get('provider');

    if (error) {
      setStatus('error');
      setMessage(error);
      toast.error(error);
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    if (token) {
      // Save token
      localStorage.setItem('token', token);
      document.cookie = `token=${token};path=/;max-age=${30 * 24 * 60 * 60}`;
      
      // Verify and get user
      const verifyToken = async () => {
        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            updateUser(userData);
            setStatus('success');
            setMessage(`Bem-vindo, ${userData.name}!`);
            toast.success(`Bem-vindo, ${userData.name}!`);
            setTimeout(() => navigate('/dashboard'), 1000);
          } else {
            throw new Error('Invalid token');
          }
        } catch (err) {
          setStatus('error');
          setMessage('Token inválido. Por favor, tente novamente.');
          toast.error('Token inválido. Por favor, tente novamente.');
          setTimeout(() => navigate('/login'), 3000);
        }
      };
      
      verifyToken();
    } else {
      setStatus('error');
      setMessage('Nenhum token recebido');
      toast.error('Nenhum token recebido');
      setTimeout(() => navigate('/login'), 3000);
    }
  }, [searchParams, updateUser, navigate, isAuthenticated]);

  return (
    <div className="callback-container">
      <motion.div
        className="callback-card"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {status === 'loading' && (
          <div className="callback-loading">
            <motion.div
              className="loading-spinner"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 size={40} />
            </motion.div>
            <h2>Autenticando...</h2>
            <p>Por favor, aguarde enquanto verificamos suas credenciais</p>
          </div>
        )}

        {status === 'success' && (
          <div className="callback-success">
            <motion.div
              className="success-icon"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <CheckCircle size={64} color="#4ade80" />
            </motion.div>
            <h2>Autenticação Bem-Sucedida!</h2>
            <p>{message}</p>
            <p className="redirecting">Redirecionando para o dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="callback-error">
            <motion.div
              className="error-icon"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <AlertCircle size={64} color="#f87171" />
            </motion.div>
            <h2>Erro de Autenticação</h2>
            <p>{message}</p>
            <p className="redirecting">Redirecionando para o login...</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default AuthCallbackPage;
