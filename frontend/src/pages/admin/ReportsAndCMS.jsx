// src/components/ReportAndCMS.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash'; 
import { saveAs } from 'file-saver';
import { parseISO, format, isValid } from 'date-fns';

import axiosInstance from '../../axios'; // Adjust this path based on your project structure

const ReportAndCMS = () => {


    const [activeReport, setActiveReport] = useState('users');
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 10,
        totalCount: 0,
        next: null,
        previous: null,
    });
    const [filters, setFilters] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [orderBy, setOrderBy] = useState(''); // Field to order by

    const reportEndpoints = {
        users: {
            list: `adminpanel/reports/users/`, // Relative path, axiosInstance will use its baseURL
            exportXLSX: `adminpanel/reports/users/export/xlsx/`,
            exportPDF: `adminpanel/reports/users/export/pdf/`,
            columns: [
                { key: 'id', label: 'ID' },
                { key: 'email', label: 'Email' },
                { key: 'full_name', label: 'Full Name' },
                { key: 'role.name', label: 'Role' },
                { key: 'is_active', label: 'Active', render: (val) => (val ? 'Yes' : 'No') },
                { key: 'is_staff', label: 'Staff', render: (val) => (val ? 'Yes' : 'No') },
{ key: 'created_at', label: 'Created At', render: (val) => val && isValid(new Date(val)) ? format(new Date(val), 'yyyy-MM-dd') : '—' },

                { key: 'total_wallet_balance', label: 'Wallet Balance', render: (val) => `INR ${parseFloat(val).toFixed(2)}` },
            ],
            searchableFields: ['email', 'full_name', 'role__name'], // Use double underscore for related fields in search/order
            filterableFields: [],
            orderableFields: ['email', 'created_at', 'role__name', 'is_active', 'total_wallet_balance'],
        },
        sessions: {
            list: `adminpanel/reports/session-bookings/`,
            exportXLSX: `adminpanel/reports/session-bookings/export/xlsx/`,
            exportPDF: `adminpanel/reports/session-bookings/export/pdf/`,
            columns: [
                { key: 'id', label: 'ID' },
                { key: 'learner_full_name', label: 'Learner' }, 
                { key: 'mentor_full_name', label: 'Mentor' },
                { key: 'session_date', label: 'Date' },
                { key: 'start_time', label: 'Start Time' },
                { key: 'end_time', label: 'End Time' },
                { key: 'amount', label: 'Amount', render: (val) => `INR ${parseFloat(val).toFixed(2)}` },
                { key: 'status', label: 'Status' },
                { key: 'payment_status', label: 'Payment Status' },
 { key: 'created_at', label: 'Booked At', render: (val) => val && isValid(new Date(val)) ? format(new Date(val), 'yyyy-MM-dd HH:mm') : '—' }

            ],
            searchableFields: ['learner__email', 'mentor__email', 'topic_focus'],
            filterableFields: [{ name: 'status', type: 'select', options: ['pending', 'confirmed', 'completed', 'cancelled', 'rejected', 'no_show'] },
            { name: 'payment_status', type: 'select', options: ['holding', 'released', 'refunded'] },
            { name: 'date', type: 'date' }],
            orderableFields: ['created_at', 'date', 'amount', 'status', 'payment_status'],
        },
        walletTransactions: {
            list: `adminpanel/reports/wallet-transactions/`,
            exportXLSX: `adminpanel/reports/wallet-transactions/export/xlsx/`,
            exportPDF: `adminpanel/reports/wallet-transactions/export/pdf/`,
            columns: [
                { key: 'id', label: 'ID' },
                { key: 'wallet_user_email', label: 'User Email' },
                { key: 'wallet_type', label: 'Wallet Type' },
                { key: 'amount', label: 'Amount', render: (val) => `INR ${parseFloat(val).toFixed(2)}` },
                { key: 'transaction_type_display', label: 'Transaction Type' },
                { key: 'current_balance', label: 'Current Balance', render: (val) => `INR ${parseFloat(val).toFixed(2)}` },
                {
  key: 'timestamp',
  label: 'Timestamp',
  render: (val) =>
    val && isValid(parseISO(val)) ? format(parseISO(val), 'yyyy-MM-dd HH:mm') : '—'
},
                { key: 'description', label: 'Description' },
            ],
            searchableFields: ['wallet__user__email', 'description'],
            filterableFields: [{ name: 'transaction_type', type: 'select', options: ['credit_referral', 'credit_session_fee', 'debit_payout', 'credit_platform_fee', 'credit_premium_subscription'] }],
            orderableFields: ['timestamp', 'amount'],
        },
        // Add more report configurations here
    };

    const currentReportConfig = reportEndpoints[activeReport];

