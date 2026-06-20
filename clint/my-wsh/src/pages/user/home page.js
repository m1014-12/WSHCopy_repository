import React, { useState, useEffect } from 'react'; 
import { Link, useNavigate } from 'react-router-dom';
import '../../App.css';
import '../../css/HomePage.css';
import '../../css/UserHeader.css';
import '../../css/Footer.css';
import { Clock, Calendar, AlertCircle, CheckCircle, Plus, Settings, Download, Search, RefreshCw, Zap, Shield, CreditCard, Wrench, Eye, Edit } from 'lucide-react';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { translations } from '../../translations/translations';
import UserHeader from '../../components/UserHeader';
import LiveChatButton from '../../components/LiveChatButton';
import Footer from '../../components/Footer';
import api from '../../utils/api';

function HomePage() {
  const navigate = useNavigate();
  const { isDarkMode, language } = useThemeLanguage();
  const t = translations[language];

  // State for dashboard features
  const [selectedTimeRange, setSelectedTimeRange] = useState('week');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for user data
  const [userStats, setUserStats] = useState({
    activeWarranties: 0,
    activeSubscriptions: 0,
    pendingTasks: 0,
    expiringSoon: 0,
    overdueTasks: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingThings, setUpcomingThings] = useState([]);
  const [userData, setUserData] = useState(null);
  
  // State for analytics data
  const [warrantiesData, setWarrantiesData] = useState([]);
  const [subscriptionsData, setSubscriptionsData] = useState([]);
  const [tasksData, setTasksData] = useState([]);

  // Load user data on component mount
  useEffect(() => {
    loadUserDashboardData();
  }, []);

  // Process activities and upcoming things when data changes
  useEffect(() => {
    if (warrantiesData.length > 0 || subscriptionsData.length > 0 || tasksData.length > 0) {
      processActivitiesAndUpcoming();
    }
  }, [warrantiesData, subscriptionsData, tasksData]);

  // Load user dashboard data
  const loadUserDashboardData = async () => {
    try {
      setIsLoading(true);
      const userId = localStorage.getItem('userId');
      
      if (!userId) {
        navigate('/login');
        return;
      }

      // Load user profile data
      const profileResponse = await api.get(`/profile/${userId}`);
      if (profileResponse.data.success) {
        setUserData(profileResponse.data.user);
      }

      // Load user statistics
      await Promise.all([
        loadWarranties(),
        loadSubscriptions(),
        loadHomeTasks()
      ]);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load warranties data
  const loadWarranties = async () => {
    try {
      const response = await api.get('/getWarranty');
      const warranties = response.data.warranty || [];
      
      // Store warranties data for analytics
      setWarrantiesData(warranties);
      
      // Calculate expiring warranties (within 5 days)
      const now = new Date();
      const fiveDaysFromNow = new Date(now.getTime() + (5 * 24 * 60 * 60 * 1000));
      const expiringSoon = warranties.filter(warranty => {
        const expiryDate = new Date(warranty.warrantyExpirationDate);
        return expiryDate >= now && expiryDate <= fiveDaysFromNow;
      });

      setUserStats(prev => ({
        ...prev,
        activeWarranties: warranties.length,
        expiringSoon: expiringSoon.length
      }));

      // Store warranty data for activities (will be processed later)
      // No immediate addition to activities to avoid duplication

    } catch (error) {
      console.error('Error loading warranties:', error);
    }
  };

  // Load subscriptions data
  const loadSubscriptions = async () => {
    try {
      const response = await api.get('/getSubscriptions');
      const subscriptions = response.data.subscriptions || [];

      // Store subscriptions data for analytics
      setSubscriptionsData(subscriptions);

      setUserStats(prev => ({
        ...prev,
        activeSubscriptions: subscriptions.length
      }));

      // Store subscription data for activities (will be processed later)
      // No immediate addition to activities to avoid duplication

    } catch (error) {
      console.error('Error loading subscriptions:', error);
    }
  };

  // Load home tasks data
  const loadHomeTasks = async () => {
    try {
      const response = await api.get('/getHomeTasks');
      const tasks = response.data.homeTasks || [];
      
      // Store tasks data for analytics
      setTasksData(tasks);
      
      const pendingTasks = tasks.filter(task => !task.homeTaskCompleted);
      
      // Calculate overdue tasks
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const overdueTasks = tasks.filter(task => {
        if (task.homeTaskCompleted) return false;
        const reminderDate = new Date(task.homeTaskReminderDate);
        reminderDate.setHours(0, 0, 0, 0);
        return reminderDate < now;
      });

      setUserStats(prev => ({
        ...prev,
        pendingTasks: pendingTasks.length,
        overdueTasks: overdueTasks.length
      }));

      // Store task data for activities (will be processed later)
      // No immediate addition to activities to avoid duplication

    } catch (error) {
      console.error('Error loading home tasks:', error);
    }
  };

  // Process all data to create activities and upcoming things without duplication
  const processActivitiesAndUpcoming = () => {
    // Clear existing data first
    setRecentActivities([]);
    setUpcomingThings([]);

    // Process warranties
    const warrantyActivities = warrantiesData.slice(0, 2).map(warranty => ({
      id: warranty._id,
      type: 'warranty',
      title: t.homePage.warrantyAdded,
      description: `${warranty.warrantyName} - ${warranty.warrantyCategory}`,
      time: t.homePage.recently,
      status: 'completed',
      icon: <CheckCircle className="activity-icon completed" />
    }));

    // Process subscriptions
    const subscriptionActivities = subscriptionsData.slice(0, 2).map(subscription => ({
      id: subscription._id,
      type: 'subscription',
      title: t.homePage.subscriptionAdded,
      description: `${subscription.subscriptionName} - ${subscription.subscriptionCategory}`,
      time: t.homePage.recently,
      status: 'completed',
      icon: <CheckCircle className="activity-icon completed" />
    }));

    // Process tasks
    const taskActivities = tasksData.slice(0, 2).map(task => ({
        id: task._id,
        type: 'maintenance',
        title: task.homeTaskCompleted ? t.homePage.taskCompleted : t.homePage.taskAdded,
        description: `${task.homeTaskName} - ${task.homeTaskCategory}`,
        time: t.homePage.recently,
        status: task.homeTaskCompleted ? 'completed' : 'pending',
        icon: task.homeTaskCompleted ? 
          <CheckCircle className="activity-icon completed" /> : 
          <Clock className="activity-icon pending" />
      }));

    // Combine and limit activities
    const allActivities = [...warrantyActivities, ...subscriptionActivities, ...taskActivities];
    setRecentActivities(allActivities.slice(0, 5)); // Show max 5 activities

    // Process upcoming things within 5-day range
    const now = new Date();
    const fiveDaysFromNow = new Date(now.getTime() + (5 * 24 * 60 * 60 * 1000));
    
    // Filter warranties expiring within 5 days
    const expiringSoon = warrantiesData.filter(warranty => {
      const expiryDate = new Date(warranty.warrantyExpirationDate);
      return expiryDate >= now && expiryDate <= fiveDaysFromNow;
    });

    const warrantyUpcoming = expiringSoon.map(warranty => ({
      id: warranty._id,
      type: 'warranty',
      title: warranty.warrantyName,
      description: t.homePage.warrantyExpiresSoon,
      date: new Date(warranty.warrantyExpirationDate).toLocaleDateString(),
      priority: 'high',
      icon: <AlertCircle className="upcoming-icon" />
    }));

    // Filter subscriptions with renewal dates within 5 days
    const upcomingSubscriptions = subscriptionsData.filter(subscription => {
      const renewalDate = new Date(subscription.subscriptionRenewalDate);
      return renewalDate >= now && renewalDate <= fiveDaysFromNow;
    });

    const subscriptionUpcoming = upcomingSubscriptions.map(subscription => ({
      id: subscription._id,
      type: 'subscription',
      title: subscription.subscriptionName,
      description: subscription.subscriptionAutoRenewal ? t.homePage.autoRenewalScheduled : t.homePage.manualRenewalRequired,
      date: new Date(subscription.subscriptionRenewalDate).toLocaleDateString(),
      priority: subscription.subscriptionAutoRenewal ? 'medium' : 'high',
      icon: <Calendar className="upcoming-icon" />
    }));

    // Filter home tasks with reminder dates within 5 days
    const upcomingTasks = tasksData.filter(task => {
      const reminderDate = new Date(task.homeTaskReminderDate);
      return !task.homeTaskCompleted && reminderDate >= now && reminderDate <= fiveDaysFromNow;
    });

    const taskUpcoming = upcomingTasks.map(task => ({
      id: task._id,
      type: 'maintenance',
      title: task.homeTaskName,
      description: t.homePage.taskReminder,
      date: new Date(task.homeTaskReminderDate).toLocaleDateString(),
      priority: task.homeTaskPriority === 'high' ? 'high' : 
                task.homeTaskPriority === 'medium' ? 'medium' : 'low',
      icon: <Clock className="upcoming-icon" />
    }));
    
    // Filter overdue tasks
    const overdueTasks = tasksData.filter(task => {
      if (task.homeTaskCompleted) return false;
      const reminderDate = new Date(task.homeTaskReminderDate);
      reminderDate.setHours(0, 0, 0, 0);
      return reminderDate < now;
    });
    
    const overdueTaskItems = overdueTasks.map(task => ({
      id: task._id,
      type: 'maintenance',
      title: task.homeTaskName,
      description: t.homePage.overdueTask,
      date: new Date(task.homeTaskReminderDate).toLocaleDateString(),
      priority: 'high',
      icon: <AlertCircle className="upcoming-icon" />
    }));

    // Combine and limit upcoming things (include overdue tasks)
    const allUpcoming = [...warrantyUpcoming, ...subscriptionUpcoming, ...taskUpcoming, ...overdueTaskItems];
    setUpcomingThings(allUpcoming.slice(0, 5)); // Show max 5 upcoming items
  };

  // Calculate expense tracking data
  const getExpenseData = () => {
    const totalWarranties = warrantiesData.length;
    const totalSubscriptions = subscriptionsData.length;
    const completedTasks = tasksData.filter(task => task.homeTaskCompleted).length;
    const pendingTasks = tasksData.filter(task => !task.homeTaskCompleted).length;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const overdueTasks = tasksData.filter(task => {
      if (task.homeTaskCompleted) return false;
      const reminderDate = new Date(task.homeTaskReminderDate);
      reminderDate.setHours(0, 0, 0, 0);
      return reminderDate < now;
    }).length;
    
    return [
      { name: t.homePage.warranties, value: totalWarranties, color: '#667eea', icon: '🛡️' },
      { name: t.homePage.subscriptions, value: totalSubscriptions, color: '#764ba2', icon: '💳' },
      { name: t.homePage.completedTasks, value: completedTasks, color: '#43e97b', icon: '✅' },
      { name: t.homePage.pendingTasks, value: pendingTasks, color: '#ffa502', icon: '⏳' },
      { name: t.homePage.overdueTasks, value: overdueTasks, color: '#ff4757', icon: '⚠️' }
    ];
  };


  // Quick action buttons
  const quickActions = [
    { icon: <Plus className="quick-action-icon" />, label: t.homePage.addWarranty, action: () => navigate('/warranty'), color: '#667eea' },
    { icon: <CreditCard className="quick-action-icon" />, label: t.homePage.addSubscription, action: () => navigate('/subscription'), color: '#764ba2' },
    { icon: <Wrench className="quick-action-icon" />, label: t.homePage.scheduleTask, action: () => navigate('/home-tasks'), color: '#f093fb' },
    { icon: <Search className="quick-action-icon" />, label: t.homePage.search, action: () => navigate('/search'), color: '#4facfe' },
    { icon: <Download className="quick-action-icon" />, label: t.homePage.userReport, action: () => navigate('/user-report'), color: '#43e97b' },
    { icon: <Settings className="quick-action-icon" />, label: t.homePage.profile, action: () => navigate('/profile'), color: '#fa709a' }
  ];





  const handleRefresh = () => {
    setIsRefreshing(true);
    setRecentActivities([]);
    setUpcomingThings([]);
    setWarrantiesData([]);
    setSubscriptionsData([]);
    setTasksData([]);
    setUserStats({
      activeWarranties: 0,
      activeSubscriptions: 0,
      pendingTasks: 0,
      expiringSoon: 0,
      overdueTasks: 0
    });
    loadUserDashboardData().finally(() => {
      setIsRefreshing(false);
    });
  };


  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ff4757';
      case 'medium': return '#ffa502';
      case 'low': return '#2ed573';
      default: return '#747d8c';
    }
  };


  const renderPieChart = () => {
    const expenseData = getExpenseData();
    const total = expenseData.reduce((sum, item) => sum + item.value, 0);
    
    if (total === 0) {
    return (
        <div className="pie-chart-container">
          <div className="no-data-message">
            <p>{t.homePage.noDataAvailable}</p>
            <p>{t.homePage.startAddingMessage}</p>
        </div>
      </div>
    );
    }

    return (
      <div className="pie-chart-container">
        <div className="pie-chart">
          {expenseData.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const rotation = expenseData.slice(0, index).reduce((sum, prevItem) => 
              sum + (prevItem.value / total) * 360, 0
            );
            
            return (
            <div
              key={index}
              className="pie-segment"
              style={{
                  transform: `rotate(${rotation}deg)`,
                  backgroundColor: item.color,
                  clipPath: `polygon(50% 50%, 50% 0%, ${50 + Math.cos((percentage * Math.PI) / 180) * 50}% ${50 + Math.sin((percentage * Math.PI) / 180) * 50}%)`
              }}
            />
            );
          })}
        </div>
        <div className="pie-legend">
          {expenseData.map((item, index) => (
            <div key={index} className="legend-item">
              <div 
                className="legend-color" 
                style={{ backgroundColor: item.color }}
              />
              <span className="legend-icon">{item.icon}</span>
              <span className="legend-label">{item.name}</span>
              <span className="legend-value">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="home-page">
        <UserHeader />
        <main className="home-main">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>{t.homePage.loadingDashboard}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="home-page">
      <UserHeader />

      {/* Main Content Area */}
      <main className="home-main">
        {/* Welcome Message */}
        {userData && (
         <div className="welcome-section">
  <h1 className="welcome-title">
    <span>{t.homePage.welcomeBack.replace('{name}', userData.userName).replace('👋', '')}</span>
    <span className="emoji-fix"> 👋</span>
  </h1>
  <p className="welcome-subtitle">
    {t.homePage.welcomeSubtitle}
  </p>
</div>
        )}
        {/* Dashboard Overview Section */}
        <div className="dashboard-overview">
          <div className="overview-header">
              <h2 className="overview-title">
              <span className="overview-icon">🏠</span>
              {t.homePage.dashboardOverview}
            </h2>
            <div className="overview-controls">
              <select 
                value={selectedTimeRange} 
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="time-range-selector"
              >
                <option value="week">{t.homePage.thisWeek}</option>
                <option value="month">{t.homePage.thisMonth}</option>
                <option value="year">{t.homePage.thisYear}</option>
              </select>
              <button 
                onClick={handleRefresh} 
                className={`refresh-button ${isRefreshing ? 'refreshing' : ''}`}
                disabled={isRefreshing}
              >
                <RefreshCw className="refresh-icon" />
              </button>
            </div>
          </div>
          
          <div className="overview-stats">
            <div className="stat-card">
              <div className="stat-icon">
                <Shield className="stat-icon-svg" />
              </div>
              <div className="stat-content">
                <div className="stat-number">{userStats.activeWarranties}</div>
                <div className="stat-label">{t.homePage.activeWarranties}</div>
                <div className="stat-change positive">{t.homePage.activeWarrantiesDesc}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <CreditCard className="stat-icon-svg" />
              </div>
              <div className="stat-content">
                <div className="stat-number">{userStats.activeSubscriptions}</div>
                <div className="stat-label">{t.homePage.activeSubscriptions}</div>
                <div className="stat-change positive">{t.homePage.activeSubscriptionsDesc}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <Wrench className="stat-icon-svg" />
              </div>
              <div className="stat-content">
                <div className="stat-number">{userStats.pendingTasks}</div>
                <div className="stat-label">{t.homePage.pendingTasks}</div>
                <div className="stat-change negative">{t.homePage.tasksPendingDesc}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <AlertCircle className="stat-icon-svg" />
              </div>
              <div className="stat-content">
                <div className="stat-number">{userStats.expiringSoon}</div>
                <div className="stat-label">{t.homePage.expiringSoon}</div>
                <div className="stat-change warning">{t.homePage.dueSoonDesc}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <AlertCircle className="stat-icon-svg" />
              </div>
              <div className="stat-content">
                <div className="stat-number">{userStats.overdueTasks}</div>
                <div className="stat-label">{t.homePage.overdueTasks}</div>
                <div className="stat-change negative">{t.homePage.needsAttentionDesc}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="quick-actions-section">
          <h3 className="section-title">
            <Zap className="section-icon" />
            {t.homePage.quickActions}
          </h3>
          <div className="quick-actions-grid">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className="quick-action-button"
                onClick={action.action}
                style={{ '--action-color': action.color }}
              >
                <div className="quick-action-icon-wrapper">
                  {action.icon}
                </div>
                <span className="quick-action-label">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Analytics Section */}
        <div className="analytics-section">
          <div className="analytics-header">
            <h3 className="section-title">
              <span className="section-icon">📊</span>
              {t.homePage.yourActivityOverview}
            </h3>
          </div>
          <div className="analytics-grid">
            <div className="chart-card">
              <h4>
                <span className="chart-icon">🎯</span>
                {t.homePage.yourItemsOverview}
              </h4>
              {renderPieChart()}
            </div>
          </div>
        </div>

        {/* Recent Activities and Upcoming Things Section */}
        <div className="activities-upcoming-section">
          {/* Recent Activities */}
          <div className="activities-section">
            <div className="section-header">
              <h3 className="section-title">
                <span className="section-icon">⏰</span>
                {t.homePage.recentActivities}
              </h3>
            </div>
            <div className="activities-list">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-icon-container">
                    {activity.icon}
                  </div>
                  <div className="activity-content">
                    <div className="activity-title">{activity.title}</div>
                    <div className="activity-description">{activity.description}</div>
                    <div className="activity-time">{activity.time}</div>
                  </div>
                  <div className="activity-actions">
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Things */}
          <div className="upcoming-section">
            <div className="section-header">
              <h3 className="section-title">
                <span className="section-icon">📅</span>
                {t.homePage.upcomingThings}
              </h3>
            </div>
            <div className="upcoming-list">
              {upcomingThings.map((item) => (
                <div key={item.id} className="upcoming-item">
                  <div className="upcoming-icon-container">
                    {item.icon}
                  </div>
                  <div className="upcoming-content">
                    <div className="upcoming-title">{item.title}</div>
                    <div className="upcoming-description">{item.description}</div>
                    <div className="upcoming-date">{item.date}</div>
                  </div>

                  <div className="upcoming-actions">

                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </main>

      {/* Live Chat Button */}
      <LiveChatButton />
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

export default HomePage;

