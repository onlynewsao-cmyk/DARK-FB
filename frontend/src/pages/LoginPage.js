import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight, Facebook, Google, GitHub } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  
  const { login, loginWithGoogle, loginWithFacebook, loginWithGitHub, isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    try {
      setIsLoading(true);
      await login(email, password);
      navigate(from, { replace: true });
    } catch (error) {
      // Error is already handled by the auth context
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setForgotPassword(true);
  };

  const handleBackToLogin = () => {
    setForgotPassword(false);
  };

  const handleOAuthLogin = (provider) => {
    switch (provider) {
      case 'google':
        loginWithGoogle();
        break;
      case 'facebook':
        loginWithFacebook();
        break;
      case 'github':
        loginWithGitHub();
        break;
      default:
        break;
    }
  };

  return (
    <div className="auth-container">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.95 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <AnimatePresence mode="wait">
          {!forgotPassword ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
            >
              <div className="auth-header">
                <motion.div
                  className="logo"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="logo-icon">
                    <Facebook size={32} />
                  </div>
                  <h1>DARK-FB</h1>
                </motion.div>
                <p className="auth-subtitle">
                  Automatize sua presença no Facebook com segurança e profissionalismo
                </p>
              </div>

              <form className="auth-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <div className="input-wrapper">
                    <Mail size={20} className="input-icon" />
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div className="input-wrapper">
                    <Lock size={20} className="input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Senha"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="form-options">
                  <label className="remember-me">
                    <input type="checkbox" />
                    <span>Lembrar-me</span>
                  </label>
                  <button
                    type="button"
                    className="forgot-password"
                    onClick={handleForgotPassword}
                  >
                    Esqueceu a senha?
                  </button>
                </div>

                <motion.button
                  type="submit"
                  className="btn btn-primary btn-block btn-login"
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={20} className="spinner" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      Entrar
                      <ArrowRight size={18} />
                    </>
                  )}
                </motion.button>
              </form>

              <div className="auth-divider">
                <span>ou continue com</span>
              </div>

              <div className="oauth-buttons">
                <motion.button
                  className="btn btn-oauth btn-google"
                  onClick={() => handleOAuthLogin('google')}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Google size={20} />
                  <span>Google</span>
                </motion.button>

                <motion.button
                  className="btn btn-oauth btn-facebook"
                  onClick={() => handleOAuthLogin('facebook')}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Facebook size={20} />
                  <span>Facebook</span>
                </motion.button>

                <motion.button
                  className="btn btn-oauth btn-github"
                  onClick={() => handleOAuthLogin('github')}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <GitHub size={20} />
                  <span>GitHub</span>
                </motion.button>
              </div>

              <div className="auth-footer">
                <p>
                  Não tem uma conta?{' '}
                  <Link to="/register" className="auth-link">
                    Cadastre-se
                  </Link>
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="forgot"
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.3 }}
            >
              <div className="auth-header">
                <motion.div
                  className="logo"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Mail size={32} />
                </motion.div>
                <h1>Esqueceu a Senha?</h1>
                <p className="auth-subtitle">
                  Digite seu email para receber o link de redefinição
                </p>
              </div>

              <form className="auth-form">
                <div className="form-group">
                  <div className="input-wrapper">
                    <Mail size={20} className="input-icon" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      required
                    />
                  </div>
                </div>

                <motion.button
                  type="button"
                  className="btn btn-primary btn-block"
                  onClick={() => navigate('/forgot-password', { state: { email } })}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Enviar Link de Redefinição
                  <ArrowRight size={18} />
                </motion.button>

                <motion.button
                  type="button"
                  className="btn btn-secondary btn-block"
                  onClick={handleBackToLogin}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Voltar para Login
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        className="auth-decoration"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <div className="circle circle-1"></div>
        <div className="circle circle-2"></div>
        <div className="circle circle-3"></div>
        <div className="circle circle-4"></div>
      </motion.div>
    </div>
  );
}

export default LoginPage;
