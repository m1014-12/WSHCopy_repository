# Home Page Features

## Overview
The home page has been enhanced with responsive design, theme switching, and language switching capabilities.

## Features Implemented

### 1. Full-Page Responsive Design
- **Full viewport utilization**: The design takes up the entire screen without padding
- **Mobile-first approach**: The design adapts to different screen sizes
- **Breakpoints**:
  - Desktop: 1024px and above
  - Tablet: 768px - 1023px
  - Mobile: 480px - 767px
  - Small Mobile: Below 480px

- **Responsive Elements**:
  - Header spans full width with glass morphism effect
  - Service cards stack vertically on smaller screens
  - Logo size adjusts for different screen sizes
  - Navigation menu wraps and centers on mobile
  - Gradient backgrounds for enhanced visual appeal

### 2. Theme Switching
- **Light Theme**: Clean, bright interface with light backgrounds
- **Dark Theme**: Dark interface with better contrast for low-light environments
- **Toggle Button**: Moon/Sun icon in the header to switch themes
- **Persistent**: Theme preference is saved in localStorage
- **Smooth Transitions**: All theme changes have smooth animations

### 3. Language Switching
- **English**: Default language
- **Arabic**: Full RTL (Right-to-Left) support
- **Toggle Button**: Language button in the header
- **Persistent**: Language preference is saved in localStorage
- **RTL Layout**: Complete layout reversal for Arabic text

### 4. CSS Architecture
- **Separated Styles**: All styles moved from inline to `HomePage.css`
- **CSS Classes**: Semantic class names for better maintainability
- **Theme Variables**: CSS custom properties for consistent theming
- **Responsive Utilities**: Media queries for different screen sizes
- **Glass Morphism**: Modern backdrop-filter effects for enhanced UI
- **Gradient Backgrounds**: Subtle gradients for visual depth

## File Structure

```
src/
├── css/
│   └── HomePage.css          # Home page specific styles
├── context/
│   └── ThemeLanguageContext.js  # Theme and language context
├── translations/
│   └── translations.js       # Translation strings
└── pages/
    └── home page.js          # Updated home page component
```

## Usage

### Theme Switching
Click the moon/sun icon in the header to toggle between light and dark themes.

### Language Switching
Click the "Language" button in the header to switch between English and Arabic.

### Full-Page Behavior
The page utilizes the entire viewport:
- No padding around the main container for full-screen experience
- Header spans the complete width with modern glass effect
- Content area expands to fill available space
- Responsive design maintains full-page layout across devices

## Technical Implementation

### CSS Classes Used
- `.home-page`: Main container
- `.home-header`: Header section
- `.header-left`: Left side of header (logo + search)
- `.search-container`: Search input wrapper
- `.home-nav`: Navigation menu
- `.nav-button`: Navigation buttons
- `.nav-icon`: Icons in navigation
- `.home-main`: Main content area
- `.service-card`: Individual service cards
- `.card-image`: Card images
- `.card-content`: Card text content
- `.card-title`: Card titles
- `.card-description`: Card descriptions
- `.live-chat`: Floating chat button

### Context Usage
The component uses the `useThemeLanguage` hook to access:
- `isDarkMode`: Current theme state
- `language`: Current language
- `toggleTheme()`: Function to switch themes
- `toggleLanguage()`: Function to switch languages

### Translations
All text content is now translatable through the `translations` object:
- English translations in `translations.en`
- Arabic translations in `translations.ar`
- Home page specific translations in `translations[language].homePage`

## Browser Support
- Modern browsers with CSS Grid and Flexbox support
- RTL support for Arabic language
- CSS custom properties for theming
- LocalStorage for preference persistence

## Future Enhancements
- Additional language support
- More theme options
- Advanced responsive breakpoints
- Animation improvements
- Accessibility enhancements 