import React, { useState, useEffect } from 'react';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { translations } from '../../translations/translations';
import AdminHeader from '../../components/AdminHeader';
import LiveChatButton from '../../components/LiveChatButton';
import { serviceProviderApi } from '../../utils/adminApi';
import { categoryApi } from '../../utils/adminApi';
import '../../css/CategoryManagePage.css';

// Predefined list of main cities in Oman
const LOCATIONS = [
    'Muscat',
    'Salalah',
    'Sohar',
    'Sur',
    'Nizwa',
    'Ibri',
    'Rustaq',
    'Bahla',
    'Buraimi',
    'Khasab',
    'Duqm',
    'Ibra',
    'Barka',
    'Seeb',
    'Muttrah',
    'Quriyat',
    'Al Buraimi',
    'Al Khaburah',
    'Al Suwaiq',
    'Al Mudhaibi',
    'Adam',
    'Bidbid',
    'Izki',
    'Samail',
    'Al Hamra',
    'Other'
];

function ServiceProviderManagementPage() {
  const { isDarkMode, language } = useThemeLanguage();
  const t = translations[language];

  // State for service providers
  const [serviceProviders, setServiceProviders] = useState([]);
  const [newServiceProvider, setNewServiceProvider] = useState({
    name: '',
    category: '',
    location: '',
    contactName: '',
    phone: '',
    email: '',
    address: '',
    description: '',
    rating: 0
  });
  const [editingServiceProvider, setEditingServiceProvider] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  // Load service providers and categories on component mount
  useEffect(() => {
    loadServiceProviders();
    loadCategories();
  }, []);

  // Load categories for dropdown
  const loadCategories = async () => {
    try {
      const response = await categoryApi.getCategories();
      if (response.success) {
        // Filter only homeTask categories
        const homeTaskCategories = response.categories.filter(cat => cat.category === 'homeTask');
        setCategories(homeTaskCategories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Load service providers from API
  const loadServiceProviders = async () => {
    try {
      setIsLoading(true);
      const response = await serviceProviderApi.getServiceProviders();
      if (response.success) {
        setServiceProviders(response.serviceProviders);
      } else {
        setMessage({ type: 'error', text: 'Failed to load service providers' });
      }
    } catch (error) {
      console.error('Error loading service providers:', error);
      setMessage({ type: 'error', text: 'Error loading service providers' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage, searchTerm]);

  // Filter service providers by search term
  const filteredServiceProviders = serviceProviders.filter(sp => {
    const searchLower = searchTerm.toLowerCase();
    return (
      sp.name.toLowerCase().includes(searchLower) ||
      sp.category.toLowerCase().includes(searchLower) ||
      sp.location.toLowerCase().includes(searchLower) ||
      (sp.contactName && sp.contactName.toLowerCase().includes(searchLower)) ||
      (sp.phone && sp.phone.toLowerCase().includes(searchLower))
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredServiceProviders.length / itemsPerPage));
  const indexOfLastProvider = currentPage * itemsPerPage;
  const indexOfFirstProvider = indexOfLastProvider - itemsPerPage;
  const currentProviders = filteredServiceProviders.slice(indexOfFirstProvider, indexOfLastProvider);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewServiceProvider(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle adding new service provider
  const handleAddServiceProvider = async () => {
    if (!newServiceProvider.name || !newServiceProvider.category || !newServiceProvider.location) {
      setMessage({ type: 'error', text: 'Name, category, and location are required' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    try {
      setIsLoading(true);
      const response = await serviceProviderApi.addServiceProvider(newServiceProvider);
      if (response.success) {
        setMessage({ type: 'success', text: response.message || t.serviceProviderManagement.serviceProviderAdded });
        setNewServiceProvider({
          name: '',
          category: '',
          location: '',
          contactName: '',
          phone: '',
          email: '',
          address: '',
          description: '',
          rating: 0
        });
        await loadServiceProviders();
      } else {
        setMessage({ type: 'error', text: response.message || t.serviceProviderManagement.failedToAdd });
      }
    } catch (error) {
      console.error('Error adding service provider:', error);
        setMessage({ type: 'error', text: error.response?.data?.message || t.serviceProviderManagement.errorAdding });
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  // Handle editing service provider
  const handleEditServiceProvider = (serviceProvider) => {
    setEditingServiceProvider(serviceProvider);
    setNewServiceProvider({
      name: serviceProvider.name,
      category: serviceProvider.category,
      location: serviceProvider.location,
      contactName: serviceProvider.contactName || '',
      phone: serviceProvider.phone || '',
      email: serviceProvider.email || '',
      address: serviceProvider.address || '',
      description: serviceProvider.description || '',
      rating: serviceProvider.rating || 0
    });
  };

  // Handle saving edited service provider
  const handleSaveEdit = async () => {
    if (!newServiceProvider.name || !newServiceProvider.category || !newServiceProvider.location) {
      setMessage({ type: 'error', text: 'Name, category, and location are required' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    try {
      setIsLoading(true);
      const response = await serviceProviderApi.updateServiceProvider(editingServiceProvider.id, newServiceProvider);
      if (response.success) {
        setMessage({ type: 'success', text: t.serviceProviderManagement.serviceProviderUpdated });
        setEditingServiceProvider(null);
        setNewServiceProvider({
          name: '',
          category: '',
          location: '',
          contactName: '',
          phone: '',
          email: '',
          address: '',
          description: '',
          rating: 0
        });
        await loadServiceProviders();
      } else {
        setMessage({ type: 'error', text: response.message || t.serviceProviderManagement.failedToUpdate });
      }
    } catch (error) {
      console.error('Error updating service provider:', error);
        setMessage({ type: 'error', text: error.response?.data?.message || t.serviceProviderManagement.errorUpdating });
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  // Handle canceling edit
  const handleCancelEdit = () => {
    setEditingServiceProvider(null);
    setNewServiceProvider({
      name: '',
      category: '',
      location: '',
      contactName: '',
      phone: '',
      email: '',
      address: '',
      description: '',
      rating: 0
    });
  };

  // Handle deleting service provider
  const handleDeleteServiceProvider = async (serviceProviderId) => {
    if (window.confirm(t.serviceProviderManagement.confirmDelete)) {
      try {
        setIsLoading(true);
        const response = await serviceProviderApi.deleteServiceProvider(serviceProviderId);
        if (response.success) {
          setMessage({ type: 'success', text: t.serviceProviderManagement.serviceProviderDeleted });
          await loadServiceProviders();
        } else {
          setMessage({ type: 'error', text: response.message || t.serviceProviderManagement.failedToDelete });
        }
      } catch (error) {
        console.error('Error deleting service provider:', error);
        setMessage({ type: 'error', text: error.response?.data?.message || t.serviceProviderManagement.errorDeleting });
      } finally {
        setIsLoading(false);
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    }
  };

  return (
    <div
      className="category-manage-container"
      data-theme={isDarkMode ? 'dark' : 'light'}
      data-language={language}
    >
      <AdminHeader />

      {/* Main Content */}
      <div className="category-content">
        <div className="category-card">
          <h2 className="category-title">{t.serviceProviderManagement.title}</h2>

          {/* Message Display */}
          {message.text && (
            <div className={`message ${message.type}-message`}>
              {message.text}
            </div>
          )}

          {/* Add New Service Provider Section */}
          <div className="category-section">
            <h3 className="section-title">
              {editingServiceProvider ? t.serviceProviderManagement.editServiceProvider : t.serviceProviderManagement.addNewServiceProvider}
            </h3>
            <div className="add-category-form">
              <div className="form-group">
                <label className="form-label">{t.serviceProviderManagement.name} *</label>
                <input
                  type="text"
                  className="form-input"
                  name="name"
                  value={newServiceProvider.name}
                  onChange={handleInputChange}
                  placeholder={t.serviceProviderManagement.name}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t.serviceProviderManagement.category} *</label>
                <select
                  className="form-select"
                  name="category"
                  value={newServiceProvider.category}
                  onChange={handleInputChange}
                >
                  <option value="">{t.serviceProviderManagement.selectCategory}</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t.serviceProviderManagement.location} *</label>
                <select
                  className="form-select"
                  name="location"
                  value={newServiceProvider.location}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">{t.serviceProviderManagement.selectLocation}</option>
                  {LOCATIONS.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t.serviceProviderManagement.contactName}</label>
                <input
                  type="text"
                  className="form-input"
                  name="contactName"
                  value={newServiceProvider.contactName}
                  onChange={handleInputChange}
                  placeholder="Contact Person Name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t.serviceProviderManagement.phone}</label>
                <input
                  type="text"
                  className="form-input"
                  name="phone"
                  value={newServiceProvider.phone}
                  onChange={handleInputChange}
                  placeholder="Phone Number"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t.serviceProviderManagement.email}</label>
                <input
                  type="email"
                  className="form-input"
                  name="email"
                  value={newServiceProvider.email}
                  onChange={handleInputChange}
                  placeholder="Email Address"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t.serviceProviderManagement.address}</label>
                <textarea
                  className="form-input"
                  name="address"
                  value={newServiceProvider.address}
                  onChange={handleInputChange}
                  placeholder="Full Address"
                  rows="2"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t.serviceProviderManagement.description}</label>
                <textarea
                  className="form-input"
                  name="description"
                  value={newServiceProvider.description}
                  onChange={handleInputChange}
                  placeholder="Service Provider Description"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t.serviceProviderManagement.rating}</label>
                <input
                  type="number"
                  className="form-input"
                  name="rating"
                  value={newServiceProvider.rating}
                  onChange={handleInputChange}
                  min="0"
                  max="5"
                  step="0.1"
                />
              </div>

              <div className="form-group">
                <label className="form-label">&nbsp;</label>
                {editingServiceProvider ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="add-btn" onClick={handleSaveEdit}>
                      {t.serviceProviderManagement.saveChanges}
                    </button>
                    <button className="action-btn" onClick={handleCancelEdit}>
                      {t.serviceProviderManagement.cancel}
                    </button>
                  </div>
                ) : (
                  <button className="add-btn" onClick={handleAddServiceProvider}>
                    {t.serviceProviderManagement.addServiceProvider}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Existing Service Providers List */}
          <div className="category-section">
            <h3 className="section-title">{t.serviceProviderManagement.existingServiceProviders}</h3>

            {/* Search Bar */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder={t.serviceProviderManagement.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {isLoading ? (
              <div className="loading">{t.serviceProviderManagement.loading}</div>
            ) : filteredServiceProviders.length === 0 ? (
              <p>{t.serviceProviderManagement.noServiceProviders}</p>
            ) : (
              <>
                <div className="category-pagination-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <label htmlFor="itemsPerPage" style={{ marginRight: '0.5rem' }}>{t.serviceProviderManagement.itemsPerPage}:</label>
                    <select
                      id="itemsPerPage"
                      value={itemsPerPage}
                      onChange={(e) => setItemsPerPage(Number(e.target.value))}
                      className="form-select"
                      style={{ width: 'auto', minWidth: '120px' }}
                    >
                      {[5, 10, 20, 30, 50].map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      className="action-btn"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      {t.serviceProviderManagement.previous}
                    </button>
                    <span style={{ fontSize: '0.95rem' }}>
                      {t.serviceProviderManagement.pageLabel} {currentPage} {t.serviceProviderManagement.of} {totalPages}
                    </span>
                    <button
                      className="action-btn"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      {t.serviceProviderManagement.next}
                    </button>
                  </div>
                </div>

                <ul className="categories-list">
                  {currentProviders.map(provider => (
                    <li key={provider.id} className="category-item">
                      <div className="category-info">
                        <span className="category-name">{provider.name}</span>
                        <span className="category-type">
                          {provider.category} - {provider.location}
                        </span>
                        {provider.contactName && (
                          <span className="category-description">{t.serviceProviderManagement.contact}: {provider.contactName}</span>
                        )}
                        {provider.phone && (
                          <span className="category-description">{t.serviceProviderManagement.phone}: {provider.phone}</span>
                        )}
                        {provider.email && (
                          <span className="category-description">{t.serviceProviderManagement.email}: {provider.email}</span>
                        )}
                        {provider.rating > 0 && (
                          <span className="category-description">{t.serviceProviderManagement.rating}: {provider.rating}/5</span>
                        )}
                        {!provider.isActive && (
                          <span style={{ color: '#dc3545', fontWeight: 'bold' }}> {t.serviceProviderManagement.inactive}</span>
                        )}
                      </div>
                      <div className="category-actions">
                        <button
                          className="action-btn edit-btn"
                          onClick={() => handleEditServiceProvider(provider)}
                          disabled={isLoading}
                        >
                          {t.edit}
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDeleteServiceProvider(provider.id)}
                          disabled={isLoading}
                        >
                          {t.delete}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map(pageNumber => (
                    <button
                      key={pageNumber}
                      className={`action-btn ${pageNumber === currentPage ? 'active-page' : ''}`}
                      onClick={() => setCurrentPage(pageNumber)}
                      disabled={pageNumber === currentPage}
                      style={{ minWidth: '40px' }}
                    >
                      {pageNumber}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Live Chat Button */}
      <LiveChatButton />
    </div>
  );
}

export default ServiceProviderManagementPage;

