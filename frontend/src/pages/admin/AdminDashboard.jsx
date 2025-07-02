import { useEffect, useState } from 'react';
import axiosInstance from '../../axios';
import { Users, GraduationCap, UserCheck, BookOpen, FolderOpen, Hash, Calendar, Clock, CheckCircle, XCircle, Star, MessageSquare, Link, IndianRupee, TrendingUp, Activity } from 'lucide-react';



const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get('adminpanel/dashboard-metrics/')
      .then(res => {
        setMetrics(res.data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching metrics:', err);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-amber-400 text-lg font-medium">Loading dashboard metrics...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center text-red-400">
          <XCircle className="h-16 w-16 mx-auto mb-4" />
          <p className="text-lg font-medium">Failed to load metrics</p>
        </div>
      </div>
    );
  }

  const MetricCard = ({ icon: Icon, title, value, color = "text-amber-400", suffix = "" }) => (
    <div className="group relative overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-amber-400/30 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-400/10 hover:-translate-y-1">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-slate-700/50 ${color.replace('text-', 'text-')} group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="text-slate-400 group-hover:text-amber-400 transition-colors duration-300">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>
        <p className="text-slate-400 text-sm font-medium mb-2 group-hover:text-slate-300 transition-colors duration-300">{title}</p>
        <div className="flex items-baseline space-x-1">
          <h3 className={`text-2xl lg:text-3xl font-bold ${color} group-hover:scale-105 transition-transform duration-300`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </h3>
          {suffix && <span className="text-slate-400 text-sm font-medium">{suffix}</span>}
        </div>
      </div>
    </div>
  );

  const formatRevenue = (amount) => {
    if (amount >= 100000) {
      return `${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toString();
  };

  const metricsData = [
    { icon: Users, title: "Total Users", value: metrics.total_users, color: "text-blue-400" },
    { icon: GraduationCap, title: "Learners", value: metrics.total_learners, color: "text-green-400" },
    { icon: UserCheck, title: "Mentors", value: metrics.total_mentors, color: "text-purple-400" },
    { icon: BookOpen, title: "Courses", value: metrics.total_courses, color: "text-indigo-400" },
    { icon: FolderOpen, title: "Main Topics", value: metrics.total_main_topics, color: "text-cyan-400" },
    { icon: Hash, title: "Subtopics", value: metrics.total_subtopics, color: "text-teal-400" },
    { icon: Calendar, title: "Total Sessions", value: metrics.total_sessions, color: "text-orange-400" },
    { icon: Clock, title: "Pending Sessions", value: metrics.pending_sessions, color: "text-yellow-400" },
    { icon: CheckCircle, title: "Completed Sessions", value: metrics.completed_sessions, color: "text-emerald-400" },
    { icon: XCircle, title: "Cancelled/Rejected", value: metrics.cancelled_sessions, color: "text-red-400" },
    { icon: Star, title: "Total Reviews", value: metrics.total_reviews, color: "text-amber-400" },
    { icon: Activity, title: "Average Rating", value: metrics.average_rating, color: "text-yellow-400", suffix: "⭐" },
    { icon: MessageSquare, title: "Total Feedbacks", value: metrics.total_feedbacks, color: "text-pink-400" },
    { icon: Link, title: "Feedbacks with Links", value: metrics.feedback_with_links, color: "text-violet-400" },
    { icon: IndianRupee, title: "Revenue", value: `₹${formatRevenue(metrics.total_revenue)}`, color: "text-green-500" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-amber-400/10 rounded-xl border border-amber-400/20">
              <Activity className="h-8 w-8 text-amber-400" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-slate-400 mt-1">Monitor your platform's key metrics and performance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {metricsData.map((metric, index) => (
            <MetricCard
              key={index}
              icon={metric.icon}
              title={metric.title}
              value={metric.value}
              color={metric.color}
              suffix={metric.suffix}
            />
          ))}
        </div>

        {/* Summary Cards */}
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <Users className="h-6 w-6 text-blue-400" />
              <span>User Overview</span>
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-slate-700/30 rounded-xl">
                <p className="text-3xl font-bold text-green-400">{metrics.total_learners}</p>
                <p className="text-slate-400 text-sm">Active Learners</p>
              </div>
              <div className="text-center p-4 bg-slate-700/30 rounded-xl">
                <p className="text-3xl font-bold text-purple-400">{metrics.total_mentors}</p>
                <p className="text-slate-400 text-sm">Expert Mentors</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <Star className="h-6 w-6 text-amber-400" />
              <span>Quality Metrics</span>
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Avg Rating</span>
                <span className="text-2xl font-bold text-amber-400">{metrics.average_rating} ⭐</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total Reviews</span>
                <span className="text-lg font-semibold text-white">{metrics.total_reviews.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;