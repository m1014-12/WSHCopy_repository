import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Filter, SortAsc, SortDesc, RefreshCw, Mic, MicOff } from 'lucide-react';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { translations } from '../../translations/translations';
import '../../css/SearchPage.css';
import '../../css/UserHeader.css';
import '../../css/Footer.css';
import UserHeader from '../../components/UserHeader';
import LiveChatButton from '../../components/LiveChatButton';
import Footer from '../../components/Footer';
import api from '../../utils/api';
import useDebounce from '../../hooks/useDebounce';

function SearchPage() {
  const navigate = useNavigate();
  const { isDarkMode, language, toggleTheme, toggleLanguage } = useThemeLanguage();
  const t = translations[language];
  const logo = require('../../components/wshLogo.png');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Voice search state
  const [isListening, setIsListening] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [voiceError, setVoiceError] = useState(null);
  const recognitionRef = useRef(null);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Data state
  const [searchResults, setSearchResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Debounced search query for autocomplete
  const debouncedSearchQuery = useDebounce(searchQuery, 4000);


  // Categories and types
  const categories = ['all', 'Electronics', 'Home Appliances', 'Entertainment', 'Software', 'HVAC', 'Landscaping', 'Plumbing', 'Cleaning'];
  const types = ['all', 'warranty', 'subscription', 'task'];
  const statuses = ['all', 'Active', 'Scheduled', 'Completed', 'Pending'];

  // Navigation functions
  const goTohome = () => navigate('/home');
  const goToProfile = () => navigate('/profile');
  const goTonotifications = () => navigate('/notifications');
  const handleLogout = () => navigate('/login');

  // Check for voice recognition support and initialize
  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsVoiceSupported(true);
      // Initialize recognition
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'ar' ? 'ar-SA' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError(null);
      };

      recognition.onresult = (event) => {
        let transcript = event.results[0][0].transcript;
        // Remove all trailing punctuation including periods/dots
        transcript = transcript.trim(); // First trim whitespace
        // Remove trailing periods/dots explicitly
        transcript = transcript.replace(/\.+$/, ''); // Remove one or more trailing periods
        // Remove any other trailing punctuation
        transcript = transcript.replace(/[.,;:!?。，、]+$/, ''); 
        // Final trim to ensure no trailing spaces
        transcript = transcript.trim();
        // Extra safety check: if last character is still a period, remove it
        if (transcript.endsWith('.')) {
          transcript = transcript.slice(0, -1).trim();
        }
        setSearchQuery(transcript);
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        switch (event.error) {
          case 'no-speech':
            setVoiceError(t.searchPage.voiceSearch.errors.noSpeech);
            break;
          case 'audio-capture':
            setVoiceError(t.searchPage.voiceSearch.errors.noMicrophone);
            break;
          case 'not-allowed':
            setVoiceError(t.searchPage.voiceSearch.errors.permissionDenied);
            break;
          default:
            setVoiceError(t.searchPage.voiceSearch.errors.generic);
        }
        
        // Clear error after 3 seconds
        setTimeout(() => setVoiceError(null), 3000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setIsVoiceSupported(false);
    }

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors when stopping
        }
      }
    };
  }, [language, t]);

  // Update recognition language when language changes
  useEffect(() => {
    if (recognitionRef.current && isVoiceSupported) {
      recognitionRef.current.lang = language === 'ar' ? 'ar-SA' : 'en-US';
    }
  }, [language, isVoiceSupported]);

  // Load data from database
  useEffect(() => {
    loadSearchData();
  }, []);

  const loadSearchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const userId = localStorage.getItem('userId');
      if (!userId) {
        navigate('/login');
        return;
      }

      // Fetch all data in parallel
      const [warrantiesResponse, subscriptionsResponse, tasksResponse] = await Promise.all([
        api.get('/getWarranty'),
        api.get('/getSubscriptions'),
        api.get('/getHomeTasks')
      ]);

      const warranties = warrantiesResponse.data.warranty || [];
      const subscriptions = subscriptionsResponse.data.subscriptions || [];
      const tasks = tasksResponse.data.homeTasks || [];

      // Transform data to unified format
      const unifiedData = [
        // Transform warranties
        ...warranties.map(warranty => ({
          id: warranty._id,
          type: 'warranty',
          name: warranty.warrantyName,
          category: warranty.warrantyCategory,
          price: 0, // Warranties don't have price in the model
          date: warranty.warrantyExpirationDate,
          description: `${t.searchPage.results.warrantyFor} ${warranty.warrantyName}`,
          status: 'Active', // All warranties are considered active
          expiryDate: warranty.warrantyExpirationDate,
          remindBefore: warranty.warrantyRemindBefore
        })),
        
        // Transform subscriptions
        ...subscriptions.map(subscription => ({
          id: subscription._id,
          type: 'subscription',
          name: subscription.subscriptionName,
          category: subscription.subscriptionCategory,
          price: subscription.subscriptionPrice || 0,
          date: subscription.subscriptionRenewalDate,
          description: subscription.subscriptionDescription || `${t.searchPage.results.subscriptionFor} ${subscription.subscriptionName}`,
          status: 'Active', // All subscriptions are considered active
          renewalDate: subscription.subscriptionRenewalDate,
          autoRenewal: subscription.subscriptionAutoRenewal,
          billingCycle: subscription.subscriptionBillingCycle,
          remindBefore: subscription.subscriptionRemindBefore
        })),
        
        // Transform home tasks
        ...tasks.map(task => ({
          id: task._id,
          type: 'task',
          name: task.homeTaskName,
          category: task.homeTaskCategory,
          price: task.homeTaskCost || 0,
          date: task.homeTaskReminderDate,
          description: task.homeTaskDescription || `${t.searchPage.results.taskPrefix} ${task.homeTaskName}`,
          status: task.homeTaskCompleted ? 'Completed' : (task.homeTaskStatus || 'Pending'),
          dueDate: task.homeTaskReminderDate,
          priority: task.homeTaskPriority,
          estimatedDuration: task.homeTaskEstimatedDuration,
          completed: task.homeTaskCompleted
        }))
      ];

      setSearchResults(unifiedData);
      
    } catch (error) {
      console.error('Error loading search data:', error);
      setError(t.searchPage.failedToLoadData);
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    await loadSearchData();
    setIsRefreshing(false);
  };

  // Navigation function for view details
  const handleViewDetails = (item) => {
    switch (item.type) {
      case 'warranty':
        navigate('/warranty');
        break;
      case 'subscription':
        navigate('/subscription');
        break;
      case 'task':
        navigate('/home-tasks');
        break;
      default:
        console.warn(t.searchPage.unknownItemType + ':', item.type);
    }
  };

  useEffect(() => {
    let filtered = [...searchResults];

    // Filter by search query - enhanced to search across more fields
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.priority && item.priority.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(item => item.type === selectedType);
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(item => item.status === selectedStatus);
    }

    // Filter by price range
    if (priceRange.min !== '') {
      filtered = filtered.filter(item => item.price >= parseFloat(priceRange.min));
    }
    if (priceRange.max !== '') {
      filtered = filtered.filter(item => item.price <= parseFloat(priceRange.max));
    }

    // Filter by date range
    if (dateRange.start !== '') {
      filtered = filtered.filter(item => new Date(item.date) >= new Date(dateRange.start));
    }
    if (dateRange.end !== '') {
      filtered = filtered.filter(item => new Date(item.date) <= new Date(dateRange.end));
    }

    // Sort results
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        case 'priority':
          // Priority sorting: High > Medium > Low
          const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
          aValue = priorityOrder[a.priority] || 0;
          bValue = priorityOrder[b.priority] || 0;
          break;
        case 'status':
          aValue = a.status.toLowerCase();
          bValue = b.status.toLowerCase();
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredResults(filtered);
  }, [searchQuery, selectedCategory, selectedType, selectedStatus, sortBy, sortOrder, priceRange, dateRange, searchResults]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedType('all');
    setSelectedStatus('all');
    setSortBy('name');
    setSortOrder('asc');
    setPriceRange({ min: '', max: '' });
    setDateRange({ start: '', end: '' });
  };

  // Voice search handlers
  const startVoiceSearch = () => {
    if (!isVoiceSupported || !recognitionRef.current) {
      setVoiceError(t.searchPage.voiceSearch.errors.notSupported);
      setTimeout(() => setVoiceError(null), 3000);
      return;
    }

    try {
      if (isListening) {
        recognitionRef.current.stop();
      } else {
        recognitionRef.current.start();
      }
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      setVoiceError(t.searchPage.voiceSearch.errors.generic);
      setTimeout(() => setVoiceError(null), 3000);
    }
  };

  const stopVoiceSearch = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'warranty':
        return '🛡️';
      case 'subscription':
        return '💳';
      case 'task':
        return '🔧';
      default:
        return '📄';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'status-active';
      case 'Scheduled':
        return 'status-scheduled';
      case 'Completed':
        return 'status-completed';
      case 'Pending':
        return 'status-pending';
      default:
        return 'status-default';
    }
  };

  const getTranslatedStatus = (status) => {
    switch (status) {
      case 'Active':
        return t.searchPage.status.active;
      case 'Scheduled':
        return t.searchPage.status.scheduled;
      case 'Completed':
        return t.searchPage.status.completed;
      case 'Pending':
        return t.searchPage.status.pending;
      default:
        return status;
    }
  };

  const getTranslatedPriority = (priority) => {
    if (!priority) return '';
    const priorityLower = priority.toLowerCase();
    return t.searchPage.priority[priorityLower] || priority;
  };

  // Generate suggestions based on search query
  const generateSuggestions = useCallback((query, allResults) => {
    if (!query || query.trim().length < 1) {
      return [];
    }

    const queryLower = query.toLowerCase().trim();
    const suggestionsWithScore = [];

    allResults.forEach(item => {
      let score = 0;
      const nameLower = item.name.toLowerCase();
      const categoryLower = item.category.toLowerCase();
      const descriptionLower = (item.description || '').toLowerCase();
      const statusLower = item.status.toLowerCase();

      // Exact name match (highest priority)
      if (nameLower === queryLower) {
        score = 100;
      }
      // Name starts with query (high priority)
      else if (nameLower.startsWith(queryLower)) {
        score = 80;
      }
      // Name contains query (medium priority)
      else if (nameLower.includes(queryLower)) {
        score = 60;
      }
      // Category matches
      else if (categoryLower.includes(queryLower)) {
        score = 40;
      }
      // Description contains query
      else if (descriptionLower.includes(queryLower)) {
        score = 30;
      }
      // Status matches
      else if (statusLower.includes(queryLower)) {
        score = 20;
      }
      // Priority matches (for tasks)
      else if (item.priority && item.priority.toLowerCase().includes(queryLower)) {
        score = 15;
      }

      if (score > 0) {
        console.log(`score value: ${score}`)
        suggestionsWithScore.push({ ...item, matchScore: score });
      }
    });

    // Sort by score (highest first), then by name
    suggestionsWithScore.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }

      return a.name.localeCompare(b.name);
    });

    // Limit to top 8 suggestions
    return suggestionsWithScore.slice(0, 8).map(({ matchScore, ...item }) => item);

  }, []);

  // Update suggestions based on debounced query
  useEffect(() => {
    console.log(debouncedSearchQuery)
    if (debouncedSearchQuery && debouncedSearchQuery.trim().length >= 1 && searchResults.length > 0) {
      const newSuggestions = generateSuggestions(debouncedSearchQuery, searchResults);
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0 && searchQuery.trim().length > 0);
      setSelectedIndex(-1);
    } else {

      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  }, [debouncedSearchQuery, searchResults, generateSuggestions, searchQuery]);

  // Highlight matched text in suggestion
  const highlightMatch = (text, query) => {
    if (!query || !text) return text;
    // Escape special regex characters in query
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="suggestion-highlight">{part}</mark>
      ) : (
        part
      )
    );
  };

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion) => {
    setSearchQuery(suggestion.name);
    setShowSuggestions(false);
    setSelectedIndex(0);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Keyboard navigation handlers
  const handleKeyDown = useCallback((e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter' && isListening) {
        stopVoiceSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      case 'Tab':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  }, [showSuggestions, suggestions, selectedIndex, handleSuggestionSelect, isListening]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(true);
        setSelectedIndex(1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle input focus
  const handleInputFocus = () => {
    if (searchQuery && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
    setSelectedIndex(0);
    if (e.target.value.trim().length > 0) {
      // Will show suggestions after debounce
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  return (
    <div className="search-page">
      <UserHeader />

      {/* Main Content */}
      <main className="search-main">
        {/* Search and Filters Section */}
        <div className="search-filters-section">
          {/* Main Search Bar */}
          <div className="main-search-container">
            <div className="search-input-container">
              <input
                ref={inputRef}
                type="text"
                placeholder={t.searchPage.searchPlaceholder}
                value={searchQuery}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onKeyDown={handleKeyDown}
                className="main-search-input"
                autoComplete="off"
                aria-autocomplete="list"
                aria-expanded={showSuggestions}
                aria-controls="search-suggestions"
                aria-activedescendant={selectedIndex >= 0 ? `suggestion-${selectedIndex}` : undefined}
              />
              {isVoiceSupported && (
                <button
                  type="button"
                  className={`voice-search-button ${isListening ? 'listening' : ''}`}
                  onClick={startVoiceSearch}
                  title={isListening ? t.searchPage.voiceSearch.stopListening : t.searchPage.voiceSearch.startListening}
                  aria-label={isListening ? t.searchPage.voiceSearch.stopListening : t.searchPage.voiceSearch.startListening}
                >
                  {isListening ? (
                    <MicOff className="voice-icon" />
                  ) : (
                    <Mic className="voice-icon" />
                  )}
                </button>
              )}
              {voiceError && (
                <div className="voice-error-message" role="alert">
                  {voiceError}
                </div>
              )}
              {/* Autocomplete Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div 
                  ref={suggestionsRef}
                  id="search-suggestions"
                  className="suggestions-dropdown"
                  role="listbox"
                >
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={suggestion.id}
                      id={`suggestion-${index}`}
                      className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
                      onClick={() => handleSuggestionSelect(suggestion)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      role="option"
                      aria-selected={index === selectedIndex}
                    >
                      <span className="suggestion-icon">{getTypeIcon(suggestion.type)}</span>
                      <div className="suggestion-content">
                        <div className="suggestion-name">
                          {highlightMatch(suggestion.name, searchQuery)}
                        </div>
                        <div className="suggestion-meta">
                          <span className="suggestion-category">{suggestion.category}</span>
                          <span className="suggestion-type">{t.searchPage.types[suggestion.type] || suggestion.type}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {isListening && (
              <div className="voice-listening-indicator">
                <div className="pulse-ring"></div>
                <p>{t.searchPage.voiceSearch.listening}</p>
              </div>
            )}
          </div>

          {/* Basic Filters */}
          <div className="basic-filters-container">
            <div className="filter-group">
              <label className="filter-label">{t.searchPage.filters.type}:</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="filter-select"
              >
                {types.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? t.searchPage.filters.allTypes : type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">{t.searchPage.filters.category}:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="filter-select"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? t.searchPage.filters.allCategories : category}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">{t.searchPage.filters.status}:</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="filter-select"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status === 'all' ? t.searchPage.filters.allStatuses : status}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">{t.searchPage.filters.sortBy}:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="name">{t.searchPage.filters.name}</option>
                <option value="price">{t.searchPage.filters.price}</option>
                <option value="date">{t.searchPage.filters.date}</option>
                <option value="category">{t.searchPage.filters.category}</option>
                <option value="priority">{t.searchPage.filters.priority}</option>
                <option value="status">{t.searchPage.filters.status}</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">{t.searchPage.filters.order}:</label>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="sort-button"
              >
                {sortOrder === 'asc' ? <SortAsc className="sort-icon" /> : <SortDesc className="sort-icon" />}
              </button>
            </div>

            <button 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} 
              className="advanced-filters-toggle"
            >
              <Filter className="filter-icon" />
              {showAdvancedFilters ? t.searchPage.filters.hideAdvanced : t.searchPage.filters.showAdvanced}
            </button>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="advanced-filters-container">
              <div className="filter-group">
                <label className="filter-label">{t.searchPage.filters.priceRange}:</label>
                <div className="price-range">
                  <input
                    type="number"
                    placeholder={t.searchPage.filters.min}
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                    className="price-input"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    placeholder={t.searchPage.filters.max}
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                    className="price-input"
                  />
                </div>
              </div>

              <div className="filter-group">
                <label className="filter-label">{t.searchPage.filters.dateRange}:</label>
                <div className="date-range">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="date-input"
                  />
                  <span>-</span>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="date-input"
                  />
                </div>
              </div>

              <button onClick={clearFilters} className="clear-filters-button">
                {t.searchPage.results.clearFilters}
              </button>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="results-section">
          <div className="results-header">
            <h2 className="results-title">
              {t.searchPage.results.title} ({filteredResults.length} {t.searchPage.results.items})
            </h2>
            
            {/* Refresh Button */}
            <button 
              onClick={refreshData} 
              className="refresh-button"
              disabled={isRefreshing}
            >
              <RefreshCw className={`refresh-icon ${isRefreshing ? 'spinning' : ''}`} />
              {isRefreshing ? t.searchPage.results.refreshing : t.searchPage.results.refresh}
            </button>
            
            {/* View Toggle Buttons */}
            <div className="view-toggle">
              <button 
                className={`view-toggle-button ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                  <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                  <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                  <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                </svg>
                {t.searchPage.results.grid}
              </button>
              <button 
                className={`view-toggle-button ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <line x1="8" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2"/>
                  <line x1="8" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2"/>
                  <line x1="8" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2"/>
                  <line x1="3" y1="6" x2="3.01" y2="6" stroke="currentColor" strokeWidth="2"/>
                  <line x1="3" y1="12" x2="3.01" y2="12" stroke="currentColor" strokeWidth="2"/>
                  <line x1="3" y1="18" x2="3.01" y2="18" stroke="currentColor" strokeWidth="2"/>
                </svg>
                {t.searchPage.results.list}
              </button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>{t.searchPage.results.loadingData}</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="error-state">
              <p>{error}</p>
              <button onClick={loadSearchData} className="retry-button">
                {t.searchPage.results.tryAgain}
              </button>
            </div>
          )}

          {/* Results */}
          {!isLoading && !error && (
            <div className={viewMode === 'grid' ? 'results-grid' : 'results-list'}>
              {filteredResults.length > 0 ? (
                filteredResults.map((item) => (
                  <div key={item.id} className="result-card">
                    <div className="result-card-header">
                      <span className="type-icon">{getTypeIcon(item.type)}</span>
                      <span className={`status-badge ${getStatusColor(item.status)}`}>
                        {getTranslatedStatus(item.status)}
                      </span>
                    </div>
                    
                    <div className="result-card-content">
                      <h3 className="result-title">{item.name}</h3>
                      <p className="result-description">{item.description}</p>
                      
                      <div className="result-details">
                        <div className="detail-item">
                          <span className="detail-label">{t.searchPage.results.category}</span>
                          <span className="detail-value">{item.category}</span>
                        </div>
                        {item.price > 0 && (
                          <div className="detail-item">
                            <span className="detail-label">{t.searchPage.results.price}</span>
                            <span className="detail-value">${item.price}</span>
                          </div>
                        )}
                        <div className="detail-item">
                          <span className="detail-label">{t.searchPage.results.date}</span>
                          <span className="detail-value">{new Date(item.date).toLocaleDateString()}</span>
                        </div>
                        {item.type === 'warranty' && (
                          <div className="detail-item">
                            <span className="detail-label">{t.searchPage.results.expires}</span>
                            <span className="detail-value">{new Date(item.expiryDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {item.type === 'subscription' && (
                          <div className="detail-item">
                            <span className="detail-label">{t.searchPage.results.renewal}</span>
                            <span className="detail-value">{new Date(item.renewalDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {item.type === 'task' && (
                          <>
                            <div className="detail-item">
                              <span className="detail-label">{t.searchPage.results.due}</span>
                              <span className="detail-value">{new Date(item.dueDate).toLocaleDateString()}</span>
                            </div>
                            {item.priority && (
                              <div className="detail-item">
                                <span className="detail-label">{t.searchPage.results.priority}</span>
                                <span className={`detail-value priority-${item.priority.toLowerCase()}`}>
                                  {getTranslatedPriority(item.priority)}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="result-card-actions">
                      <button 
                        className="action-button view-button"
                        onClick={() => handleViewDetails(item)}
                      >
                        {t.searchPage.results.viewDetails}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-results">
                  <p>{t.searchPage.results.noResults}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Live Chat Button */}
      <LiveChatButton />
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

export default SearchPage; 