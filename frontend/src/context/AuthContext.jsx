import PropTypes from 'prop-types';
import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay un usuario guardado en localStorage
    const storedUser = localStorage.getItem('admin_user');
    const storedToken = localStorage.getItem('admin_token');
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('admin_user', JSON.stringify(userData));
    localStorage.setItem('admin_token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_token');
    setUser(null);
  };

  const isAuthenticated = () => {
    return !!user;
  };

  const getToken = () => {
    return localStorage.getItem('admin_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, getToken, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
