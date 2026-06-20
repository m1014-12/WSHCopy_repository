import React, { useState, useEffect } from 'react';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { translations } from '../../translations/translations';
import AdminHeader from '../../components/AdminHeader';
import LiveChatButton from '../../components/LiveChatButton';
import { categoryApi } from '../../utils/adminApi';
import '../../css/CategoryManagePage.css';

function CategoryManagementPage() {
  const { isDarkMode, language } = useThemeLanguage();
  const t = translations[language];

  // State for categories
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: '', category: '', parentId: '', description: '' });
  const [editingCategory, setEditingCategory] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [parentCategories, setParentCategories] = useState([]);
  const [loadingParents, setLoadingParents] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Load categories from API
  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const response = await categoryApi.getCategories();
      if (response.success) {
        setCategories(response.categories);
      } else {
        setMessage({ type: 'error', text: t.categoryManagement.failedToLoadCategories });
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setMessage({ type: 'error', text: t.categoryManagement.errorLoadingCategories });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(categories.length / itemsPerPage));
    setCurrentPage(prev => Math.min(prev, totalPages));
  }, [categories, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(categories.length / itemsPerPage));
  const indexOfLastCategory = currentPage * itemsPerPage;
  const indexOfFirstCategory = indexOfLastCategory - itemsPerPage;
  const currentCategories = categories.slice(indexOfFirstCategory, indexOfLastCategory);



  // Load parent categories when category type changes
  const loadParentCategories = async (categoryType) => {
    if (!categoryType) {
      setParentCategories([]);
      return;
    }
    
    try {
      setLoadingParents(true);
      const response = await categoryApi.getParentCategories(categoryType);
      if (response.success) {
        setParentCategories(response.categories);
      } else {
        setParentCategories([]);
      }
    } catch (error) {
      console.error('Error loading parent categories:', error);
      setParentCategories([]);
    } finally {
      setLoadingParents(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCategory(prev => ({
      ...prev,
      [name]: value
    }));
    
    // When category type changes, load parent categories
    if (name === 'category') {
      loadParentCategories(value);
      setNewCategory(prev => ({ ...prev, parentId: '' })); // Reset parent selection
    }
  };

  // Handle adding new category
  const handleAddCategory = async () => {
    if (!newCategory.name || !newCategory.category || !newCategory.description) {
      setMessage({ type: 'error', text: t.categoryManagement.fillRequiredFields });
      return;
    }

    try {
      setIsLoading(true);
      // Prepare data - only include parentId if it's not empty
      const categoryData = {
      name: newCategory.name,
        category: newCategory.category,
        description: newCategory.description
      };
      if (newCategory.parentId) {
        categoryData.parentId = newCategory.parentId;
      }
      
      const response = await categoryApi.addCategory(categoryData);
      if (response.success) {
        setMessage({ type: 'success', text: response.message || t.categoryManagement.categoryAdded });
        setNewCategory({ name: '', category: '', parentId: '', description: '' });
        setParentCategories([]);
        // Reload categories to get the updated list
        await loadCategories();
      } else {
        setMessage({ type: 'error', text: response.message || t.categoryManagement.failedToAddCategory });
      }
    } catch (error) {
      console.error('Error adding category:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || t.categoryManagement.errorAddingCategory });
    } finally {
      setIsLoading(false);
    // Clear message after 3 seconds
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  // Handle editing category
  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      category: category.category,
      parentId: category.parentId || '',
      description: category.description || ''
    });
    // Load parent categories for this category type
    if (category.category) {
      loadParentCategories(category.category);
    }
  };

  // Handle saving edited category
  const handleSaveEdit = async () => {
    if (!newCategory.name || !newCategory.category || !newCategory.description) {
      setMessage({ type: 'error', text: t.categoryManagement.fillRequiredFields });
      return;
    }

    try {
      setIsLoading(true);
      // Prepare update data
      const updateData = {
        name: newCategory.name,
        category: newCategory.category,
        description: newCategory.description
      };
      // Include parentId only if it's provided (can be empty string to make it a root category)
      if (newCategory.parentId !== undefined) {
        updateData.parentId = newCategory.parentId || null;
      }
      
      const response = await categoryApi.updateCategory(editingCategory.id, updateData);
      if (response.success) {
        setMessage({ type: 'success', text: t.categoryManagement.categoryUpdated });
    setEditingCategory(null);
        setNewCategory({ name: '', category: '', parentId: '', description: '' });
        setParentCategories([]);
        // Reload categories to get the updated list
        await loadCategories();
      } else {
        setMessage({ type: 'error', text: response.message || t.categoryManagement.failedToUpdateCategory });
      }
    } catch (error) {
      console.error('Error updating category:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || t.categoryManagement.errorUpdatingCategory });
    } finally {
      setIsLoading(false);
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  // Handle canceling edit
  const handleCancelEdit = () => {
    setEditingCategory(null);
    setNewCategory({ name: '', category: '', parentId: '', description: '' });
    setParentCategories([]);
  };

  // Handle deleting category
  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm(t.categoryManagement.confirmDelete)) {
      try {
        setIsLoading(true);
        const response = await categoryApi.deleteCategory(categoryId);
        if (response.success) {
      setMessage({ type: 'success', text: t.categoryManagement.categoryDeleted });
          // Reload categories to get the updated list
          await loadCategories();
        } else {
          setMessage({ type: 'error', text: response.message || t.categoryManagement.failedToDeleteCategory });
        }
      } catch (error) {
        console.error('Error deleting category:', error);
        setMessage({ type: 'error', text: error.response?.data?.message || t.categoryManagement.errorDeletingCategory });
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
          <h2 className="category-title">{t.categoryManagement.title}</h2>

          {/* Message Display */}
          {message.text && (
            <div className={`message ${message.type}-message`}>
              {message.text}
            </div>
          )}

          {/* Add New Category Section */}
          <div className="category-section">
            <h3 className="section-title">
              {editingCategory ? t.categoryManagement.editCategory : t.categoryManagement.addNewCategory}
            </h3>
            <div className="add-category-form">
              <div className="form-group">
                <label className="form-label">{t.categoryManagement.categoryName}:</label>
                <input
                  type="text"
                  className="form-input"
                  name="name"
                  value={newCategory.name}
                  onChange={handleInputChange}
                  placeholder={t.categoryManagement.categoryName}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t.categoryManagement.categoryType}:</label>
                <select
                  className="form-select"
                  name="category"
                  value={newCategory.category}
                  onChange={handleInputChange}
                >
                  <option value="">{t.categoryManagement.categoryType}</option>
                  <option value="warranty">{t.categoryManagement.categories.warranty}</option>
                  <option value="subscription">{t.categoryManagement.categories.subscription}</option>
                  <option value="homeTask">{t.categoryManagement.categories.homeTask}</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t.categoryManagement.parentCategory}</label>
                <select
                  className="form-select"
                  name="parentId"
                  value={newCategory.parentId}
                  onChange={handleInputChange}
                  disabled={!newCategory.category || loadingParents}
                >
                  <option value="">
                    {!newCategory.category ? t.categoryManagement.selectCategoryTypeFirst : 
                     loadingParents ? t.loading : 
                     t.categoryManagement.noneRootCategory}
                  </option>
                  {parentCategories.map(parent => (
                    <option key={parent.id} value={parent.id}>
                      {parent.name}
                    </option>
                  ))}
                </select>
                <small style={{ color: 'var(--secondary-text, #666)', fontSize: '0.85rem' }}>
                  {t.categoryManagement.parentCategoryHelp}
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">{t.categoryManagement.description}</label>
                <textarea
                  className="form-input"
                  name="description"
                  value={newCategory.description}
                  onChange={handleInputChange}
                  placeholder={t.categoryManagement.descriptionPlaceholder}
                  rows="3"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">&nbsp;</label>
                {editingCategory ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="add-btn" onClick={handleSaveEdit}>
                      {t.categoryManagement.saveChanges}
                    </button>
                    <button className="action-btn" onClick={handleCancelEdit}>
                      {t.categoryManagement.cancel}
                    </button>
                  </div>
                ) : (
                  <button className="add-btn" onClick={handleAddCategory}>
                    {t.categoryManagement.addCategory}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Existing Categories List */}
          <div className="category-section">
            <h3 className="section-title">{t.categoryManagement.existingCategories}</h3>
            {isLoading ? (
              <div className="loading">{t.categoryManagement.loadingCategories}</div>
            ) : categories.length === 0 ? (
              <p>{t.categoryManagement.noCategories}</p>
            ) : (
              <>
                <div className="category-pagination-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <label htmlFor="itemsPerPage" style={{ marginRight: '0.5rem' }}>{t.categoryManagement.itemsPerPage}:</label>
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
                      {t.categoryManagement.previous}
                    </button>
                    <span style={{ fontSize: '0.95rem' }}>
                      {t.categoryManagement.pageLabel} {currentPage} {t.categoryManagement.of} {totalPages}
                    </span>
                    <button
                      className="action-btn"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      {t.categoryManagement.next}
                    </button>
                  </div>
                </div>

                <ul className="categories-list">
                {currentCategories.map(category => (
                  <li key={category.id} className="category-item">
                    <div className="category-info">
                      <span className="category-name">
                        {category.parentName && '↳ '}
                        {category.name}
                      </span>
                      <span className="category-type">
                        {t.categoryManagement.categories[category.category]}
                        {category.parentName && ` → ${category.parentName}`}
                      </span>
                      {category.description && (
                        <span className="category-description">{category.description}</span>
                      )}
                    </div>
                    <div className="category-actions">
                      <button 
                        className="action-btn edit-btn"
                        onClick={() => handleEditCategory(category)}
                        disabled={isLoading}
                      >
                        {t.edit}
                      </button>
                      <button 
                        className="action-btn delete-btn"
                        onClick={() => handleDeleteCategory(category.id)}
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

export default CategoryManagementPage;