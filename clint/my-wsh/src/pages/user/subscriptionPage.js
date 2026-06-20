import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, X, Calendar, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { translations } from '../../translations/translations';
import '../../css/SubscriptionPage.css';
import '../../css/UserHeader.css';
import '../../css/Footer.css';
import UserHeader from '../../components/UserHeader';
import Footer from '../../components/Footer';
import api from '../../utils/api';

function SubscriptionsPage() {
  const navigate = useNavigate();
  const { isDarkMode, language, toggleTheme, toggleLanguage } = useThemeLanguage();
  const t = translations[language];
  
  const logo = require('../../components/wshLogo.png');

  // Helper function to get category display name
  const getCategoryDisplayName = (categoryKey) => {
    if (!categoryKey) return t.subscriptionPage.unknownCategory;
    
    // First try to find in API categories
    const apiCategory = categories.find(cat => 
      cat.name === categoryKey || 
      (cat.subcategories && cat.subcategories.some(sub => sub.name === categoryKey))
    );
    
    if (apiCategory) {
      if (apiCategory.name === categoryKey) {
        return apiCategory.name;
      }
      // Find subcategory
      const subcategory = apiCategory.subcategories?.find(sub => sub.name === categoryKey);
      return subcategory ? subcategory.name : apiCategory.name;
    }
    
    // Fallback to translation categories
    return t.subscriptionPage.categories[categoryKey] || categoryKey;
  };

  // State management
  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  // API_URL removed as we're using the api utility now

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' or 'edit'
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSubscriptions, setFilteredSubscriptions] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingData, setEditingData] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  const [addingData, setAddingData] = useState({});
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'entertainment',
    renewalDate: '',
    remindBefore: '7',
    autoRenewal: false,
    description: '',
    price: '',
    billingCycle: 'monthly'
  });

  // Load subscriptions from server
  useEffect(() => {
    loadSubscriptions();
    loadCategories();
  }, []);

  // Load categories from API
  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await api.get('/categories/subscription');
      if (response.data.success) {
        console.log('Loaded categories from API:', response.data.categories);
        setCategories(response.data.categories);
      } else {
        console.error('Failed to load categories:', response.data.message);
        setCategories([]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadSubscriptions = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/getSubscriptions');
      const loadedSubs = response.data.subscriptions || [];
      console.log('Loaded subscriptions:', loadedSubs);
      console.log('Sample subscription category:', loadedSubs[0]?.subscriptionCategory);
      setSubscriptions(loadedSubs);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      setSubscriptions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addSubscription = async (subscriptionData) => {
    try {
      setIsLoading(true);
      const response = await api.post('/addSubscription', {
        subscriptionName: subscriptionData.name,
        subscriptionCategory: subscriptionData.category,
        subscriptionRenewalDate: subscriptionData.renewalDate,
        subscriptionRemindBefore: subscriptionData.remindBefore,
        subscriptionAutoRenewal: subscriptionData.autoRenewal,
        subscriptionDescription: subscriptionData.description,
        subscriptionPrice: subscriptionData.price,
        subscriptionBillingCycle: subscriptionData.billingCycle
      });
      if (response.data.message) {
        alert(t.subscriptionPage.messages.subscriptionAdded);
        loadSubscriptions(); // Reload the list
      }
    } catch (error) {
      console.error('Error adding subscription:', error);
      alert(t.subscriptionPage.errorAddingSubscription);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSubscription = async (subscriptionData, subscriptionId) => {
    try {
      setIsLoading(true);
      const response = await api.put(`/updateSubscription/${subscriptionId}`, {
        subscriptionName: subscriptionData.name,
        subscriptionCategory: subscriptionData.category,
        subscriptionRenewalDate: subscriptionData.renewalDate,
        subscriptionRemindBefore: subscriptionData.remindBefore,
        subscriptionAutoRenewal: subscriptionData.autoRenewal,
        subscriptionDescription: subscriptionData.description,
        subscriptionPrice: subscriptionData.price,
        subscriptionBillingCycle: subscriptionData.billingCycle
      });
      if (response.data.message) {
        alert(t.subscriptionPage.messages.subscriptionUpdated);
        loadSubscriptions(); // Reload the list
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      alert(t.subscriptionPage.errorUpdatingSubscription);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSubscription = async (subscriptionId) => {
    try {
      setIsLoading(true);
      const response = await api.delete(`/deleteSubscription/${subscriptionId}`);
      if (response.data.message) {
        alert(t.subscriptionPage.messages.subscriptionDeleted);
        loadSubscriptions(); // Reload the list
      }
    } catch (error) {
      console.error('Error deleting subscription:', error);
      alert(t.subscriptionPage.errorDeletingSubscription);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter subscriptions based on search
  useEffect(() => {
    const filtered = subscriptions.filter(sub => {
      const name = sub.subscriptionName || sub.name || '';
      const category = sub.subscriptionCategory || sub.category || '';
      const categoryDisplayName = getCategoryDisplayName(category);
      return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             categoryDisplayName.toLowerCase().includes(searchTerm.toLowerCase());
    });
    setFilteredSubscriptions(filtered);
  }, [searchTerm, subscriptions, language, categories]);

  // Navigation functions
  const goTohome = () => navigate('/home');
  const goToProfile = () => navigate('/profile');
  const goTonotifications = () => navigate('/notifications');
  const handleLogout = () => {
    console.log('User logged out');
    navigate('/login');
  };

  // Calendar functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    
    // Add previous month days
    for (let i = startingDay - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({
        date: prevDate,
        isCurrentMonth: false,
        day: prevDate.getDate()
      });
    }
    
    // Add current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month, i);
      days.push({
        date: currentDate,
        isCurrentMonth: true,
        day: i
      });
    }
    
    // Add next month days to complete the grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({
        date: nextDate,
        isCurrentMonth: false,
        day: nextDate.getDate()
      });
    }
    
    return days;
  };

  const getSubscriptionsForDate = (date) => {
    return subscriptions.filter(sub => {
      const subDate = new Date(sub.subscriptionRenewalDate || sub.subscriptionReminderDate || sub.renewalDate || sub.reminderDate);
      return subDate.getDate() === date.getDate() &&
             subDate.getMonth() === date.getMonth() &&
             subDate.getFullYear() === date.getFullYear();
    });
  };

  const hasSubscriptionOnDate = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return getSubscriptionsForDate(date).length > 0;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Calendar rendering
  const renderCalendar = () => {
    const days = getDaysInMonth(currentMonth);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const arabicMonthNames = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    const today = new Date();
    const isToday = (day) => {
      return day.isCurrentMonth && 
             day.date.getDate() === today.getDate() &&
             day.date.getMonth() === today.getMonth() &&
             day.date.getFullYear() === today.getFullYear();
    };

    const hasSubscriptionOnDay = (day) => {
      if (!day.isCurrentMonth) return false;
      const subscriptions = getSubscriptionsForDate(day.date);
      return subscriptions.length > 0;
    };

    return (
      <div className="calendar-section">
        <div className="calendar-header">
          <ChevronLeft className="calendar-nav" onClick={previousMonth} />
          <h3 className="calendar-title">
            {language === 'ar' 
              ? `${arabicMonthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`
              : `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`
            }
          </h3>
          <ChevronRight className="calendar-nav" onClick={nextMonth} />
        </div>
        <table className="calendar-table">
          <thead>
            <tr>
              <th>{language === 'ar' ? 'أحد' : 'Sun'}</th>
              <th>{language === 'ar' ? 'اثنين' : 'Mon'}</th>
              <th>{language === 'ar' ? 'ثلاثاء' : 'Tue'}</th>
              <th>{language === 'ar' ? 'أربعاء' : 'Wed'}</th>
              <th>{language === 'ar' ? 'خميس' : 'Thu'}</th>
              <th>{language === 'ar' ? 'جمعة' : 'Fri'}</th>
              <th>{language === 'ar' ? 'سبت' : 'Sat'}</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }, (_, row) => (
              <tr key={row}>
                {days.slice(row * 7, (row + 1) * 7).map((day, index) => {
                  const dayKey = `${row}-${index}`;
                  const subscriptions = getSubscriptionsForDate(day.date);
                  const className = [
                    !day.isCurrentMonth ? 'other-month' : '',
                    isToday(day) ? 'today' : '',
                    hasSubscriptionOnDay(day) ? 'has-subscription' : ''
                  ].filter(Boolean).join(' ');

                  return (
                    <td 
                      key={dayKey}
                      className={className}
                      onClick={() => {
                        if (subscriptions.length > 0) {
                          setSelectedSubscription(subscriptions[0]);
                        }
                      }}
                      style={{ cursor: subscriptions.length > 0 ? 'pointer' : 'default' }}
                      title={subscriptions.length > 0 ? subscriptions.map(s => s.subscriptionName || s.name).join(', ') : ''}
                    >
                      {day.day}
                      {subscriptions.length > 0 && (
                        <div style={{ fontSize: '8px', color: '#007bff', marginTop: '2px' }}>
                          {subscriptions.length} {language === 'ar' ? 'اشتراك' : 'sub'}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {selectedSubscription ? (
          <p className="calendar-status">
            {selectedSubscription.subscriptionName || selectedSubscription.name} - {formatDate(new Date(selectedSubscription.subscriptionRenewalDate || selectedSubscription.subscriptionReminderDate || selectedSubscription.renewalDate || selectedSubscription.reminderDate))}
          </p>
        ) : (
          <p className="calendar-status">
            {language === 'ar' ? 'اختر تاريخ لعرض الاشتراكات' : 'Select a date to view subscriptions'}
          </p>
        )}
      </div>
    );
  };

  // Modal functions
  const openAddModal = () => {
    setModalType('add');
    setFormData({
      name: '',
      category: 'entertainment',
      renewalDate: '',
      remindBefore: '7',
      autoRenewal: false,
      description: '',
      price: '',
      billingCycle: 'monthly'
    });
    setShowModal(true);
  };

  const startAdding = () => {
    setIsAdding(true);
    setAddingData({
      name: '',
      category: 'entertainment',
      renewalDate: '',
      remindBefore: '7',
      autoRenewal: false,
      description: '',
      price: '',
      billingCycle: 'monthly'
    });
    setSelectedSubscription(null);
  };

  const saveAdding = async () => {
    if (!addingData.name || !addingData.renewalDate) {
      alert(t.subscriptionPage.messages.fillRequiredFields);
      return;
    }

    const subscriptionData = {
      ...addingData,
      price: addingData.price ? parseFloat(addingData.price) : 0
    };
    
    await addSubscription(subscriptionData);
    setIsAdding(false);
    setAddingData({});
  };

  const cancelAdding = () => {
    setIsAdding(false);
    setAddingData({});
  };

  const openEditModal = (subscription) => {
    setModalType('edit');
    setSelectedSubscription(subscription);
    setFormData({
      name: subscription.subscriptionName || subscription.name,
      category: subscription.subscriptionCategory || subscription.category,
      renewalDate: subscription.subscriptionRenewalDate || subscription.renewalDate || subscription.subscriptionReminderDate || subscription.reminderDate,
      remindBefore: subscription.subscriptionRemindBefore || subscription.remindBefore || '7',
      autoRenewal: subscription.subscriptionAutoRenewal || subscription.autoRenewal,
      description: subscription.subscriptionDescription || subscription.description || '',
      price: subscription.subscriptionPrice || subscription.price || '',
      billingCycle: subscription.subscriptionBillingCycle || subscription.billingCycle
    });
    setShowModal(true);
  };

  const startEditing = (subscription) => {
    setIsEditing(true);
    setEditingData({
      name: subscription.subscriptionName || subscription.name,
      category: subscription.subscriptionCategory || subscription.category,
      renewalDate: subscription.subscriptionRenewalDate || subscription.renewalDate || subscription.subscriptionReminderDate || subscription.reminderDate,
      remindBefore: subscription.subscriptionRemindBefore || subscription.remindBefore || '7',
      autoRenewal: subscription.subscriptionAutoRenewal || subscription.autoRenewal,
      description: subscription.subscriptionDescription || subscription.description || '',
      price: subscription.subscriptionPrice || subscription.price || '',
      billingCycle: subscription.subscriptionBillingCycle || subscription.billingCycle
    });
  };

  const saveEditing = async () => {
    if (!editingData.name || !editingData.renewalDate) {
      alert(t.subscriptionPage.messages.fillRequiredFields);
      return;
    }

    const subscriptionData = {
      ...editingData,
      price: editingData.price ? parseFloat(editingData.price) : 0
    };

    await updateSubscription(subscriptionData, selectedSubscription._id || selectedSubscription.id);
    setIsEditing(false);
    setEditingData({});
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditingData({});
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSubscription(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEditingInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditingData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddingInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddingData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.renewalDate) {
      alert(t.subscriptionPage.messages.fillRequiredFields);
      return;
    }

    const subscriptionData = {
      ...formData,
      price: formData.price ? parseFloat(formData.price) : 0
    };

    if (modalType === 'add') {
      await addSubscription(subscriptionData);
    } else {
      await updateSubscription(subscriptionData, selectedSubscription._id || selectedSubscription.id);
    }
    
    closeModal();
  };

  const handleDelete = async (subscription) => {
    if (window.confirm(t.subscriptionPage.messages.confirmDelete)) {
      await deleteSubscription(subscription._id || subscription.id);
    }
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <div 
      className="subscription-page"
      data-theme={isDarkMode ? 'dark' : 'light'}
      data-language={language}
    >
      <UserHeader />

      {/* Main Content */}
      <div className="subscription-content">
        <h2 className="page-title">{t.subscriptionPage.title}</h2>

        <div className="subscription-grid">
          {/* Subscription Details */}
          <div className="subscription-details">
            <h3 className="section-title">
              {isAdding ? t.subscriptionPage.addSubscription : t.subscriptionPage.subscriptionDetails}
            </h3>
            {isAdding ? (
              <div className="details-container">
                <div className="detail-item">
                  <label className="detail-label">{t.subscriptionPage.subscriptionName}</label>
                  <input 
                    type="text" 
                    name="name"
                    className="detail-input" 
                    value={addingData.name} 
                    onChange={handleAddingInputChange}
                    placeholder="Enter subscription name"
                  />
                </div>

                <div className="detail-item">
                  <label className="detail-label">{t.subscriptionPage.subscriptionCategory}</label>
                  <select
                    name="category"
                    className="detail-select"
                    value={addingData.category}
                    onChange={handleAddingInputChange}
                    disabled={loadingCategories}
                  >
                    <option value="">{loadingCategories ? t.subscriptionPage.loadingCategories : t.subscriptionPage.selectCategory}</option>
                    {categories.length > 0 ? (
                      categories.map((category) => (
                        <optgroup key={category.id} label={category.name}>
                          <option value={category.name}>{category.name}</option>
                          {category.subcategories && category.subcategories.map((sub) => (
                            <option key={sub.id} value={sub.name}>
                              ↳ {sub.name}
                            </option>
                          ))}
                        </optgroup>
                      ))
                    ) : (
                      Object.entries(t.subscriptionPage.categories).map(([key, value]) => (
                        <option key={key} value={key}>{value}</option>
                      ))
                    )}
                  </select>
                </div>

                <div className="detail-item">
                  <label className="detail-label">{t.subscriptionPage.form.renewalDate}</label>
                  <input 
                    type="date" 
                    name="renewalDate"
                    className="detail-input" 
                    value={addingData.renewalDate} 
                    onChange={handleAddingInputChange}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="detail-item">
                  <label className="detail-label">{t.subscriptionPage.form.remindBefore}</label>
                  <select
                    name="remindBefore"
                    className="detail-select"
                    value={addingData.remindBefore}
                    onChange={handleAddingInputChange}
                  >
                    {Object.entries(t.subscriptionPage.remindBeforeOptions).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </select>
                </div>

                <div className="detail-item">
                  <label className="detail-label">{t.subscriptionPage.form.billingCycle}</label>
                  <select
                    name="billingCycle"
                    className="detail-select"
                    value={addingData.billingCycle}
                    onChange={handleAddingInputChange}
                  >
                    {Object.entries(t.subscriptionPage.billingCycles).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </select>
                </div>

                <div className="detail-item">
                  <label className="detail-label">{t.subscriptionPage.form.price}</label>
                  <input 
                    type="number" 
                    name="price"
                    className="detail-input" 
                    value={addingData.price} 
                    onChange={handleAddingInputChange}
                    step="0.01"
                    min="0"
                    placeholder="Enter price (optional)"
                  />
                </div>

                <div className="detail-item">
                  <label className="detail-label">{t.subscriptionPage.form.autoRenewal}</label>
                  <label className="checkbox-label">
                    <input 
                      type="checkbox" 
                      name="autoRenewal"
                      className="detail-checkbox" 
                      checked={addingData.autoRenewal} 
                      onChange={handleAddingInputChange}
                    />
                    {addingData.autoRenewal ? 'On' : 'Off'}
                  </label>
                </div>

                <div className="detail-item">
                  <label className="detail-label">{t.subscriptionPage.form.description}</label>
                  <textarea 
                    name="description"
                    className="detail-textarea" 
                    value={addingData.description} 
                    onChange={handleAddingInputChange}
                    rows="3"
                    placeholder="Enter description (optional)"
                  />
                </div>

                <div className="detail-actions">
                  <button className="btn btn-primary" onClick={saveAdding}>
                    {t.subscriptionPage.actions.add}
                  </button>
                  <button className="btn btn-secondary" onClick={cancelAdding}>
                    {t.subscriptionPage.actions.cancel}
                  </button>
                </div>
              </div>
            ) : selectedSubscription ? (
              <div className="details-container">
                <div className="detail-item">
                  <label className="detail-label">{t.subscriptionPage.subscriptionName}</label>
                  {isEditing ? (
                    <input 
                      type="text" 
                      name="name"
                      className="detail-input" 
                      value={editingData.name} 
                      onChange={handleEditingInputChange}
                    />
                  ) : (
                    <input 
                      type="text" 
                      className="detail-input" 
                      value={selectedSubscription.subscriptionName || selectedSubscription.name} 
                      readOnly 
                    />
                  )}
                </div>

                <div className="detail-item">
                  <label className="detail-label">{t.subscriptionPage.subscriptionCategory}</label>
                  {isEditing ? (
                    <select
                      name="category"
                      className="detail-select"
                      value={editingData.category}
                      onChange={handleEditingInputChange}
                    >
                      {Object.entries(t.subscriptionPage.categories).map(([key, value]) => (
                        <option key={key} value={key}>{value}</option>
                      ))}
                    </select>
                  ) : (
                    <input 
                      type="text" 
                      className="detail-input" 
                      value={getCategoryDisplayName(selectedSubscription.subscriptionCategory || selectedSubscription.category)} 
                      readOnly 
                    />
                  )}
                </div>

                <div className="detail-item">
                  <label className="detail-label">{t.subscriptionPage.form.renewalDate}</label>
                  {isEditing ? (
                    <input 
                      type="date" 
                      name="renewalDate"
                      className="detail-input" 
                      value={editingData.renewalDate} 
                      onChange={handleEditingInputChange}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  ) : (
                    <input 
                      type="text" 
                      className="detail-input" 
                      value={formatDate(new Date(selectedSubscription.subscriptionRenewalDate || selectedSubscription.renewalDate || selectedSubscription.subscriptionReminderDate || selectedSubscription.reminderDate))} 
                      readOnly 
                    />
                  )}
                </div>

                <div className="detail-item">
                  <label className="detail-label">{t.subscriptionPage.form.remindBefore}</label>
                  {isEditing ? (
                    <select
                      name="remindBefore"
                      className="detail-select"
                      value={editingData.remindBefore}
                      onChange={handleEditingInputChange}
                    >
                      {Object.entries(t.subscriptionPage.remindBeforeOptions).map(([key, value]) => (
                        <option key={key} value={key}>{value}</option>
                      ))}
                    </select>
                  ) : (
                    <input 
                      type="text" 
                      className="detail-input" 
                      value={t.subscriptionPage.remindBeforeOptions[selectedSubscription.subscriptionRemindBefore || selectedSubscription.remindBefore || '7']} 
                      readOnly 
                    />
                  )}
                </div>

                <div className="detail-item">
                  <label className="detail-label">{t.subscriptionPage.form.billingCycle}</label>
                  {isEditing ? (
                    <select
                      name="billingCycle"
                      className="detail-select"
                      value={editingData.billingCycle}
                      onChange={handleEditingInputChange}
                    >
                      {Object.entries(t.subscriptionPage.billingCycles).map(([key, value]) => (
                        <option key={key} value={key}>{value}</option>
                      ))}
                    </select>
                  ) : (
                    <input 
                      type="text" 
                      className="detail-input" 
                      value={t.subscriptionPage.billingCycles[selectedSubscription.subscriptionBillingCycle || selectedSubscription.billingCycle]} 
                      readOnly 
                    />
                  )}
                </div>

                <div className="detail-item">
                  <label className="detail-label">{t.subscriptionPage.form.price}</label>
                  {isEditing ? (
                    <input 
                      type="number" 
                      name="price"
                      className="detail-input" 
                      value={editingData.price} 
                      onChange={handleEditingInputChange}
                      step="0.01"
                      min="0"
                      placeholder="Enter price"
                    />
                  ) : (
                    <input 
                      type="text" 
                      className="detail-input" 
                      value={(selectedSubscription.subscriptionPrice || selectedSubscription.price) ? `$${selectedSubscription.subscriptionPrice || selectedSubscription.price}` : 'Not set'} 
                      readOnly 
                    />
                  )}
                </div>

                <div className="detail-item">
                  <label className="detail-label">{t.subscriptionPage.form.autoRenewal}</label>
                  {isEditing ? (
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        name="autoRenewal"
                        className="detail-checkbox" 
                        checked={editingData.autoRenewal} 
                        onChange={handleEditingInputChange}
                      />
                      {editingData.autoRenewal ? 'On' : 'Off'}
                    </label>
                  ) : (
                    <input 
                      type="text" 
                      className="detail-input" 
                      value={(selectedSubscription.subscriptionAutoRenewal || selectedSubscription.autoRenewal) ? 'On' : 'Off'} 
                      readOnly 
                    />
                  )}
                </div>

                <div className="detail-item">
                  <label className="detail-label">{t.subscriptionPage.form.description}</label>
                  {isEditing ? (
                    <textarea 
                      name="description"
                      className="detail-textarea" 
                      value={editingData.description} 
                      onChange={handleEditingInputChange}
                      rows="3"
                      placeholder="Enter description"
                    />
                  ) : (
                    <textarea 
                      className="detail-textarea" 
                      value={selectedSubscription.subscriptionDescription || selectedSubscription.description || 'No description'} 
                      readOnly 
                      rows="3"
                    />
                  )}
                </div>

                <div className="detail-actions">
                  {isEditing ? (
                    <>
                      <button className="btn btn-primary" onClick={saveEditing}>
                        {t.subscriptionPage.actions.save}
                      </button>
                      <button className="btn btn-secondary" onClick={cancelEditing}>
                        {t.subscriptionPage.actions.cancel}
                      </button>
                    </>
                  ) : (
                    <button className="btn btn-primary" onClick={() => startEditing(selectedSubscription)}>
                      <Edit size={16} />
                      {t.subscriptionPage.actions.edit}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--label-color)' }}>
                {language === 'ar' ? 'اختر اشتراك لعرض التفاصيل' : 'Select a subscription to view details'}
              </p>
            )}
          </div>

          {/* Calendar */}
          {renderCalendar()}

          {/* Subscriptions List */}
          <div className="subscriptions-list">
            <div className="list-header">
              <h3 className="section-title">{t.subscriptionPage.subscriptionsList}</h3>
              <span className="subscription-count">{filteredSubscriptions.length}</span>
            </div>
            
            {filteredSubscriptions.length > 0 ? (
              <ul style={{ listStyleType: 'none', padding: 0 }}>
                {filteredSubscriptions.map(subscription => (
                  <li 
                    key={subscription._id || subscription.id} 
                    className="subscription-item"
                    onClick={() => setSelectedSubscription(subscription)}
                  >
                    <span>{subscription.subscriptionName || subscription.name}</span>
                    <div className="subscription-item-actions">
                      <button 
                        className="action-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(subscription);
                        }}
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="action-button delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(subscription);
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--label-color)' }}>
                {searchTerm ? 
                  (language === 'ar' ? 'لا توجد نتائج للبحث' : 'No search results') :
                  t.subscriptionPage.noSubscriptions
                }
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button 
            className="action-button-large" 
            onClick={startAdding}
            disabled={isAdding || isEditing}
          >
            <Plus size={20} />
            {t.subscriptionPage.addSubscription}
          </button>
          
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {modalType === 'add' ? t.subscriptionPage.addSubscription : t.subscriptionPage.updateSubscription}
              </h3>
              <button className="modal-close" onClick={closeModal}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">{t.subscriptionPage.form.name} *</label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">{t.subscriptionPage.form.category}</label>
                <select
                  name="category"
                  className="form-select"
                  value={formData.category}
                  onChange={handleInputChange}
                >
                  {Object.entries(t.subscriptionPage.categories).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">{t.subscriptionPage.form.renewalDate} *</label>
                <input
                  type="date"
                  name="renewalDate"
                  className="form-input"
                  value={formData.renewalDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">{t.subscriptionPage.form.remindBefore}</label>
                <select
                  name="remindBefore"
                  className="form-select"
                  value={formData.remindBefore}
                  onChange={handleInputChange}
                >
                  {Object.entries(t.subscriptionPage.remindBeforeOptions).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">{t.subscriptionPage.form.billingCycle}</label>
                <select
                  name="billingCycle"
                  className="form-select"
                  value={formData.billingCycle}
                  onChange={handleInputChange}
                >
                  {Object.entries(t.subscriptionPage.billingCycles).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">{t.subscriptionPage.form.price}</label>
                <input
                  type="number"
                  name="price"
                  className="form-input"
                  value={formData.price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">{t.subscriptionPage.form.description}</label>
                <textarea
                  name="description"
                  className="form-input"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="autoRenewal"
                    className="form-checkbox"
                    checked={formData.autoRenewal}
                    onChange={handleInputChange}
                  />
                  {t.subscriptionPage.form.autoRenewal}
                </label>
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  {t.subscriptionPage.actions.cancel}
                </button>
                <button type="submit" className="btn btn-primary">
                  {modalType === 'add' ? t.subscriptionPage.actions.add : t.subscriptionPage.actions.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

export default SubscriptionsPage;