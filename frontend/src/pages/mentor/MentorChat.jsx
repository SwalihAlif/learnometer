// src/pages/mentor/MentorChat.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useParams } from 'react-router-dom';
import axiosInstance from '../../axios';

// Enhanced Mentor-specific Tailwind color palette
const mentorTheme = {
  primary: 'bg-gradient-to-r from-teal-700 to-teal-600',
  primarySolid: 'bg-teal-700',
  secondary: 'bg-gradient-to-r from-amber-500 to-amber-400',
  secondarySolid: 'bg-amber-500',
  background: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50',
  cardBg: 'bg-white/80 backdrop-blur-sm',
  text: 'text-emerald-950',
  textMuted: 'text-emerald-800',
  textLight: 'text-emerald-600',
  border: 'border-teal-200',
  borderAccent: 'border-teal-300',
  inputBg: 'bg-white/90',
  inputBorder: 'border-teal-300',
  inputFocus: 'focus:border-teal-500 focus:ring-teal-500/20',
  buttonHover: 'hover:from-teal-800 hover:to-teal-700',
  buttonSecondaryHover: 'hover:from-amber-600 hover:to-amber-500',
  messageBg: 'bg-gradient-to-br from-teal-100 to-teal-50',
  myMessageBg: 'bg-gradient-to-br from-amber-100 to-amber-50',
  myMessageText: 'text-emerald-950',
  otherMessageText: 'text-emerald-950',
  systemBg: 'bg-gradient-to-r from-gray-100 to-gray-50',
  onlineIndicator: 'bg-emerald-400',
  offlineIndicator: 'bg-red-400',
  shadow: 'shadow-xl shadow-teal-100/50',
  hover: 'hover:shadow-2xl hover:shadow-teal-200/60',
};

function MentorChat() {
  const { user, loading: authLoading } = useAuth();
  const { learnerId } = useParams();
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const typingTimeoutRef = useRef(null);
  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const currentMentorId = user?.user_id;
  const targetLearnerId = learnerId;

  const isValidChat = currentMentorId && targetLearnerId &&
                      String(targetLearnerId).trim() !== '' &&
                      String(targetLearnerId) !== 'undefined';

  const roomName = isValidChat
    ? `private_chat_${[String(currentMentorId), String(targetLearnerId)].sort().join('_')}`
    : null;

  const wsUrl = roomName ? `ws://localhost:8000/ws/chat/${roomName}/` : null;

  useEffect(() => {
    if (authLoading || !isValidChat) {
      if (!authLoading && !user) {
        setMessages(prev => [...prev, {type: 'system', text: 'Please log in to chat.'}]);
      } else if (!learnerId || String(learnerId).trim() === '' || String(learnerId) === 'undefined') {
        setMessages(prev => [...prev, {type: 'system', text: 'No learner selected. Please go to your conversations to start a chat.'}]);
      }
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
      setIsConnected(false);
      return;
    } 

    // --- Fetch Chat History ---
    const fetchChatHistory = async () => {
      setLoadingHistory(true);
      try {
        const response = await axiosInstance.get(`chat/history/${roomName}/`);
        const historyMessages = response.data.map(msg => ({
          type: (user && msg.sender.id === user.user_id) ? 'my' : 'other',
          text: msg.content,
          sender: msg.sender.full_name,
          timestamp: msg.timestamp,
          isRead: msg.is_read,
          readAt: msg.read_at,
        }));
        setMessages(historyMessages);
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
        setMessages(prev => [...prev, {type: 'system', text: 'Failed to load chat history.'}]);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchChatHistory();

    // --- WebSocket Connection ---
    if (!ws.current || ws.current.readyState === WebSocket.CLOSED || ws.current.url !== wsUrl) {
      console.log(`Attempting WebSocket connection with roomName: ${roomName}, wsUrl: ${wsUrl}`);
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log(`Mentor WebSocket Connected to: ${wsUrl}`);
        setIsConnected(true);
      };

      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Message from server (Mentor):', data);

        if (data.type === 'chat_message') {
            const messageType = (user && data.sender_id === user.user_id) ? 'my' : 'other';
            setMessages((prev) => [...prev, {
                type: messageType,
                text: data.message,
                sender: data.sender_full_name || 'Unknown',
                timestamp: data.timestamp,
                isRead: data.is_read || false,
                readAt: data.read_at || null
            }]);
            if (typingUser && typingUser.id === data.sender_id) {
                setTypingUser(null);
            }
        } else if (data.type === 'message_read_status') {
            if (data.reader_id === parseInt(targetLearnerId)) {
                setMessages(prevMessages =>
                    prevMessages.map(msg => {
                        if (msg.type === 'my' && !msg.isRead) {
                            return { ...msg, isRead: true, readAt: data.timestamp };
                        }
                        return msg;
                    })
                );
                console.log(`Messages sent to ${data.reader_full_name} marked as read.`);
            }
        } else if (data.type === 'typing_status') {
            if (user && data.sender_id !== user.user_id) {
                if (data.is_typing) {
                    setTypingUser({ id: data.sender_id, name: data.sender_full_name });
                } else {
                    setTypingUser(null);
                }
            }
        }
      };

      ws.current.onclose = (event) => {
        console.log('Mentor WebSocket Disconnected:', event);
        setIsConnected(false);
        setTypingUser(null);
        if (event.code !== 1000) {
            setMessages(prev => [...prev, { type: 'system', text: `Disconnected from chat. Code: ${event.code}. Reason: ${event.reason || 'Unknown'}` }]);
        }
      };

      ws.current.onerror = (error) => {
        console.error('Mentor WebSocket Error:', error);
        setIsConnected(false);
        setTypingUser(null);
        setMessages(prev => [...prev, { type: 'system', text: 'WebSocket error occurred. Check console for details.' }]);
      };
    }

    return () => {
      if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
        console.log('Cleaning up Mentor WebSocket.');
        ws.current.close();
      }
      ws.current = null;
      setIsConnected(false);
      setTypingUser(null);
    };
  }, [authLoading, isValidChat, wsUrl, user, targetLearnerId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendTypingStatus = useCallback((isTyping) => {
    if (isConnected && user && user.user_id && ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: isTyping ? 'typing_start' : 'typing_stop',
        sender_id: user.user_id,
      }));
    }
  }, [user, isConnected]);

  const handleMessageInputChange = (e) => {
    setMessageInput(e.target.value);

    if (isConnected && user && user.user_id) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      } else {
        sendTypingStatus(true);
      }

      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStatus(false);
        typingTimeoutRef.current = null;
      }, 1000);
    }
  };

  const sendMessage = () => {
    if (messageInput.trim() === '' || !ws.current || ws.current.readyState !== WebSocket.OPEN) {
        console.warn('Cannot send message: WebSocket not open or empty message.');
        return;
    }
    
    if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
    }
    sendTypingStatus(false);

    const messageData = {
      type: 'chat_message',
      message: messageInput,
      recipient_id: learnerId,
    };

    ws.current.send(JSON.stringify(messageData));
    setMessageInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  // Enhanced emoji panel
  const emojiCategories = {
    'Smileys': ['😀', '😃', '😄', '😁', '😆', '😂', '🤣', '😊', '😇', '😍', '🥰', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝'],
    'Gestures': ['👍', '👎', '👌', '✋', '🤚', '👋', '🤟', '✌️', '🤞', '🤜', '🤛', '👏', '🙌', '👐', '🤝', '🙏', '💪', '🦾', '👂', '👃'],
    'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '❣️', '💔', '❤️‍🔥'],
    'Activities': ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳'],
    'Objects': ['💼', '👔', '👕', '👖', '🧣', '🧤', '🧥', '🧦', '👗', '👘', '🥻', '🩱', '🩲', '🩳', '👙', '👚', '👛', '👜', '👝', '🛍️'],
    'Nature': ['🌱', '🌿', '🍀', '🍃', '🍂', '🍁', '🍄', '🌾', '💐', '🌷', '🌹', '🥀', '🌺', '🌻', '🌼', '🌸', '🌵', '🌲', '🌳', '🌴']
  };

  const [showEmojis, setShowEmojis] = useState(false);
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState('Smileys');

  const addEmoji = (emoji) => {
    setMessageInput(prev => prev + emoji);
    setShowEmojis(false);
  };

  if (authLoading || loadingHistory) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${mentorTheme.background}`}>
        <div className={`${mentorTheme.cardBg} p-8 rounded-2xl ${mentorTheme.shadow} border ${mentorTheme.border}`}>
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-teal-200 border-t-teal-600"></div>
            <p className={`${mentorTheme.text} text-lg font-medium`}>Loading chat...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !user.user_id) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${mentorTheme.background}`}>
        <div className={`${mentorTheme.cardBg} p-8 rounded-2xl ${mentorTheme.shadow} border ${mentorTheme.border} text-center`}>
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className={`${mentorTheme.text} text-lg font-semibold mb-2`}>Authentication Required</p>
          <p className={`${mentorTheme.textMuted} text-sm`}>Please log in to access the mentor chat.</p>
        </div>
      </div>
    );
  }

  if (!learnerId || String(learnerId).trim() === '' || String(learnerId) === 'undefined') {
    return (
      <div className={`min-h-screen flex items-center justify-center ${mentorTheme.background}`}>
        <div className={`${mentorTheme.cardBg} p-8 rounded-2xl ${mentorTheme.shadow} border ${mentorTheme.border} text-center max-w-md`}>
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h2V4a2 2 0 012-2h4a2 2 0 012 2v4z" />
            </svg>
          </div>
          <p className={`${mentorTheme.text} text-lg font-semibold mb-2`}>No Conversation Selected</p>
          <p className={`${mentorTheme.textMuted} text-sm`}>Please select a learner from your conversations to start chatting.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-4 font-inter ${mentorTheme.background}`}>
      <div className={`flex flex-col h-[calc(100vh-2rem)] max-w-5xl mx-auto rounded-2xl ${mentorTheme.shadow} ${mentorTheme.hover} overflow-hidden border ${mentorTheme.border} transition-all duration-300`}>
        {/* Enhanced Chat Header */}
        <div className={`${mentorTheme.primary} text-white p-6 relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-r from-teal-600/20 to-transparent"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold">Mentor Chat</h1>
                  <p className="text-white/80 text-sm">with Learner {targetLearnerId}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-full ${isConnected ? 'bg-emerald-500/20' : 'bg-red-500/20'} backdrop-blur-sm`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? mentorTheme.onlineIndicator : mentorTheme.offlineIndicator} animate-pulse`}></div>
                <span className="text-white text-xs font-medium">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Message Display Area */}
        <div className={`flex-1 p-6 overflow-y-auto ${mentorTheme.cardBg} custom-scrollbar`}>
          {messages.length === 0 && !loadingHistory ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-teal-100 to-teal-200 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className={`${mentorTheme.textMuted} text-lg font-medium mb-2`}>Start Your Conversation</p>
              <p className={`${mentorTheme.textLight} text-sm`}>Send a message to begin your mentoring session</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.type === 'my' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] ${msg.type === 'system' ? 'mx-auto max-w-md' : ''}`}>
                    {msg.type !== 'system' && (
                      <div className={`text-xs font-medium mb-2 ${msg.type === 'my' ? 'text-right text-amber-700' : 'text-left text-teal-700'}`}>
                        {msg.type === 'my' ? 'You' : msg.sender}
                      </div>
                    )}
                    <div
                      className={`p-4 rounded-2xl backdrop-blur-sm border shadow-sm transition-all duration-200 hover:shadow-md ${
                        msg.type === 'my'
                          ? `${mentorTheme.myMessageBg} ${mentorTheme.myMessageText} border-amber-200 rounded-br-md`
                          : msg.type === 'other'
                          ? `${mentorTheme.messageBg} ${mentorTheme.otherMessageText} border-teal-200 rounded-bl-md`
                          : `${mentorTheme.systemBg} text-gray-700 text-sm italic text-center border-gray-200`
                      }`}
                    >
                      <p className="leading-relaxed break-words">{msg.text}</p>
                      {msg.timestamp && (
                        <div className="text-xs opacity-60 mt-2 flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                    {/* Enhanced Read Receipt */}
                    {msg.type === 'my' && msg.isRead && (
                      <div className="text-xs text-emerald-600 mt-2 flex items-center justify-end space-x-1">
                        <div className="flex space-x-0.5">
                          <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
                          <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="font-medium">Read</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Enhanced Typing Indicator */}
        {typingUser && (
          <div className={`px-6 py-3 ${mentorTheme.cardBg} border-t ${mentorTheme.border}`}>
            <div className="flex items-center space-x-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className={`text-sm ${mentorTheme.textMuted} font-medium`}>
                {typingUser.name} is typing...
              </span>
            </div>
          </div>
        )}

        {/* Enhanced Emoji Panel */}
        {showEmojis && (
          <div className={`${mentorTheme.cardBg} border-t ${mentorTheme.border} p-4`}>
            <div className="flex space-x-2 mb-3 overflow-x-auto">
              {Object.keys(emojiCategories).map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedEmojiCategory(category)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedEmojiCategory === category
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-10 gap-2 max-h-32 overflow-y-auto">
              {emojiCategories[selectedEmojiCategory].map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => addEmoji(emoji)}
                  className="text-lg hover:bg-gray-100 rounded p-1 transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Message Input */}
        <div className={`p-6 ${mentorTheme.primary} relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-r from-teal-600/20 to-transparent"></div>
          <div className="relative flex items-end space-x-3">
            <div className="flex-1 relative">
              <div className={`flex items-center ${mentorTheme.inputBg} rounded-2xl border ${mentorTheme.inputBorder} ${mentorTheme.inputFocus} focus-within:ring-2 focus-within:ring-teal-500/20 transition-all duration-200 backdrop-blur-sm`}>
                <button
                  onClick={() => setShowEmojis(!showEmojis)}
                  className="p-3 text-gray-500 hover:text-teal-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <input
                  type="text"
                  value={messageInput}
                  onChange={handleMessageInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message... 💬"
                  className={`flex-1 p-3 bg-transparent focus:outline-none ${mentorTheme.text} text-base placeholder-gray-500`}
                  disabled={!isValidChat || !isConnected}
                />
                <div className="p-2">
                  <div className="w-1 h-8 bg-gradient-to-b from-teal-300 to-transparent rounded-full"></div>
                </div>
              </div>
            </div>
            <button
              onClick={sendMessage}
              className={`p-4 rounded-2xl text-white font-semibold shadow-lg transition-all duration-300 transform hover:scale-105 ${mentorTheme.secondary} ${mentorTheme.buttonSecondaryHover} disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
              disabled={!isValidChat || !isConnected || !messageInput.trim()}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MentorChat;


// // src/pages/mentor/MentorChat.jsx
// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import { useAuth } from '../../contexts/AuthContext';
// import { useParams } from 'react-router-dom';
// import axiosInstance from '../../axios';

// // Mentor-specific Tailwind color palette
// const mentorTheme = {
//   primary: 'bg-teal-700', // #0F766E
//   secondary: 'bg-amber-500', // #F59E0B
//   background: 'bg-emerald-50', // #ECFDF5
//   text: 'text-emerald-950', // #064E3B
//   border: 'border-teal-700',
//   inputBg: 'bg-white',
//   inputBorder: 'border-teal-300',
//   buttonHover: 'hover:bg-teal-800',
//   messageBg: 'bg-teal-100', // For messages from others
//   myMessageBg: 'bg-amber-100', // For messages sent by 'my' user
//   myMessageText: 'text-emerald-950',
//   otherMessageText: 'text-emerald-950',
// };

// function MentorChat() {
//   const { user, loading: authLoading } = useAuth();
//   const { learnerId } = useParams();
//   const [messages, setMessages] = useState([]);
//   const [messageInput, setMessageInput] = useState('');
//   const [loadingHistory, setLoadingHistory] = useState(true);
//   const [isConnected, setIsConnected] = useState(false);
//   const [typingUser, setTypingUser] = useState(null); // NEW: State for typing user
//   const typingTimeoutRef = useRef(null); // NEW: Ref for typing debounce
//   const ws = useRef(null);
//   const messagesEndRef = useRef(null);

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   };

//   const currentMentorId = user?.user_id;
//   const targetLearnerId = learnerId;

//   const isValidChat = currentMentorId && targetLearnerId &&
//                       String(targetLearnerId).trim() !== '' &&
//                       String(targetLearnerId) !== 'undefined';

//   const roomName = isValidChat
//     ? `private_chat_${[String(currentMentorId), String(targetLearnerId)].sort().join('_')}`
//     : null;

//   const wsUrl = roomName ? `ws://localhost:8000/ws/chat/${roomName}/` : null;

//   useEffect(() => {
//     if (authLoading || !isValidChat) {
//       if (!authLoading && !user) {
//         setMessages(prev => [...prev, {type: 'system', text: 'Please log in to chat.'}]);
//       } else if (!learnerId || String(learnerId).trim() === '' || String(learnerId) === 'undefined') {
//         setMessages(prev => [...prev, {type: 'system', text: 'No learner selected. Please go to your conversations to start a chat.'}]);
//       }
//       if (ws.current) {
//         ws.current.close();
//         ws.current = null;
//       }
//       setIsConnected(false);
//       return;
//     } 

//     // --- Fetch Chat History ---
//     const fetchChatHistory = async () => {
//       setLoadingHistory(true);
//       try {
//         const response = await axiosInstance.get(`chat/history/${roomName}/`);
//         const historyMessages = response.data.map(msg => ({
//           type: (user && msg.sender.id === user.user_id) ? 'my' : 'other',
//           text: msg.content,
//           sender: msg.sender.full_name,
//           timestamp: msg.timestamp,
//           isRead: msg.is_read, // <--- NEW: Include is_read from history
//           readAt: msg.read_at, // <--- NEW: Include read_at from history
//         }));
//         setMessages(historyMessages);
//       } catch (error) {
//         console.error('Failed to fetch chat history:', error);
//         setMessages(prev => [...prev, {type: 'system', text: 'Failed to load chat history.'}]);
//       } finally {
//         setLoadingHistory(false);
//       }
//     };

//     fetchChatHistory();

//     // --- WebSocket Connection ---
//     if (!ws.current || ws.current.readyState === WebSocket.CLOSED || ws.current.url !== wsUrl) {
//       console.log(`Attempting WebSocket connection with roomName: ${roomName}, wsUrl: ${wsUrl}`);
//       ws.current = new WebSocket(wsUrl);

//       ws.current.onopen = () => {
//         console.log(`Mentor WebSocket Connected to: ${wsUrl}`);
//         setIsConnected(true);
//       };

//       ws.current.onmessage = (event) => {
//         const data = JSON.parse(event.data);
//         console.log('Message from server (Mentor):', data);

//         // MODIFIED: Handle different message types received from the backend
//         if (data.type === 'chat_message') {
//             const messageType = (user && data.sender_id === user.user_id) ? 'my' : 'other';
//             setMessages((prev) => [...prev, {
//                 type: messageType,
//                 text: data.message,
//                 sender: data.sender_full_name || 'Unknown',
//                 timestamp: data.timestamp,
//                 isRead: data.is_read || false,
//                 readAt: data.read_at || null
//             }]);
//             // NEW: Clear typing indicator if a message is received from the typing user
//             if (typingUser && typingUser.id === data.sender_id) {
//                 setTypingUser(null);
//             }
//         } else if (data.type === 'message_read_status') { // <--- NEW: Handle 'message_read_status' event
//             if (data.reader_id === parseInt(targetLearnerId)) {
//                 setMessages(prevMessages =>
//                     prevMessages.map(msg => {
//                         if (msg.type === 'my' && !msg.isRead) {
//                             return { ...msg, isRead: true, readAt: data.timestamp };
//                         }
//                         return msg;
//                     })
//                 );
//                 console.log(`Messages sent to ${data.reader_full_name} marked as read.`);
//             }
//         } else if (data.type === 'typing_status') { // <--- NEW: Handle 'typing_status' event
//             if (user && data.sender_id !== user.user_id) {
//                 if (data.is_typing) {
//                     setTypingUser({ id: data.sender_id, name: data.sender_full_name });
//                 } else {
//                     setTypingUser(null);
//                 }
//             }
//         }
//       };

//       ws.current.onclose = (event) => {
//         console.log('Mentor WebSocket Disconnected:', event);
//         setIsConnected(false);
//         setTypingUser(null); // <--- NEW: Clear typing indicator on disconnect
//         if (event.code !== 1000) {
//             setMessages(prev => [...prev, { type: 'system', text: `Disconnected from chat. Code: ${event.code}. Reason: ${event.reason || 'Unknown'}` }]);
//         }
//       };

//       ws.current.onerror = (error) => {
//         console.error('Mentor WebSocket Error:', error);
//         setIsConnected(false);
//         setTypingUser(null); // <--- NEW: Clear typing indicator on error
//         setMessages(prev => [...prev, { type: 'system', text: 'WebSocket error occurred. Check console for details.' }]);
//       };
//     }

//     return () => {
//       if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
//         console.log('Cleaning up Mentor WebSocket.');
//         ws.current.close();
//       }
//       ws.current = null;
//       setIsConnected(false);
//       setTypingUser(null); // <--- NEW: Clear typing indicator on unmount
//     };
//   }, [authLoading, isValidChat, wsUrl, user, targetLearnerId]);

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   // NEW: Function to send typing status (re-introduced)
//   const sendTypingStatus = useCallback((isTyping) => {
//     if (isConnected && user && user.user_id && ws.current && ws.current.readyState === WebSocket.OPEN) {
//       ws.current.send(JSON.stringify({
//         type: isTyping ? 'typing_start' : 'typing_stop',
//         sender_id: user.user_id,
//       }));
//     }
//   }, [user, isConnected]);

//   const handleMessageInputChange = (e) => { // <--- NEW: Re-introduced for typing indicator
//     setMessageInput(e.target.value);

//     if (isConnected && user && user.user_id) {
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current);
//       } else {
//         sendTypingStatus(true);
//       }

//       typingTimeoutRef.current = setTimeout(() => {
//         sendTypingStatus(false);
//         typingTimeoutRef.current = null;
//       }, 1000);
//     }
//   };

//   const sendMessage = () => {
//     if (messageInput.trim() === '' || !ws.current || ws.current.readyState !== WebSocket.OPEN) {
//         console.warn('Cannot send message: WebSocket not open or empty message.');
//         return;
//     }
    
//     // NEW: Clear typing status when message is sent
//     if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current);
//         typingTimeoutRef.current = null;
//     }
//     sendTypingStatus(false);

//     const messageData = {
//       type: 'chat_message', // <--- NEW: Explicitly set type for chat messages
//       message: messageInput,
//       recipient_id: learnerId,
//     };

//     ws.current.send(JSON.stringify(messageData));
//     setMessageInput('');
//   };

//   const handleKeyPress = (e) => {
//     if (e.key === 'Enter') {
//       sendMessage();
//     }
//   };

//   if (authLoading || loadingHistory) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <p className={`${mentorTheme.text} text-lg`}>Loading chat...</p>
//       </div>
//     );
//   }

//   if (!user || !user.user_id) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <p className={`${mentorTheme.text} text-lg`}>Please log in to access chat.</p>
//       </div>
//     );
//   }

//   if (!learnerId || String(learnerId).trim() === '' || String(learnerId) === 'undefined') {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <p className={`${mentorTheme.text} text-lg`}>No learner selected. Please go to your conversations to start a chat.</p>
//       </div>
//     );
//   }

//   const roomNameDisplay = roomName;

//   return (
//     <div className="min-h-screen flex items-center justify-center p-4 font-inter">
//       <div className={`flex flex-col h-[80vh] sm:h-[90vh] w-full max-w-4xl mx-auto rounded-lg shadow-xl overflow-hidden ${mentorTheme.background} ${mentorTheme.border} border-2`}>
//         {/* Chat Header */}
//         <div className={`p-4 ${mentorTheme.primary} text-white text-xl sm:text-2xl font-bold rounded-t-md`}>
//           Mentor Chat {targetLearnerId ? `with Learner ${targetLearnerId}` : ''} ({roomNameDisplay})
//         </div>

//         {/* Message Display Area */}
//         <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
//           {messages.length === 0 && !loadingHistory ? (
//             <div className="text-center text-gray-500 py-10">Start your conversation!</div>
//           ) : (
//             messages.map((msg, index) => (
//               <div key={index} className={`mb-2 ${msg.type === 'my' ? 'text-right' : 'text-left'}`}>
//                 {msg.type !== 'system' && (
//                   <span className={`text-xs ${msg.type === 'my' ? mentorTheme.myMessageText : mentorTheme.otherMessageText} opacity-75 mr-1`}>
//                     {msg.type === 'my' ? 'You' : msg.sender}:
//                   </span>
//                 )}
//                 <div
//                   className={`inline-block p-3 rounded-lg max-w-[80%] break-words ${
//                     msg.type === 'my'
//                       ? `${mentorTheme.myMessageBg} ${mentorTheme.myMessageText} ml-auto`
//                       : msg.type === 'other'
//                       ? `${mentorTheme.messageBg} ${mentorTheme.otherMessageText} mr-auto`
//                       : 'mx-auto bg-gray-200 text-gray-700 text-sm italic'
//                   }`}
//                 >
//                   {msg.text}
//                   {msg.timestamp && (
//                     <div className="text-xs opacity-60 mt-1">
//                       {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//                     </div>
//                   )}
//                 </div>
//                 {/* NEW: Read Receipt Indicator */}
//                 {msg.type === 'my' && msg.isRead && (
//                     <div className="text-xs text-gray-500 mt-1 flex items-center justify-end">
//                         <svg className="w-3 h-3 text-blue-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
//                             <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
//                         </svg>
//                         Read
//                     </div>
//                 )}
//               </div>
//             ))
//           )}
//           <div ref={messagesEndRef} />
//         </div>

//         {/* NEW: Typing Indicator */}
//         {typingUser && (
//             <div className="p-2 text-sm text-gray-600 italic text-center">
//                 {typingUser.name} is typing...
//             </div>
//         )}

//         {/* Message Input */}
//         <div className={`p-4 flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 ${mentorTheme.primary} rounded-b-md`}>
//           <input
//             type="text"
//             value={messageInput}
//             onChange={handleMessageInputChange}
//             onKeyPress={handleKeyPress}
//             placeholder="Type your message..."
//             className={`flex-1 w-full p-3 rounded-lg focus:outline-none focus:ring-2 ${mentorTheme.inputBorder} ${mentorTheme.inputBg} ${mentorTheme.text} text-base`}
//             disabled={!isValidChat || !isConnected}
//           />
//           <button
//             onClick={sendMessage}
//             className={`w-full sm:w-auto px-6 py-3 rounded-lg text-white font-semibold shadow-md transition duration-300 ease-in-out ${mentorTheme.secondary} ${mentorTheme.buttonHover}`}
//             disabled={!isValidChat || !isConnected}
//           >
//             Send
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default MentorChat;
