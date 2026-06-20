import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import React from 'react';
import LoginPage from './pages/login';
import HomePage from './pages/user/home page';
import AdminHomePage from './pages/admin/AdminHomePage';
import WarrantyPage from './pages/user/WarrantyPage'; 
import SubscriptionsPage from './pages/user/subscriptionPage';
import HomeMaintenanceTasksPage from './pages/user/homeTasksPage';
import ProfilePage from './pages/user/profile';
import ManageUsersPage from './pages/admin/ManageUsersPage';
import ManageAdminPage from './pages/admin/ManageAdminPage';
import GetStarted from './pages/GetStartedPage'; 
import ResetPassword from './pages/ResetPasswordPage';
import HelpSupportPage from './pages/user/help&support';
import AboutUsPage from './pages/user/AboutUsPage';
import TutorialsPage from './pages/user/TutorialsPage';
import FAQPage from './pages/user/FAQPage';
import FeedbackPage from './pages/user/FeedbackPage';
import CategoryManagementPage from './pages/admin/categoryManage';
import ServiceProviderManagementPage from './pages/admin/ServiceProviderManagementPage';
import AdminReportPage from './pages/admin/AdminReportPage';
import AllUsersDataPage from './pages/admin/AllUsersDataPage';
import UserReportPage from './pages/user/userReportPage';
import ForgotPasswordPage from './pages/forgetPassword';
import Registration from './pages/registration';
import NotificationsPage from './pages/user/notification';
import SearchPage from './pages/user/SearchPage';
import { ThemeLanguageProvider } from './context/ThemeLanguageContext';
import { AdminProvider } from './context/AdminContext';
import { UserSessionProvider } from './context/UserSessionContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import LiveChatButton from './components/LiveChatButton';
import { useUserSession } from './context/UserSessionContext';
import { useAdmin } from './context/AdminContext';
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";


// Component to conditionally render LiveChatButton based on authentication
function ConditionalLiveChatButton() {
  const location = useLocation();
  const { isAuthenticated: isUserAuthenticated } = useUserSession();
  const { isAuthenticated: isAdminAuthenticated } = useAdmin();
  
  // Pages where chat button should NOT appear
  const publicPages = ['/', '/login', '/registration', '/forgot-password'];
  const isPublicPage = publicPages.includes(location.pathname) || 
                       location.pathname.startsWith('/reset-password');
  
  // Show chat button only if authenticated (user or admin) and not on public pages
  const shouldShowChat = (isUserAuthenticated || isAdminAuthenticated) && !isPublicPage;
  
  return shouldShowChat ? <LiveChatButton /> : null;
}

function App() {
  return (
    <ThemeLanguageProvider>
      <UserSessionProvider>
        <AdminProvider>
        <BrowserRouter> 
          <Routes>
          <Route path="/" element={<GetStarted />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registration" element={<Registration />} />

          <Route path="/admin-home" element={<AdminProtectedRoute><AdminHomePage /></AdminProtectedRoute>} />
          <Route path="/warranty" element={<ProtectedRoute><WarrantyPage /></ProtectedRoute>} />
          <Route path="/subscription" element={<ProtectedRoute><SubscriptionsPage /></ProtectedRoute>} />
          <Route path="/home-tasks" element={<ProtectedRoute><HomeMaintenanceTasksPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/manage-users" element={<AdminProtectedRoute><ManageUsersPage /></AdminProtectedRoute>} />
          <Route path="/manage-admin" element={<AdminProtectedRoute><ManageAdminPage /></AdminProtectedRoute>} />
          <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:id/:token" element={<ResetPassword />} />
          <Route path="/help" element={<ProtectedRoute><HelpSupportPage /></ProtectedRoute>} />
          <Route path="/about-us" element={<ProtectedRoute><AboutUsPage /></ProtectedRoute>} />
          <Route path="/tutorials" element={<ProtectedRoute><TutorialsPage /></ProtectedRoute>} />
          <Route path="/faq" element={<ProtectedRoute><FAQPage /></ProtectedRoute>} />
          <Route path="/feedback" element={<ProtectedRoute><FeedbackPage /></ProtectedRoute>} />
          <Route path="/category-manage" element={<AdminProtectedRoute><CategoryManagementPage /></AdminProtectedRoute>} />
          <Route path="/service-provider-manage" element={<AdminProtectedRoute><ServiceProviderManagementPage /></AdminProtectedRoute>} />
          <Route path="/admin-report" element={<AdminProtectedRoute><AdminReportPage /></AdminProtectedRoute>} />
          <Route path="/all-users-data" element={<AdminProtectedRoute><AllUsersDataPage /></AdminProtectedRoute>} />
          <Route path="/user-report" element={<ProtectedRoute><UserReportPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
          </Routes>
          {/* Live Chat Button - appears only after login */}
          <ConditionalLiveChatButton />
        </BrowserRouter>
        </AdminProvider>
      </UserSessionProvider>
    </ThemeLanguageProvider>
  );
}

export default App;

// 
