import React, { useState, useEffect } from 'react';
import { Search, Users, DollarSign, TrendingUp, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import axiosInstance from '../../axios';

const AdminPremiumAndReferral = () => {
    const [summaryData, setSummaryData] = useState({
        total_subscribers: 0,
        total_revenue: 0,
        total_referral_earnings_paid: 0
    });
    const [subscriptions, setSubscriptions] = useState([]);
    const [referrals, setReferrals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [subscriptionPagination, setSubscriptionPagination] = useState({});
    const [referralPagination, setReferralPagination] = useState({});



    useEffect(() => {
        fetchData();
    }, [currentPage, searchQuery]);

const fetchData = async () => {
  setLoading(true);
  try {
    // Fetch summary
    const summaryRes = await axiosInstance.get('premium/admin/premium-summary/');
    console.log("Summary Data: ", summaryRes.data)
    setSummaryData(summaryRes.data);

    // Fetch subscriptions
    const subRes = await axiosInstance.get(`premium/admin/premium-subscriptions/?page=${currentPage}&search=${searchQuery}`);
    console.log("Subscription data: ", subRes.data.results || [])
    setSubscriptions(subRes.data.results || []);
    setSubscriptionPagination({
        count: subRes.data.count,
        next: subRes.data.next,
        previous: subRes.data.previous
    });
    
    // Fetch referrals
    const refRes = await axiosInstance.get(`premium/admin/referral-earnings/?page=${currentPage}&search=${searchQuery}`);
    console.log("Referral data: ", refRes.data.results || [])
    setReferrals(refRes.data.results || []);
    setReferralPagination({
      count: refRes.data.count,
      next: refRes.data.next,
      previous: refRes.data.previous
    });

  } catch (error) {
    console.error('Error fetching data:', error);
    // Optional: fallback mock data for dev
  } finally {
    setLoading(false);
  }
};


const handleSearch = (query) => {
  setSearchQuery(query.trim());
  setCurrentPage(1);
};

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const SummaryCard = ({ title, value, icon: Icon, color }) => (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-sm font-medium">{title}</p>
                    <p className={`text-2xl font-bold ${color} mt-2`}>{value}</p>
                </div>
                <Icon className={`h-8 w-8 ${color}`} />
            </div>
        </div>
    );

    const SearchBar = ({ onSearch, placeholder }) => (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
                type="text"
                placeholder={placeholder}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                onChange={(e) => onSearch(e.target.value)}
                value={searchQuery}
            />
        </div>
    );

    const Pagination = ({ pagination, onPageChange }) => {
        const totalPages = Math.ceil(pagination.count / 10);

        return (
            <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-t border-gray-700">
                <div className="text-sm text-gray-400">
                    Showing {Math.min((currentPage - 1) * 10 + 1, pagination.count)} to{' '}
                    {Math.min(currentPage * 10, pagination.count)} of {pagination.count} results
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={!pagination.previous}
                        className="p-2 rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-300">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={!pagination.next}
                        className="p-2 rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        );
    };

    const SubscriptionTable = () => (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-gray-100">Premium Subscriptions</h3>
            </div>

            {/* Mobile view */}
            <div className="md:hidden">
                {subscriptions.map((sub) => (
                    <div key={sub.id} className="p-4 border-b border-gray-700">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="font-medium text-gray-100">{sub.learner}</span>
                                <span className="px-2 py-1 bg-green-900 text-green-300 text-xs rounded">
                                    {sub.status}
                                </span>
                            </div>
                            <div className="text-sm text-gray-400">{sub.learner_email}</div>
                            <div className="text-sm text-gray-400">Date: {formatDate(sub.created_at)}</div>
                            {sub.referred_by && (
                                <div className="text-sm text-gray-400">
                                    Referred by: {sub.referred_by ? sub.referred_by : 'OWN'}
                                </div>
                            )}
                            {sub.referral_code && (
                                <div className="text-sm text-gray-400">Code: {sub.referral_code}</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop view */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-900">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Learner
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Referred By
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Referral Code
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {subscriptions.map((sub) => (
                            <tr key={sub.id} className="hover:bg-gray-750">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-100">
                                    {sub.learner}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                    {sub.learner_email}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                    {formatDate(sub.created_at)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                    {sub.referred_by ? sub.referred_by : 'OWN'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                    {sub.referral_code || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-900 text-green-300">
                                        {sub.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {subscriptions.length > 0 && (
                <Pagination
                    pagination={subscriptionPagination}
                    onPageChange={setCurrentPage}
                />
            )}
        </div>
    );

    const ReferralTable = () => (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-gray-100">Referral Earnings</h3>
            </div>

            {/* Mobile view */}
            <div className="md:hidden">
                {referrals.map((ref) => (
                    <div key={ref.id} className="p-4 border-b border-gray-700">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="font-medium text-gray-100">{ref.referrer}</span>
                                <span className="px-2 py-1 bg-green-900 text-green-300 text-xs rounded">
                                    {ref.status}
                                </span>
                            </div>
                            <div className="text-sm text-gray-400">
                                  Referred: {ref.referred? ref.referred : 'N/A'}
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-400">Amount:</span>
                                <span className="text-sm font-medium text-yellow-400">
                                    {formatCurrency(ref.amount)}
                                </span>
                            </div>
                            <div className="text-sm text-gray-400">Date: {formatDate(ref.created_at)}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop view */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-900">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Referrer
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Referred Learner
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {referrals.map((ref) => (
                            <tr key={ref.id} className="hover:bg-gray-750">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-100">
                                    {ref.referrer}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                    {ref.referred? ref.referred : 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-yellow-400">
                                    {formatCurrency(ref.amount)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                    {formatDate(ref.created_at)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-900 text-green-300">
                                        {ref.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {referrals.length > 0 && (
                <Pagination
                    pagination={referralPagination}
                    onPageChange={setCurrentPage}
                />
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-100">Premium Subscriptions & Referral</h1>
                    <p className="text-gray-400 mt-2">Statistics of Premium Subscriptions & Referral</p>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <SearchBar
                        onSearch={handleSearch}
                        placeholder="Search by name, email, or referral code..."
                    />
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
                        <span className="ml-2 text-gray-400">Loading dashboard data...</span>
                    </div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <SummaryCard
                                title="Total Premium Subscribers"
                                value={summaryData.total_premium_subscribers?.toLocaleString() ?? '0'}

                                icon={Users}
                                color="text-yellow-400"
                            />
                            <SummaryCard
                                title="Total Revenue"
                                value={formatCurrency(summaryData.total_revenue)}
                                icon={DollarSign}
                                color="text-indigo-400"
                            />
                            <SummaryCard
                                title="Total Referral Earnings Paid"
                                value={formatCurrency(summaryData.total_referral_earnings_paid)}
                                icon={TrendingUp}
                                color="text-green-400"
                            />
                        </div>

                        {/* Tables */}
                        <div className="space-y-8">
                            <SubscriptionTable />
                            <ReferralTable />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminPremiumAndReferral;