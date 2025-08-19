import axiosInstance from '../../axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { format } from 'date-fns';  
import {
    BookOpenIcon,
    CheckCircleIcon,
    FireIcon,
    ChartBarIcon,
    CurrencyDollarIcon,
    GiftIcon,
    CameraIcon,
    PencilIcon,
    AcademicCapIcon,
    UserGroupIcon,
    StarIcon,
    CalendarIcon,
    CurrencyRupeeIcon,
    EnvelopeIcon,
    PhoneIcon,
    BriefcaseIcon,
    ClockIcon,
    PencilSquareIcon,
} from '@heroicons/react/24/outline';

const metricDetails = [
    { key: 'courses_created', title: 'Courses Created', icon: BookOpenIcon, color: 'text-blue-600' },
    { key: 'topics', title: 'Main Topics', icon: CheckCircleIcon, color: 'text-green-600' },
    { key: 'subtopics', title: 'Subtopics', icon: FireIcon, color: 'text-orange-600' },
    { key: 'progress', title: 'Progress', icon: ChartBarIcon, color: 'text-purple-600' },
    { key: 'total_spent', title: 'Total Spent', icon: CurrencyDollarIcon, color: 'text-red-600' },
    { key: 'referral_earnings', title: 'Referral Earnings', icon: GiftIcon, color: 'text-yellow-600' }
];

const LearnerDashboard = () => {
    const navigate = useNavigate();
    const [profileData, setProfileData] = useState(null);
    const [learnerMetrics, setLearnerMetrics] = useState(null);

    const fetchMetrics = async () => {
        try {
            const res = await axiosInstance.get('users/learner-dash/');
            setLearnerMetrics(res.data);
            console.log("Learner metrics: ", res.data)
        } catch (err) {
            console.error(err);
        }
    };

    const fetchProfile = async () => {
        try {
            const res = await axiosInstance.get('users/profile/');
            setProfileData(res.data);
            console.log("Profile data: ", res.data)
        } catch (err) {
            console.error("Failed to fetch profile", err);
        }
    };

    useEffect(() => {
        fetchProfile();
        fetchMetrics();
    }, []);

    const handleEditClick = () => {
        navigate("/learner/profile");
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Metrics Cards */}
                <h1 className="text-3xl font-bold text-indigo-900 mb-6">Metrics and Profile</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {metricDetails.map((metric, index) => (
                        <div key={index} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6 border border-gray-100 hover:border-indigo-200 transform hover:-translate-y-1">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">{metric.title}</p>
                                    <p className={`text-2xl font-bold text-indigo-900 ${metric.color}`}>
                                        {learnerMetrics
                                            ? metric.key === 'progress'
                                                ? `${learnerMetrics[metric.key] || 0}%`
                                                : ['total_spent', 'referral_earnings'].includes(metric.key)
                                                    ? `₹${learnerMetrics[metric.key] || 0}`
                                                    : learnerMetrics[metric.key] ?? '0'
                                            : 'Loading...'}
                                    </p>
                                </div>
                                <div className="p-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600">
                                    <metric.icon className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Section: Profile Summary */}
                {profileData && (
                    <div className="bg-white rounded-xl shadow-md p-6 border border-purple-100 relative">
                        {/* Edit icon */}
                        <div className="absolute top-4 right-4">
                            <button onClick={handleEditClick} title="Edit Profile">
                                <PencilSquareIcon className="w-5 h-5 text-purple-600 hover:text-purple-800" />
                            </button>
                        </div>

                        <h2 className="text-2xl font-bold text-purple-900 mb-6">Profile Summary</h2>
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-shrink-0">
                                {profileData.profile_picture ? (
                                    <img
                                        src={profileData.profile_picture}
                                        alt="Profile"
                                        className="w-32 h-32 rounded-full object-cover border-2 border-purple-500"
                                    />
                                ) : (
                                    <div className="w-32 h-32 bg-gradient-to-br from-purple-600 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                                        {profileData.full_name?.charAt(0) || "?"}
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 space-y-4">
                                <div>
                                    <h3 className="text-2xl font-bold text-purple-900">{profileData.full_name}</h3>
                                    <p className="text-lg font-semibold text-purple-600">{profileData.preferred_categories?.join(", ")}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center text-purple-700">
                                        <EnvelopeIcon className="h-5 w-5 mr-2 text-purple-600" />
                                        {profileData.email}
                                    </div>
                                    <div className="flex items-center text-purple-700">
                                        <PhoneIcon className="h-5 w-5 mr-2 text-purple-600" />
                                        {profileData.phone || "N/A"}
                                    </div>
                                    <div className="flex items-center text-purple-700">
                                        <BriefcaseIcon className="h-5 w-5 mr-2 text-purple-600" />
                                        <span className="font-medium mr-1">Goal:</span>
                                        {profileData.learning_goals}
                                    </div>
                                    <div className="flex items-center text-purple-700">
                                        <ClockIcon className="h-5 w-5 mr-2 text-purple-600" />
                                        🗓️ Member Since {format(new Date(profileData.created_at), "MMM yyyy")}
                                    </div>
                                </div>

                                {profileData.preferred_categories?.length > 0 && (
                                    <div>
                                        <p className="text-sm font-semibold text-purple-800 mb-2">🧠 Specialized Subjects:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {profileData.preferred_categories.map((subject, idx) => (
                                                <span
                                                    key={idx}
                                                    className="bg-gradient-to-r from-purple-100 to-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium border border-purple-200"
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

            </div>
        </div>
    );
};

export default LearnerDashboard;
