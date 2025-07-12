// src/pages/mentor/MentorChatList.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axiosInstance from '../../axios'; // Your axios instance
import toast from 'react-hot-toast';

const mentorTheme = {
  primary: 'bg-teal-700', // #0F766E
  secondary: 'bg-amber-500', // #F59E0B
  background: 'bg-emerald-50', // #ECFDF5
  text: 'text-emerald-950', // #064E3B
  border: 'border-teal-700',
};

function MentorChatList() {
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConversations = async () => {
      if (authLoading || !user) {
        setLoadingConversations(false);
        return;
      }

      try {
        setLoadingConversations(true);
        // --- FIX HERE: Ensure the path is correct relative to axiosInstance.baseURL ---
        // If baseURL is http://localhost:8000/api/, then 'chat/conversations/' makes it
        // http://localhost:8000/api/chat/conversations/
        const response = await axiosInstance.get('chat/conversations/'); // This should be correct
        // If this still fails, try the absolute path for debugging:
        // const response = await axiosInstance.get('http://localhost:8000/api/chat/conversations/');
        // If the absolute path works, it means your axiosInstance.baseURL might be misconfigured or not applied.
        // But based on your VITE_API_URL, this relative path should be correct.
        // --- END FIX ---
        setConversations(response.data);
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
        toast.error('Failed to load conversations.');
      } finally {
        setLoadingConversations(false);
      }
    };

    fetchConversations();
  }, [user, authLoading]);

  const handleChatClick = (learnerId) => {
    navigate(`/mentor/chat/${learnerId}`);
  };

  if (authLoading || loadingConversations) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className={`${mentorTheme.text} text-lg`}>Loading conversations...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className={`${mentorTheme.text} text-lg`}>Please log in to view conversations.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 font-inter">
      <div className={`flex flex-col h-[80vh] sm:h-[90vh] w-full max-w-4xl mx-auto rounded-lg shadow-xl overflow-hidden ${mentorTheme.background} ${mentorTheme.border} border-2`}>
        {/* Header */}
        <div className={`p-4 ${mentorTheme.primary} text-white text-xl sm:text-2xl font-bold rounded-t-md`}>
          Your Conversations
        </div>

        {/* Conversation List */}
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          {conversations.length === 0 ? (
            <div className="text-center py-10 text-gray-600">
              <p>No active conversations found.</p>
              <p>Messages will appear here when learners contact you.</p>
            </div>
          ) : (
            conversations.map((partner) => (
              <div
                key={partner.id}
                className="flex items-center p-3 mb-3 bg-white rounded-lg shadow-sm cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleChatClick(partner.id)}
              >
                <img
                  src={partner.profile_picture || "https://placehold.co/50x50/E0E7FF/4338CA?text=User"}
                  alt={partner.full_name || partner.email}
                  className="w-12 h-12 rounded-full object-cover mr-4 border-2 border-gray-200"
                />
                <div>
                  <h3 className="font-semibold text-gray-900">{partner.full_name || partner.email}</h3>
                  <p className="text-sm text-gray-600">{partner.email}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default MentorChatList;
