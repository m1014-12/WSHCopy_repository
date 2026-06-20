import axios from 'axios';

// Base URL for the API
const BASE_URL = 'http://localhost:3001';

// Create axios instance for admin API calls
const adminApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include admin token
adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, redirect to admin login
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminId');
      localStorage.removeItem('adminAccessName');
      window.location.href = '/admin-login';
    }
    return Promise.reject(error);
  }
);

// Category Management API calls
export const categoryApi = {
  // Get all categories
  getCategories: async () => {
    const response = await adminApi.get('/admin/categories');
    return response.data;
  },

  // Get parent categories for a specific type
  getParentCategories: async (categoryType) => {
    const response = await adminApi.get(`/admin/parent-categories/${categoryType}`);
    return response.data;
  },

  // Add new category or subcategory
  addCategory: async (categoryData) => {
    const response = await adminApi.post('/admin/categories', categoryData);
    return response.data;
  },

  // Update category
  updateCategory: async (id, categoryData) => {
    const response = await adminApi.put(`/admin/categories/${id}`, categoryData);
    return response.data;
  },

  // Delete category
  deleteCategory: async (id) => {
    const response = await adminApi.delete(`/admin/categories/${id}`);
    return response.data;
  },
};

// User Management API calls
export const userApi = {
  // Get all users
  getUsers: async () => {
    const response = await adminApi.get('/admin/users');
    return response.data;
  },

  // Update user
  updateUser: async (id, userData) => {
    const response = await adminApi.put(`/admin/users/${id}`, userData);
    return response.data;
  },

  // Delete user
  deleteUser: async (id) => {
    const response = await adminApi.delete(`/admin/users/${id}`);
    return response.data;
  },
};

// Admin Management API calls
export const adminManagementApi = {
  // Get all admins
  getAdmins: async () => {
    const response = await adminApi.get('/admin/admins');
    return response.data;
  },

  // Add new admin
  addAdmin: async (adminData) => {
    const response = await adminApi.post('/admin/admins', adminData);
    return response.data;
  },

  // Update admin
  updateAdmin: async (id, adminData) => {
    const response = await adminApi.put(`/admin/admins/${id}`, adminData);
    return response.data;
  },

  // Delete admin
  deleteAdmin: async (id) => {
    const response = await adminApi.delete(`/admin/admins/${id}`);
    return response.data;
  },
};

// Statistics and Reports API calls
export const statisticsApi = {
  // Get comprehensive admin statistics
  getStatistics: async (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await adminApi.get(`/admin/statistics?${params.toString()}`);
    return response.data;
  },

  // Get user activity logs
  getUserActivity: async (startDate, endDate, limit = 50) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('limit', limit);
    
    const response = await adminApi.get(`/admin/user-activity?${params.toString()}`);
    return response.data;
  },

  // Get system performance metrics
  getSystemMetrics: async () => {
    const response = await adminApi.get('/admin/system-metrics');
    return response.data;
  },

  // Get error logs
  getErrorLogs: async (limit = 20) => {
    const response = await adminApi.get(`/admin/error-logs?limit=${limit}`);
    return response.data;
  },

  // Get reminder statistics
  getReminderStats: async () => {
    const response = await adminApi.get('/admin/reminder-stats');
    return response.data;
  },

  // Get reminder logs
  getReminderLogs: async () => {
    const response = await adminApi.get('/admin/reminder-logs');
    return response.data;
  },
};

// Service Provider Management API calls
export const serviceProviderApi = {
  // Get all service providers
  getServiceProviders: async () => {
    const response = await adminApi.get('/admin/service-providers');
    return response.data;
  },

  // Add new service provider
  addServiceProvider: async (serviceProviderData) => {
    const response = await adminApi.post('/admin/service-providers', serviceProviderData);
    return response.data;
  },

  // Update service provider
  updateServiceProvider: async (id, serviceProviderData) => {
    const response = await adminApi.put(`/admin/service-providers/${id}`, serviceProviderData);
    return response.data;
  },

  // Delete service provider
  deleteServiceProvider: async (id) => {
    const response = await adminApi.delete(`/admin/service-providers/${id}`);
    return response.data;
  },
};

export default adminApi;