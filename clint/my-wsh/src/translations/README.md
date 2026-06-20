# Translation System Documentation

This document describes the improved translation system for the WHS Management System.

## Overview

The translation system has been enhanced with better organization, utility functions, and TypeScript support while maintaining backward compatibility.

## File Structure

```
src/translations/
├── index.js          # Main export file
├── en.js            # English translations
├── ar.js            # Arabic translations
├── translations.js  # Legacy file (backward compatibility)
└── README.md        # This documentation

src/utils/
└── translationHelpers.js  # Utility functions

src/types/
└── translations.d.ts      # TypeScript definitions
```

## Basic Usage

### Import translations
```javascript
import { translations } from '../translations';
// or
import { translations } from '../translations/translations'; // Legacy import
```

### Use in components
```javascript
import React from 'react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { translations } from '../translations';

function MyComponent() {
  const { language } = useThemeLanguage();
  const t = translations[language];
  
  return (
    <div>
      <h1>{t.welcome}</h1>
      <p>{t.homePage.title}</p>
    </div>
  );
}
```

## Advanced Usage with Helper Functions

### Import helper functions
```javascript
import { t, formatNumber, formatDate, getTextDirection } from '../utils/translationHelpers';
```

### Basic translation with helper
```javascript
const message = t('welcome', language);
const title = t('homePage.title', language);
```

### Translation with parameters
```javascript
// In your translation file:
// welcomeUser: "Welcome, {{name}}! You have {{count}} items."

const greeting = t('welcomeUser', language, { 
  name: 'John', 
  count: 5 
});
// Result: "Welcome, John! You have 5 items."
```

### Number formatting
```javascript
const formattedNumber = formatNumber(1234.56, language);
// English: "1,234.56"
// Arabic: "١٬٢٣٤٫٥٦"
```

### Date formatting
```javascript
const formattedDate = formatDate(new Date(), language);
// English: "December 25, 2023"
// Arabic: "٢٥ ديسمبر ٢٠٢٣"
```

### Text direction
```javascript
const direction = getTextDirection(language);
// English: "ltr"
// Arabic: "rtl"
```

## Adding New Translations

### 1. Add to language files
```javascript
// In en.js
export const en = {
  // ... existing translations
  newSection: {
    title: "New Section",
    description: "This is a new section"
  }
};

// In ar.js
export const ar = {
  // ... existing translations
  newSection: {
    title: "قسم جديد",
    description: "هذا قسم جديد"
  }
};
```

### 2. Use in components
```javascript
const title = t('newSection.title', language);
const description = t('newSection.description', language);
```

## Validation

### Run validation script
```bash
node src/scripts/validateTranslations.js
```

### Manual validation
```javascript
import { validateTranslations } from '../utils/translationHelpers';

const validation = validateTranslations();
if (!validation.isValid) {
  console.log('Missing keys:', validation.missingKeys);
  console.log('Extra keys:', validation.extraKeys);
}
```

## TypeScript Support

The system includes TypeScript definitions for better type safety:

```typescript
import { t, Language, TranslationParams } from '../utils/translationHelpers';

const message: string = t('welcome', 'en' as Language);
const greeting: string = t('welcomeUser', 'en' as Language, { name: 'John' } as TranslationParams);
```

## Best Practices

### 1. Use descriptive keys
```javascript
// Good
t('userProfile.editButton', language)

// Avoid
t('btn1', language)
```

### 2. Group related translations
```javascript
// Good
warrantyPage: {
  title: "Warranty Management",
  addButton: "Add Warranty",
  editButton: "Edit Warranty"
}

// Avoid
warrantyTitle: "Warranty Management",
warrantyAddBtn: "Add Warranty",
warrantyEditBtn: "Edit Warranty"
```

### 3. Use parameters for dynamic content
```javascript
// Good
t('welcomeUser', language, { name: userName })

// Avoid
t(`welcomeUser${userName}`, language)
```

### 4. Validate translations regularly
Run the validation script before deploying to catch missing translations.

## Migration Guide

### From old system to new system

**Old way:**
```javascript
import { translations } from '../translations/translations';
const t = translations[language];
const message = t.welcome;
```

**New way (backward compatible):**
```javascript
import { translations } from '../translations';
const t = translations[language];
const message = t.welcome;
```

**New way (with helpers):**
```javascript
import { t } from '../utils/translationHelpers';
const message = t('welcome', language);
```

## Troubleshooting

### Missing translation warning
If you see a warning like "Translation missing for key: someKey", check:
1. The key exists in the translation file
2. The key path is correct (use dot notation for nested keys)
3. The language code is valid

### TypeScript errors
Make sure to import the correct types:
```typescript
import { Language, TranslationParams } from '../types/translations';
```

## Performance Notes

- The helper functions are optimized for performance
- Translations are loaded once and cached
- Parameter interpolation is efficient
- Validation should be run in development, not production

## Future Enhancements

Potential future improvements:
- Lazy loading of translation files
- Pluralization support
- Translation management tools integration
- Automatic translation validation in CI/CD
- Translation key auto-completion in IDEs
