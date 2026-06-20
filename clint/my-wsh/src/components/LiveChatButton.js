import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../css/LiveChatButton.css';
import Chatbot from './Chatbot';
import LiveChat from './LiveChat';
import AdminChatDashboard from './AdminChatDashboard';

function LiveChatButton({ onClick }) {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isLiveChatOpen, setIsLiveChatOpen] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const location = useLocation();
  
  // Check if user is admin - check route path and tokens
  const adminToken = localStorage.getItem('adminToken');
  const userToken = localStorage.getItem('userToken');
  const adminId = localStorage.getItem('adminId');
  const isOnAdminRoute = location.pathname.startsWith('/admin') || 
                          location.pathname.startsWith('/manage') ||
                          location.pathname.startsWith('/category-manage') ||
                          location.pathname.startsWith('/all-users-data');
  
  // User is admin if: on admin route OR (has adminToken/adminId AND no userToken)
  const isUserAdmin = isOnAdminRoute || !!(adminToken && adminId && !userToken);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (isUserAdmin) {
      // Admin: Open live chat dashboard directly
      setIsLiveChatOpen(true);
    } else {
      // User: Show options (chatbot or live chat)
      setShowOptions(!showOptions);
    }
  };

  const handleChatbotClick = () => {
    setShowOptions(false);
    setIsChatbotOpen(true);
  };

  const handleLiveChatClick = () => {
    setShowOptions(false);
    setIsLiveChatOpen(true);
  };

  // Close options when clicking outside
  useEffect(() => {
    if (showOptions) {
      const handleClickOutside = (e) => {
        if (!e.target.closest('.live-chat-button') && !e.target.closest('.chat-options-menu')) {
          setShowOptions(false);
        }
      };
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showOptions]);

  return (
    <>
      <div className="live-chat-button" onClick={handleClick}>
        <svg className="live-chat-icon" viewBox="0 0 24 24" fill="none">
          <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z" fill="currentColor"></path>
        </svg>
      </div>
      
      {/* Options menu for users */}
      {showOptions && !isUserAdmin && (
        <div className="chat-options-menu">
          <button className="chat-option" onClick={handleChatbotClick}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>Chatbot</span>
          </button>
          <button className="chat-option" onClick={handleLiveChatClick}>
            <svg viewBox="0 0 24 24" fill="#28a745" stroke="#28a745" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              <line x1="9" y1="10" x2="15" y2="10"></line>
              <line x1="9" y1="14" x2="15" y2="14"></line>
            </svg>
            <span>Live Chat</span>
          </button>
        </div>
      )}

      {/* Chatbot for users */}
      {!isUserAdmin && (
        <Chatbot isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />
      )}

      {/* Live Chat for users */}
      {!isUserAdmin && (
        <LiveChat isOpen={isLiveChatOpen} onClose={() => setIsLiveChatOpen(false)} />
      )}

      {/* Admin Chat Dashboard */}
      {isUserAdmin && (
        <AdminChatDashboard isOpen={isLiveChatOpen} onClose={() => setIsLiveChatOpen(false)} />
      )}
    </>
  );
}

export default LiveChatButton;
