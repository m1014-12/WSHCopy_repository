/**
 * Translation validation script
 * Run this script to check for missing or extra translation keys
 */

import { validateTranslations, getTranslationStats } from '../utils/translationHelpers';

console.log('🔍 Validating translations...\n');

// Validate all translations
const validation = validateTranslations();

if (validation.isValid) {
  console.log('✅ All translations are valid!');
} else {
  console.log('❌ Translation validation failed!\n');
  
  // Show missing keys
  Object.keys(validation.missingKeys).forEach(lang => {
    if (validation.missingKeys[lang].length > 0) {
      console.log(`🔴 Missing keys in ${lang}:`);
      validation.missingKeys[lang].forEach(key => {
        console.log(`   - ${key}`);
      });
      console.log('');
    }
  });
  
  // Show extra keys
  Object.keys(validation.extraKeys).forEach(lang => {
    if (validation.extraKeys[lang].length > 0) {
      console.log(`🟡 Extra keys in ${lang}:`);
      validation.extraKeys[lang].forEach(key => {
        console.log(`   - ${key}`);
      });
      console.log('');
    }
  });
  
  // Show errors
  if (validation.errors.length > 0) {
    console.log('🚨 Errors:');
    validation.errors.forEach(error => {
      console.log(`   - ${error}`);
    });
    console.log('');
  }
}

// Show translation statistics
console.log('📊 Translation Statistics:');
const stats = getTranslationStats();
Object.keys(stats).forEach(lang => {
  const stat = stats[lang];
  console.log(`   ${lang}: ${stat.totalKeys} total keys (${stat.stringKeys} strings, ${stat.objectKeys} objects)`);
});

console.log('\n✨ Validation complete!');
