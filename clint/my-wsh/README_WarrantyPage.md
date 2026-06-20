# Warranty Management Page

## Overview
The Warranty Management page is a comprehensive, responsive web application that allows users to manage their warranties effectively. It features a modern design with theme switching, multilingual support, and full CRUD operations.

## Features

### 🎨 Design & UX
- **Responsive Design**: Fully responsive layout that works on desktop, tablet, and mobile devices
- **Theme Switching**: Toggle between light and dark themes
- **Multilingual Support**: Switch between English and Arabic with RTL support
- **Modern UI**: Clean, intuitive interface with smooth animations and transitions
- **Full-Page Layout**: Optimized for full-screen usage

### 🔧 Functionality
- **Add Warranty**: Create new warranty entries with detailed information
- **Edit Warranty**: Update existing warranty details
- **Delete Warranty**: Remove warranties with confirmation dialog
- **Search & Filter**: Real-time search through warranty list
- **File Upload**: Upload warranty images and documents
- **Reminder System**: Set reminder dates for warranty expiration
- **Categorization**: Organize warranties by categories (Electronics, Appliances, Furniture, etc.)

### 📱 Responsive Breakpoints
- **Desktop**: 3-column grid layout
- **Tablet**: 2-column grid layout
- **Mobile**: Single-column layout with optimized touch interactions

## Technical Implementation

### Components Used
- **React Hooks**: useState, useEffect for state management
- **React Router**: Navigation between pages
- **Lucide React**: Modern icon library
- **CSS Grid & Flexbox**: Responsive layout system
- **CSS Variables**: Dynamic theming support

### State Management
```javascript
// Main state variables
const [warranties, setWarranties] = useState([]);
const [formData, setFormData] = useState({});
const [editingId, setEditingId] = useState(null);
const [searchTerm, setSearchTerm] = useState('');
const [selectedWarranty, setSelectedWarranty] = useState(null);
const [showForm, setShowForm] = useState(false);
```

### Theme System
- **CSS Variables**: Dynamic color schemes
- **Data Attributes**: Theme and language attributes for styling
- **Context API**: Global theme and language state management

### File Structure
```
src/
├── pages/
│   └── WarrantyPage.js          # Main component
├── css/
│   └── WarrantyPage.css         # Styling
├── context/
│   └── ThemeLanguageContext.js  # Theme & language context
└── translations/
    └── translations.js          # Multilingual support
```

## Usage

### Adding a Warranty
1. Click the "Add Warranty" button
2. Fill in the required fields:
   - Warranty Name
   - Category
   - Reminder Date
3. Optionally add notification message and upload files
4. Click "Save" to create the warranty

### Editing a Warranty
1. Click the edit icon next to any warranty in the list
2. Modify the desired fields
3. Click "Save" to update the warranty

### Deleting a Warranty
1. Click the delete icon next to any warranty
2. Confirm the deletion in the dialog
3. The warranty will be removed from the list

### Searching Warranties
- Use the search bar in the header to filter warranties by name or category
- Results update in real-time as you type

### Theme Switching
- Click the moon icon in the header to toggle between light and dark themes
- Theme preference is saved in localStorage

### Language Switching
- Click the language link in the header to switch between English and Arabic
- Language preference is saved in localStorage
- RTL layout is automatically applied for Arabic

## Categories Available
- Electronics (الإلكترونيات)
- Appliances (الأجهزة المنزلية)
- Furniture (الأثاث)
- Vehicles (المركبات)
- Clothing (الملابس)
- Other (أخرى)

## Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Features
- **Lazy Loading**: Images and components load on demand
- **Optimized Rendering**: Efficient React rendering with proper key props
- **CSS Optimization**: Minimal CSS with efficient selectors
- **Responsive Images**: Optimized image loading and display

## Accessibility
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **High Contrast**: Dark theme provides high contrast option
- **Focus Management**: Proper focus indicators and management

## Future Enhancements
- [ ] Calendar view for warranty reminders
- [ ] Export functionality (PDF, CSV)
- [ ] Advanced filtering options
- [ ] Warranty expiration notifications
- [ ] Cloud storage integration
- [ ] Warranty sharing features
- [ ] Analytics dashboard
- [ ] Mobile app version

## Dependencies
- React 19.1.0
- React Router DOM 7.6.0
- Lucide React 0.510.0
- Bootstrap 5.3.6 (for additional styling support)

## Installation & Setup
1. Ensure all dependencies are installed: `npm install`
2. Start the development server: `npm start`
3. Navigate to `/warranty` to access the warranty management page

## Contributing
When contributing to this component:
1. Follow the existing code style and patterns
2. Test on multiple screen sizes
3. Ensure theme and language switching works correctly
4. Add appropriate translations for new features
5. Update this README for any new features 