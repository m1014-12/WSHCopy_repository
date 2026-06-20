import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import adminApi from '../utils/adminApi';
import '../css/AdminChatDashboard.css';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { translations } from '../translations/translations';

function AdminChatDashboard({ isOpen, onClose }) {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const selectedChatRef = useRef(null);
  const { language } = useThemeLanguage();
  const t = translations[language]?.adminChat || {};

  // Keep selectedChat ref updated
  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  // Initialize socket connection
  useEffect(() => {
    if (isOpen) {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        console.error('No admin token found');
        return;
      }
      
      const newSocket = io('http://localhost:3001', {
        auth: { token },
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('Admin connected to live chat, socket ID:', newSocket.id);
        console.log('Admin socket connected:', newSocket.connected);
        // Ensure admin joins the admin room (should happen automatically on server, but just in case)
      });

      newSocket.on('connect_error', (error) => {
        console.error('Admin socket connection error:', error);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Admin socket disconnected:', reason);
      });

      newSocket.on('new_message', (data) => {
        console.log('Admin received new_message event:', data);
        // Always update chat list first to show new chats
        loadChats();
        
        // If this message is for the currently selected chat, add it to messages immediately
        const currentChat = selectedChatRef.current;
        if (currentChat) {
          const currentChatId = currentChat._id?.toString();
          const incomingChatId = data.chatId?.toString();
          const incomingUserId = data.userId?.toString();
          const selectedUserId = currentChat.userId?._id?.toString() || currentChat.userId?.toString();
          
          console.log('Comparing:', {
            currentChatId,
            incomingChatId,
            incomingUserId,
            selectedUserId,
            match: incomingChatId === currentChatId || incomingUserId === selectedUserId
          });
          
          if (incomingChatId === currentChatId || incomingUserId === selectedUserId) {
            console.log('Adding message to current chat:', data.message);
            setMessages(prev => {
              // Check if message already exists to avoid duplicates
              const exists = prev.some(msg => 
                (msg._id && data.message._id && msg._id.toString() === data.message._id.toString()) ||
                (msg.content === data.message.content && 
                 msg.senderType === data.message.senderType &&
                 Math.abs(new Date(msg.timestamp).getTime() - new Date(data.message.timestamp).getTime()) < 1000)
              );
              if (exists) {
                console.log('Message already exists, skipping');
                return prev;
              }
              return [...prev, {
                ...data.message,
                _id: data.message._id || Date.now().toString()
              }];
            });
            // Also reload messages to ensure we have the latest from database
            setTimeout(() => {
              if (selectedChatRef.current && selectedChatRef.current._id?.toString() === currentChatId) {
                loadChatMessages(currentChatId);
              }
            }, 1000);
          }
        } else {
          console.log('No chat selected, message will appear when chat is selected');
        }
      });

      newSocket.on('user_typing', (data) => {
        if (selectedChat && data.userId === selectedChat.userId?._id) {
          setIsTyping(true);
          setTimeout(() => setIsTyping(false), 3000);
        }
      });

      newSocket.on('message_sent', () => {
        // Message sent successfully
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [isOpen]);

  // Load chats
  useEffect(() => {
    if (isOpen) {
      loadChats();
      const interval = setInterval(loadChats, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Load messages when chat is selected
  useEffect(() => {
    if (selectedChat && selectedChat._id) {
      loadChatMessages(selectedChat._id);
    }
  }, [selectedChat?._id]);

  const loadChats = async () => {
    try {
      const response = await adminApi.get('/admin/livechats');
      if (response.data.success) {
        setChats(response.data.chats);
        // If selected chat exists, update it and reload messages
        // Only update if the chat data actually changed to prevent unnecessary re-renders
        const currentChat = selectedChatRef.current;
        if (currentChat) {
          const updated = response.data.chats.find(c => c._id?.toString() === currentChat._id?.toString());
          if (updated) {
            // Only update if there are actual changes to prevent focus loss
            const hasChanges = JSON.stringify(updated) !== JSON.stringify(currentChat);
            if (hasChanges) {
              setSelectedChat(updated);
              // Reload messages to get latest
              loadChatMessages(updated._id);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  const loadChatMessages = async (chatId) => {
    try {
      setIsLoading(true);
      console.log('Loading messages for chat:', chatId);
      const response = await adminApi.get(`/admin/livechat/${chatId}`);
      if (response.data.success) {
        console.log('Loaded messages:', response.data.chat.messages);
        setMessages(response.data.chat.messages || []);
        setSelectedChat(response.data.chat);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectChat = (chat) => {
    console.log('Selecting chat:', chat);
    setSelectedChat(chat);
    setMessages([]);
    // Load messages immediately when chat is selected
    if (chat && chat._id) {
      loadChatMessages(chat._id);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !selectedChat || !socket) return;

    const messageContent = inputMessage.trim();
    setInputMessage('');

    const tempMessage = {
      _id: `temp_${Date.now()}`,
      senderId: localStorage.getItem('adminId'),
      senderType: 'admins',
      content: messageContent,
      timestamp: new Date(),
      read: false
    };

    setMessages(prev => [...prev, tempMessage]);

    // Store current input ref to restore focus after state updates
    const currentInputRef = inputRef.current;

    try {
      // Assign chat to admin if not assigned
      if (!selectedChat.adminId) {
        await adminApi.post(`/admin/livechat/${selectedChat._id}/assign`);
      }

      socket.emit('admin_message', {
        chatId: selectedChat._id,
        message: messageContent,
        userId: selectedChat.userId?._id || selectedChat.userId
      });

      // Refresh chat list without causing focus loss
      setTimeout(() => {
        loadChats();
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(msg => msg._id !== tempMessage._id));
    } finally {
      // Restore focus after a brief delay to ensure DOM is updated
      setTimeout(() => {
        if (currentInputRef) {
          currentInputRef.focus();
        }
      }, 50);
    }
  };

  const handleResolveChat = async () => {
    if (!selectedChat) return;
    try {
      await adminApi.post(`/admin/livechat/${selectedChat._id}/resolve`);
      loadChats();
      // Don't clear selected chat and messages - keep them visible for history
      // Just update the status
      setSelectedChat(prev => prev ? { ...prev, status: 'resolved', resolvedAt: new Date() } : null);
    } catch (error) {
      console.error('Error resolving chat:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getUnreadCount = (chat) => {
    if (!chat.messages) return 0;
    return chat.messages.filter(msg => 
      msg.senderType === 'users' && !msg.read
    ).length;
  };

  if (!isOpen) return null;

  return (
    <div className="admin-chat-overlay" onClick={onClose}>
      <div className="admin-chat-container" onClick={(e) => e.stopPropagation()}>
        <div className="admin-chat-header">
          <h3>{t.title || 'Live Chat Dashboard'}</h3>
          <button className="admin-chat-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="admin-chat-content">
          {/* Chat List */}
          <div className="admin-chat-list">
            <div className="chat-list-header">
              <h4>{t.chats || 'Chats'}</h4>
              <span className="chat-count">{chats.length}</span>
            </div>
            <div className="chat-list-items">
              {chats.map(chat => {
                const unreadCount = getUnreadCount(chat);
                const lastMessage = chat.messages?.[chat.messages.length - 1];
                return (
                  <div
                    key={chat._id}
                    className={`chat-list-item ${selectedChat?._id === chat._id ? 'active' : ''}`}
                    onClick={() => handleSelectChat(chat)}
                  >
                    <div className="chat-item-info">
                      <div className="chat-item-name">
                        {chat.userId?.userName || 'Unknown User'}
                        {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
                      </div>
                      <div className="chat-item-preview">
                        {lastMessage?.content?.substring(0, 50) || 'No messages yet'}
                      </div>
                      <div className="chat-item-status">
                        <span className={`status-badge ${chat.status}`}>{chat.status}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {chats.length === 0 && (
                <div className="no-chats">
                  <p>{t.noChats || 'No active chats'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div className="admin-chat-window">
            {selectedChat ? (
              <>
                <div className="chat-window-header">
                  <div className="chat-user-info">
                    <h4>{selectedChat.userId?.userName || 'Unknown User'}</h4>
                    <span className="chat-user-email">{selectedChat.userId?.email}</span>
                  </div>
                  <button
                    className="resolve-button"
                    onClick={handleResolveChat}
                    disabled={selectedChat.status === 'resolved'}
                  >
                    {t.resolve || 'Resolve'}
                  </button>
                </div>

                <div className="chat-window-messages">
                  {messages.map((message) => (
                    <div
                      key={message._id || message.timestamp}
                      className={`admin-chat-message ${message.senderType === 'admins' ? 'admin-message' : 'user-message'}`}
                    >
                      {message.senderType === 'users' && (
                        <div className="admin-chat-avatar-small">
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
                    <div className="admin-chat-message user-message">
                      <div className="admin-chat-avatar-small">
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

                <div className="chat-window-input">
                  <input
                    ref={inputRef}
                    type="text"
                    className="admin-chat-input"
                    placeholder={t.placeholder || 'Type your message...'}
                    value={inputMessage}
                    onChange={(e) => {
                      setInputMessage(e.target.value);
                      // Maintain focus during typing
                      if (inputRef.current && document.activeElement !== inputRef.current) {
                        setTimeout(() => inputRef.current?.focus(), 0);
                      }
                    }}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading || selectedChat?.status === 'resolved'}
                  />
                  <button
                    className="admin-chat-send"
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
              </>
            ) : (
              <div className="no-chat-selected">
                <p>{t.selectChat || 'Select a chat to start conversation'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminChatDashboard;

