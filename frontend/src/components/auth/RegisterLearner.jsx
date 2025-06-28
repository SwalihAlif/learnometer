import { useGoogleLogin } from '@react-oauth/google';
import axiosInstance from '../../axios';
import React, { useState } from 'react';
import { User, Mail, Phone, BookOpen, AlertCircle, Chrome } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LearnerRegistration = () => {
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

    // Prepare form data
    const data = new FormData();
    data.append('full_name', fullName);
    data.append('email', email);
    data.append('password', password);
    data.append('confirm_password', confirmPassword);
    data.append('phone', phone);

    try {
      const response = await axiosInstance.post('users/register/learner/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Mentor registered successfully:', response.data);

      navigate('/verify-otp', {
        state: {
          email,
          role: 'learner'
        }
      });
    } catch (error) {
      console.error('Registration failed:', error.response?.data || error.message);
      alert('Registration failed. Please check your inputs or try again.');
    }
  };

    const loginWithGoogle = useGoogleLogin({
  flow: 'auth-code',
  onSuccess: async (tokenResponse) => {
    try {
      const res = await axiosInstance.post('users/login/google/', {
        token: tokenResponse.code,
        role: 'Learner',
      });

      localStorage.setItem('access', res.data.access);
      localStorage.setItem('refresh', res.data.refresh);
      localStorage.setItem('email', res.data.email);
      localStorage.setItem('role', res.data.role);

      navigate(res.data.role === 'Mentor' ? '/mentor' : '/learner');
    } catch (error) {
      console.error(error);
      alert('Google SSO login failed');
    }
  },
  onError: () => {
    alert('Google login failed');
  },
});

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header Section with Purple Background */}
        <div className="bg-[#4F46E5] text-white rounded-2xl p-6 mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-[#FACC15] mr-2" />
            <h1 className="text-2xl md:text-3xl font-bold">Learnometer</h1>
            <User className="w-8 h-8 text-[#FACC15] ml-2" />
          </div>

          <h2 className="text-xl md:text-2xl font-bold mb-3">
            Start Your Self-learning Journey with Learnometer
          </h2>
          <p className="text-blue-100 text-sm md:text-base max-w-xl mx-auto">
            Join thousands of learners discovering new skills and achieving their goals
          </p>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <div className="space-y-8">
            {/* Personal Information Section */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-[#1E1B4B] border-b-2 border-[#FACC15] pb-2">
                Personal Information
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#1E1B4B] mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5] transition-colors"
                      required
                    />
                    {errors.fullName && (
                      <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {errors.fullName}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1E1B4B] mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email address"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5] transition-colors"
                      required
                    />
                    {errors.email && (
                      <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {errors.email}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1E1B4B] mb-2">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter your phone number"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5] transition-colors"
                      required
                    />
                    {errors.phone && (
                      <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {errors.phone}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1E1B4B] mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create a strong password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5] transition-colors"
                    required
                  />
                  {errors.password && (
                    <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      {errors.password}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1E1B4B] mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5] transition-colors"
                    required
                  />
                  {errors.confirmPassword && (
                    <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      {errors.confirmPassword}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Agreement Checkbox */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleInputChange}
                className="w-5 h-5 text-[#4F46E5] border-gray-300 rounded focus:ring-[#4F46E5] focus:ring-2 mt-1"
                required
              />
              <label className="text-sm text-gray-700 leading-relaxed">
                I agree to the{' '}
                <a href="#" className="text-[#4F46E5] hover:underline font-medium">
                  Terms and Conditions
                </a>{' '}
                and{' '}
                <a href="#" className="text-[#4F46E5] hover:underline font-medium">
                  Privacy Policy
                </a>{' '}
                of Learnometer. I understand that my data will be used to provide personalized learning experiences.
              </label>
            </div>

            {/* Divider */}
            <div className="my-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">OR Sign in with</span>
                </div>
              </div>
            </div>

            {/* SSO Button */}
            <button
              onClick={() => loginWithGoogle()}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all"
            >
              <Chrome className="w-5 h-5 mr-3 text-blue-500" />
              Continue with Google
            </button>




            {/* Register Button */}
            <button
              type="button"
              onClick={handleRegister}
              className="w-full bg-[#4F46E5] text-white font-bold py-4 px-6 rounded-lg hover:bg-[#3730A3] transition duration-300 transform hover:scale-105 shadow-lg"
            >
              Register as Learner
            </button>
          </div>

          {/* Footer Links */}
          <div className="mt-8 text-center space-y-3">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <a href="/" className="text-[#4F46E5] hover:underline font-medium">
                Login
              </a>
            </p>
            <div className="flex justify-center space-x-6 text-sm text-gray-500">
              <a href="#" className="hover:text-[#4F46E5] hover:underline">
                About Learnometer
              </a>
              <a href="#" className="hover:text-[#4F46E5] hover:underline">
                Help & Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearnerRegistration;