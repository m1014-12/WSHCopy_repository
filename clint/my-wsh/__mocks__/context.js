// Mock for context providers
import React from 'react';

export const ThemeLanguageProvider = ({ children }) => <div>{children}</div>;
export const AdminProvider = ({ children }) => <div>{children}</div>;
export const UserSessionProvider = ({ children }) => <div>{children}</div>;

// Mock hooks
export const useThemeLanguage = () => ({
  language: 'en',
  isDarkMode: false,
  toggleTheme: jest.fn(),
  toggleLanguage: jest.fn(),
});

export const useAdmin = () => ({
  login: jest.fn(),
  logout: jest.fn(),
  admin: null,
});

export const useUserSession = () => ({
  login: jest.fn(),
  logout: jest.fn(),
  user: null,
});

export default {
  ThemeLanguageProvider,
  AdminProvider,
  UserSessionProvider,
  useThemeLanguage,
  useAdmin,
  useUserSession,
};
