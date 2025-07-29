
import React, { useState, useEffect } from 'react';
// import { Button } from '@/components/ui/button'; // Optional: if you're using a button component library
import axiosInstance from '../../axios';
import { FaWallet } from 'react-icons/fa';

const AdminWallet = () => {

      const [walletBalance, setWalletBalance] = useState(523.75);
  const [isStripeOnboarded, setIsStripeOnboarded] = useState(false);


    useEffect(() => {
    fetchOnboardingStatus();
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

  const handleWithdraw = () => {
    // Call backend to trigger withdrawal
    alert('Withdrawal request submitted.');
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
          <h3 className="text-4xl font-bold text-green-400">${walletBalance.toFixed(2)}</h3>
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
      </div>
    </div>
  );
};

export default AdminWallet;
