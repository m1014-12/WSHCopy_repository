import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { translations } from '../translations/translations';
import '../css/Registration.css';
import ThemeLanguageToggles from '../components/ThemeLanguageToggles';

function Registration() {
  const [userName, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneValid, setPhoneValid] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordValidations, setPasswordValidations] = useState({
    minLength: false,
    maxLength: false,
    upperCase: false,
    lowerCase: false,
    number: false,
    specialChar: false
  });
  const navigate = useNavigate();
  
  // Use centralized theme and language context
  const { language, isDarkMode, toggleTheme, toggleLanguage } = useThemeLanguage();
  const t = translations[language];

  const validateFields = () => {
    const newErrors = {};
    if (userName.length > 20) {
      newErrors.userName = t.usernameMax;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t.emailValid;
    }
    if (!/^[97][0-9]{7}$/.test(phoneNumber)) {
      newErrors.phoneNumber = t.phoneValid;
    }
    if (!Object.values(passwordValidations).every(Boolean)) {
      newErrors.password = t.passwordInvalid;
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = t.passwordsNoMatch;
    }
    return newErrors;
  };

  // Real-time password validations
  useEffect(() => {
    setPasswordValidations({
      minLength: password.length >= 8,
      maxLength: password.length <= 20,
      upperCase: /[A-Z]/.test(password),
      lowerCase: /[a-z]/.test(password),
      number: /\d/.test(password),
      specialChar: /[\W_]/.test(password),
    });
    setErrors(validateFields());
  }, [password, confirmPassword, userName, email, phoneNumber, language]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fieldErrors = validateFields();
    setErrors(fieldErrors);

    if (Object.keys(fieldErrors).length > 0) return;

    if (!userName || !email || !password || !confirmPassword || !phoneNumber) {
      alert(t.fillAll);
      return;
    }

    try {
      const res = await axios.post("http://localhost:3001/userRegister", {
        userName: userName,
        email: email,
        password: password,
        confirmPassword: confirmPassword,
        phoneNumber: phoneNumber,
      });
      if (res.data.success) {
        alert(t.registrationDone);
        // Optionally store user data if you want to auto-login after registration
        // localStorage.setItem('userId', res.data.user.id);
        navigate("/login");
      } else {
        alert(res.data.message || t.registrationFailed);
      }
    } catch (err) {
      console.error("Registration error:", err);
      console.error("Error response:", err.response?.data);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || t.registrationFailed;
      alert(errorMessage);
    }
  };

  const handlePhoneInput = (e) => {
    const value = e.target.value;
    setPhoneNumber(value);
    setPhoneValid(/^[97][0-9]{7}$/.test(value));
  };

  return (
    <div className={`container${isDarkMode ? ' dark' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="header header-flex">
        <h1 className={isDarkMode ? 'dark' : ''}>{t.registration}</h1>
        <ThemeLanguageToggles />
      </div>
      <div className="login-form login-form-responsive fade-in">
        <form onSubmit={handleSubmit}>
          <div className={`form-group${errors.userName ? ' error' : userName ? ' valid' : ''}`}> 
            <label htmlFor="username" className={isDarkMode ? 'dark' : ''}>{t.username}</label>
            <input
              type="text"
              id="username"
              value={userName}
              onChange={(e) => setUsername(e.target.value)}
              required
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
            {errors.userName && <span className="error-text">{errors.userName}</span>}
          </div>
          <div className={`form-group${errors.email ? ' error' : email ? ' valid' : ''}`}> 
            <label htmlFor="email" className={isDarkMode ? 'dark' : ''}>{t.email}</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>
          <div className={`form-group${errors.phoneNumber ? ' error' : phoneValid ? ' valid' : ''}`}> 
            <label htmlFor="phoneNumber" className={isDarkMode ? 'dark' : ''}>{t.phoneNumber}</label>
            <input
              type="tel"
              id="phoneNumber"
              value={phoneNumber}
              onChange={handlePhoneInput}
              required
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
            {phoneNumber && (
              <span className={`phone-feedback ${phoneValid ? 'valid' : 'invalid'}`}>{phoneValid ? t.validPhone : t.invalidPhone}</span>
            )}
            {errors.phoneNumber && <span className="error-text">{errors.phoneNumber}</span>}
          </div>
          <div className={`form-group${errors.password ? ' error' : password ? ' valid' : ''}`}> 
            <label htmlFor="password" className={isDarkMode ? 'dark' : ''}>{t.password}</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            /> 
            <ul className="password-requirements">
              <li className={passwordValidations.minLength ? 'valid' : 'invalid'}>{t.atLeast8}</li>
              <li className={passwordValidations.maxLength ? 'valid' : 'invalid'}>{t.notMore20}</li>
              <li className={passwordValidations.upperCase ? 'valid' : 'invalid'}>{t.upper}</li>
              <li className={passwordValidations.lowerCase ? 'valid' : 'invalid'}>{t.lower}</li>
              <li className={passwordValidations.number ? 'valid' : 'invalid'}>{t.number}</li>
              <li className={passwordValidations.specialChar ? 'valid' : 'invalid'}>{t.special}</li>
            </ul>
            {/* {errors.password && <span className="error-text">{errors.password}</span>} */}
          </div>
          <div className={`form-group${errors.confirmPassword ? ' error' : confirmPassword ? ' valid' : ''}`}> 
            <label htmlFor="confirmPassword" className={isDarkMode ? 'dark' : ''}>{t.confirmPassword}</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
          </div>
          <button type="submit" className={`submit-button${isDarkMode ? ' dark' : ''}`}>{t.register}</button>
          <p className="login-link">{t.alreadyAccount} <a href="/login">{t.loginHere}</a></p>
        </form>
      </div>
    </div>
  );
}

export default Registration;

