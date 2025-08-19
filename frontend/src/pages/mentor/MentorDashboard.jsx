import axiosInstance from '../../axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
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
import { StarIcon as StarSolid, PencilSquareIcon } from '@heroicons/react/24/solid';

const MentorDashboard = () => {
    const navigate = useNavigate();
    const [profileData, setProfileData] = useState(null);
    const [mentorMetrics, setMentorMetrics] = useState(null);



    // Prepare dynamic stats data with fallbacks and formatting
    const impactStats = [
        { icon: AcademicCapIcon, title: 'Total Sessions Conducted', value: mentorMetrics ? mentorMetrics.total_sessions_conducted : '–', color: 'text-teal-600' },
        { icon: UserGroupIcon, title: 'Total Learners Mentored', value: mentorMetrics ? mentorMetrics.total_learners_mentored : '–', color: 'text-blue-600' },
        // If you get average feedback rating from backend, replace value with mentorMetrics.avg_feedback_rating
        { icon: StarIcon, title: 'Average Feedback Rating', value: mentorMetrics ? mentorMetrics.average_rating : '4.8', color: 'text-yellow-600' },
        { icon: CalendarIcon, title: 'Upcoming Sessions', value: mentorMetrics ? mentorMetrics.upcoming_sessions : '–', color: 'text-purple-600' },
        {
            icon: CurrencyRupeeIcon,
            title: 'Total Earnings',
            value: mentorMetrics ? `₹${mentorMetrics.total_earnings.toLocaleString()}` : '–',
            color: 'text-green-600',
            hasButton: true
        }
    ];


    const fetchMetrics = async () => {
        try {
            const res = await axiosInstance.get('users/mentor-dash/');
            console.log("Mentor metrics: ", res.data)
            setMentorMetrics(res.data)

        } catch (err) {
            console.error(err)
        }
    }

    useEffect(() => {
        fetchProfileData();
        fetchMetrics();
    }, []);

    const fetchProfileData = async () => {
        try {
            const res = await axiosInstance.get('users/profile/');
            setProfileData(res.data);
        } catch (err) {
            console.error('Failed to fetch profile data', err);
        }
    };

    const handleEditClick = () => {

        navigate("/mentor/profile");
    };


    return (
        <div className="min-h-screen bg-emerald-50 p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Section 1: Impact Overview */}
                <div>
                    <h1 className="text-3xl font-bold text-emerald-900 mb-6">Metrics and Profile</h1>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        {impactStats.map((stat, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6 border border-emerald-100 hover:border-teal-300 transform hover:-translate-y-1"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-3 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600`}>
                                        <stat.icon className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                                <p className="text-sm font-medium text-emerald-700 mb-1">{stat.title}</p>
                                <p className="text-2xl font-bold text-emerald-900 mb-3">{stat.value}</p>
                                {stat.hasButton && (
                                    <button
                                        onClick={() => navigate('/mentor/earnings')}
                                        className="w-full bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-md hover:shadow-lg">
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
                            <button onClick={handleEditClick} title="Edit Profile">
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
                                        {profileData.phone || "N/A"}
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
            </div>
        </div>
    );
};

export default MentorDashboard;