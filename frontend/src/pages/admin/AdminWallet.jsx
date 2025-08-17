
import React, { useState, useEffect } from 'react';
import axiosInstance from '../../axios';
import { FaWallet } from 'react-icons/fa';
import { X } from 'lucide-react';

const AdminWallet = () => {

  const [walletBalance, setWalletBalance] = useState(523.75);
  const [isStripeOnboarded, setIsStripeOnboarded] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const [showAllTransactionsModal, setShowAllTransactionsModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchOnboardingStatus();
    fetchWalletAmount();
    fetchWalletTransactions();
  }, []);

  const fetchOnboardingStatus = async () => {
    try {
      const response = await axiosInstance.get('adminpanel/stripe/onboarding-status/');
      setIsStripeOnboarded(response.data.onboarding_complete);
    } catch (err) {
      console.error('Failed to fetch onboarding status:', err);
    }
  };

  const handleCreateAccount = async () => {
    try {
      const response = await axiosInstance.post('adminpanel/stripe/create/');
      const data = response.data;

      if (data.onboarding_required && data.onboarding_url) {
        // Redirect to Stripe onboarding link
        window.location.href = data.onboarding_url;
      } else {
        // Onboarding already completed
        alert('Stripe account already set up and onboarded.');
      }
    } catch (err) {
      console.error('Failed to create Stripe account:', err);
      alert(err.response?.data?.error || 'Something went wrong. Try again later.');
    }
  };

  const fetchWalletAmount = async () => {

    try {
      const response = await axiosInstance.get('premium/admin/wallet/');
      console.log("Wallet data", response.data)
      setWalletBalance(response.data.balance)

    } catch (err) {
      console.error('Failed to fetch wallet balance:', err);

    }
  }


  const fetchWalletTransactions = async () => {
    try {
      const response = await axiosInstance.get('premium/admin/wallet/transactions/');
      console.log("Wallet transactions:", response.data);
      setTransactions(response.data);
    } catch (err) {
      console.error('Failed to fetch wallet transactions:', err);
    }
  };


  const handleWithdraw = async () => {
    if (!withdrawAmount || isNaN(withdrawAmount)) {
      alert("Please enter a valid number.");
      return;
    }

    const amount = parseFloat(withdrawAmount);

    if (amount <= 0 || amount > walletBalance) {
      alert("Invalid withdrawal amount.");
      return;
    }

    try {
      await axiosInstance.post('premium/admin/wallet/withdraw/', {
        amount,
      });

      alert('Successfully withdrawed to your account.');

      setWalletBalance((prev) => prev - amount);
      setWithdrawAmount('');
      setShowWithdrawModal(false);
      fetchWalletTransactions(); // refresh transactions
    } catch (err) {
      console.error('Withdrawal failed:', err);
      alert('Failed to withdraw. Try again.');
    }
  };

  const handleSeeAll = () => {
    setShowAllTransactionsModal(true);
    setCurrentPage(1); // reset to first page
  };

  const formatTransactionType = (type) => {
  return type
    .split('_')                // Split by underscore
    .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
    .join(' ');                // Join with space
};


  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 shadow-lg rounded-2xl p-6 space-y-6">
        <div className="flex items-center space-x-3">
          <FaWallet className="text-yellow-400 text-3xl" />
          <h2 className="text-2xl font-bold">Admin Wallet</h2>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-400 mb-1">Total Wallet Balance</p>
          <h3 className="text-4xl font-bold text-green-400">₹{parseFloat(walletBalance).toFixed(2)}</h3>
        </div>

        {isStripeOnboarded ? (
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 transition rounded-lg py-2 text-white font-semibold"
          >
            Withdraw Funds
          </button>
        ) : (
          <button
            onClick={handleCreateAccount}
            className="w-full bg-red-600 hover:bg-red-700 transition rounded-lg py-2 text-white font-semibold"
          >
            You have no payment account yet. Create one
          </button>
        )}

        {/* Withdrawal History */}
        <div className="bg-gray-700 p-4 rounded-lg mt-4">
          <h4 className="text-lg font-semibold mb-2">Recent Transactions</h4>

          {/* Header Row */}
          <div className="flex justify-between text-gray-300 text-sm font-semibold border-b border-gray-600 pb-1">
            <span className="w-1/3">Date</span>
            <span className="w-1/3">Amount</span>
            <span className="w-1/3">Transaction Type</span>
          </div>  

          <div className="max-h-48 overflow-y-auto space-y-2">
            {transactions.slice(0, 10).map((transaction, index) => (
              <div key={index} className="flex justify-between items-center border-b border-gray-600 pb-1">
                <span className="text-sm">{transaction.timestamp.slice(0, 10)}</span>
                <span className="text-sm">₹{parseFloat(transaction.amount).toFixed(2)}</span>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${transaction.transaction_type === 'credit_referral'
                      ? 'bg-green-500'
                      : transaction.transaction_type === 'debit_payout'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                >
                  {formatTransactionType(transaction.transaction_type)}
                </span>
              </div>
            ))}
          </div>
          <div className="text-right mt-2">
            <button className="text-blue-400 hover:underline text-sm" onClick={handleSeeAll}>
              See All
            </button>
          </div>
        </div>
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-purple-100 to-blue-100 p-6 rounded-2xl shadow-xl w-80">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">Withdraw Amount</h3>
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4 text-gray-800 placeholder-gray-500"
            />
            <div className="flex justify-between">
              <button
                onClick={handleWithdraw}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
              >
                Submit
              </button>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}


      {showAllTransactionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center">
          <div className="bg-white text-black rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 relative">
            <button
              className="absolute top-2 right-4 text-gray-500 hover:text-red-600 text-xl"
              onClick={() => setShowAllTransactionsModal(false)}
            >
              <X size={24} />
            </button>

            <h2 className="text-xl font-bold mb-4">All Transactions</h2>

            <div className="space-y-3">

                {/* Header Row */}
  <div className="flex justify-between items-center border-b pb-2 text-sm font-semibold text-gray-600">
    <span className="w-1/3">Date</span>
    <span className="w-1/3">Amount</span>
    <span className="w-1/3">Transaction Type</span>
  </div>

              {transactions
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((transaction, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center border-b pb-1 text-sm"
                  >
                    <span>{transaction.timestamp.slice(0, 10)}</span>
                    <span>₹{parseFloat(transaction.amount).toFixed(2)}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${transaction.transaction_type === 'credit_referral'
                          ? 'bg-green-500 text-white'
                          : transaction.transaction_type === 'debit_payout'
                            ? 'bg-yellow-500 text-black'
                            : 'bg-red-500 text-white'
                        }`}
                    >
                      {formatTransactionType(transaction.transaction_type)}
                    </span>
                  </div>
                ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-4">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-sm">
                Page {currentPage} of {Math.ceil(transactions.length / itemsPerPage)}
              </span>
              <button
                disabled={currentPage >= Math.ceil(transactions.length / itemsPerPage)}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}



    </div>
  );

};

export default AdminWallet;
