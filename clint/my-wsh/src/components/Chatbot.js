import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import '../css/Chatbot.css';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { translations } from '../translations/translations';

function Chatbot({ isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionHistory, setSuggestionHistory] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [suggestionsVisible, setSuggestionsVisible] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { language } = useThemeLanguage();
  const t = translations[language]?.chatbot || {};

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat session when component opens
  useEffect(() => {
    if (isOpen) {
      loadChatSession();
      // Focus input when opened
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      // Reset when closed
      setMessages([]);
      setChatId(null);
      setInputMessage('');
      setSuggestions([]);
      setSuggestionHistory([]);
      setShowSuggestions(true);
    }
  }, [isOpen]);

  const loadChatSession = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/chat/session');
      if (response.data.success) {
        // Only set chatId - don't load previous messages
        // User starts fresh each time they open chatbot
        setChatId(response.data.chatId);
        setMessages([]); // Always start with empty messages - user doesn't see history
        
        // Set initial suggestions for fresh conversation
        if (response.data.suggestions) {
          setSuggestions(response.data.suggestions);
        } else {
          // Default suggestions
          setSuggestions([
            "How do I add a warranty?",
            "How to manage subscriptions?",
            "Create a home maintenance task",
            "Update my profile",
            "How to search for items?",
            "Set up reminders"
          ]);
        }
        setSuggestionHistory([]); // Reset history for new session
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error loading chat session:', error);
      // Initialize with empty messages for fresh start
      setMessages([]);
      // Set initial suggestions
      setSuggestions([
        "How do I add a warranty?",
        "How to manage subscriptions?",
        "Create a home maintenance task",
        "Update my profile",
        "How to search for items?",
        "Set up reminders"
      ]);
      setSuggestionHistory([]); // Reset history for new session
      setShowSuggestions(true);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (messageText = null) => {
    const userMessage = messageText || inputMessage.trim();
    
    if (!userMessage || isLoading) return;

    // Clear input if using text input
    if (!messageText) {
      setInputMessage('');
    }
    
    // Hide suggestions when user sends a message
    setShowSuggestions(false);
    
    // Add user message to UI immediately
    const newUserMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const response = await api.post('/chat/message', {
        message: userMessage,
        chatId: chatId
      });

      if (response.data.success) {
        setChatId(response.data.chatId);
        
        // Add bot response
        const botMessage = {
          role: 'assistant',
          content: response.data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);

        // Update suggestions based on intent
        if (response.data.suggestions && response.data.suggestions.length > 0) {
          // Save current suggestions to history before setting new ones
          if (suggestions.length > 0) {
            setSuggestionHistory(prev => [...prev, suggestions]);
          }
          setSuggestions(response.data.suggestions);
          setShowSuggestions(true);
        } else {
          setShowSuggestions(false);
        }

        // If escalated, show escalation message
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        role: 'assistant',
        content: t.error || 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion);
  };

  const handleBackToPrevious = () => {
    if (suggestionHistory.length > 0) {
      const previousSuggestions = suggestionHistory[suggestionHistory.length - 1];
      setSuggestionHistory(prev => prev.slice(0, -1));
      setSuggestions(previousSuggestions);
      setShowSuggestions(true);
    }
  };


  const formatMessage = (content) => {
    // Format markdown-like text
    let formatted = content;
    
    // Convert **text** to bold
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert • to bullet points
    formatted = formatted.replace(/^• /gm, '• ');
    
    // Convert numbered lists
    formatted = formatted.replace(/^\d+\. /gm, (match) => match);
    
    // Convert line breaks
    formatted = formatted.split('\n').map((line, index) => {
      if (line.trim() === '') return '<br />';
      return line;
    }).join('');

    return formatted;
  };

  if (!isOpen) return null;

  return (
    <div className="chatbot-overlay" onClick={onClose}>
      <div className="chatbot-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="chatbot-header">
          <div className="chatbot-header-content">
            <div className="chatbot-avatar">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z" fill="currentColor"></path>
              </svg>
            </div>
            <div className="chatbot-header-info">
              <h3>{t.title || 'WHS Support Chatbot'}</h3>
              <span className="chatbot-status">{t.online || 'Online'}</span>
            </div>
          </div>
          <button className="chatbot-close" onClick={onClose} aria-label="Close chat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="chatbot-messages">
          {messages.length === 0 && !isLoading && (
            <div className="chatbot-empty">
              <p>{t.startConversation || 'Start a conversation by typing a message below.'}</p>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div
              key={index}
              className={`chatbot-message ${message.role === 'user' ? 'user-message' : message.role === 'system' ? 'system-message' : 'bot-message'}`}
            >
              {message.role !== 'user' && (
                <div className="chatbot-avatar-small">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z" fill="currentColor"></path>
                  </svg>
                </div>
              )}
              <div className="message-content">
                <div 
                  className="message-text"
                  dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                />
                <span className="message-time">
                  {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  }) : ''}
                </span>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="chatbot-message bot-message">
              <div className="chatbot-avatar-small">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z" fill="currentColor"></path>
                </svg>
              </div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="chatbot-suggestions">
            <div className="suggestions-header">
              <p className="suggestions-label">{t.suggestionsLabel || 'Choose a topic:'}</p>
              <div className="suggestions-header-actions">
                {suggestionHistory.length > 0 && (
                  <button
                    className="suggestion-back-button"
                    onClick={handleBackToPrevious}
                    disabled={isLoading}
                    title={t.backToPrevious || 'Back to previous options'}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{t.back || 'Back'}</span>
                  </button>
                )}
                <button
                  className="suggestion-toggle-button"
                  onClick={() => setSuggestionsVisible(!suggestionsVisible)}
                  title={suggestionsVisible ? (t.hideSuggestions || 'Hide suggestions') : (t.showSuggestions || 'Show suggestions')}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {suggestionsVisible ? (
                      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
                    ) : (
                      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
                    )}
                  </svg>
                </button>
              </div>
            </div>
            {suggestionsVisible && (
              <div className="suggestions-list">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="suggestion-button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    disabled={isLoading}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Input Area */}
        <div className="chatbot-input-area">
          <form onSubmit={handleSubmit} className="chatbot-form">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={t.placeholder || 'Type your message...'}
              className="chatbot-input"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="chatbot-send"
              disabled={!inputMessage.trim() || isLoading}
              aria-label="Send message"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Chatbot;

