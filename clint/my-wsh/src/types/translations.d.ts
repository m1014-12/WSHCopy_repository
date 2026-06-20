// Type definitions for translations

export type Language = 'en' | 'ar';

export interface TranslationParams {
  [key: string]: string | number;
}

export interface TranslationObject {
  [key: string]: string | TranslationObject;
}

export interface Translations {
  en: TranslationObject;
  ar: TranslationObject;
}

export interface ValidationResult {
  isValid: boolean;
  missingKeys: Record<string, string[]>;
  extraKeys: Record<string, string[]>;
  errors: string[];
}

export interface TranslationStats {
  [language: string]: {
    totalKeys: number;
    stringKeys: number;
    objectKeys: number;
  };
}

// Translation function type
export type TranslationFunction = (
  key: string,
  language?: Language,
  params?: TranslationParams
) => string;

// Pluralization function type
export type PluralizationFunction = (
  key: string,
  count: number,
  language?: Language,
  params?: TranslationParams
) => string;

// Number formatting function type
export type NumberFormatFunction = (
  number: number,
  language?: Language
) => string;

// Date formatting function type
export type DateFormatFunction = (
  date: Date | string,
  language?: Language,
  options?: Intl.DateTimeFormatOptions
) => string;

// Text direction function type
export type TextDirectionFunction = (language?: Language) => 'ltr' | 'rtl';

// Available languages
export const availableLanguages: Language[];

// Language names for display
export const languageNames: Record<Language, string>;

// Default language
export const defaultLanguage: Language;

// Translation functions
export declare const t: TranslationFunction;
export declare const pluralize: PluralizationFunction;
export declare const formatNumber: NumberFormatFunction;
export declare const formatDate: DateFormatFunction;
export declare const getTextDirection: TextDirectionFunction;
export declare const hasTranslation: (key: string, language?: Language) => boolean;
export declare const getAvailableLanguages: () => Language[];
export declare const validateTranslations: (languages?: Language[]) => ValidationResult;
export declare const getTranslationStats: () => TranslationStats;
export declare const getNestedValue: (obj: any, path: string) => any;
export declare const getKeys: (obj: any, prefix?: string) => string[];
