import React, { useState, useEffect } from 'react';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { translations } from '../../translations/translations';
import AdminHeader from '../../components/AdminHeader';
import { adminManagementApi } from '../../utils/adminApi';
import '../../css/ManageAdminPage.css';

function ManageAdminPage() {
  const { isDarkMode, language } = useThemeLanguage();
  const t = translations[language];

  // Admin data from API
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    accessName: '',
    password: '',
    adminKey: '',
    adminName: ''
  });

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [currentAdmin] = useState(localStorage.getItem('adminAccessName') || 'Main Admin'); // Current admin using the system

  // Check super admin access and fetch admins on component mount
  useEffect(() => {
    // Check if current admin is super admin
    const currentAdminAccessName = localStorage.getItem('adminAccessName');
    if (currentAdminAccessName !== 'admin') {
      setError(t.adminManagement.accessDenied);
      setLoading(false);
      return;
    }
    
    fetchAdmins();
  }, []);

  // Fetch admins from API
  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminManagementApi.getAdmins();
      if (response.success) {
        setAdmins(response.admins);
      } else {
        setError(response.message || t.adminManagement.failedToFetchAdmins);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
      setError(error.message || t.adminManagement.failedToFetchAdmins);
    } finally {
      setLoading(false);
    }
  };

  // Filtered admins based on search
  const filteredAdmins = admins.filter(admin =>
    admin.accessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (admin.adminName && admin.adminName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.accessName || !formData.password || !formData.adminKey) {
      alert(t.adminManagement.fillRequiredFields);
      return;
    }

    try {
      if (editingId) {
        // Update existing admin
        const response = await adminManagementApi.updateAdmin(editingId, formData);
        if (response.success) {
          alert(t.adminManagement.adminUpdated);
          await fetchAdmins(); // Refresh the list
          // Log admin action
          try {
            const actions = JSON.parse(localStorage.getItem('adminRecentActions') || '[]');
            actions.unshift({
              type: 'admin',
              text: `${t.adminManagement.updatedAdmin}: ${formData.adminName || formData.accessName}`,
              timestamp: new Date().toISOString()
            });
            localStorage.setItem('adminRecentActions', JSON.stringify(actions.slice(0, 50)));
          } catch (_) {}
        } else {
          alert(response.message || t.adminManagement.failedToUpdateAdmin);
        }
      } else {
        // Add new admin
        const response = await adminManagementApi.addAdmin(formData);
        if (response.success) {
          alert(t.adminManagement.adminAdded);
          await fetchAdmins(); // Refresh the list
          // Log admin action
          try {
            const actions = JSON.parse(localStorage.getItem('adminRecentActions') || '[]');
            actions.unshift({
              type: 'admin',
              text: `${t.adminManagement.addedAdmin}: ${formData.adminName || formData.accessName}`,
              timestamp: new Date().toISOString()
            });
            localStorage.setItem('adminRecentActions', JSON.stringify(actions.slice(0, 50)));
          } catch (_) {}
        } else {
          alert(response.message || t.adminManagement.failedToAddAdmin);
        }
      }

      // Reset form
      setFormData({
        accessName: '',
        password: '',
        adminKey: '',
        adminName: ''
      });
      setEditingId(null);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(error.message || t.adminManagement.errorOccurred);
    }
  };

  // Handle edit admin
  const handleEdit = (admin) => {
    setFormData({
      accessName: admin.accessName,
      password: admin.password,
      adminKey: admin.adminKey,
      adminName: admin.adminName
    });
    setEditingId(admin.id);
  };

  // Handle delete admin
  const handleDelete = async (adminId) => {
    // Check if trying to delete super admin
    const adminToDelete = admins.find(admin => admin.id === adminId);
    if (adminToDelete && adminToDelete.accessName === 'admin') {
      alert(t.adminManagement.cannotDeleteSuperAdmin);
      return;
    }

    if (window.confirm(t.adminManagement.confirmDeleteAdmin)) {
      try {
        const response = await adminManagementApi.deleteAdmin(adminId);
        if (response.success) {
          alert(t.adminManagement.adminDeleted);
          await fetchAdmins(); // Refresh the list
          // Log admin action
          try {
            const deleted = admins.find(a => a.id === adminId);
            const actions = JSON.parse(localStorage.getItem('adminRecentActions') || '[]');
            actions.unshift({
              type: 'admin',
              text: `${t.adminManagement.deletedAdmin}: ${deleted?.adminName || deleted?.accessName || adminId}`,
              timestamp: new Date().toISOString()
            });
            localStorage.setItem('adminRecentActions', JSON.stringify(actions.slice(0, 50)));
          } catch (_) {}
        } else {
          alert(response.message || t.adminManagement.failedToDeleteAdmin);
        }
      } catch (error) {
        console.error('Error deleting admin:', error);
        alert(error.message || t.adminManagement.failedToDeleteAdmin);
      }
    }
  };



  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Toggle admin key visibility
  const toggleAdminKeyVisibility = () => {
    setShowAdminKey(!showAdminKey);
  };

  // Cancel edit
  const cancelEdit = () => {
    setFormData({
      accessName: '',
      password: '',
      adminKey: '',
      adminName: ''
    });
    setEditingId(null);
  };

  // Get admin initials for avatar
  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="manage-admin-container">
      <AdminHeader />

      {/* Main Content */}
      <main className="manage-admin-main">
        <h1 className="page-title">{t.adminManagement.title}</h1>

        {/* Admin Management Form Section */}
        <div className="admin-form-section">
          <h3 className="form-title">
            {editingId ? t.edit : t.adminManagement.addNewAdmin}
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t.adminManagement.adminName}</label>
                <input
                  type="text"
                  name="adminName"
                  value={formData.adminName}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder={t.adminManagement.adminName}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t.adminManagement.accessName}</label>
                <input
                  type="text"
                  name="accessName"
                  value={formData.accessName}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder={t.adminManagement.accessName}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t.adminManagement.password}</label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="password-input"
                    placeholder={t.adminManagement.password}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="password-toggle"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t.adminManagement.adminKey}</label>
                <div className="password-input-container">
                  <input
                    type={showAdminKey ? 'text' : 'password'}
                    name="adminKey"
                    value={formData.adminKey}
                    onChange={handleInputChange}
                    className="password-input"
                    placeholder={t.adminManagement.adminKey}
                  />
                  <button
                    type="button"
                    onClick={toggleAdminKeyVisibility}
                    className="password-toggle"
                  >
                    {showAdminKey ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
            </div>

            <div className="btn-group">
              {editingId ? (
                <>
                  <button type="submit" className="btn btn-primary">
                    ✅ {t.adminManagement.update}
                  </button>
                  <button type="button" onClick={cancelEdit} className="btn btn-secondary">
                    ❌ {t.cancel}
                  </button>
                </>
              ) : (
                <button type="submit" className="btn btn-primary">
                  ➕ {t.adminManagement.add}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Search Section */}
        <div className="search-section">
          <h3 className="form-title">{t.adminManagement.searchAdmin}</h3>
          
          <div className="search-container">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              placeholder={t.adminManagement.searchByAccessName}
            />
          </div>
        </div>

        {/* Admins Table */}
        <div className="admins-table-container">
          {loading ? (
            <div className="empty-state">
              <div className="empty-state-icon">⏳</div>
              <p>{t.adminManagement.loadingAdmins}</p>
            </div>
          ) : error ? (
            <div className="empty-state">
              <div className="empty-state-icon">❌</div>
              <p>{error}</p>
              <button onClick={fetchAdmins} className="btn btn-primary">
                🔄 Retry
              </button>
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <p>{searchTerm ? t.adminManagement.noAdminsFound : 'No admins found'}</p>
            </div>
          ) : (
            <table className="admins-table">
              <thead>
                <tr>
                  <th>{t.adminManagement.adminName}</th>
                  <th>{t.adminManagement.accessName}</th>
                  <th>{t.adminManagement.password}</th>
                  <th>{t.adminManagement.adminKey}</th>
                  <th>{t.adminManagement.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.map(admin => (
                  <tr key={admin.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="admin-avatar">
                          {getInitials(admin.adminName || admin.accessName)}
                        </div>
                        <span>{admin.adminName || admin.accessName}</span>
                      </div>
                    </td>
                    <td>{admin.accessName}</td>
                    <td>••••••••</td>
                    <td>••••••••</td>
                    <td>
                      <div className="table-actions">
                        <button
                          onClick={() => handleEdit(admin)}
                          className="btn btn-secondary btn-sm"
                        >
                          ✏️ {t.edit}
                        </button>
                        <button
                          onClick={() => handleDelete(admin.id)}
                          className={`btn btn-sm ${admin.accessName === 'admin' ? 'btn-disabled' : 'btn-danger'}`}
                          disabled={admin.accessName === 'admin'}
                          title={admin.accessName === 'admin' ? t.adminManagement.cannotDeleteSuperAdmin : ''}
                        >
                          🗑️ {t.delete}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
  </div>
  );
}

export default ManageAdminPage;