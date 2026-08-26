import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('system');
  const [cookies, setCookie, removeCookie] = useCookies(['token', 'refreshToken']);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = cookies.token || localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }
        
        // Verify token
        const response = await axios.get('/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setUser(response.data);
        setError(null);
        
        // Set theme from user settings
        if (response.data.settings?.theme) {
          setTheme(response.data.settings.theme);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        removeCookie('token', { path: '/' });
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setError(err.response?.data?.error || 'Authentication failed');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate, cookies.token]);

  // Check for OAuth callback in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    
    if (token && !user) {
      localStorage.setItem('token', token);
      setCookie('token', token, { path: '/', maxAge: 30 * 24 * 60 * 60 });
      navigate('/dashboard');
    }
  }, [location.search, user, navigate, setCookie]);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await axios.post('/auth/login', { email, password });
      
      localStorage.setItem('token', response.data.token);
      setCookie('token', response.data.token, { 
        path: '/', 
        maxAge: 30 * 24 * 60 * 60,
        httpOnly: false
      });
      
      setUser(response.data.user);
      setError(null);
      
      toast.success(`Bem-vindo, ${response.data.user.name}!`);
      navigate('/dashboard');
      
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Login failed';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      // Redirect to Google OAuth
      window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/google`;
    } catch (err) {
      toast.error('Error connecting with Google');
    }
  };

  const loginWithFacebook = async () => {
    try {
      // Redirect to Facebook OAuth
      window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/facebook`;
    } catch (err) {
      toast.error('Error connecting with Facebook');
    }
  };

  const loginWithGitHub = async () => {
    try {
      // Redirect to GitHub OAuth
      window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/github`;
    } catch (err) {
      toast.error('Error connecting with GitHub');
    }
  };

  const register = async (name, email, password, role = 'user') => {
    try {
      setLoading(true);
      const response = await axios.post('/auth/register', { name, email, password, role });
      
      localStorage.setItem('token', response.data.token);
      setCookie('token', response.data.token, { 
        path: '/', 
        maxAge: 30 * 24 * 60 * 60,
        httpOnly: false
      });
      
      setUser(response.data.user);
      setError(null);
      
      toast.success('Registration successful! Please check your email for verification.');
      navigate('/dashboard');
      
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Registration failed';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axios.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      removeCookie('token', { path: '/' });
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setError(null);
      toast.success('Logged out successfully');
      navigate('/login');
    }
  };

  const refreshToken = async () => {
    try {
      const response = await axios.post('/auth/refresh');
      localStorage.setItem('token', response.data.token);
      setCookie('token', response.data.token, { 
        path: '/', 
        maxAge: 30 * 24 * 60 * 60,
        httpOnly: false
      });
      return response.data.token;
    } catch (err) {
      console.error('Token refresh failed:', err);
      removeCookie('token', { path: '/' });
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setUser(null);
      navigate('/login');
      throw err;
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const updateTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update user settings if logged in
    if (user) {
      axios.put('/auth/settings', { 
        settings: { theme: newTheme } 
      }).catch(err => console.error('Error updating theme:', err));
    }
  };

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const value = {
    user,
    loading,
    error,
    theme,
    login,
    loginWithGoogle,
    loginWithFacebook,
    loginWithGitHub,
    register,
    logout,
    refreshToken,
    updateUser,
    updateTheme,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export { AuthContext };
