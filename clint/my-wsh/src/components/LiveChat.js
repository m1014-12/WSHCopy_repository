import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../utils/api';
import '../css/LiveChat.css';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { translations } from '../translations/translations';

function LiveChat({ isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [status, setStatus] = useState('pending');
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { language } = useThemeLanguage();
  const t = translations[language]?.liveChat || {};

  // Initialize socket connection
  useEffect(() => {
    if (isOpen) {
      const token = localStorage.getItem('userToken');
      const newSocket = io('http://localhost:3001', {
        auth: { token }
      });

      newSocket.on('connect', () => {
        console.log('Connected to live chat');
      });

      newSocket.on('new_message', (data) => {
        // Only show new messages that come while chat is open
        // Previous messages are not loaded for user sessions
        setMessages(prev => {
          // Check if message already exists to avoid duplicates
          const exists = prev.some(msg => 
            msg._id === data.message._id ||
            (msg.content === data.message.content && 
             msg.senderType === data.message.senderType &&
             Math.abs(new Date(msg.timestamp).getTime() - new Date(data.message.timestamp).getTime()) < 1000)
          );
          if (exists) return prev;
          return [...prev, {
            ...data.message,
            _id: data.message._id || Date.now().toString()
          }];
        });
        setIsTyping(false);
      });

      newSocket.on('admin_typing', () => {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      });

      newSocket.on('message_sent', (data) => {
        if (data.chatId) {
          setChatId(data.chatId);
        }
      });

      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [isOpen]);

  // Load chat session - only get chatId, not messages (user starts fresh each time)
  useEffect(() => {
    if (isOpen) {
      loadChatSession();
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      // Clear all conversation from user's side when closing
      setMessages([]);
      setChatId(null);
      setInputMessage('');
      setStatus('pending');
      setIsTyping(false);
    }
  }, [isOpen]);

  const loadChatSession = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/livechat/session');
      if (response.data.success) {
        // Only set chatId - don't load previous messages for users
        // Messages are preserved in DB for admin, but user starts fresh
        setChatId(response.data.chatId);
        setMessages([]); // Always start with empty messages for user
        setStatus(response.data.status || 'pending');
      }
    } catch (error) {
      console.error('Error loading chat session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !socket) return;

    const messageContent = inputMessage.trim();
    setInputMessage('');

    const tempMessage = {
      _id: `temp_${Date.now()}`,
      senderId: localStorage.getItem('userId'),
      senderType: 'users',
      content: messageContent,
      timestamp: new Date(),
      read: false
    };

    setMessages(prev => [...prev, tempMessage]);
    setIsLoading(true);

    // Emit typing stop
    socket.emit('typing', { chatId, typing: false });

    try {
      socket.emit('user_message', {
        chatId: chatId,
        message: messageContent
      });

      setStatus('active');
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(msg => msg._id !== tempMessage._id));
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleTyping = () => {
    if (socket && chatId) {
      socket.emit('typing', { chatId });
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { chatId, typing: false });
      }, 1000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="livechat-overlay" onClick={onClose}>
      <div className="livechat-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="livechat-header">
          <div className="livechat-header-content">
            <div className="livechat-avatar">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z" fill="currentColor"></path>
              </svg>
            </div>
            <div className="livechat-header-info">
              <h3>{t.title || 'Live Chat Support'}</h3>
              <span className="livechat-status">
                {status === 'pending' ? (t.waiting || 'Waiting for admin...') : (t.active || 'Admin is online')}
              </span>
            </div>
          </div>
          <button className="livechat-close" onClick={onClose} aria-label="Close chat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="livechat-messages">
          {messages.length === 0 && !isLoading && (
            <div className="livechat-empty">
              <p>{t.startConversation || 'Start a conversation with our support team.'}</p>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message._id || message.timestamp}
              className={`livechat-message ${message.senderType === 'users' ? 'user-message' : 'admin-message'}`}
            >
              {message.senderType === 'admins' && (
                <div className="livechat-avatar-small">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z" fill="currentColor"></path>
                  </svg>
                </div>
              )}
              <div className="message-content">
                <div className="message-text">{message.content}</div>
                <span className="message-time">
                  {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  }) : ''}
                </span>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="livechat-message admin-message">
              <div className="livechat-avatar-small">
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

        {/* Input Area */}
        <div className="livechat-input-area">
          <div className="livechat-form">
            <input
              ref={inputRef}
              type="text"
              className="livechat-input"
              placeholder={t.placeholder || 'Type your message...'}
              value={inputMessage}
              onChange={(e) => {
                setInputMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <button
              className="livechat-send"
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              aria-label="Send message"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LiveChat;

