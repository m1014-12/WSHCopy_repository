import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MessageCircle, Check, Trash2, Eye, RefreshCw } from 'lucide-react';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { translations } from '../../translations/translations';
import '../../css/NotificationPage.css';
import '../../css/UserHeader.css';
import '../../css/Footer.css';
import UserHeader from '../../components/UserHeader';
import Footer from '../../components/Footer';

const NotificationsPage = () => {
    const navigate = useNavigate();
    const { isDarkMode, language, toggleTheme, toggleLanguage } = useThemeLanguage();
    const logo = require('../../components/wshLogo.png');
    
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredNotifications, setFilteredNotifications] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date().toLocaleDateString());
    const [unreadCount, setUnreadCount] = useState(0);

    const t = translations[language];

    // Fetch notifications from API
    const fetchNotifications = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const token = localStorage.getItem('userToken');
            if (!token) {
                console.log('No token found, redirecting to login');
                navigate('/login');
                return;
            }

            console.log('Fetching notifications with token:', token.substring(0, 20) + '...');

            const response = await fetch('http://localhost:3001/notifications', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Response status:', response.status);

            if (response.status === 401) {
                console.log('Token expired or invalid, redirecting to login');
                localStorage.removeItem('token');
                navigate('/login');
                return;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: Failed to fetch notifications`);
            }

            const data = await response.json();
            console.log('Notifications data:', data);
            
            if (data.success) {
                setNotifications(data.notifications || []);
                setFilteredNotifications(data.notifications || []);
                
                // Count unread notifications
                const unread = (data.notifications || []).filter(n => !n.isRead).length;
                setUnreadCount(unread);
            } else {
                throw new Error(data.message || t.errors.failedToFetchNotifications);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
            setError(error.message);
            
            // If it's a network error or server error, don't redirect to login
            if (error.message.includes('Failed to fetch') || error.message.includes('HTTP 5')) {
                setError(t.errors.serverErrorRetry);
            }
        } finally {
            setLoading(false);
        }
    };

    // Mark notification as read
    const markAsRead = async (notificationId) => {
        try {
            const token = localStorage.getItem('userToken');
            const response = await fetch(`http://localhost:3001/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // Update local state
                setNotifications(prev => 
                    prev.map(notification => 
                        notification.id === notificationId 
                            ? { ...notification, isRead: true }
                            : notification
                    )
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Delete notification
    const deleteNotification = async (notificationId) => {
        try {
            const token = localStorage.getItem('userToken');
            const response = await fetch(`http://localhost:3001/notifications/${notificationId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // Update local state
                setNotifications(prev => prev.filter(n => n.id !== notificationId));
                setFilteredNotifications(prev => prev.filter(n => n.id !== notificationId));
                
                // Update unread count if the deleted notification was unread
                const deletedNotification = notifications.find(n => n.id === notificationId);
                if (deletedNotification && !deletedNotification.isRead) {
                    setUnreadCount(prev => Math.max(0, prev - 1));
                }
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    // Mark all notifications as read
    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('userToken');
            const response = await fetch('http://localhost:3001/notifications/read-all', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // Update local state
                setNotifications(prev => 
                    prev.map(notification => ({ ...notification, isRead: true }))
                );
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    // Check authentication and fetch notifications on component mount
    useEffect(() => {
        const token = localStorage.getItem('userToken');
        if (!token) {
            console.log('No authentication token found');
            navigate('/login');
            return;
        }
        
        // Verify token is not expired by checking if it's a valid JWT format
        try {
            const tokenParts = token.split('.');
            if (tokenParts.length !== 3) {
                console.log('Invalid token format');
                localStorage.removeItem('token');
                navigate('/login');
                return;
            }
            
            // Decode the payload to check expiration
            const payload = JSON.parse(atob(tokenParts[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            
            if (payload.exp && payload.exp < currentTime) {
                console.log('Token expired');
                localStorage.removeItem('token');
                navigate('/login');
                return;
            }
            
            console.log('Token is valid, fetching notifications');
            fetchNotifications();
        } catch (error) {
            console.log('Error validating token:', error);
            localStorage.removeItem('token');
            navigate('/login');
        }
    }, []);

    // Filter notifications based on search term
    useEffect(() => {
        const filtered = notifications.filter(notification =>
            notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
            notification.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            notification.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredNotifications(filtered);
    }, [searchTerm, notifications]);

    // Update current date every minute
    useEffect(() => {
        const updateDate = () => {
            setCurrentDate(new Date().toLocaleDateString());
        };
        
        // Update immediately
        updateDate();
        
        // Update every minute
        const interval = setInterval(updateDate, 60000);
        
        // Cleanup interval on component unmount
        return () => clearInterval(interval);
    }, []);

    const goTohome = () => {
        navigate('/home'); 
    };

    const handleLogout = () => {
        console.log('User logged out');
        navigate('/login');
    };

    const goToProfile = () => {
        navigate('/profile'); 
    };

    const goTonotifications = () => {
        navigate('/notifications'); 
    };

    const handleNotificationClick = (notification) => {
        // Mark as read if not already read
        if (!notification.isRead) {
            markAsRead(notification.id);
        }
        
        // Navigate to relevant page based on notification type
        console.log('Notification clicked:', notification);
        switch(notification.type) {
            case 'subscription':
                navigate('/subscription');
                break;
            case 'warranty':
                navigate('/warranty');
                break;
            case 'maintenance':
                navigate('/home-tasks');
                break;
            default:
                break;
        }
    };

    const getNotificationIcon = (type) => {
        switch(type) {
            case 'subscription':
                return '🔄';
            case 'warranty':
                return '⚠️';
            case 'maintenance':
                return '📋';
            default:
                return '📢';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <div 
            className="notification-page"
            data-theme={isDarkMode ? 'dark' : 'light'}
            data-language={language}
        >
            <UserHeader />

            <main className="notification-main">
                <p className="current-date">
                    {t.currentDate} {currentDate}
                </p>
                
                <div className="notification-header">
                    <h2 className="notification-title">
                        {t.notifications}
                        {unreadCount > 0 && (
                            <span className="unread-badge">{unreadCount}</span>
                        )}
                    </h2>
                    
                    
                    <div className="header-actions">
                        <button 
                            className="refresh-btn"
                            onClick={fetchNotifications}
                            title="Refresh notifications"
                            disabled={loading}
                        >
                            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
                        </button>
                        {unreadCount > 0 && (
                            <button 
                                className="mark-all-read-btn"
                                onClick={markAllAsRead}
                                title="Mark all as read"
                            >
                                <Check size={16} />
                                Mark All Read
                            </button>
                        )}
                    </div>
                </div>

                {/* Search bar */}
                <div className="search-container">
                    <input
                        type="text"
                        placeholder="Search notifications..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
                
                <div className="notifications-container">
                    {loading ? (
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                            <p>Loading notifications...</p>
                        </div>
                    ) : error ? (
                        <div className="error-container">
                            <h3>Error loading notifications</h3>
                            <p>{error}</p>
                            <button onClick={fetchNotifications} className="retry-btn">
                                Try Again
                            </button>
                        </div>
                    ) : filteredNotifications.length > 0 ? (
                        filteredNotifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                                data-type={notification.type}
                            >
                                <div 
                                    className="notification-content"
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="notification-icon">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="notification-text">
                                        <h4 className="notification-title-text">
                                            {notification.title}
                                        </h4>
                                        <p className="notification-message">
                                            {notification.message}
                                        </p>
                                        <div className="notification-meta">
                                            <span className="notification-date">
                                                {formatDate(notification.createdAt)}
                                            </span>
                                            <span className="notification-type">
                                                {notification.type}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="notification-actions">
                                    {!notification.isRead && (
                                        <button
                                            className="action-btn mark-read-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                markAsRead(notification.id);
                                            }}
                                            title="Mark as read"
                                        >
                                            <Eye size={16} />
                                        </button>
                                    )}
                                    <button
                                        className="action-btn delete-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteNotification(notification.id);
                                        }}
                                        title="Delete notification"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-notifications">
                            <h3>{searchTerm ? 'No notifications match your search' : 'No notifications yet'}</h3>
                            <p>
                                {searchTerm 
                                    ? 'Try adjusting your search terms' 
                                    : 'You\'ll see warranty, subscription, and maintenance reminders here'
                                }
                            </p>
                        </div>
                    )}
                </div>
            </main>

            <button className="floating-button" onClick={() => navigate('/help')}>
                <MessageCircle />
            </button>
    
    {/* Footer */}
    <Footer />
  </div>
  );
};

export default NotificationsPage;
