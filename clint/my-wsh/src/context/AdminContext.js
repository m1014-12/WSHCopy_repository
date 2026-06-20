import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AdminContext = createContext();

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const [adminData, setAdminData] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Session timeout check
  useEffect(() => {
    if (isAuthenticated) {
      const checkSessionTimeout = () => {
        const token = localStorage.getItem('adminToken');
        if (token) {
          try {
            // Decode token to check expiration
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Date.now() / 1000;
            
            if (payload.exp < currentTime) {
              // Token expired
              logout();
            }
          } catch (error) {
            console.error('Token decode error:', error);
            logout();
          }
        }
      };

      // Check every 5 minutes
      const interval = setInterval(checkSessionTimeout, 5 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const adminId = localStorage.getItem('adminId');
      
      if (!token || !adminId) {
        setIsAuthenticated(false);
        setAdminData(null);
        return;
      }

      // Verify token by making a request to get admin profile
      const response = await axios.get('http://localhost:3001/admin/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setAdminData(response.data.admin);
        setIsAuthenticated(true);
      } else {
        // Token is invalid
        logout();
      }
    } catch (error) {
      console.error('Admin auth check failed:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = (adminInfo, token) => {
    localStorage.setItem('adminId', adminInfo.id);
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminAccessName', adminInfo.accessName);
    localStorage.setItem('adminEmail', adminInfo.email);
    
    setAdminData(adminInfo);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('adminId');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminAccessName');
    localStorage.removeItem('adminEmail');
    
    setAdminData(null);
    setIsAuthenticated(false);
  };

  const updateAdminData = (newData) => {
    const updatedData = { ...adminData, ...newData };
    setAdminData(updatedData);
    localStorage.setItem('adminAccessName', updatedData.accessName);
    localStorage.setItem('adminEmail', updatedData.email);
  };

  const refreshToken = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return false;

      const response = await axios.get('http://localhost:3001/admin/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setAdminData(response.data.admin);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return false;
    }
  };

  const value = {
    adminData,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateAdminData,
    checkAuthStatus,
    refreshToken
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}; 