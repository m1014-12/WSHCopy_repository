import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Plus, Edit, Trash2, Calendar, Upload, X } from 'lucide-react';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { translations } from '../../translations/translations';
import '../../css/WarrantyPage.css';
import '../../css/UserHeader.css';
import '../../css/Footer.css';
import UserHeader from '../../components/UserHeader';
import LiveChatButton from '../../components/LiveChatButton';
import Footer from '../../components/Footer';
import api from '../../utils/api';

// Component to handle authenticated image display
const WarrantyImageDisplay = ({ warranty, api, t }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await api.get(`/warranty-file/${warranty._id}`, {
          responseType: 'blob'
        });
        
        const blob = new Blob([response.data], { type: warranty.warrantyFile.contentType });
        const url = URL.createObjectURL(blob);
        setImageUrl(url);
      } catch (error) {
        console.error('Error fetching image:', error);
        setError(t.warrantyPage.failedToLoadImage);
      } finally {
        setLoading(false);
      }
    };

    if (warranty.warrantyFile && warranty.warrantyFile.contentType.startsWith('image/')) {
      fetchImage();
    }

    // Cleanup object URL when component unmounts
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [warranty._id, warranty.warrantyFile, api]);

  if (loading) {
    return (
      <div className="warranty-image-container">
        <div className="image-loading">
          <Upload size={60} />
          <p>{t.warrantyPage.loadingImage}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="warranty-image-container">
        <div className="image-error">
          <Upload size={60} />
          <p>{t.warrantyPage.errorLoadingImage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="warranty-image-container">
      <img 
        src={imageUrl}
        alt={warranty.warrantyName || warranty.name}
        className="warranty-image"
      />
      <div className="image-file-info">
        <p className="file-name">{warranty.warrantyFile.originalName}</p>
        <p className="file-size">{(warranty.warrantyFile.size / 1024).toFixed(1)} KB</p>
        <p className="file-type">{warranty.warrantyFile.contentType}</p>
        <WarrantyFileDownload 
          warranty={warranty}
          api={api}
          buttonText={t.warrantyPage.actions.downloadWarranty}
          t={t}
        />
      </div>
    </div>
  );
};

// Component to handle authenticated file downloads
const WarrantyFileDownload = ({ warranty, api, buttonText, t }) => {
  const handleDownload = async () => {
    try {
      const response = await api.get(`/warranty-file/${warranty._id}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: warranty.warrantyFile.contentType });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link element to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = warranty.warrantyFile.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the object URL
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert(t.warrantyPage.failedToDownloadFile);
    }
  };

  return (
    <button 
      onClick={handleDownload}
      className="download-link"
    >
      {buttonText}
    </button>
  );
};

function WarrantyPage() {
  const navigate = useNavigate();
  const { isDarkMode, language, toggleTheme, toggleLanguage } = useThemeLanguage();
  const t = translations[language];

  const logo = require('../../components/wshLogo.png');

  // API_URL removed as we're using the api utility now
  const [warranties, setWarranties] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarranty, setSelectedWarranty] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [addingWarranty, setAddingWarranty] = useState(false);

  useEffect(() => {
    loadWarranties();
    loadCategories();
  }, []);

  // Load categories from API
  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await api.get('/categories/warranty');
      if (response.data.success) {
        setCategories(response.data.categories);
      } else {
        console.error('Failed to load categories:', response.data.message);
        // Fallback to hardcoded categories if API fails
        setCategories([]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      // Fallback to hardcoded categories if API fails
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadWarranties = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/getWarranty');
      setWarranties(response.data.warranty || []);
    } catch (error) {
      console.error('Error loading warranties:', error);
      setWarranties([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addWarranty = async (warrantyData) => {
    try {
      setAddingWarranty(true);
      
      // Optimistic UI update - add warranty to list immediately
      const tempWarranty = {
        _id: `temp-${Date.now()}`, // Temporary ID
        warrantyName: warrantyData.name,
        warrantyCategory: warrantyData.category,
        warrantyExpirationDate: warrantyData.expiryDate,
        warrantyRemindBefore: warrantyData.remindBefore,
        warrantyFile: warrantyData.image ? {
          originalName: warrantyData.image.name,
          contentType: warrantyData.image.type,
          size: warrantyData.image.size
        } : null,
        isOptimistic: true // Flag to identify optimistic updates
      };
      
      setWarranties(prev => [tempWarranty, ...prev]);
      
      console.log('Creating FormData for warranty upload...');
      console.log('File details:', warrantyData.image ? {
        name: warrantyData.image.name,
        size: warrantyData.image.size,
        type: warrantyData.image.type
      } : 'No file');
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('warrantyName', warrantyData.name);
      formData.append('warrantyCategory', warrantyData.category);
      formData.append('warrantyExpirationDate', warrantyData.expiryDate);
      formData.append('warrantyRemindBefore', warrantyData.remindBefore);
      
      // Add file if selected
      if (warrantyData.image) {
        formData.append('warrantyFile', warrantyData.image);
        console.log('File added to FormData');
      } else {
        console.log('No file to add to FormData');
      }
      
      const response = await api.post('/addWarranty', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.message) {
        // Remove optimistic update and reload the list with real data
        setWarranties(prev => prev.filter(w => w._id !== tempWarranty._id));
        loadWarranties(); // Reload the list
        alert(t.warrantyPage.messages.warrantyAdded);
      }
    } catch (error) {
      console.error('Error adding warranty:', error);
      
      // Remove optimistic update on error
      setWarranties(prev => prev.filter(w => w._id !== `temp-${Date.now()}`));
      
      // Better error handling
      if (error.response) {
        const errorMessage = error.response.data?.message || t.errors.serverError;
        alert(`${t.warrantyPage.errorAddingWarranty}: ${errorMessage}`);
      } else if (error.request) {
        alert(t.errors.networkError);
      } else {
        alert(t.warrantyPage.errorAddingWarrantyRetry);
      }
    } finally {
      setAddingWarranty(false);
    }
  };

  const updateWarranty = async (warrantyData) => {
    try {
      setIsLoading(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('warrantyName', warrantyData.name);
      formData.append('warrantyCategory', warrantyData.category);
      formData.append('warrantyExpirationDate', warrantyData.expiryDate);
      formData.append('warrantyRemindBefore', warrantyData.remindBefore);
      
      // Add file if selected
      if (warrantyData.image) {
        formData.append('warrantyFile', warrantyData.image);
      }
      
      const response = await api.put(`/updateWarranty/${editingId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.message) {
        alert(t.warrantyPage.messages.warrantyUpdated);
        loadWarranties(); // Reload the list
      }
    } catch (error) {
      console.error('Error updating warranty:', error);
      
      // Better error handling
      if (error.response) {
        const errorMessage = error.response.data?.message || t.errors.serverError;
        alert(`${t.warrantyPage.errorUpdatingWarranty}: ${errorMessage}`);
      } else if (error.request) {
        alert(t.errors.networkError);
      } else {
        alert(t.warrantyPage.errorUpdatingWarrantyRetry);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const deleteWarranty = async (id) => {
    try {
      setIsLoading(true);
      const response = await api.delete(`/deleteWarranty/${id}`);
      if (response.data.message) {
        alert(t.warrantyPage.messages.warrantyDeleted);
        loadWarranties(); // Reload the list
      }
    } catch (error) {
      console.error('Error deleting warranty:', error);
      alert(t.warrantyPage.errorDeletingWarranty);
    } finally {
      setIsLoading(false);
    }
  };
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    expiryDate: '',
    remindBefore: '',
    image: null
  });

  // Navigation functions
  const goTohome = () => navigate('/home');
  const goToProfile = () => navigate('/profile');
  const goTonotifications = () => navigate('/notifications');
    const handleLogout = () => {
        console.log('User logged out');
        navigate('/login');
    };

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert('File size must be less than 10MB');
        e.target.value = ''; // Clear the input
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only images (JPEG, PNG, GIF), PDF, Word documents, and text files are allowed');
        e.target.value = ''; // Clear the input
        return;
      }

      setFormData(prev => ({
        ...prev,
        image: file
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Debug logging
    console.log('Form submission started');
    console.log('Form data:', formData);
    console.log('Authentication token:', localStorage.getItem('userToken') ? 'Present' : 'Missing');
    
    if (!formData.name || !formData.category || !formData.expiryDate || !formData.remindBefore || !formData.image) {
      alert(t.warrantyPage.messages.fillRequiredFields);
      return;
    }

    if (editingId) {
      // Update existing warranty
      await updateWarranty(formData);
    } else {
      // Add new warranty
      await addWarranty(formData);
    }

    resetForm();
  };

  const handleEdit = (warranty) => {
    // Format dates for HTML date inputs (YYYY-MM-DD)
    const formatDateForInput = (dateValue) => {
      if (!dateValue) return '';
      const date = new Date(dateValue);
      return date.toISOString().split('T')[0];
    };

    setFormData({
      name: warranty.warrantyName || warranty.name,
      category: warranty.warrantyCategory || warranty.category,
      expiryDate: formatDateForInput(warranty.warrantyExpirationDate || warranty.expiryDate),
      remindBefore: warranty.warrantyRemindBefore || warranty.remindBefore || '',
      image: warranty.warrantyImage || warranty.image
    });
    setEditingId(warranty._id || warranty.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm(t.warrantyPage.messages.confirmDelete)) {
      await deleteWarranty(id);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      expiryDate: '',
      remindBefore: '',
      image: null
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleWarrantySelect = (warranty) => {
    setSelectedWarranty(warranty);
  };

  // Check if warranty is expired
  const isWarrantyExpired = (warranty) => {
    const expiryDate = warranty.warrantyExpirationDate || warranty.expiryDate;
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    return expiry < today;
  };

  // Filter warranties based on search term and sort them
  const filteredWarranties = warranties
    .filter(warranty => {
      const name = warranty.warrantyName || warranty.name || '';
      const category = warranty.warrantyCategory || warranty.category || '';
      return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             category.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      // Sort expired warranties to the bottom
      const aExpired = isWarrantyExpired(a);
      const bExpired = isWarrantyExpired(b);
      
      if (aExpired && !bExpired) return 1;
      if (!aExpired && bExpired) return -1;
      
      // If both are expired or both are not expired, sort by expiry date
      const aDate = new Date(a.warrantyExpirationDate || a.expiryDate);
      const bDate = new Date(b.warrantyExpirationDate || b.expiryDate);
      return aDate - bDate;
    });

  return (
    <div 
      className="warranty-page" 
      data-theme={isDarkMode ? 'dark' : 'light'}
      data-language={language}
    >
      <UserHeader />

      {/* Main Content */}
      <main className="warranty-main">
        <h1 className="warranty-title">{t.warrantyPage.title}</h1>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button 
            className="btn btn-primary" 
            onClick={() => setShowForm(true)}
          >
            <Plus size={20} />
            {t.warrantyPage.addWarranty}
          </button>
        </div>

        {/* Warranty Grid */}
        <div className="warranty-grid">
          {/* Warranty Form Card */}
          {showForm && (
            <div className="warranty-form-card" data-theme={isDarkMode ? 'dark' : 'light'}>
              <div className="form-header">
                <h3 className="form-title">
                  {editingId ? t.warrantyPage.updateWarranty : t.warrantyPage.addWarranty}
                </h3>
                <button className="nav-button" onClick={resetForm}>
                  <X size={20} />
                </button>
                    </div>
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">{t.warrantyPage.warrantyName} *</label>
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
                  <label className="form-label">{t.warrantyPage.warrantyCategory} *</label>
                  <select
                    name="category"
                    className="form-select"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    disabled={loadingCategories}
                  >
                    <option value="">{loadingCategories ? t.warrantyPage.loadingCategories : t.warrantyPage.selectCategory}</option>
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
                      Object.entries(t.warrantyPage.categories).map(([key, value]) => (
                        <option key={key} value={key}>{value}</option>
                      ))
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{t.warrantyPage.expiryDate} *</label>
                  <input
                    type="date"
                    name="expiryDate"
                    className="form-input"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t.warrantyPage.remindBefore} *</label>
                  <select
                    name="remindBefore"
                    className="form-select"
                    value={formData.remindBefore}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">{t.warrantyPage.selectRemindBefore}</option>
                    <option value="1">1 day before</option>
                    <option value="3">3 days before</option>
                    <option value="7">1 week before</option>
                    <option value="14">2 weeks before</option>
                    <option value="30">1 month before</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{t.warrantyPage.warrantyImageOrFile} *</label>
                  <div className="file-upload">
                    <input
                      type="file"
                      id="warranty-file-input"
                      className="file-input"
                      accept="image/jpeg,image/jpg,image/png,image/gif,.pdf,.doc,.docx,.txt"
                      onChange={handleFileChange}
                      onClick={() => console.log('File input clicked')}
                      required
                    />
                    <label 
                      htmlFor="warranty-file-input"
                      className="file-label"
                      onClick={() => console.log('File label clicked')}
                    >
                      <Upload className="upload-icon" size={20} />
                      {formData.image ? (
                        <div className="file-selected">
                          <span className="file-name">{formData.image.name}</span>
                          <span className="file-size">({(formData.image.size / 1024).toFixed(1)} KB)</span>
                          <span className="file-type">{formData.image.type}</span>
                        </div>
                      ) : (
                        <div className="file-placeholder">
                          <span>{t.warrantyPage.dragDropText}</span>
                          <span className="required-hint">* {t.warrantyPage.required}</span>
                        </div>
                      )}
                    </label>
                    <button 
                      type="button" 
                      className="btn btn-outline file-select-btn"
                      onClick={() => document.getElementById('warranty-file-input').click()}
                      style={{ marginTop: '0.5rem', width: '100%' }}
                    >
                      <Upload size={16} />
                      Select File
                    </button>
                    </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={addingWarranty}>
                    {addingWarranty ? t.loading : (editingId ? t.warrantyPage.actions.save : t.warrantyPage.addWarranty)}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={resetForm}>
                    {t.warrantyPage.actions.cancel}
                  </button>
                    </div>
              </form>
                    </div>
          )}

          {/* Selected Warranty Image Card */}
          <div className="warranty-image-card" data-theme={isDarkMode ? 'dark' : 'light'}>
            <h3 className="form-title">
              {selectedWarranty ? (selectedWarranty.warrantyName || selectedWarranty.name) : t.warrantyPage.warrantyDetails}
            </h3>
            {selectedWarranty ? (
              <>
                {selectedWarranty.warrantyFile ? (
                  <div className="warranty-file-display">
                    {selectedWarranty.warrantyFile.contentType.startsWith('image/') ? (
                      <WarrantyImageDisplay 
                        warranty={selectedWarranty}
                        api={api}
                        t={t}
                      />
                    ) : (
                      <div className="warranty-file-info">
                        <Upload size={60} />
                        <div className="file-details">
                          <p className="file-name">{selectedWarranty.warrantyFile.originalName}</p>
                          <p className="file-size">{(selectedWarranty.warrantyFile.size / 1024).toFixed(1)} KB</p>
                          <p className="file-type">{selectedWarranty.warrantyFile.contentType}</p>
                          <p className="file-upload-date">Uploaded: {new Date(selectedWarranty.updatedAt || selectedWarranty.createdAt).toLocaleDateString()}</p>
                        </div>
                        <WarrantyFileDownload 
                          warranty={selectedWarranty}
                          api={api}
                          buttonText={t.warrantyPage.actions.downloadWarranty}
                          t={t}
                        />
                      </div>
                    )}
                  </div>
                ) : selectedWarranty.warrantyImage || selectedWarranty.image ? (
                  <img 
                    src={selectedWarranty.warrantyImage || URL.createObjectURL(selectedWarranty.image)} 
                    alt={selectedWarranty.warrantyName || selectedWarranty.name}
                    className="warranty-image"
                  />
                ) : (
                  <div className="warranty-image-placeholder">
                    <Upload size={60} />
                    <p>{t.warrantyPage.noWarranties}</p>
                    </div>
                )}
                <p className="image-category">
                  {t.warrantyPage.categories[selectedWarranty.warrantyCategory || selectedWarranty.category]}
                </p>
                <p className="image-category">
                  {t.warrantyPage.expiryDate}: {selectedWarranty.warrantyExpirationDate || selectedWarranty.expiryDate}
                </p>
                <p className="image-category">
                  {t.warrantyPage.remindBefore}: {selectedWarranty.warrantyRemindBefore || selectedWarranty.remindBefore || 'Not set'} days
                </p>
              </>
            ) : (
              <>
                <img 
                  src="https://primary.jwwb.nl/public/i/r/u/temp-xcncqovdihjtzrvndmka/y0ab5a/1-year-warranty-stamp-vector-9510433-1.jpg" 
                  alt="Warranty Example"
                  className="warranty-image"
                />
                <p className="image-category">{t.warrantyPage.categories.electronics}</p>
                <p className="image-category">{t.warrantyPage.expiryDate}: Select a warranty to view details</p>
              </>
            )}
          </div>

          {/* Warranties List Card */}
          <div className="warranty-list-card" data-theme={isDarkMode ? 'dark' : 'light'}>
            <div className="list-header">
              <h3 className="form-title">{t.warrantyPage.warrantiesList}</h3>
              <span className="list-count">{filteredWarranties.length}</span>
        </div>

            <ul className="warranty-list">
              {filteredWarranties.length > 0 ? (
                filteredWarranties.map(warranty => {
                  const isExpired = isWarrantyExpired(warranty);
                  return (
                    <li 
                      key={warranty._id || warranty.id} 
                      className={`warranty-item ${isExpired ? 'expired' : ''}`}
                      onClick={() => handleWarrantySelect(warranty)}
                    >
                      <div className="warranty-info">
                        <span className="warranty-name">{warranty.warrantyName || warranty.name}</span>
                        <span className="warranty-expiry">
                          Expires: {warranty.warrantyExpirationDate || warranty.expiryDate}
                          {isExpired && <span className="expired-badge">EXPIRED</span>}
                        </span>
                      </div>
                      <div className="warranty-actions">
                        <button 
                          className="action-btn edit-btn"
                          title={t.warrantyPage.actions.edit}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(warranty);
                          }}
                        >
                          <Edit className="edit-icon" size={14} />
                        </button>
                        <button 
                          className="action-btn delete-btn"
                          title={t.warrantyPage.actions.delete}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(warranty._id || warranty.id);
                          }}
                        >
                          <Trash2 className="delete-icon" size={14} />
                        </button>
                      </div>
                    </li>
                  );
                })
              ) : (
                <li className="warranty-item">
                  <span className="warranty-name">{t.warrantyPage.noWarranties}</span>
                </li>
              )}
          </ul>
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

export default WarrantyPage;
