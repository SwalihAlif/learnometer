
import React, { useState, useEffect } from 'react';
// import { Button } from '@/components/ui/button'; // Optional: if you're using a button component library
import axiosInstance from '../../axios';
import { FaWallet } from 'react-icons/fa';

const AdminWallet = () => {

      const [walletBalance, setWalletBalance] = useState(523.75);
  const [isStripeOnboarded, setIsStripeOnboarded] = useState(false);

  const withdrawals = [
  { id: 1, amount: 50.0, status: 'Success', date: '2025-07-28' },
  { id: 2, amount: 30.5, status: 'Pending', date: '2025-07-27' },
  { id: 3, amount: 20.0, status: 'Failed', date: '2025-07-26' },
  { id: 4, amount: 40.25, status: 'Success', date: '2025-07-25' },
  { id: 5, amount: 10.75, status: 'Success', date: '2025-07-24' },
];



    useEffect(() => {
    fetchOnboardingStatus();
    fetchWalletAmount();
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
    const response = await axiosInstance.get('premium/wallet/');
    console.log("Wallet data", response.data)
    setWalletBalance(response.data.balance)

  } catch (err) {
    console.error('Failed to fetch wallet balance:', err);

  }
}

  const handleWithdraw = () => {
    // Call backend to trigger withdrawal
    alert('Withdrawal request submitted.');
  };

  const handleSeeAll = () => {
  // You can navigate to a full transaction history page here
  console.log("See All clicked");
  // Example with React Router:
  // navigate('/admin/withdrawals'); 
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
        <h3 className="text-4xl font-bold text-green-400">${parseFloat(walletBalance).toFixed(2)}</h3>
      </div>

      {isStripeOnboarded ? (
        <button
          onClick={handleWithdraw}
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
        <h4 className="text-lg font-semibold mb-2">Recent Withdrawals</h4>
        <div className="max-h-48 overflow-y-auto space-y-2">
          {withdrawals.slice(0, 10).map((withdrawal, index) => (
            <div key={index} className="flex justify-between items-center border-b border-gray-600 pb-1">
              <span className="text-sm">{withdrawal.date}</span>
              <span className="text-sm">${withdrawal.amount.toFixed(2)}</span>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  withdrawal.status === 'Success'
                    ? 'bg-green-500'
                    : withdrawal.status === 'Pending'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
              >
                {withdrawal.status}
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
  </div>
);

};

export default AdminWallet;
