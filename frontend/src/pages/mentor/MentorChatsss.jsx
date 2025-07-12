// src/pages/mentor/MentorChat.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react'; // Import useCallback
import { useAuth } from '../../contexts/AuthContext';
import { useParams } from 'react-router-dom';
import axiosInstance from '../../axios';

// Mentor-specific Tailwind color palette
const mentorTheme = {
  primary: 'bg-teal-700', // #0F766E
  secondary: 'bg-amber-500', // #F59E0B
  background: 'bg-emerald-50', // #ECFDF5
  text: 'text-emerald-950', // #064E3B
  border: 'border-teal-700',
  inputBg: 'bg-white',
  inputBorder: 'border-teal-300',
  buttonHover: 'hover:bg-teal-800',
  messageBg: 'bg-teal-100', // For messages from others
  myMessageBg: 'bg-amber-100', // For messages sent by 'my' user
  myMessageText: 'text-emerald-950',
  otherMessageText: 'text-emerald-950',
};

function MentorChat() {
  const { user, loading: authLoading } = useAuth();
  const { learnerId } = useParams();
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUser, setTypingUser] = useState(null); // NEW: State to hold typing user's email
  const typingTimeoutRef = useRef(null); // NEW: Ref for typing debounce timeout
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
        const response = await axiosInstance.get(`chat/history/${roomName}/`); // Correct relative path
        const historyMessages = response.data.map(msg => ({
          type: (user && msg.sender.id === user.user_id) ? 'my' : 'other',
          text: msg.content,
          sender: msg.sender.email,
          timestamp: msg.timestamp,
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

        // NEW: Handle different message types
        if (data.type === 'chat_message') {
            const messageType = (user && data.sender_id === user.user_id) ? 'my' : 'other';
            setMessages((prev) => [...prev, {
                type: messageType,
                text: data.message,
                sender: data.sender_email || 'Unknown',
                timestamp: data.timestamp
            }]);
            // Clear typing indicator if a message is received from the typing user
            if (typingUser && typingUser.id === data.sender_id) {
                setTypingUser(null);
            }
        } else if (data.type === 'typing_status') {
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
        console.log('Mentor WebSocket Disconnected:', event);
        setIsConnected(false);
        setTypingUser(null); // Clear typing indicator on disconnect
        if (event.code !== 1000) {
            setMessages((prev) => [...prev, { type: 'system', text: `Disconnected from chat. Code: ${event.code}. Reason: ${event.reason || 'Unknown'}` }]);
        }
      };

      ws.current.onerror = (error) => {
        console.error('Mentor WebSocket Error:', error);
        setIsConnected(false);
        setTypingUser(null); // Clear typing indicator on error
        setMessages((prev) => [...prev, { type: 'system', text: 'WebSocket error occurred. Check console for details.' }]);
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
  }, [authLoading, isValidChat, wsUrl, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // NEW: Function to send typing status
  const sendTypingStatus = useCallback((isTyping) => {
    if (isConnected && user && user.user_id) {
      ws.current.send(JSON.stringify({
        type: isTyping ? 'typing_start' : 'typing_stop',
        sender_id: user.user_id, // Send current user's ID
      }));
    }
  }, [user, isConnected]); // Dependencies on user and isConnected

  const handleMessageInputChange = (e) => {
    setMessageInput(e.target.value);

    // Only send typing status if connected and user is valid
    if (isConnected && user && user.user_id) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      } else {
        // If no timeout is active, user just started typing
        sendTypingStatus(true);
      }

      // Set a timeout to send 'typing_stop' after a brief pause
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStatus(false);
        typingTimeoutRef.current = null;
      }, 1000); // Send 'typing_stop' after 1 second of no typing
    }
  };

  const sendMessage = () => {
    if (messageInput.trim() === '' || !ws.current || ws.current.readyState !== WebSocket.OPEN) {
        console.warn('Cannot send message: WebSocket not open or empty message.');
        return;
    }

    // Clear any pending typing stop message immediately before sending chat message
    if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
    }
    sendTypingStatus(false); // Ensure typing status is stopped when message is sent

    const messageData = {
      type: 'chat_message', // NEW: Add type for chat messages
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

  if (authLoading || loadingHistory) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className={`${mentorTheme.text} text-lg`}>Loading chat...</p>
      </div>
    );
  }

  if (!user || !user.user_id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className={`${mentorTheme.text} text-lg`}>Please log in to access chat.</p>
      </div>
    );
  }

  if (!learnerId || String(learnerId).trim() === '' || String(learnerId) === 'undefined') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className={`${mentorTheme.text} text-lg`}>No learner selected. Please go to your conversations to start a chat.</p>
      </div>
    );
  }

  const roomNameDisplay = roomName;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-inter">
      <div className={`flex flex-col h-[80vh] sm:h-[90vh] w-full max-w-4xl mx-auto rounded-lg shadow-xl overflow-hidden ${mentorTheme.background} ${mentorTheme.border} border-2`}>
        {/* Chat Header */}
        <div className={`p-4 ${mentorTheme.primary} text-white text-xl sm:text-2xl font-bold rounded-t-md`}>
          Mentor Chat {targetLearnerId ? `with Learner ${targetLearnerId}` : ''} ({roomNameDisplay})
        </div>

        {/* Message Display Area */}
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          {messages.length === 0 && !loadingHistory ? (
            <div className="text-center text-gray-500 py-10">Start your conversation!</div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`mb-2 ${msg.type === 'my' ? 'text-right' : 'text-left'}`}>
                {msg.type !== 'system' && (
                  <span className={`text-xs ${msg.type === 'my' ? mentorTheme.myMessageText : mentorTheme.otherMessageText} opacity-75 mr-1`}>
                    {msg.type === 'my' ? 'You' : msg.sender}:
                  </span>
                )}
                <div
                  className={`inline-block p-3 rounded-lg max-w-[80%] break-words ${
                    msg.type === 'my'
                      ? `${mentorTheme.myMessageBg} ${mentorTheme.myMessageText} ml-auto`
                      : msg.type === 'other'
                      ? `${mentorTheme.messageBg} ${mentorTheme.otherMessageText} mr-auto`
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
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing Indicator */}
        {typingUser && (
            <div className="p-2 text-sm text-gray-600 italic text-center">
                {typingUser.email} is typing...
            </div>
        )}

        {/* Message Input */}
        <div className={`p-4 flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 ${mentorTheme.primary} rounded-b-md`}>
          <input
            type="text"
            value={messageInput}
            onChange={handleMessageInputChange} 
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className={`flex-1 w-full p-3 rounded-lg focus:outline-none focus:ring-2 ${mentorTheme.inputBorder} ${mentorTheme.inputBg} ${mentorTheme.text} text-base`}
            disabled={!isValidChat || !isConnected}
          />
          <button
            onClick={sendMessage}
            className={`w-full sm:w-auto px-6 py-3 rounded-lg text-white font-semibold shadow-md transition duration-300 ease-in-out ${mentorTheme.secondary} ${mentorTheme.buttonHover}`}
            disabled={!isValidChat || !isConnected}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default MentorChat;








