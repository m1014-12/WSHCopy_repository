import React, { useState, useEffect } from 'react';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { translations } from '../../translations/translations';
import AdminHeader from '../../components/AdminHeader';
import '../../css/ManageUsersPage.css';
import axios from 'axios';

function ManageUsersPage() {
  const { language, isDarkMode } = useThemeLanguage();
  const t = translations[language];

  // State for users
  const [users, setUsers] = useState([]);
  const API_URL = 'http://localhost:3001';

  const [filteredUsers, setFilteredUsers] = useState(users);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(5);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    status: 'active'
  });
  const [editFormErrors, setEditFormErrors] = useState({});

  // Load users from server
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/admin/users`);
      if (response.data.success) {
        setUsers(response.data.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search users
  useEffect(() => {
    let filtered = users;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phoneNumber.includes(searchTerm)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [users, searchTerm, statusFilter]);

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);



  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditFormData({
      username: user.username || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      status: user.status || 'active'
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (editFormErrors[name]) {
      setEditFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateEditForm = () => {
    const errors = {};

    // Username validation
    if (!editFormData.username.trim()) {
      errors.username = t.userManagement.usernameRequired;
    } else if (editFormData.username.length > 20) {
      errors.username = t.userManagement.usernameMaxLength;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!editFormData.email.trim()) {
      errors.email = t.userManagement.emailRequired;
    } else if (!emailRegex.test(editFormData.email)) {
      errors.email = t.userManagement.emailInvalid;
    }

    // Phone number validation
    const phoneRegex = /^[97][0-9]{7}$/;
    if (!editFormData.phoneNumber.trim()) {
      errors.phoneNumber = t.userManagement.phoneRequired;
    } else if (!phoneRegex.test(editFormData.phoneNumber)) {
      errors.phoneNumber = t.userManagement.phoneInvalid;
    }

    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    if (!validateEditForm()) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.put(`${API_URL}/admin/users/${editingUser.id}`, {
        userName: editFormData.username,
        email: editFormData.email,
        phoneNumber: editFormData.phoneNumber,
        status: editFormData.status
      });
      if (response.data.success) {
        alert(t.userManagement.userUpdated || 'User updated successfully');
        loadUsers(); // Reload the list
        setEditingUser(null);
        setEditFormErrors({});
        // Log admin action
        try {
          const actions = JSON.parse(localStorage.getItem('adminRecentActions') || '[]');
          actions.unshift({
            type: 'admin',
            text: `${t.userManagement.updatedUser}: ${editFormData.username}`,
            timestamp: new Date().toISOString()
          });
          localStorage.setItem('adminRecentActions', JSON.stringify(actions.slice(0, 50)));
        } catch (_) {}
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert(t.userManagement.errorUpdatingUser);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditFormData({
      username: '',
      email: '',
      phoneNumber: '',
      status: 'active'
    });
    setEditFormErrors({});
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm(t.userManagement.confirmDeleteUser)) {
      try {
        setLoading(true);
        const response = await axios.delete(`${API_URL}/admin/users/${userId}`);
        if (response.data.success) {
          alert(t.userManagement.userDeleted || 'User deleted successfully');
          loadUsers(); // Reload the list
        // Log admin action
        try {
          const deleted = users.find(u => u.id === userId);
          const actions = JSON.parse(localStorage.getItem('adminRecentActions') || '[]');
          actions.unshift({
            type: 'admin',
            text: `${t.userManagement.deletedUser}: ${deleted?.username || userId}`,
            timestamp: new Date().toISOString()
          });
          localStorage.setItem('adminRecentActions', JSON.stringify(actions.slice(0, 50)));
        } catch (_) {}
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert(t.userManagement.errorDeletingUser);
      } finally {
        setLoading(false);
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-OM' : 'en-US');
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="manage-users-container">
      <AdminHeader />

      {/* Main Content */}
      <main className="manage-users-main">
        <h1 className="page-title">{t.userManagement.title}</h1>

        {/* Search and Filter Section */}
        <div className="search-filter-section">
          <div className="search-filter-row">
            <input
              type="text"
              className="search-input"
              placeholder={t.userManagement.searchUsers}
              value={searchTerm}
              onChange={handleSearch}
            />
            <select
              className="filter-select"
              value={statusFilter}
              onChange={handleStatusFilter}
            >
              <option value="all">{t.userManagement.allUsers}</option>
              <option value="active">{t.userManagement.activeUsers}</option>
              <option value="inactive">{t.userManagement.inactiveUsers}</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="users-table-container">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
            </div>
          ) : currentUsers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <p>{t.userManagement.noUsersFound}</p>
            </div>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>{t.userManagement.user}</th>
                  <th>{t.userManagement.email}</th>
                  <th>{t.userManagement.phoneNumber}</th>
                  <th>{t.userManagement.status}</th>
                  <th>{t.userManagement.registrationDate}</th>
                  <th>{t.userManagement.actions}</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="user-avatar">
                          {getInitials(user.username)}
                        </div>
                        <span>{user.username}</span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>{user.phoneNumber}</td>
                    <td>
                      <span className={`user-status ${user.status}`}>
                        {user.status === 'active' ? t.userManagement.active : t.userManagement.inactive}
                      </span>
                    </td>
                    <td>{formatDate(user.registrationDate)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="action-btn edit-btn"
                          onClick={() => handleEditUser(user)}
                        >
                          {t.userManagement.edit}
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          {t.userManagement.delete}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {filteredUsers.length > usersPerPage && (
          <div className="pagination-container">
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              {t.userManagement.previous}
            </button>
            
            <span>
              {t.userManagement.showing} {indexOfFirstUser + 1}-{Math.min(indexOfLastUser, filteredUsers.length)} {t.userManagement.of} {filteredUsers.length} {t.userManagement.results}
            </span>
            
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              {t.userManagement.next}
            </button>
          </div>
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <div className="edit-modal-overlay" onClick={handleCancelEdit}>
            <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
              <div className="edit-modal-header">
                <h2>{t.userManagement.editUserModal}</h2>
                <button 
                  className="close-btn" 
                  onClick={handleCancelEdit}
                  type="button"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleUpdateUser} className="edit-form">
                <div className="form-group">
                  <label htmlFor="username">{t.userManagement.username}:</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={editFormData.username}
                    onChange={handleEditFormChange}
                    required
                    className={`form-input ${editFormErrors.username ? 'error' : ''}`}
                  />
                  {editFormErrors.username && (
                    <span className="error-message">{editFormErrors.username}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="email">{t.userManagement.email}:</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={editFormData.email}
                    onChange={handleEditFormChange}
                    required
                    className={`form-input ${editFormErrors.email ? 'error' : ''}`}
                  />
                  {editFormErrors.email && (
                    <span className="error-message">{editFormErrors.email}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="phoneNumber">{t.userManagement.phoneNumber}:</label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={editFormData.phoneNumber}
                    onChange={handleEditFormChange}
                    required
                    className={`form-input ${editFormErrors.phoneNumber ? 'error' : ''}`}
                  />
                  {editFormErrors.phoneNumber && (
                    <span className="error-message">{editFormErrors.phoneNumber}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="status">{t.userManagement.status}:</label>
                  <select
                    id="status"
                    name="status"
                    value={editFormData.status}
                    onChange={handleEditFormChange}
                    className="form-select"
                  >
                    <option value="active">{t.userManagement.active}</option>
                    <option value="inactive">{t.userManagement.inactive}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>{t.userManagement.registrationDate}:</label>
                  <input
                    type="text"
                    value={formatDate(editingUser.registrationDate)}
                    disabled
                    className="form-input disabled"
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    onClick={handleCancelEdit}
                    className="btn btn-cancel"
                  >
                    {t.userManagement.cancel}
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-save"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : t.userManagement.saveChanges}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
  </div>
  );
}

export default ManageUsersPage;