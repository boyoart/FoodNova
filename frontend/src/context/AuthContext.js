import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe, isAuthenticated, logout as apiLogout, getRole } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (isAuthenticated()) {
        try {
          const userData = await getMe();
          setUser(userData);
        } catch (error) {
          console.error('Failed to load user:', error);
          apiLogout();
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const logout = () => {
    apiLogout();
    setUser(null);
  };

  const refreshUser = async () => {
    if (isAuthenticated()) {
      try {
        const userData = await getMe();
        setUser(userData);
      } catch (error) {
        console.error('Failed to refresh user:', error);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout, refreshUser, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
