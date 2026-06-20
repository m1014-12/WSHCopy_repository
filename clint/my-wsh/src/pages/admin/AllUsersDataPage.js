import React, { useState, useEffect } from 'react';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { translations } from '../../translations/translations';
import AdminHeader from '../../components/AdminHeader';
import LiveChatButton from '../../components/LiveChatButton';
import adminApi from '../../utils/adminApi';
import { Shield, CreditCard, Wrench, Trash2 } from 'lucide-react';
import '../../css/AdminHomePage.css';
import '../../css/AllUsersDataPage.css';

function AllUsersDataPage() {
  const { isDarkMode, language } = useThemeLanguage();
  const t = translations[language];

  const [warranties, setWarranties] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('warranties');

  useEffect(() => {
    loadAllUsersData();
  }, []);

  const loadAllUsersData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get all warranties, subscriptions, and tasks from all users
      const [warrantiesRes, subscriptionsRes, tasksRes] = await Promise.all([
        adminApi.get('/admin/all-warranties').catch((err) => {
          console.error('Error fetching warranties:', err);
          return { data: { success: false, warranties: [] } };
        }),
        adminApi.get('/admin/all-subscriptions').catch((err) => {
          console.error('Error fetching subscriptions:', err);
          return { data: { success: false, subscriptions: [] } };
        }),
        adminApi.get('/admin/all-tasks').catch((err) => {
          console.error('Error fetching tasks:', err);
          return { data: { success: false, tasks: [] } };
        })
      ]);

      if (warrantiesRes.data.success) {
        setWarranties(warrantiesRes.data.warranties || []);
      }
      if (subscriptionsRes.data.success) {
        setSubscriptions(subscriptionsRes.data.subscriptions || []);
      }
      if (tasksRes.data.success) {
        setTasks(tasksRes.data.tasks || []);
      }
    } catch (err) {
      console.error('Error loading users data:', err);
      setError(t.allUsersDataPage.failedToLoad);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-OM' : 'en-US');
  };

  const handleDeleteWarranty = async (warrantyId) => {
    if (!window.confirm(t.allUsersDataPage.confirmDeleteWarranty)) {
      return;
    }

    try {
      const response = await adminApi.delete(`/admin/delete-warranty/${warrantyId}`);
      if (response.data.success) {
        alert(t.allUsersDataPage.warrantyDeleted);
        // Remove from state
        setWarranties(warranties.filter(w => (w._id || w.id) !== warrantyId));
      } else {
        alert(response.data.message || t.allUsersDataPage.failedToDeleteWarranty);
      }
    } catch (error) {
      console.error('Error deleting warranty:', error);
      alert(error.response?.data?.message || t.allUsersDataPage.failedToDeleteWarrantyRetry);
    }
  };

  const handleDeleteSubscription = async (subscriptionId) => {
    if (!window.confirm(t.allUsersDataPage.confirmDeleteSubscription)) {
      return;
    }

    try {
      const response = await adminApi.delete(`/admin/delete-subscription/${subscriptionId}`);
      if (response.data.success) {
        alert(t.allUsersDataPage.subscriptionDeleted);
        // Remove from state
        setSubscriptions(subscriptions.filter(s => (s._id || s.id) !== subscriptionId));
      } else {
        alert(response.data.message || t.allUsersDataPage.failedToDeleteSubscription);
      }
    } catch (error) {
      console.error('Error deleting subscription:', error);
      alert(error.response?.data?.message || t.allUsersDataPage.failedToDeleteSubscriptionRetry);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm(t.allUsersDataPage.confirmDeleteTask)) {
      return;
    }

    try {
      const response = await adminApi.delete(`/admin/delete-task/${taskId}`);
      if (response.data.success) {
        alert(t.allUsersDataPage.taskDeleted);
        // Remove from state
        setTasks(tasks.filter(t => (t._id || t.id) !== taskId));
      } else {
        alert(response.data.message || t.allUsersDataPage.failedToDeleteTask);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert(error.response?.data?.message || t.allUsersDataPage.failedToDeleteTaskRetry);
    }
  };

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
          <p>{t.allUsersDataPage.loading}</p>
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

      <main className="admin-main">
        <div className="dashboard-header">
          <h1 className="dashboard-title">{t.allUsersDataPage.title}</h1>
          <p className="dashboard-subtitle">{t.allUsersDataPage.subtitle}</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="tabs-container">
          <button
            className={`tab-button ${activeTab === 'warranties' ? 'active' : ''}`}
            onClick={() => setActiveTab('warranties')}
          >
            <Shield size={20} className="tab-icon" />
            {t.allUsersDataPage.warranties} ({warranties.length})
          </button>
          <button
            className={`tab-button ${activeTab === 'subscriptions' ? 'active' : ''}`}
            onClick={() => setActiveTab('subscriptions')}
          >
            <CreditCard size={20} className="tab-icon" />
            {t.allUsersDataPage.subscriptions} ({subscriptions.length})
          </button>
          <button
            className={`tab-button ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            <Wrench size={20} className="tab-icon" />
            {t.allUsersDataPage.tasks} ({tasks.length})
          </button>
        </div>

        {/* Warranties Tab */}
        {activeTab === 'warranties' && (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t.allUsersDataPage.warrantyName}</th>
                  <th>{t.allUsersDataPage.category}</th>
                  <th>{t.allUsersDataPage.user}</th>
                  <th>{t.allUsersDataPage.expirationDate}</th>
                  <th>{t.allUsersDataPage.status}</th>
                  <th>{t.allUsersDataPage.actions}</th>
                </tr>
              </thead>
              <tbody>
                {warranties.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-state-cell">
                      {t.allUsersDataPage.noWarrantiesFound}
                    </td>
                  </tr>
                ) : (
                  warranties.map((warranty, index) => {
                    const expDate = warranty.warrantyExpirationDate || warranty.expiryDate;
                    const isActive = expDate && new Date(expDate) > new Date();
                    return (
                      <tr key={warranty._id || warranty.id || index}>
                        <td>{warranty.warrantyName || warranty.name || 'N/A'}</td>
                        <td>{warranty.warrantyCategory || warranty.category || 'N/A'}</td>
                        <td>{warranty.userId?.userName || warranty.userName || 'N/A'}</td>
                        <td>{formatDate(expDate)}</td>
                        <td>
                          <span className={`status-badge ${isActive ? 'active' : 'expired'}`}>
                            {isActive ? t.allUsersDataPage.active : t.allUsersDataPage.expired}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleDeleteWarranty(warranty._id || warranty.id)}
                            className="delete-btn"
                            title={t.allUsersDataPage.deleteWarranty}
                          >
                            <Trash2 size={14} />
                            {t.allUsersDataPage.delete}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Subscriptions Tab */}
        {activeTab === 'subscriptions' && (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t.allUsersDataPage.subscriptionName}</th>
                  <th>{t.allUsersDataPage.category}</th>
                  <th>{t.allUsersDataPage.user}</th>
                  <th>{t.allUsersDataPage.renewalDate}</th>
                  <th>{t.allUsersDataPage.status}</th>
                  <th>{t.allUsersDataPage.actions}</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-state-cell">
                      {t.allUsersDataPage.noSubscriptionsFound}
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((subscription, index) => (
                    <tr key={subscription._id || subscription.id || index}>
                      <td>{subscription.subscriptionName || subscription.name || 'N/A'}</td>
                      <td>{subscription.subscriptionCategory || subscription.category || 'N/A'}</td>
                      <td>{subscription.userId?.userName || subscription.userName || 'N/A'}</td>
                      <td>{formatDate(subscription.subscriptionRenewalDate || subscription.renewalDate)}</td>
                      <td>
                        <span className="status-badge subscription-active">
                          {t.allUsersDataPage.active}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleDeleteSubscription(subscription._id || subscription.id)}
                          className="delete-btn"
                          title={t.allUsersDataPage.deleteSubscription}
                        >
                          <Trash2 size={14} />
                          {t.allUsersDataPage.delete}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t.allUsersDataPage.taskName}</th>
                  <th>{t.allUsersDataPage.category}</th>
                  <th>{t.allUsersDataPage.user}</th>
                  <th>{t.allUsersDataPage.status}</th>
                  <th>{t.allUsersDataPage.completed}</th>
                  <th>{t.allUsersDataPage.actions}</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-state-cell">
                      {t.allUsersDataPage.noTasksFound}
                    </td>
                  </tr>
                ) : (
                  tasks.map((task, index) => {
                    const isCompleted = task.homeTaskCompleted || task.completed;
                    return (
                      <tr key={task._id || task.id || index}>
                        <td>{task.homeTaskName || task.name || 'N/A'}</td>
                        <td>{task.homeTaskCategory || task.category || 'N/A'}</td>
                        <td>{task.userId?.userName || task.userName || 'N/A'}</td>
                        <td>{task.homeTaskStatus || task.status || 'N/A'}</td>
                        <td>
                          <span className={`status-badge ${isCompleted ? 'completed' : 'pending'}`}>
                            {isCompleted ? t.allUsersDataPage.yes : t.allUsersDataPage.no}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleDeleteTask(task._id || task.id)}
                            className="delete-btn"
                            title={t.allUsersDataPage.deleteTask}
                          >
                            <Trash2 size={14} />
                            {t.allUsersDataPage.delete}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <LiveChatButton />
    </div>
  );
}

export default AllUsersDataPage;

