import { translations } from '../translations';

/**
 * Get nested value from object using dot notation
 * @param {Object} obj - The object to search in
 * @param {string} path - The path to the value (e.g., 'homePage.title')
 * @returns {string|Object|undefined} - The value at the path or undefined
 */
export const getNestedValue = (obj, path) => {
  if (!obj || !path) return undefined;
  
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
};

/**
 * Translation function with parameter interpolation
 * @param {string} key - Translation key (supports dot notation)
 * @param {string} language - Language code (e.g., 'en', 'ar')
 * @param {Object} params - Parameters to interpolate (e.g., {name: 'John'})
 * @returns {string} - Translated text with interpolated parameters
 */
export const t = (key, language = 'en', params = {}) => {
  const translation = getNestedValue(translations[language], key);
  
  if (!translation) {
    console.warn(`Translation missing for key: ${key} in language: ${language}`);
    return key; // Return the key as fallback
  }
  
  // If translation is an object, return the key (this shouldn't happen in normal usage)
  if (typeof translation !== 'string') {
    console.warn(`Translation key "${key}" points to an object, not a string`);
    return key;
  }
  
  // Simple parameter replacement using {{param}} syntax
  let result = translation;
  Object.keys(params).forEach(param => {
    const placeholder = `{{${param}}}`;
    result = result.replace(new RegExp(placeholder, 'g'), params[param]);
  });
  
  return result;
};

/**
 * Get all keys from a nested object
 * @param {Object} obj - The object to extract keys from
 * @param {string} prefix - Current prefix for nested keys
 * @returns {Array} - Array of all keys in dot notation
 */
export const getKeys = (obj, prefix = '') => {
  let keys = [];
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        keys = keys.concat(getKeys(obj[key], fullKey));
      } else {
        keys.push(fullKey);
      }
    }
  }
  
  return keys;
};

/**
 * Validate that all translation keys exist in all languages
 * @param {Array} languages - Array of language codes to validate
 * @returns {Object} - Validation results
 */
export const validateTranslations = (languages = ['en', 'ar']) => {
  const results = {
    isValid: true,
    missingKeys: {},
    extraKeys: {},
    errors: []
  };
  
  // Get keys from the first language as reference
  const referenceLanguage = languages[0];
  const referenceKeys = getKeys(translations[referenceLanguage]);
  
  // Check each language
  languages.forEach(lang => {
    if (!translations[lang]) {
      results.errors.push(`Language "${lang}" not found in translations`);
      results.isValid = false;
      return;
    }
    
    const langKeys = getKeys(translations[lang]);
    
    // Find missing keys
    const missing = referenceKeys.filter(key => !langKeys.includes(key));
    if (missing.length > 0) {
      results.missingKeys[lang] = missing;
      results.isValid = false;
    }
    
    // Find extra keys
    const extra = langKeys.filter(key => !referenceKeys.includes(key));
    if (extra.length > 0) {
      results.extraKeys[lang] = extra;
    }
  });
  
  return results;
};

/**
 * Get translation statistics
 * @returns {Object} - Statistics about translations
 */
export const getTranslationStats = () => {
  const stats = {};
  
  Object.keys(translations).forEach(lang => {
    const keys = getKeys(translations[lang]);
    stats[lang] = {
      totalKeys: keys.length,
      stringKeys: keys.filter(key => typeof getNestedValue(translations[lang], key) === 'string').length,
      objectKeys: keys.filter(key => typeof getNestedValue(translations[lang], key) === 'object').length
    };
  });
  
  return stats;
};

/**
 * Check if a translation key exists
 * @param {string} key - Translation key to check
 * @param {string} language - Language code
 * @returns {boolean} - Whether the key exists
 */
export const hasTranslation = (key, language = 'en') => {
  return getNestedValue(translations[language], key) !== undefined;
};

/**
 * Get all available languages
 * @returns {Array} - Array of language codes
 */
export const getAvailableLanguages = () => {
  return Object.keys(translations);
};

/**
 * Format number according to language locale
 * @param {number} number - Number to format
 * @param {string} language - Language code
 * @returns {string} - Formatted number
 */
export const formatNumber = (number, language = 'en') => {
  const locales = {
    en: 'en-US',
    ar: 'ar-SA'
  };
  
  try {
    return new Intl.NumberFormat(locales[language] || 'en-US').format(number);
  } catch (error) {
    console.warn('Error formatting number:', error);
    return number.toString();
  }
};

/**
 * Format date according to language locale
 * @param {Date|string} date - Date to format
 * @param {string} language - Language code
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date
 */
export const formatDate = (date, language = 'en', options = {}) => {
  const locales = {
    en: 'en-US',
    ar: 'ar-SA'
  };
  
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locales[language] || 'en-US', { ...defaultOptions, ...options }).format(dateObj);
  } catch (error) {
    console.warn('Error formatting date:', error);
    return date.toString();
  }
};

/**
 * Get text direction for a language
 * @param {string} language - Language code
 * @returns {string} - Text direction ('ltr' or 'rtl')
 */
export const getTextDirection = (language = 'en') => {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  return rtlLanguages.includes(language) ? 'rtl' : 'ltr';
};

/**
 * Pluralization helper (basic implementation)
 * @param {string} key - Translation key
 * @param {number} count - Count for pluralization
 * @param {string} language - Language code
 * @param {Object} params - Additional parameters
 * @returns {string} - Pluralized translation
 */
export const pluralize = (key, count, language = 'en', params = {}) => {
  // Basic pluralization rules
  const pluralRules = {
    en: (count) => count === 1 ? 'singular' : 'plural',
    ar: (count) => {
      if (count === 0) return 'zero';
      if (count === 1) return 'singular';
      if (count === 2) return 'dual';
      if (count >= 3 && count <= 10) return 'few';
      return 'many';
    }
  };
  
  const rule = pluralRules[language] || pluralRules.en;
  const pluralForm = rule(count);
  
  // Try to get pluralized key (e.g., 'item.singular', 'item.plural')
  const pluralKey = `${key}.${pluralForm}`;
  
  if (hasTranslation(pluralKey, language)) {
    return t(pluralKey, language, { count, ...params });
  }
  
  // Fallback to regular key
  return t(key, language, { count, ...params });
};