const fetchReportData = useCallback(async () => {
  setLoading(true);
  setError(null);
  try {
    const params = {
      page: pagination.page,
      page_size: pagination.pageSize,
      search: searchTerm,
      ordering: orderBy,
      ...filters,
    };

    const response = await axiosInstance.get(currentReportConfig.list, {
      params,
    });

    setReportData(response.data.results);
    setPagination((prev) => ({
      ...prev,
      totalCount: response.data.count,
      next: response.data.next,
      previous: response.data.previous,
    }));
  } catch (err) {
    console.error("Failed to fetch report data:", err);
    if (err.response?.status === 401) {
      setError("Unauthorized. Please log in again.");
    } else {
      setError("Failed to load report data. Please try again.");
    }
  } finally {
    setLoading(false);
  }
}, [pagination.page, pagination.pageSize, searchTerm, orderBy, filters, activeReport]);


    useEffect(() => {
        setPagination(prev => ({ ...prev, page: 1 }));
        setFilters({});
        setSearchTerm('');
        setOrderBy('');
    }, [activeReport]);

    // 2️⃣ Fetch data when relevant filters change
    useEffect(() => {
        fetchReportData();
    }, [pagination.page, pagination.pageSize, searchTerm, orderBy, filters, activeReport]);

    const handlePageChange = (newPage) => {
        setPagination((prev) => ({ ...prev, page: newPage }));
    };

    const handlePageSizeChange = (e) => {
        setPagination((prev) => ({ ...prev, pageSize: parseInt(e.target.value), page: 1 }));
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleFilterChange = (field, value) => {
        setFilters((prev) => ({ ...prev, [field]: value }));
    };

    const handleOrderByChange = (field) => {
        // Toggle ascending/descending
        if (orderBy === field) {
            setOrderBy(`-${field}`);
        } else if (orderBy === `-${field}`) {
            setOrderBy('');
        } else {
            setOrderBy(field);
        }
    };

    const getSortIndicator = (field) => {
        if (orderBy === field) return ' ▲';
        if (orderBy === `-${field}`) return ' ▼';
        return '';
    };

    const downloadFile = async (formatType) => {
        setLoading(true);
        setError(null);
        try {
            let url = '';
            let fileName = '';
            let responseType = 'arraybuffer'; // For binary data (PDF, XLSX)

            if (formatType === 'pdf') {
                url = currentReportConfig.exportPDF;
                fileName = `${activeReport}_report.pdf`;
            } else if (formatType === 'xlsx') {
                url = currentReportConfig.exportXLSX;
                fileName = `${activeReport}_report.xlsx`;
            } else {
                throw new Error('Invalid format type');
            }

            const params = {
                search: searchTerm,
                ordering: orderBy,
                ...filters,
            };

            // Use axiosInstance for file downloads too
            const response = await axiosInstance.get(url, {
                params,
                responseType: responseType,
            });

            const blob = new Blob([response.data], {
                type: formatType === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            saveAs(blob, fileName);
        } catch (err) {
            console.error(`Failed to export ${formatType} report:`, err);
            if (err.response && err.response.status === 401) {
                setError("Unauthorized to download. Please log in.");
            } else {
                setError(`Failed to export report. Please try again.`);
            }
        } finally {
            setLoading(false);
        }
    };

    const renderFilterControl = (filterConfig) => {
        switch (filterConfig.type) {
            case 'select':
                return (
                    <select
                        key={filterConfig.name}
                        className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm text-black"
                        value={filters[filterConfig.name] || ''}
                        onChange={(e) => handleFilterChange(filterConfig.name, e.target.value)}
                    >
                        <option value="">All {filterConfig.name.replace(/_/g, ' ')}</option> {/* Improve option display */}
                        {filterConfig.options.map((option) => (
                            <option key={option} value={option}>{option.replace(/_/g, ' ')}</option>
                        ))}
                    </select>
                );
            case 'date':
                return (
                    <input
                        key={filterConfig.name}
                        type="date"
                        className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm text-black"
                        value={filters[filterConfig.name] || ''}
                        onChange={(e) => handleFilterChange(filterConfig.name, e.target.value)}
                    />
                );
            default:
                return null;
        }
    };

    const getNestedValue = (obj, path) => {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    };

    if (error) {
        return <div className="p-4 text-red-600 bg-red-100 rounded-lg">{error}</div>;
    }

    return (
        <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Reports & CMS</h1>

            {/* Report Type Selector */}
            <div className="mb-6 flex space-x-4 overflow-x-auto pb-2">
                {Object.keys(reportEndpoints).map((key) => (
                    <button
                        key={key}
                        onClick={() => {
                            setActiveReport(key);
                            // Reset pagination, filters, search, and order when changing report type
                            setPagination({ page: 1, pageSize: 10, totalCount: 0, next: null, previous: null });
                            setFilters({});
                            setSearchTerm('');
                            setOrderBy('');
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${activeReport === key
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                            }`}
                    >
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())} {/* Converts camelCase to readable text */}
                    </button>
                ))}
            </div>

            {/* Search, Filter, and Export Controls */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-center">
                <div className="col-span-1">
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search:</label>
                    <input
                        type="text"
                        id="search"
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-black text-sm"
                        placeholder={`Search ${activeReport}...`}
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                </div>

                {currentReportConfig.filterableFields.length > 0 && (
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Filters:</label>
                        <div className="flex flex-wrap gap-2">
                            {currentReportConfig.filterableFields.map(renderFilterControl)}
                        </div>
                    </div>
                )}

                <div className="col-span-1 flex flex-col md:flex-row md:items-end gap-2 md:justify-end">
                    <button
                        onClick={() => downloadFile('pdf')}
                        className="w-full md:w-auto bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md shadow-sm transition duration-200 text-sm"
                        disabled={loading}
                    >
                        {loading ? 'Generating...' : 'Download PDF'}
                    </button>
                    <button
                        onClick={() => downloadFile('xlsx')}
                        className="w-full md:w-auto bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md shadow-sm transition duration-200 text-sm"
                        disabled={loading}
                    >
                        {loading ? 'Generating...' : 'Download Excel'}
                    </button>
                </div>
            </div>

            {/* Report Table */}
            <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
                {loading ? (
                    <div className="text-center py-8 text-gray-600">Loading report data...</div>
                ) : reportData.length === 0 ? (
                    <div className="text-center py-8 text-gray-600">No data found for this report with the current filters.</div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {currentReportConfig.columns.map((col) => (
                                    <th
                                        key={col.key}
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                        onClick={() => currentReportConfig.orderableFields.includes(col.key) && handleOrderByChange(col.key)}
                                    >
                                        {col.label}
                                        {currentReportConfig.orderableFields.includes(col.key) && getSortIndicator(col.key)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {reportData.map((row, rowIndex) => (
                                <tr key={row.id || rowIndex}>
                                    {currentReportConfig.columns.map((col) => (
                                        <td
                                            key={col.key}
                                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                        >
                                            {col.render ? col.render(getNestedValue(row, col.key)) : getNestedValue(row, col.key)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination Controls */}
            <div className="mt-6 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <span>Items per page:</span>
                    <select
                        className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        value={pagination.pageSize}
                        onChange={handlePageSizeChange}
                    >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                    </select>
                    <span>Total: {pagination.totalCount}</span>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={!pagination.previous || loading}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 text-sm"
                    >
                        Previous
                    </button>
                    <span className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700">
                        Page {pagination.page} of {Math.ceil(pagination.totalCount / pagination.pageSize) || 1}
                    </span>
                    <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={!pagination.next || loading}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 text-sm"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportAndCMS;