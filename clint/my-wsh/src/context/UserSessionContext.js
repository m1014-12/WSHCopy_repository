import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const UserSessionContext = createContext();

export const useUserSession = () => {
  const context = useContext(UserSessionContext);
  if (!context) {
    throw new Error('useUserSession must be used within a UserSessionProvider');
  }
  return context;
};

export const UserSessionProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const userId = localStorage.getItem('userId');
      
      if (!token || !userId) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      // Verify token by making a request to get user profile
      const response = await api.get(`/profile/${userId}`);
      if (response.data.success) {
        setUser(response.data.user);
        setIsAuthenticated(true);
      } else {
        // Token is invalid
        logout();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = (userData, token) => {
    localStorage.setItem('userId', userData.id);
    localStorage.setItem('userToken', token);
    localStorage.setItem('userName', userData.userName);
    localStorage.setItem('userEmail', userData.email);
    
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userToken');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updatedUserData) => {
    setUser(updatedUserData);
    localStorage.setItem('userName', updatedUserData.userName);
    localStorage.setItem('userEmail', updatedUserData.email);
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateUser,
    checkAuthStatus
  };

  return (
    <UserSessionContext.Provider value={value}>
      {children}
    </UserSessionContext.Provider>
  );
};
