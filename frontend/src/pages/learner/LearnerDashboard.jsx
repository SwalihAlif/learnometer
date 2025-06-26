import axiosInstance from '../../axios';
import React, { useEffect, useState } from 'react';
import {
  BookOpenIcon,
  CheckCircleIcon,
  FireIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  GiftIcon,
  CalendarIcon,
  PlayIcon,
  PlusIcon,
  ChatBubbleLeftRightIcon,
  CameraIcon,
  PencilIcon,
  KeyIcon,
  GlobeAltIcon,
  DocumentArrowDownIcon,
  XMarkIcon,
  BellIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';

const LearnerDashboard = () => {

  const [profileData, setProfileData] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({});

  const [progressToggle, setProgressToggle] = useState('This Week');
  const [preferences, setPreferences] = useState({
    dailyReminders: true,
    sessionNotifications: true,
    progressReports: false
  });

  const stats = [
    { icon: BookOpenIcon, title: 'Courses Created', value: '12', color: 'text-blue-600' },
    { icon: CheckCircleIcon, title: 'Topics Completed', value: '45', color: 'text-green-600' },
    { icon: FireIcon, title: 'Day Streak', value: '23', color: 'text-orange-600' },
    { icon: ChartBarIcon, title: 'Progress', value: '78%', color: 'text-purple-600' },
    { icon: CurrencyDollarIcon, title: 'Total Spent', value: '$240', color: 'text-red-600' },
    { icon: GiftIcon, title: 'Referral Earnings', value: '$95', color: 'text-yellow-600' }
  ];

  const upcomingSessions = [
    { date: '2025-06-24', time: '10:00 AM', mentor: 'Dr. Sarah Johnson', topic: 'React Advanced Patterns' },
    { date: '2025-06-25', time: '2:00 PM', mentor: 'Prof. Mike Chen', topic: 'Database Design' },
    { date: '2025-06-26', time: '11:00 AM', mentor: 'Lisa Rodriguez', topic: 'UI/UX Principles' }
  ];

  const quickActions = [
    { icon: CheckCircleIcon, label: 'Mark Habits Done', color: 'bg-green-600 hover:bg-green-700' },
    { icon: PlayIcon, label: 'Resume Course', color: 'bg-blue-600 hover:bg-blue-700' },
    { icon: PlusIcon, label: 'Add Topic', color: 'bg-purple-600 hover:bg-purple-700' },
    { icon: ChatBubbleLeftRightIcon, label: 'Daily Quote', color: 'bg-yellow-600 hover:bg-yellow-700' }
  ];

  const favoriteSubjects = ['JavaScript', 'Python', 'HTML', 'React', 'Node.js'];

  const togglePreference = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getRankFromStreak = (streak) => {
    if (streak >= 30) return { rank: 'Master', color: 'text-purple-600', bgColor: 'bg-purple-100' };
    if (streak >= 15) return { rank: 'Expert', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (streak >= 7) return { rank: 'Advanced', color: 'text-green-600', bgColor: 'bg-green-100' };
    return { rank: 'Beginner', color: 'text-gray-600', bgColor: 'bg-gray-100' };
  };

  const userRank = getRankFromStreak(23);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axiosInstance.get('users/profile/');
      setProfileData(res.data);
      setEditData(res.data); // for editing
    } catch (err) {
      console.error("Failed to fetch profile", err);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      await axiosInstance.put("users/profile/", editData);
      setIsEditModalOpen(false);
      fetchProfile();
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Left Section - 2/3 width */}
          <div className="flex-1 lg:w-2/3 space-y-6">

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6 border border-gray-100 hover:border-indigo-200 transform hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                      <p className="text-2xl font-bold text-indigo-900">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Upcoming Sessions */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-indigo-900 mb-4 flex items-center">
                <CalendarIcon className="h-6 w-6 mr-2 text-indigo-600" />
                📅 Upcoming Sessions
              </h2>
              <div className="space-y-3">
                {upcomingSessions.map((session, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100 hover:border-indigo-200 transition-all duration-300">
                    <div className="flex-1">
                      <h3 className="font-semibold text-indigo-900">{session.topic}</h3>
                      <p className="text-sm text-gray-600">with {session.mentor}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-indigo-700">{session.date}</p>
                      <p className="text-sm text-gray-600">{session.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-indigo-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action, index) => (
                  <button key={index} className={`${action.color} text-white px-4 py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transform hover:-translate-y-1`}>
                    <action.icon className="h-5 w-5" />
                    <span className="text-sm">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Learning Progress */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-indigo-900 flex items-center">
                  <ArrowTrendingUpIcon className="h-6 w-6 mr-2 text-indigo-600" />
                  📈 Learning Progress
                </h2>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  {['This Week', 'This Month'].map((period) => (
                    <button
                      key={period}
                      onClick={() => setProgressToggle(period)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${progressToggle === period
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-gray-600 hover:text-indigo-600'
                        }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-64 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg flex items-center justify-center border border-indigo-100">
                <div className="text-center">
                  <ChartBarIcon className="h-16 w-16 text-indigo-400 mx-auto mb-4" />
                  <p className="text-gray-600">Learning Progress Chart - {progressToggle}</p>
                  <p className="text-sm text-gray-500 mt-2">Chart visualization would go here</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - 1/3 width */}
          <div className="lg:w-1/3 space-y-6">

            {/* Profile Card */}
            {profileData && (
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <div className="text-center mb-6">
                  <div className="relative inline-block">
                    {/* Profile Image or Initials */}
                    {profileData.profile_picture ? (
                      <img
                        src={profileData.profile_picture}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover mx-auto mb-3 border-2 border-indigo-400"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                        {profileData.full_name?.split(" ").map(w => w[0]).join("").toUpperCase() || "U"}
                      </div>
                    )}

                    {/* Upload Button */}
                    <button
                      className="absolute -bottom-1 -right-1 bg-yellow-400 hover:bg-yellow-500 p-2 rounded-full shadow-md transition-all duration-300"
                      onClick={() => document.getElementById('fileInput').click()}
                    >
                      <CameraIcon className="h-4 w-4 text-white" />
                    </button>


                  </div>

                  {/* Name, Email, Phone */}
                  <h3 className="text-xl font-bold text-indigo-900">
                    {profileData.full_name || "Unknown User"}
                  </h3>
                  <p className="text-gray-600">{profileData.email || "No email provided"}</p>
                  <p className="text-gray-600">{profileData.contact_number || "No contact number"}</p>

                  {/* Edit Button */}
                  <button
                    className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center mx-auto"
                    onClick={() => setIsEditModalOpen(true)}  
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                     Edit Profile
                  </button>
                </div>
              </div>
            )}


 {/* Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md relative">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-red-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold mb-4">Edit Profile</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700">Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  value={editData.full_name || ""}
                  onChange={handleEditChange}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700">Contact Number</label>
                <input
                  type="text"
                  name="contact_number"
                  value={editData.contact_number || ""}
                  onChange={handleEditChange}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700">Bio</label>
                <textarea
                  name="bio"
                  value={editData.bio || ""}
                  onChange={handleEditChange}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div className="text-right">
                <button
                  onClick={handleSave}
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

            {/* Learning Preferences */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-indigo-900 mb-4">Learning Preferences</h3>

              <div className="space-y-4 mb-6">
                {[
                  { key: 'dailyReminders', label: '🕒 Daily Reminders', icon: ClockIcon },
                  { key: 'sessionNotifications', label: '🔔 Session Notifications', icon: BellIcon },
                  { key: 'progressReports', label: '📈 Progress Reports', icon: ArrowTrendingUpIcon }
                ].map(({ key, label, icon: Icon }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Icon className="h-5 w-5 text-indigo-600 mr-2" />
                      <span className="text-gray-700">{label}</span>
                    </div>
                    <button
                      onClick={() => togglePreference(key)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences[key] ? 'bg-indigo-600' : 'bg-gray-300'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences[key] ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-indigo-900 mb-3">Favorite Subjects</h4>
                <div className="flex flex-wrap gap-2">
                  {favoriteSubjects.map((subject, index) => (
                    <span key={index} className="bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium border border-indigo-200">
                      {subject}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                <div className="flex items-center">
                  <TrophyIcon className="h-6 w-6 text-yellow-600 mr-2" />
                  <div>
                    <p className="font-semibold text-gray-800">🏅 Rank</p>
                    <p className="text-sm text-gray-600">Based on daily streak</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${userRank.color} ${userRank.bgColor}`}>
                  {userRank.rank}
                </span>
              </div>
            </div>

            {/* Account Settings */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-indigo-900 mb-4">🔐 Account Settings</h3>
              <div className="space-y-3">
                {[
                  { icon: KeyIcon, label: '🔑 Change Password', color: 'text-blue-600 hover:text-blue-700' },
                  { icon: GlobeAltIcon, label: '🌐 Language Preferences', color: 'text-green-600 hover:text-green-700' },
                  { icon: DocumentArrowDownIcon, label: '💾 Export Data', color: 'text-purple-600 hover:text-purple-700' },
                  { icon: XMarkIcon, label: '❌ Deactivate Account', color: 'text-red-600 hover:text-red-700' }
                ].map((setting, index) => (
                  <button key={index} className={`w-full flex items-center p-3 rounded-lg transition-all duration-300 hover:bg-gray-50 ${setting.color}`}>
                    <setting.icon className="h-5 w-5 mr-3" />
                    <span className="font-medium">{setting.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearnerDashboard;