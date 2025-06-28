import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../../axios';

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');

  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [showResendButton, setShowResendButton] = useState(false);

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
    if (location.state?.role) {
    setRole(location.state.role);
  }
  }, [location.state]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    } else {
      setShowResendButton(true);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOTPChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 6) setOtp(value);
  };

const handleVerifyOTP = async (e) => {
  e.preventDefault();

  if (!email || !otp) {
    return setError('Please enter both email and OTP');
  }

  if (otp.length !== 6) {
    return setError('OTP must be 6 digits');
  }

  setIsVerifying(true);
  setError('');
  setSuccess('');

  try {
    const res = await axiosInstance.post('users/verify-otp/', {
      email: email.trim(),
      code: otp.trim(),
    });

    // ✅ Save tokens
    localStorage.setItem('access', res.data.access);
    localStorage.setItem('refresh', res.data.refresh);

    // ✅ Save user info
    localStorage.setItem('email', res.data.email);
    localStorage.setItem('role', res.data.role);

    // ✅ Set success message
    setSuccess(res.data.message || 'OTP verified successfully!');

    // ✅ Redirect based on role
    setTimeout(() => {
      const userRole = res.data.role?.toLowerCase();  // safer redirect
      if (userRole === 'mentor') {
        navigate('/mentor');
      } else if (userRole === 'learner') {
        navigate('/learner');
      } else if (userRole === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }, 1500);

  } catch (err) {
    const msg = err?.response?.data?.message || 'OTP verification failed';
    setError(msg);
  } finally {
    setIsVerifying(false);
  }
};


  const handleResendOTP = async () => {
    if (!email) return setError('Email is required');
    setIsResending(true);
    setError('');
    setSuccess('');

    try {
      const res = await axiosInstance.post('users/resend-otp/', { email: email.trim() });
      setSuccess(res.data.message || 'OTP resent successfully!');
      setCountdown(60);
      setShowResendButton(false);
      setOtp('');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to resend OTP';
      setError(msg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Verify OTP</h1>
          <p className="text-gray-600">Enter the verification code sent to your email</p>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">6-Digit OTP</label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={handleOTPChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-center text-lg font-mono tracking-wider"
              placeholder="000000"
              maxLength="6"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          <button
            onClick={handleVerifyOTP}
            disabled={isVerifying}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isVerifying ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Verifying...
              </div>
            ) : (
              'Verify OTP'
            )}
          </button>
        </div>

        <div className="mt-6 text-center">
          {!showResendButton ? (
            <div className="text-gray-600">
              <p className="mb-2">Didn't receive the code?</p>
              <div className="flex justify-center items-center">
                <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mr-2"></div>
                <span className="font-mono text-lg font-medium text-indigo-600">
                  {formatCountdown(countdown)}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Resend available in</p>
            </div>
          ) : (
            <button
              onClick={handleResendOTP}
              disabled={isResending}
              className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline focus:ring-2 focus:ring-indigo-500 px-2 py-1"
            >
              {isResending ? (
                <div className="flex justify-center items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
                  Resending...
                </div>
              ) : (
                'Resend OTP'
              )}
            </button>
          )}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
