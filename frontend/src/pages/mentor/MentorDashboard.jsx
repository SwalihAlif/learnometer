import axiosInstance from '../../axios';
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
  AcademicCapIcon,
  UserGroupIcon,
  StarIcon,
  CalendarIcon,
  CurrencyRupeeIcon,
  EnvelopeIcon,
  PhoneIcon,
  BriefcaseIcon,
  ClockIcon,
  BanknotesIcon,
  TrophyIcon,
  BellIcon,
  LightBulbIcon,
  UserPlusIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { StarIcon as StarSolid, PencilSquareIcon } from '@heroicons/react/24/solid';

const MentorDashboard = () => {
  const [profileData, setProfileData] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({
    full_name: '',
    contact_number: '',
    bio: ''
  });

  const [earningsToggle, setEarningsToggle] = useState('Monthly');
  const [rankToggle, setRankToggle] = useState('Amount Earned');
  const [rankDropdownOpen, setRankDropdownOpen] = useState(false);

  const impactStats = [
    { icon: AcademicCapIcon, title: 'Total Sessions Conducted', value: '147', color: 'text-teal-600' },
    { icon: UserGroupIcon, title: 'Total Learners Mentored', value: '89', color: 'text-blue-600' },
    { icon: StarIcon, title: 'Average Feedback Rating', value: '4.8', color: 'text-yellow-600' },
    { icon: CalendarIcon, title: 'Upcoming Sessions', value: '8', color: 'text-purple-600' },
    { icon: CurrencyRupeeIcon, title: 'Total Earnings', value: '₹45,600', color: 'text-green-600', hasButton: true }
  ];

  const upcomingSessions = [
    { topic: 'Advanced React Patterns', learner: 'Priya Sharma', date: '2025-06-24', time: '10:00 AM' },
    { topic: 'Python Data Analysis', learner: 'Raj Kumar', date: '2025-06-24', time: '2:00 PM' },
    { topic: 'Machine Learning Basics', learner: 'Anita Singh', date: '2025-06-25', time: '11:00 AM' }
  ];

  const recentFeedback = [
    { learner: 'Sarah Johnson', rating: 5, comment: 'Excellent explanation of complex concepts. Very patient and helpful!' },
    { learner: 'Mike Chen', rating: 4, comment: 'Great session on React hooks. Looking forward to the next one.' },
    { learner: 'Lisa Rodriguez', rating: 5, comment: 'Amazing mentor! Made Python so easy to understand.' }
  ];

  const payoutHistory = [
    { amount: '₹5,000', date: '2025-06-01', status: 'Paid' },
    { amount: '₹3,200', date: '2025-05-15', status: 'Paid' },
    { amount: '₹4,800', date: '2025-05-01', status: 'Paid' },
    { amount: '₹2,100', date: '2025-04-15', status: 'Paid' }
  ];

  const notifications = [
    { icon: '📌', message: 'New session booked by Alif', date: 'Jun 16, 2025' },
    { icon: '📝', message: 'Feedback received from Riya', date: 'Jun 15, 2025' },
    { icon: '💸', message: 'Payout of ₹5,000 confirmed', date: 'Jun 1, 2025' }
  ];

  const specializations = ['Data Science', 'Python', 'Machine Learning', 'React', 'JavaScript'];

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <StarIconSolid
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const getRankData = () => {
    const rankData = {
      'Amount Earned': { rank: '#3', value: '₹45,600', total: 'among 1,245 mentors' },
      'Sessions Conducted': { rank: '#7', value: '147', total: 'among 1,245 mentors' },
      'Learners Assisted': { rank: '#5', value: '89', total: 'among 1,245 mentors' }
    };
    return rankData[rankToggle];
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const res = await axiosInstance.get('users/profile/');
      setProfileData(res.data);
      setEditData({
        full_name: res.data.full_name || '',
        contact_number: res.data.contact_number || '',
        bio: res.data.bio || ''
      });
    } catch (err) {
      console.error('Failed to fetch profile data', err);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = async () => {
    try {
      await axiosInstance.put('users/profile/', editData); // Your actual endpoint
      setIsEditModalOpen(false);
      fetchProfileData();
    } catch (err) {
      console.error('Update failed', err);
    }
  };



  return (
    <div className="min-h-screen bg-emerald-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Section 1: Impact Overview */}
        <div>
          <h1 className="text-3xl font-bold text-emerald-900 mb-6">Impact Overview</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {impactStats.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6 border border-emerald-100 hover:border-teal-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <p className="text-sm font-medium text-emerald-700 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-emerald-900 mb-3">{stat.value}</p>
                {stat.hasButton && (
                  <button className="w-full bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-md hover:shadow-lg">
                    Withdraw
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

      {/* Section: Profile Summary */}
      {profileData && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-emerald-100 relative">
          {/* Edit icon */}
          <div className="absolute top-4 right-4">
            <button onClick={() => setIsEditModalOpen(true)} title="Edit Profile">
              <PencilSquareIcon className="w-5 h-5 text-emerald-600 hover:text-emerald-800" />
            </button>
          </div>

          <h2 className="text-2xl font-bold text-emerald-900 mb-6">Profile Summary</h2>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              {profileData.profile_picture ? (
                <img
                  src={profileData.profile_picture}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-2 border-emerald-500"
                />
              ) : (
                <div className="w-32 h-32 bg-gradient-to-br from-teal-600 to-emerald-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                  {profileData.full_name?.charAt(0) || "?"}
                </div>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-2xl font-bold text-emerald-900">{profileData.full_name}</h3>
                <p className="text-lg font-semibold text-teal-600">{profileData.preferred_categories?.join(", ")}</p>
                <p className="text-emerald-700 mt-2">{profileData.bio}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center text-emerald-700">
                  <EnvelopeIcon className="h-5 w-5 mr-2 text-teal-600" />
                  {profileData.email}
                </div>
                <div className="flex items-center text-emerald-700">
                  <PhoneIcon className="h-5 w-5 mr-2 text-teal-600" />
                  {profileData.contact_number || "N/A"}
                </div>
                <div className="flex items-center text-emerald-700">
                  <BriefcaseIcon className="h-5 w-5 mr-2 text-teal-600" />
                  {profileData.experience_years || 0}+ Years Experience
                </div>
                <div className="flex items-center text-emerald-700">
                  <ClockIcon className="h-5 w-5 mr-2 text-teal-600" />
                  🗓️ Member Since {format(new Date(profileData.created_at), "MMM yyyy")}
                </div>
              </div>

              {profileData.preferred_categories?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-emerald-800 mb-2">🧠 Specialized Subjects:</p>
                  <div className="flex flex-wrap gap-2">
                    {profileData.preferred_categories.map((subject, idx) => (
                      <span
                        key={idx}
                        className="bg-gradient-to-r from-teal-100 to-emerald-100 text-teal-800 px-3 py-1 rounded-full text-sm font-medium border border-teal-200"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

 {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-lg">
            <h3 className="text-xl font-semibold text-emerald-800 mb-4">Edit Profile</h3>
            <div className="space-y-3">
              <input
                name="full_name"
                value={editData.full_name}
                onChange={handleEditChange}
                className="w-full border p-2 rounded text-sm"
                placeholder="Full Name"
              />
              <input
                name="contact_number"
                value={editData.contact_number}
                onChange={handleEditChange}
                className="w-full border p-2 rounded text-sm"
                placeholder="Contact Number"
              />
              <textarea
                name="bio"
                value={editData.bio}
                onChange={handleEditChange}
                className="w-full border p-2 rounded text-sm"
                placeholder="Bio"
                rows="3"
              />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleProfileUpdate}
                className="px-4 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}


        {/* Section 3: Session Schedule + Learner Feedback */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Session Schedule */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-emerald-100">
            <h3 className="text-xl font-bold text-emerald-900 mb-4 flex items-center">
              <CalendarIcon className="h-6 w-6 mr-2 text-teal-600" />
              Session Schedule Overview
            </h3>
            <div className="space-y-3">
              {upcomingSessions.map((session, index) => (
                <div key={index} className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200 hover:border-teal-300 transition-all duration-300">
                  <h4 className="font-semibold text-emerald-900">{session.topic}</h4>
                  <p className="text-sm text-emerald-700">with {session.learner}</p>
                  <p className="text-sm text-teal-600 font-medium">{session.date} at {session.time}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Learner Feedback */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-emerald-100">
            <h3 className="text-xl font-bold text-emerald-900 mb-4 flex items-center">
              <StarIcon className="h-6 w-6 mr-2 text-teal-600" />
              Learner Feedback
            </h3>
            <div className="space-y-4">
              {recentFeedback.map((feedback, index) => (
                <div key={index} className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-emerald-900">{feedback.learner}</h4>
                    <div className="flex">
                      {renderStars(feedback.rating)}
                    </div>
                  </div>
                  <p className="text-sm text-emerald-700 italic">"{feedback.comment}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 4: Earning Analytics */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-emerald-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-emerald-900 flex items-center">
              <ChartBarIcon className="h-6 w-6 mr-2 text-teal-600" />
              Earning Analytics
            </h3>
            <div className="flex bg-emerald-100 rounded-lg p-1">
              {['Monthly', 'Yearly', 'All Time'].map((period) => (
                <button
                  key={period}
                  onClick={() => setEarningsToggle(period)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${earningsToggle === period
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'text-emerald-700 hover:text-teal-600'
                    }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Placeholder */}
          <div className="h-64 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg flex items-center justify-center border border-emerald-200 mb-6">
            <div className="text-center">
              <ChartBarIcon className="h-16 w-16 text-teal-400 mx-auto mb-4" />
              <p className="text-emerald-700 font-medium">Earnings Chart - {earningsToggle}</p>
              <p className="text-sm text-emerald-600 mt-2">Analytics visualization would go here</p>
            </div>
          </div>

          {/* Payout History */}
          <div className="mb-6">
            <h4 className="text-lg font-bold text-emerald-900 mb-4">Payout History</h4>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-emerald-100">
                    <th className="text-left p-3 text-emerald-800 font-semibold">Amount</th>
                    <th className="text-left p-3 text-emerald-800 font-semibold">Date</th>
                    <th className="text-left p-3 text-emerald-800 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payoutHistory.map((payout, index) => (
                    <tr key={index} className="border-b border-emerald-100 hover:bg-emerald-50 transition-colors duration-200">
                      <td className="p-3 font-semibold text-emerald-900">{payout.amount}</td>
                      <td className="p-3 text-emerald-700">{payout.date}</td>
                      <td className="p-3">
                        <span className="flex items-center text-green-600">
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          ✅ {payout.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rank Section */}
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-lg border border-amber-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-emerald-900 flex items-center">
                <TrophyIcon className="h-6 w-6 mr-2 text-amber-600" />
                Your Rank
              </h4>
              <div className="relative">
                <button
                  onClick={() => setRankDropdownOpen(!rankDropdownOpen)}
                  className="bg-white border border-emerald-300 rounded-lg px-4 py-2 text-emerald-800 font-medium flex items-center hover:bg-emerald-50 transition-colors duration-200"
                >
                  {rankToggle}
                  <ChevronDownIcon className="h-4 w-4 ml-2" />
                </button>
                {rankDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-emerald-200 rounded-lg shadow-lg z-10">
                    {['Amount Earned', 'Sessions Conducted', 'Learners Assisted'].map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setRankToggle(option);
                          setRankDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-emerald-800 hover:bg-emerald-50 first:rounded-t-lg last:rounded-b-lg transition-colors duration-200"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-amber-600">{getRankData().rank}</p>
                <p className="text-sm text-emerald-700">{getRankData().total}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-emerald-900">{getRankData().value}</p>
                <p className="text-sm text-emerald-600">Current Value</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Notifications */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-emerald-100">
          <h3 className="text-xl font-bold text-emerald-900 mb-4 flex items-center">
            <BellIcon className="h-6 w-6 mr-2 text-teal-600" />
            Notifications
          </h3>
          <div className="space-y-3">
            {notifications.map((notification, index) => (
              <div key={index} className="flex items-center p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200 hover:border-teal-300 transition-all duration-300">
                <span className="text-2xl mr-4">{notification.icon}</span>
                <div className="flex-1">
                  <p className="text-emerald-900 font-medium">{notification.message}</p>
                  <p className="text-sm text-emerald-600">{notification.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 6: Tips & Growth */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-emerald-100">
          <h3 className="text-xl font-bold text-emerald-900 mb-4">Tips & Growth</h3>
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-lg border border-amber-200 mb-4">
            <div className="flex items-start">
              <LightBulbIcon className="h-8 w-8 text-amber-600 mr-4 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-emerald-900 mb-2">💡 Weekly Tip</h4>
                <p className="text-emerald-700">"Encourage learners to ask questions during sessions to deepen understanding. Active participation leads to better learning outcomes and higher satisfaction rates."</p>
              </div>
            </div>
          </div>
          <button className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg flex items-center">
            <UserPlusIcon className="h-5 w-5 mr-2" />
            Join Mentor Community
          </button>
        </div>
      </div>
    </div>
  );
};

export default MentorDashboard;