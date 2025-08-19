import { useGoogleLogin } from '@react-oauth/google';
import axiosInstance from '../../axios';
import React, { useState } from 'react';
import { User, Upload, Clock, Globe, Briefcase, AlertCircle, Chrome } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RegisterMentor = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    agreeToTerms: false
  });

  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validateField = (name, value, validationErrors) => {
    switch (name) {
      case 'fullName':
        if (!value.trim()) {
          validationErrors.fullName = 'Full name is required';
        } else if (value.trim().length < 2) {
          validationErrors.fullName = 'Full name must be at least 2 characters';
        } else {
          delete validationErrors.fullName;
        }
        break;

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) {
          validationErrors.email = 'Email is required';
        } else if (!emailRegex.test(value)) {
          validationErrors.email = 'Please enter a valid email address';
        } else {
          delete validationErrors.email;
        }
        break;

      case 'password':
        if (!value) {
          validationErrors.password = 'Password is required';
        } else if (value.length < 6) {
          validationErrors.password = 'Password must be at least 6 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          validationErrors.password = 'Password must contain uppercase, lowercase, and number';
        } else {
          delete validationErrors.password;
        }
        break;

      case 'confirmPassword':
        if (!value) {
          validationErrors.confirmPassword = 'Please confirm your password';
        } else if (value !== formData.password) {
          validationErrors.confirmPassword = 'Passwords do not match';
        } else {
          delete validationErrors.confirmPassword;
        }
        break;

      case 'phone':
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!value) {
          validationErrors.phone = 'Phone number is required';
        } else if (!phoneRegex.test(value.replace(/\s/g, ''))) {
          validationErrors.phone = 'Please enter a valid phone number';
        } else {
          delete validationErrors.phone;
        }
        break;

      case 'agreeToTerms':
        if (!value) {
          validationErrors.agreeToTerms = 'You must agree to the terms and conditions';
        } else {
          delete validationErrors.agreeToTerms;
        }
        break;
    }
  };

  const validateAllFields = () => {
    const tempErrors = {};
    Object.keys(formData).forEach((key) => {
      validateField(key, formData[key], tempErrors);
    });
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: fieldValue
    }));

    const updatedErrors = { ...errors };
    validateField(name, fieldValue, updatedErrors);
    setErrors(updatedErrors);
  };

