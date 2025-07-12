// src/pages/learner/LearnerChat.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useParams } from 'react-router-dom';
import axiosInstance from '../../axios';

// Learner-specific Tailwind color palette
const learnerTheme = {
  primary: 'bg-indigo-600', // #4F46E5
  secondary: 'bg-yellow-400', // #FACC15
  background: 'bg-gray-50', // #F9FAFB
  text: 'text-indigo-950', // #1E1B4B
  border: 'border-indigo-600',
  inputBg: 'bg-white',
  inputBorder: 'border-indigo-300',
  buttonHover: 'hover:bg-indigo-700',
  messageBg: 'bg-indigo-100', // For messages from others
  myMessageBg: 'bg-yellow-100', // For messages sent by 'my' user
  myMessageText: 'text-indigo-950',
  otherMessageText: 'text-indigo-950',
};

function LearnerChat() {
  const { user, loading: authLoading } = useAuth();
  const { mentorId } = useParams();
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUser, setTypingUser] = useState(null); // NEW: State for typing user
  const typingTimeoutRef = useRef(null); // NEW: Ref for typing debounce
  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const currentLearnerId = user?.user_id;
  const targetMentorId = mentorId;

  const isValidChat = currentLearnerId && targetMentorId &&
                      String(targetMentorId).trim() !== '' &&
                      String(targetMentorId) !== 'undefined';

  const roomName = isValidChat
    ? `private_chat_${[String(currentLearnerId), String(targetMentorId)].sort().join('_')}`
    : null;

  const wsUrl = roomName ? `ws://localhost:8000/ws/chat/${roomName}/` : null;

  useEffect(() => {
    if (authLoading || !isValidChat) {
      if (!authLoading && !user) {
        setMessages(prev => [...prev, {type: 'system', text: 'Please log in to chat.'}]);
      } else if (!mentorId || String(mentorId).trim() === '' || String(mentorId) === 'undefined') {
        setMessages(prev => [...prev, {type: 'system', text: 'No mentor selected. Please go to "All Mentors" to start a chat.'}]);
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
          sender: msg.sender.email,
          timestamp: msg.timestamp,
          isRead: msg.is_read, // <--- NEW: Include is_read from history
          readAt: msg.read_at, // <--- NEW: Include read_at from history
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
        console.log(`Learner WebSocket Connected to: ${wsUrl}`);
        setIsConnected(true);
      };

      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Message from server (Learner):', data);

        // MODIFIED: Handle different message types received from the backend
        if (data.type === 'chat_message') {
            const messageType = (user && data.sender_id === user.user_id) ? 'my' : 'other';
            setMessages((prev) => [...prev, {
                type: messageType,
                text: data.message,
                sender: data.sender_email || 'Unknown',
                timestamp: data.timestamp,
                isRead: data.is_read || false,
                readAt: data.read_at || null
            }]);
            // NEW: Clear typing indicator if a message is received from the typing user
            if (typingUser && typingUser.id === data.sender_id) {
                setTypingUser(null);
            }
        } else if (data.type === 'message_read_status') { // <--- NEW: Handle 'message_read_status' event
            // This event means messages sent by 'reader_id' were marked as read.
            // We need to update messages that *we* sent and *they* read.
            // The event's reader_id is the recipient who just read the message.
            // So, if the reader_id matches our targetMentorId, it means our messages were read.
            if (data.reader_id === parseInt(targetMentorId)) { // Ensure comparison with int
                setMessages(prevMessages =>
                    prevMessages.map(msg => {
                        // If it's a message *we* sent, and it's not already read, mark it as read.
                        if (msg.type === 'my' && !msg.isRead) {
                            return { ...msg, isRead: true, readAt: data.timestamp };
                        }
                        return msg;
                    })
                );
                console.log(`Messages sent to ${data.reader_email} marked as read.`);
            }
        } else if (data.type === 'typing_status') { // <--- NEW: Handle 'typing_status' event
            // Only update typing status if it's from the other user
            if (user && data.sender_id !== user.user_id) {
                if (data.is_typing) {
                    setTypingUser({ id: data.sender_id, email: data.sender_email });
                } else {
                    setTypingUser(null);
                }
            }
        }
      };

      ws.current.onclose = (event) => {
        console.log('Learner WebSocket Disconnected:', event);
        setIsConnected(false);
        setTypingUser(null); // <--- NEW: Clear typing indicator on disconnect
        if (event.code !== 1000) {
            setMessages(prev => [...prev, { type: 'system', text: `Disconnected from chat. Code: ${event.code}. Reason: ${event.reason || 'Unknown'}` }]);
        }
      };

      ws.current.onerror = (error) => {
        console.error('Learner WebSocket Error:', error);
        setIsConnected(false);
        setTypingUser(null); // <--- NEW: Clear typing indicator on error
        setMessages(prev => [...prev, { type: 'system', text: 'WebSocket error occurred. Check console for details.' }]);
      };
    }

    return () => {
      if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
        console.log('Cleaning up Learner WebSocket.');
        ws.current.close();
      }
      ws.current = null;
      setIsConnected(false);
      setTypingUser(null); // <--- NEW: Clear typing indicator on unmount
    };
  }, [authLoading, isValidChat, wsUrl, user, targetMentorId]); // Added targetMentorId to dependencies

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // NEW: Function to send typing status (re-introduced)
  const sendTypingStatus = useCallback((isTyping) => {
    if (isConnected && user && user.user_id && ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: isTyping ? 'typing_start' : 'typing_stop',
        sender_id: user.user_id,
      }));
    }
  }, [user, isConnected]);

  const handleMessageInputChange = (e) => { // <--- NEW: Re-introduced for typing indicator
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
    
    // NEW: Clear typing status when message is sent
    if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
    }
    sendTypingStatus(false);

    const messageData = {
      type: 'chat_message', // <--- NEW: Explicitly set type for chat messages
      message: messageInput,
      recipient_id: mentorId,
    };

    ws.current.send(JSON.stringify(messageData));
    setMessageInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  if (authLoading || loadingHistory) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className={`${learnerTheme.text} text-lg`}>Loading chat...</p>
      </div>
    );
  }

  if (!user || !user.user_id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className={`${learnerTheme.text} text-lg`}>Please log in to access chat.</p>
      </div>
    );
  }

  if (!mentorId || String(mentorId).trim() === '' || String(mentorId) === 'undefined') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className={`${learnerTheme.text} text-lg`}>No mentor selected. Please go to "All Mentors" to start a chat.</p>
      </div>
    );
  }

  const roomNameDisplay = roomName;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-inter">
      <div className={`flex flex-col h-[80vh] sm:h-[90vh] w-full max-w-4xl mx-auto rounded-lg shadow-xl overflow-hidden ${learnerTheme.background} ${learnerTheme.border} border-2`}>
        {/* Chat Header */}
        <div className={`p-4 ${learnerTheme.primary} text-white text-xl sm:text-2xl font-bold rounded-t-md`}>
          Learner Chat {targetMentorId ? `with Mentor ${targetMentorId}` : ''} ({roomNameDisplay})
        </div>

        {/* Message Display Area */}
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          {messages.length === 0 && !loadingHistory ? (
            <div className="text-center text-gray-500 py-10">Start your conversation!</div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`mb-2 ${msg.type === 'my' ? 'text-right' : 'text-left'}`}>
                {msg.type !== 'system' && (
                  <span className={`text-xs ${msg.type === 'my' ? learnerTheme.myMessageText : learnerTheme.otherMessageText} opacity-75 mr-1`}>
                    {msg.type === 'my' ? 'You' : msg.sender}:
                  </span>
                )}
                <div
                  className={`inline-block p-3 rounded-lg max-w-[80%] break-words ${
                    msg.type === 'my'
                      ? `${learnerTheme.myMessageBg} ${learnerTheme.myMessageText} ml-auto`
                      : msg.type === 'other'
                      ? `${learnerTheme.messageBg} ${learnerTheme.otherMessageText} mr-auto`
                      : 'mx-auto bg-gray-200 text-gray-700 text-sm italic'
                  }`}
                >
                  {msg.text}
                  {msg.timestamp && (
                    <div className="text-xs opacity-60 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
                {/* NEW: Read Receipt Indicator */}
                {msg.type === 'my' && msg.isRead && (
                    <div className="text-xs text-gray-500 mt-1 flex items-center justify-end">
                        <svg className="w-3 h-3 text-blue-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                        </svg>
                        Read
                    </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* NEW: Typing Indicator */}
        {typingUser && (
            <div className="p-2 text-sm text-gray-600 italic text-center">
                {typingUser.email} is typing...
            </div>
        )}

        {/* Message Input */}
        <div className={`p-4 flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 ${learnerTheme.primary} rounded-b-md`}>
          <input
            type="text"
            value={messageInput}
            onChange={handleMessageInputChange} 
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className={`flex-1 w-full p-3 rounded-lg focus:outline-none focus:ring-2 ${learnerTheme.inputBorder} ${learnerTheme.inputBg} ${learnerTheme.text} text-base`}
            disabled={!isValidChat || !isConnected}
          />
          <button
            onClick={sendMessage}
            className={`w-full sm:w-auto px-6 py-3 rounded-lg text-white font-semibold shadow-md transition duration-300 ease-in-out ${learnerTheme.secondary} ${learnerTheme.buttonHover}`}
            disabled={!isValidChat || !isConnected}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default LearnerChat;
