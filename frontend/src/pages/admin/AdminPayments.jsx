import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import axiosInstance from '../../axios';

const PaymentAdminDashboard = () => {
    const [metrics, setMetrics] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [transactionsLoading, setTransactionsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Filters and pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [walletTypeFilter, setWalletTypeFilter] = useState('');
    const [transactionTypeFilter, setTransactionTypeFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const [allTransactions, setAllTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [walletTypes, setWalletTypes] = useState([]);
    const [transactionTypes, setTransactionTypes] = useState([]);


    // Fetch Metrics with error handling
    const fetchMetrics = async () => {
        try {
            const response = await axiosInstance.get('premium/admin/payment/metrics/');
            console.log("Metrics Data:", response.data);  // Log data for debugging
            return response.data;
        } catch (error) {
            console.error("Error fetching metrics:", error);
            return null;
        }
    };

    // Fetch Transactions with error handling
    const fetchTransactions = async (page = 1, search = '', walletType = '', transactionType = '') => {
        try {
            const params = {
                page,
                search,
                wallet_type: walletType,
                transaction_type: transactionType,
            };

            const response = await axiosInstance.get('premium/admin/payment/transactions/', { params });
            const transactions = response.data.results;

            // Extract unique wallet types and transaction types
            const uniqueWalletTypes = Array.from(
                new Map(transactions.map(item => [item.wallet_type, item.wallet_type_display])).entries()
            ).map(([value, label]) => ({ value, label }));

            const uniqueTransactionTypes = Array.from(
                new Map(transactions.map(item => [item.transaction_type, item.transaction_type_display])).entries()
            ).map(([value, label]) => ({ value, label }));

            setWalletTypes(uniqueWalletTypes);
            setTransactionTypes(uniqueTransactionTypes);

            return response.data;
        } catch (error) {
            console.error("Error fetching transactions:", error);
            return null;
        }
    };


    // Load initial data
    useEffect(() => {
        const loadMetrics = async () => {
            try {
                setLoading(true);
                const data = await fetchMetrics();
                setMetrics(data);
            } catch (err) {
                setError('Failed to load metrics');
            } finally {
                setLoading(false);
            }
        };

        loadMetrics();
    }, []);


    // Load transactions when filters change
    useEffect(() => {
        const loadTransactions = async () => {
            try {
                setTransactionsLoading(true);
                const data = await fetchTransactions(currentPage, searchTerm, walletTypeFilter, transactionTypeFilter);
                setTransactions(data.results);
                setTotalCount(data.count);
                setTotalPages(Math.ceil(data.count / 20));
            } catch (err) {
                setError('Failed to load transactions');
            } finally {
                setTransactionsLoading(false);
            }
        };

        loadTransactions();
    }, [currentPage, searchTerm, walletTypeFilter, transactionTypeFilter]);

    const formatAmount = (amount) => {
        const num = parseFloat(amount);
        const isNegative = num < 0;
        const formatted = Math.abs(num).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        return { formatted: `₹${formatted}`, isNegative };
    };

    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleWalletTypeFilter = (e) => {
        const selectedType = e.target.value;
        setWalletTypeFilter(selectedType);

        if (selectedType === '') {
            setFilteredTransactions(allTransactions);
        } else {
            const filtered = allTransactions.filter(
                transaction => transaction.wallet_type === selectedType
            );
            setFilteredTransactions(filtered);
        }
    };


    const handleTransactionTypeFilter = (e) => {
        setTransactionTypeFilter(e.target.value);
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setWalletTypeFilter('');
        setTransactionTypeFilter('');
        setCurrentPage(1);
    };

    if (loading) {
        return (
            <div className="min-h-screen" style={{ backgroundColor: '#0D1117' }}>
                <div className="flex items-center justify-center min-h-screen">
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#FACC15' }} />
                    <span className="ml-2 text-lg" style={{ color: '#F9FAFB' }}>Loading dashboard...</span>
                </div>
            </div>
        );
    }

    if (error && !metrics) {
        return (
            <div className="min-h-screen" style={{ backgroundColor: '#0D1117' }}>
                <div className="flex items-center justify-center min-h-screen">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                    <span className="ml-2 text-lg" style={{ color: '#F9FAFB' }}>{error}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6" style={{ backgroundColor: '#0D1117' }}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2" style={{ color: '#dcf72dff' }}>
                        Payments & Transactions
                    </h1>
                    <p style={{ color: '#F9FAFB' }} className="opacity-80">
                        Monitor all payment transactions and balances across the platform
                    </p>
                </div>

                {/* Summary + Total Transactions - Flex in One Line */}
<div className="flex flex-wrap mb-8 " style={{ gap: 'calc(var(--spacing) * 58)' }}>
  {metrics?.wallet_summaries?.map((summary) => (
    <div
      key={summary.wallet_type}
      className="w-full sm:w-1/2 lg:w-1/5 rounded-lg p-6 border"
      style={{ backgroundColor: '#1F2937', borderColor: '#374151' }}
    >
      <h3 className="text-sm font-medium mb-2 opacity-80" style={{ color: '#F9FAFB' }}>
        {summary.wallet_type_display}
      </h3>
      <p className="text-2xl font-bold mb-1" style={{ color: '#FACC15' }}>
        ₹{parseFloat(summary.total_balance).toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}
      </p>
      <p className="text-sm opacity-60" style={{ color: '#F9FAFB' }}>
        {summary.wallet_count} wallets
      </p>
    </div>
  ))}

  {/* Total Transactions Card */}
  <div
    className="w-full sm:w-1/2 lg:w-1/5 rounded-lg p-6 border"
    style={{ backgroundColor: '#1F2937', borderColor: '#374151' }}
  >
    <h3 className="text-sm font-medium mb-2 opacity-80" style={{ color: '#F9FAFB' }}>
      Total Transactions
    </h3>
    <p className="text-3xl font-bold" style={{ color: '#4F46E5' }}>
      {metrics?.total_transactions?.toLocaleString('en-IN') || 0}
    </p>
  </div>
</div>




                {/* Filters and Search */}
                <div
                    className="rounded-lg p-6 mb-6 border"
                    style={{ backgroundColor: '#1F2937', borderColor: '#374151' }}
                >
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                        <div className="flex flex-col sm:flex-row gap-4 flex-1">
                            {/* Search */}
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#F9FAFB' }} />
                                <input
                                    type="text"
                                    placeholder="Search by user name or email..."
                                    value={searchTerm}
                                    onChange={handleSearch}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:border-transparent"
                                    style={{
                                        backgroundColor: '#0D1117',
                                        borderColor: '#374151',
                                        color: '#F9FAFB',
                                        focusRingColor: '#4F46E5'
                                    }}
                                />
                            </div>

                            {/* Wallet Type Filter */}
                            {/* Wallet Type Filter */}
                            <select
                                value={walletTypeFilter}
                                onChange={handleWalletTypeFilter}
                                className="px-4 py-2 rounded-lg border focus:ring-2 focus:border-transparent"
                                style={{
                                    backgroundColor: '#0D1117',
                                    borderColor: '#374151',
                                    color: '#F9FAFB'
                                }}
                            >
                                <option value="">All Wallet Types</option>
                                {walletTypes.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>

                            {/* Transaction Type Filter */}
                            <select
                                value={transactionTypeFilter}
                                onChange={handleTransactionTypeFilter}
                                className="px-4 py-2 rounded-lg border focus:ring-2 focus:border-transparent"
                                style={{
                                    backgroundColor: '#0D1117',
                                    borderColor: '#374151',
                                    color: '#F9FAFB'
                                }}
                            >
                                <option value="">All Transaction Types</option>
                                {transactionTypes.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>

                        </div>

                        {/* Clear Filters */}
                        {(searchTerm || walletTypeFilter || transactionTypeFilter) && (
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 rounded-lg border hover:opacity-80 transition-opacity"
                                style={{
                                    backgroundColor: '#374151',
                                    borderColor: '#4B5563',
                                    color: '#F9FAFB'
                                }}
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                </div>

                {/* Transactions Table */}
                <div
                    className="rounded-lg border overflow-hidden"
                    style={{ backgroundColor: '#1F2937', borderColor: '#374151' }}
                >
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y" style={{ divideColor: '#374151' }}>
                            <thead style={{ backgroundColor: '#0D1117' }}>
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#F9FAFB' }}>
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#F9FAFB' }}>
                                        Wallet Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#F9FAFB' }}>
                                        Transaction
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#F9FAFB' }}>
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#F9FAFB' }}>
                                        Source ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#F9FAFB' }}>
                                        Description
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#F9FAFB' }}>
                                        Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ divideColor: '#374151' }}>
                                {transactionsLoading ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" style={{ color: '#FACC15' }} />
                                            <p style={{ color: '#F9FAFB' }}>Loading transactions...</p>
                                        </td>
                                    </tr>
                                ) : transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center">
                                            <p style={{ color: '#F9FAFB' }} className="opacity-60">No transactions found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((transaction) => {
                                        const { formatted, isNegative } = formatAmount(transaction.amount);
                                        return (
                                            <tr key={transaction.id} className="hover:bg-opacity-50" style={{ backgroundColor: 'rgba(55, 65, 81, 0.3)' }}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="font-medium" style={{ color: '#F9FAFB' }}>
                                                            {transaction.user_name}
                                                        </div>
                                                        <div className="text-sm opacity-60" style={{ color: '#F9FAFB' }}>
                                                            {transaction.user_email}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                                        style={{ backgroundColor: '#4F46E5', color: '#F9FAFB' }}
                                                    >
                                                        {transaction.wallet_type_display}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                                        style={{
                                                            backgroundColor: isNegative ? '#DC2626' : '#059669',
                                                            color: '#F9FAFB'
                                                        }}
                                                    >
                                                        {transaction.transaction_type_display}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className="font-medium"
                                                        style={{ color: isNegative ? '#EF4444' : '#10B981' }}
                                                    >
                                                        {isNegative && '-'}{formatted}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-mono" style={{ color: '#F9FAFB' }}>
                                                        {transaction.source_id || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm truncate max-w-xs" style={{ color: '#F9FAFB' }} title={transaction.description}>
                                                        {transaction.description || 'No description'}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: '#F9FAFB' }}>
                                                    {formatDate(transaction.timestamp)}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div
                            className="px-6 py-3 flex items-center justify-between border-t"
                            style={{ borderColor: '#374151', backgroundColor: '#0D1117' }}
                        >
                            <div className="flex-1 flex justify-between sm:hidden">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{
                                        backgroundColor: '#1F2937',
                                        borderColor: '#374151',
                                        color: '#F9FAFB'
                                    }}
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="ml-3 relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{
                                        backgroundColor: '#1F2937',
                                        borderColor: '#374151',
                                        color: '#F9FAFB'
                                    }}
                                >
                                    Next
                                </button>
                            </div>
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm" style={{ color: '#F9FAFB' }}>
                                        Showing <span className="font-medium">{((currentPage - 1) * 20) + 1}</span> to{' '}
                                        <span className="font-medium">{Math.min(currentPage * 20, totalCount)}</span> of{' '}
                                        <span className="font-medium">{totalCount}</span> results
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-75"
                                            style={{
                                                backgroundColor: '#1F2937',
                                                borderColor: '#374151',
                                                color: '#F9FAFB'
                                            }}
                                        >
                                            <ChevronLeft className="h-5 w-5" />
                                        </button>

                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }

                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === pageNum
                                                        ? 'z-10 border-indigo-500 text-indigo-600'
                                                        : 'border-gray-300 text-gray-500 hover:bg-gray-50'
                                                        }`}
                                                    style={{
                                                        backgroundColor: currentPage === pageNum ? '#4F46E5' : '#1F2937',
                                                        borderColor: currentPage === pageNum ? '#4F46E5' : '#374151',
                                                        color: currentPage === pageNum ? '#F9FAFB' : '#F9FAFB'
                                                    }}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}

                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-75"
                                            style={{
                                                backgroundColor: '#1F2937',
                                                borderColor: '#374151',
                                                color: '#F9FAFB'
                                            }}
                                        >
                                            <ChevronRight className="h-5 w-5" />
                                        </button>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentAdminDashboard;