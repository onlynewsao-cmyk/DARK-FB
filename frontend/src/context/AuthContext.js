import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }
        
        // Verify token
        const response = await axios.get('/auth/me');
        setUser(response.data);
      } catch (err) {
        console.error('Auth check failed:', err);
        localStorage.removeItem('token');
        setError(err.response?.data?.error || 'Authentication failed');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate]);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await axios.post('/auth/login', { email, password });
      
      localStorage.setItem('token', response.data.token);
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

  const register = async (name, email, password, role = 'user') => {
    try {
      setLoading(true);
      const response = await axios.post('/auth/register', { name, email, password, role });
      
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      setError(null);
      
      toast.success('Registration successful!');
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
      localStorage.removeItem('token');
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
      return response.data.token;
    } catch (err) {
      console.error('Token refresh failed:', err);
      localStorage.removeItem('token');
      setUser(null);
      navigate('/login');
      throw err;
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    refreshToken,
    updateUser,
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
