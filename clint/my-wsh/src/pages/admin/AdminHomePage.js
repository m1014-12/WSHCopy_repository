import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { useAdmin } from '../../context/AdminContext';
import { translations } from '../../translations/translations';
import AdminHeader from '../../components/AdminHeader';
import { statisticsApi } from '../../utils/adminApi';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, FileText, Calendar, TrendingUp, Activity, AlertCircle, CheckCircle, Clock, Settings, BarChart3, Database } from 'lucide-react';
import '../../css/AdminHomePage.css';

function AdminHomePage() {
  const navigate = useNavigate();
  const { language, isDarkMode } = useThemeLanguage();
  const { adminData } = useAdmin();
  const t = translations[language];

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reminderStats, setReminderStats] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsResponse, reminderResponse] = await Promise.all([
        statisticsApi.getStatistics(),
        statisticsApi.getReminderStats().catch(() => ({ stats: null }))
      ]);

      setStats(statsResponse.statistics);
      setReminderStats(reminderResponse.stats);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(t.adminHomePage.failedToLoadDashboard);
    } finally {
      setLoading(false);
    }
  };

  const goToUserManag = () => {
    navigate('/manage-users');
  };

  const goToAdminManag = () => {
    navigate('/manage-admin');
  };

  const goToCategoryManag = () => {
    navigate('/category-manage');
  };

  const goToServiceProviderManag = () => {
    navigate('/service-provider-manage');
  };

  const goToReportManag = () => {
    navigate('/admin-report');
  };

  const goToAllUsersData = () => {
    navigate('/all-users-data');
  };

  // Prepare chart data

  const categoryDistribution = stats?.warranties?.categories?.slice(0, 5).map(item => ({
    name: item._id || 'Other',
    value: item.count
  })) || [];

  const taskStatusData = stats?.tasks?.statusDistribution?.map(item => ({
    name: item._id || 'Unknown',
    value: item.count
  })) || [];

  const COLORS = isDarkMode 
    ? ['#4dabf7', '#51cf66', '#ffd43b', '#ff6b6b', '#845ef7']
    : ['#339af0', '#51cf66', '#ffd43b', '#ff6b6b', '#845ef7'];

  if (loading) {
    return (
      <div 
        className="admin-home-page"
        data-theme={isDarkMode ? 'dark' : 'light'}
        data-language={language}
      >
        <AdminHeader />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{t.adminHomePage.loading || 'Loading dashboard...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="admin-home-page"
      data-theme={isDarkMode ? 'dark' : 'light'}
      data-language={language}
    >
      <AdminHeader />

      {/* Main Content */}
      <main className="admin-main">
        {/* Welcome Section */}
        <div className="dashboard-header">
          <h1 className="dashboard-title">{t.adminHomePage.welcome || 'Welcome to Admin Dashboard'}</h1>
          <p className="dashboard-subtitle">{t.adminHomePage.subtitle || 'Manage and monitor your system'}</p>
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card stat-users">
            <div className="stat-icon">
              <Users size={32} />
            </div>
            <div className="stat-content">
              <h3 className="stat-label">{t.adminHomePage.totalUsers || 'Total Users'}</h3>
              <p className="stat-value">{stats?.users?.total || 0}</p>
              <span className="stat-change">
                <TrendingUp size={16} />
                {stats?.users?.active || 0} {t.adminHomePage.active || 'Active'}
              </span>
            </div>
          </div>

          <div className="stat-card stat-warranties">
            <div className="stat-icon">
              <FileText size={32} />
            </div>
            <div className="stat-content">
              <h3 className="stat-label">{t.adminHomePage.totalWarranties || 'Total Warranties'}</h3>
              <p className="stat-value">{stats?.warranties?.total || 0}</p>
              <span className="stat-change">
                <Activity size={16} />
                {stats?.warranties?.inPeriod || 0} {t.adminHomePage.thisPeriod || 'This Timeframe'}
              </span>
            </div>
          </div>

          <div className="stat-card stat-subscriptions">
            <div className="stat-icon">
              <Calendar size={32} />
            </div>
            <div className="stat-content">
              <h3 className="stat-label">{t.adminHomePage.totalSubscriptions || 'Total Subscriptions'}</h3>
              <p className="stat-value">{stats?.subscriptions?.total || 0}</p>
              <span className="stat-change">
                <Activity size={16} />
                {stats?.subscriptions?.inPeriod || 0} {t.adminHomePage.thisPeriod || 'This Timeframe'}
              </span>
          </div>
        </div>

          <div className="stat-card stat-tasks">
            <div className="stat-icon">
              <CheckCircle size={32} />
            </div>
            <div className="stat-content">
              <h3 className="stat-label">{t.adminHomePage.totalTasks || 'Total Tasks'}</h3>
              <p className="stat-value">{stats?.tasks?.total || 0}</p>
              <span className="stat-change">
                {stats?.tasks?.completed || 0} {t.adminHomePage.completed || 'Completed'} / {stats?.tasks?.pending || 0} {t.adminHomePage.pending || 'Pending'}
              </span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-grid">
          {/* Category Distribution Chart */}
          <div className="chart-card">
            <h3 className="chart-title">{t.adminHomePage.categoryDistribution || 'Category Distribution'}</h3>
            {categoryDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">{t.adminHomePage.noData || 'No data available'}</div>
            )}
          </div>

          {/* Task Status Chart */}
          <div className="chart-card">
            <h3 className="chart-title">{t.adminHomePage.taskStatus || 'Task Status Distribution'}</h3>
            {taskStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={taskStatusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#51cf66" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">{t.adminHomePage.noData || 'No data available'}</div>
            )}
          </div>
        </div>

        {/* Reminder Statistics */}
        {reminderStats && (
          <div className="reminder-stats-card">
            <h3 className="section-title">{t.adminHomePage.reminderStats || 'Reminder Statistics'}</h3>
            <div className="reminder-stats-grid">
              <div className="reminder-stat">
                <Clock size={24} />
                <div>
                  <p className="reminder-stat-value">{reminderStats.total || 0}</p>
                  <p className="reminder-stat-label">{t.adminHomePage.totalReminders || 'Total Reminders'}</p>
                </div>
              </div>
              <div className="reminder-stat success">
                <CheckCircle size={24} />
                <div>
                  <p className="reminder-stat-value">{reminderStats.sent || 0}</p>
                  <p className="reminder-stat-label">{t.adminHomePage.sent || 'Sent'}</p>
                </div>
              </div>
              <div className="reminder-stat warning">
                <AlertCircle size={24} />
                <div>
                  <p className="reminder-stat-value">{reminderStats.failed || 0}</p>
                  <p className="reminder-stat-label">{t.adminHomePage.failed || 'Failed'}</p>
                </div>
              </div>
              <div className="reminder-stat">
                <TrendingUp size={24} />
                <div>
                  <p className="reminder-stat-value">{reminderStats.successRate || 0}%</p>
                  <p className="reminder-stat-label">{t.adminHomePage.successRate || 'Success Rate'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="quick-actions-section">
          <h3 className="section-title">{t.adminHomePage.quickActions || 'Quick Actions'}</h3>
          <div className="quick-actions-grid">
            <div className="quick-action-card" onClick={goToUserManag}>
              <Users size={40} />
              <h4>{t.adminHomePage.userManagement}</h4>
              <p>{t.adminHomePage.manageUsersDesc || 'Manage system users'}</p>
            </div>

            <div className="quick-action-card" onClick={goToAdminManag}>
              <Settings size={40} />
              <h4>{t.adminHomePage.adminManagement}</h4>
              <p>{t.adminHomePage.manageAdminsDesc || 'Manage admin accounts'}</p>
            </div>

            <div className="quick-action-card" onClick={goToCategoryManag}>
              <BarChart3 size={40} />
              <h4>{t.adminHomePage.categoryManagement}</h4>
              <p>{t.adminHomePage.manageCategoriesDesc || 'Manage categories'}</p>
            </div>

            <div className="quick-action-card" onClick={goToServiceProviderManag}>
              <Users size={40} />
              <h4>{t.adminHomePage.serviceProviderManagement}</h4>
              <p>{t.adminHomePage.manageServiceProvidersDesc}</p>
            </div>

            <div className="quick-action-card" onClick={goToReportManag}>
              <FileText size={40} />
              <h4>{t.adminHomePage.reports}</h4>
              <p>{t.adminHomePage.viewReportsDesc || 'View and generate reports'}</p>
            </div>

            <div className="quick-action-card" onClick={goToAllUsersData}>
              <Database size={40} />
              <h4>{t.adminHomePage.allUsersData}</h4>
              <p>{t.adminHomePage.viewAllUsersData}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminHomePage;


// last code added 