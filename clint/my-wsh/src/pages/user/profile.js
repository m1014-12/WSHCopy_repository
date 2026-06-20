import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Edit, Save, X } from 'lucide-react';
import api from '../../utils/api';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { translations } from '../../translations/translations';
import '../../css/ProfilePage.css';
import UserHeader from '../../components/UserHeader';
import LiveChatButton from '../../components/LiveChatButton';
import Footer from '../../components/Footer';

function ProfilePage() {
  const navigate = useNavigate();
  
  // Theme and language context
  const { language, isDarkMode } = useThemeLanguage();
  const t = translations[language];

  // User data state
  const [userData, setUserData] = useState({
    userName: '',
    email: '',
    phoneNumber: ''
  });

  // Form state
  const [formData, setFormData] = useState({
    userName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: ''
  });

  // UI state
  const [editingField, setEditingField] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errors, setErrors] = useState({});
  const [phoneValid, setPhoneValid] = useState(false);

  // Password validation state
  const [passwordValidations, setPasswordValidations] = useState({
    minLength: false,
    maxLength: false,
    upperCase: false,
    lowerCase: false,
    number: false,
    specialChar: false
  });

  // Load user data from database
  useEffect(() => {
    loadUserProfile();
  }, []);

  // Password validation effect
  useEffect(() => {
    setPasswordValidations({
      minLength: formData.password.length >= 8,
      maxLength: formData.password.length <= 20,
      upperCase: /[A-Z]/.test(formData.password),
      lowerCase: /[a-z]/.test(formData.password),
      number: /\d/.test(formData.password),
      specialChar: /[\W_]/.test(formData.password),
    });
  }, [formData.password]);

  // Phone validation effect
  useEffect(() => {
    setPhoneValid(/^[97][0-9]{7}$/.test(formData.phoneNumber));
  }, [formData.phoneNumber]);

  const loadUserProfile = async () => {
    try {
      // Get user ID from localStorage or session
      const userId = localStorage.getItem('userId');
      if (!userId) {
        navigate('/login');
        return;
      }

      const response = await api.get(`/profile/${userId}`);
      if (response.data.success) {
        const user = response.data.user;
        setUserData({
          userName: user.userName || '',
          email: user.email || '',
          phoneNumber: user.phoneNumber || ''
        });
        setFormData({
          userName: user.userName || '',
          email: user.email || '',
          password: '',
          confirmPassword: '',
          phoneNumber: user.phoneNumber || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      alert('Error loading profile. Please try again.');
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const validateFields = () => {
    const newErrors = {};
    
    // Only validate phone number and password since username and email are read-only
    if (!/^[97][0-9]{7}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = t.phoneValid;
    }
    
    if (formData.password && !Object.values(passwordValidations).every(Boolean)) {
      newErrors.password = t.passwordInvalid;
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t.passwordsNoMatch;
    }
    
    return newErrors;
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };


  const startEditing = (field) => {
    setEditingField(field);
    setErrors({});
  };

  const cancelEditing = () => {
    setEditingField(null);
    setFormData({
      userName: userData.userName,
      email: userData.email,
      password: '',
      confirmPassword: '',
      phoneNumber: userData.phoneNumber
    });
    setErrors({});
  };

  const handleUpdate = async () => {
    const fieldErrors = validateFields();
    setErrors(fieldErrors);

    if (Object.keys(fieldErrors).length > 0) return;

    setIsUpdating(true);
    try {
      const userId = localStorage.getItem('userId');
      const updateData = {
        // Only include phone number since username and email are read-only
        phoneNumber: formData.phoneNumber
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await api.put(`/profile/${userId}`, updateData);
      
      if (response.data.success) {
        // Only update phone number in userData since username and email are read-only
        setUserData(prev => ({
          ...prev,
          phoneNumber: formData.phoneNumber
        }));
        setEditingField(null);
        setFormData(prev => ({
          ...prev,
          password: '',
          confirmPassword: ''
        }));
        alert(t.profileUpdated);
      } else {
        alert(response.data.message || t.profileUpdateFailed);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(t.profileUpdateFailed);
    } finally {
      setIsUpdating(false);
    }
  };


  const renderField = (fieldName, label, type = 'text', showPasswordToggle = false) => {
    const isEditing = editingField === fieldName;
    const isPassword = type === 'password';
    const isConfirmPassword = fieldName === 'confirmPassword';
    const isReadOnly = fieldName === 'userName' || fieldName === 'email';
    
    return (
      <div className={`profile-field ${isDarkMode ? 'dark' : ''}`}>
        <label className={`field-label ${isDarkMode ? 'dark' : ''}`} htmlFor={fieldName}>
          {label}
          {isReadOnly && <span className="read-only-indicator"> ({t.readOnly})</span>}
        </label>
        <div className={`field-container ${isDarkMode ? 'dark' : ''} ${errors[fieldName] ? 'error' : ''} ${isReadOnly ? 'read-only' : ''}`}>
          <input
            type={isPassword && showPasswordToggle ? (showPassword ? 'text' : 'password') : type}
            id={fieldName}
            className={`field-input ${isDarkMode ? 'dark' : ''} ${isReadOnly ? 'read-only' : ''}`}
            value={formData[fieldName]}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            readOnly={!isEditing || isReadOnly}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          />
          
          {isPassword && showPasswordToggle && (
            <button
              type="button"
              className="nav-icon"
              onClick={() => isConfirmPassword ? setShowConfirmPassword(!showConfirmPassword) : setShowPassword(!showPassword)}
            >
              {isConfirmPassword ? (showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />) : (showPassword ? <EyeOff size={16} /> : <Eye size={16} />)}
            </button>
          )}
          
          {!isReadOnly && (
            <>
              {isEditing ? (
                <>
                  <button
                    type="button"
                    className="field-icon"
                    data-icon="save"
                    onClick={handleUpdate}
                    disabled={isUpdating}
                  >
                    <Save size={16} />
                  </button>
                  <button
                    type="button"
                    className="field-icon"
                    data-icon="cancel"
                    onClick={cancelEditing}
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="field-icon"
                  data-icon="edit"
                  onClick={() => startEditing(fieldName)}
                >
                  <Edit size={16} />
                </button>
              )}
            </>
          )}
        </div>
        
        {errors[fieldName] && <span className="error-text">{errors[fieldName]}</span>}
        
        {fieldName === 'phoneNumber' && formData.phoneNumber && (
          <span className={`phone-feedback ${phoneValid ? 'valid' : 'invalid'}`}>
            {phoneValid ? t.validPhone : t.invalidPhone}
          </span>
        )}
        
        {fieldName === 'password' && formData.password && (
          <ul className="password-requirements">
            <li className={passwordValidations.minLength ? 'valid' : 'invalid'}>{t.atLeast8}</li>
            <li className={passwordValidations.maxLength ? 'valid' : 'invalid'}>{t.notMore20}</li>
            <li className={passwordValidations.upperCase ? 'valid' : 'invalid'}>{t.upper}</li>
            <li className={passwordValidations.lowerCase ? 'valid' : 'invalid'}>{t.lower}</li>
            <li className={passwordValidations.number ? 'valid' : 'invalid'}>{t.number}</li>
            <li className={passwordValidations.specialChar ? 'valid' : 'invalid'}>{t.special}</li>
          </ul>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={`profile-container ${isDarkMode ? 'dark' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="loading-spinner"></div>
        <p>{t.loadingProfile}</p>
      </div>
    );
  }

  return (
    <div className={`profile-container ${isDarkMode ? 'dark' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <UserHeader />

      {/* Profile Content */}
      <div className={`profile-content ${isDarkMode ? 'dark' : ''} fade-in`}>
        <h1 className={`profile-title ${isDarkMode ? 'dark' : ''}`}>
          {t.profileTitle}
        </h1>

        {renderField('userName', t.username)}
        {renderField('email', t.email, 'email')}
        {renderField('password', t.password, 'password', true)}
        {renderField('confirmPassword', t.confirmPassword, 'password', true)}
        {renderField('phoneNumber', t.phoneNumber, 'tel')}

        {editingField && (
          <button 
            className={`update-button ${isDarkMode ? 'dark' : ''}`}
            onClick={handleUpdate}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <div className="loading-spinner"></div>
            ) : (
              t.saveChanges
            )}
          </button>
        )}
      </div>

      {/* Live Chat Button */}
      <LiveChatButton />
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

export default ProfilePage;