const handleRegister = async (e) => {
  e.preventDefault();

  if (!validateAllFields()) return;

  const { fullName, email, password, confirmPassword, phone } = formData;

  const data = new FormData();
  data.append('full_name', fullName);
  data.append('email', email);
  data.append('password', password);
  data.append('confirm_password', confirmPassword);
  data.append('phone', phone);

  try {
    const response = await axiosInstance.post('users/register/mentor/', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('Mentor registered successfully:', response.data);

    navigate('/verify-otp', {
      state: {
        email,
        role: 'mentor',
        message: 'OTP sent to your email. Please verify to activate your account.',
      },
    });
  } catch (error) {
    const errorMsg = error.response?.data?.non_field_errors?.[0] || error.response?.data?.error;

    if (errorMsg?.includes('OTP already sent')) {
      // Redirect to verify page since OTP was already sent
      navigate('/verify-otp', {
        state: {
          email,
          role: 'mentor',
          message: 'OTP was already sent to your email. Please verify.',
        },
      });
    } else if (error.response?.data) {
      setErrors(error.response.data);
    } else {
      console.error('Unexpected error:', error.message);
      alert('Something went wrong. Please try again later.');
    }
  }
};


const loginWithGoogle = useGoogleLogin({
  flow: 'implicit', // or remove it to use default implicit flow

  onSuccess: async (tokenResponse) => {
    console.log("✅ Google login successful. Token response:", tokenResponse);

    const accessToken = tokenResponse?.access_token;

    if (!accessToken) {
      console.error("❌ No access_token received in tokenResponse.");
      alert("Google login failed: Missing access token.");
      return;
    }

    try {
      // Step 1: Fetch user info from Google using access_token
      const googleUser = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }).then((res) => res.json());

      console.log("🧑‍💼 Google user info:", googleUser);

      const { email, name } = googleUser;

      if (!email || !name) {
        console.error("❌ Missing required user info:", googleUser);
        alert("Google account data is incomplete. Try a different account.");
        return;
      }

      // Step 2: Send user info to your backend
      const res = await axiosInstance.post('users/login/google/', {
        email,
        full_name: name,
        role: 'Mentor', // 🔁 you can make this dynamic if needed
      });

      console.log("✅ Backend login successful. Response:", res.data);

      // Step 4: Redirect based on role
      navigate(res.data.role === 'Mentor' ? '/mentor' : '/learner');
    } catch (error) {
      console.error("❌ Login failed:", error.response?.data || error.message);
      alert("Google SSO login failed. Please try again.");
    }
  },

  onError: (error) => {
    console.error("❌ Google login popup failed:", error);
    alert("Google login failed. Please try again.");
  },
});


  return (
    
    <div className="min-h-screen bg-[#F9FAFB] py-8 px-4">
      <div className="max-w-2xl mx-auto">
      {/* Header Section */}
      <div className="bg-[#0F766E] text-white rounded-2xl p-6 mb-8 text-center">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full shadow-lg mb-4 backdrop-blur-sm">
              <User className="w-8 h-8 text-white" />
            </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">
            Become a Mentor
          </h1>
          </div>
          <p className="text-lg text-teal-100 max-w-xl mx-auto leading-relaxed">
            Share your expertise and help learners grow on their educational journey
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-teal-100">
          <h2 className="text-2xl font-semibold text-[#064E3B] mb-8 flex items-center gap-2">
            <User className="w-6 h-6 text-teal-600" />
            Personal Information
          </h2>

          <div className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-[#064E3B] mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                  errors.fullName 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-teal-200 focus:ring-teal-500'
                }`}
                placeholder="Enter your full name"
              />
              {errors.fullName && (
                <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {errors.fullName}
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#064E3B] mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                  errors.email 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-teal-200 focus:ring-teal-500'
                }`}
                placeholder="Enter your email address"
              />
              {errors.email && (
                <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email}
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[#064E3B] mb-2">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                  errors.password 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-teal-200 focus:ring-teal-500'
                }`}
                placeholder="Create a secure password"
              />
              {errors.password && (
                <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {errors.password}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-[#064E3B] mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                  errors.confirmPassword 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-teal-200 focus:ring-teal-500'
                }`}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && (
                <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {errors.confirmPassword}
                </div>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-[#064E3B] mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                  errors.phone 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-teal-200 focus:ring-teal-500'
                }`}
                placeholder="Enter your phone number"
              />
              {errors.phone && (
                <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {errors.phone}
                </div>
              )}
            </div>

            {/* Agreement */}
            <div className="pt-4 border-t border-teal-100">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-teal-600 border-teal-300 rounded focus:ring-teal-500 mt-1"
                />
                <label className="text-sm text-[#064E3B] leading-relaxed">
                  I agree to the{' '}
                  <a href="#" className="text-teal-600 hover:text-teal-700 font-semibold underline">
                    Terms and Conditions
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-teal-600 hover:text-teal-700 font-semibold underline">
                    Privacy Policy
                  </a>{' '}
                  of Learnometer.
                </label>
              </div>
              {errors.agreeToTerms && (
                <div className="flex items-center gap-1 mt-2 text-red-600 text-sm ml-8">
                  <AlertCircle className="w-4 h-4" />
                  {errors.agreeToTerms}
                </div>
              )}
            </div>


                        {/* SSO Button */}
            <button
              onClick={() => loginWithGoogle()}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all"
            >
              <Chrome className="w-5 h-5 mr-3 text-blue-500" />
              Continue with Google
            </button>


            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="button"
                onClick={handleRegister}
                className="w-full bg-[#0F766E] text-white py-4 px-8 rounded-lg font-bold text-lg hover:bg-teal-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-teal-200"
              >
                Register as Mentor
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>

    </div>
  );
};

export default RegisterMentor;