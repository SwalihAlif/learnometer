// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import api from '../axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔄 Fetch current user info
const fetchMe = async () => {
  try {
    const res = await api.get('/users/me/');
    setUser(res.data);
  } catch (error) {
    // Optional: Log meaningful info for debugging
    if (error.response?.status === 401) {
      console.warn('Unauthorized: Access token may be missing or expired');
    } else {
      console.error('Failed to fetch user profile:', error);
    }

    setUser(null); // Reset user on failure
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchMe();
  }, []);

  // ✅ Useful role booleans
  const isMentor = user?.role === 'Mentor';
  const isLearner = user?.role === 'Learner';
  const isAdmin = user?.role === 'Admin';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        refresh: fetchMe, // for post-login/logout
        isAuthenticated,
        isMentor,
        isLearner,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// 🔄 Easy to use in any component
export const useAuth = () => useContext(AuthContext);
