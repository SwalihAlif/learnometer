import axiosInstance from '../../axios';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, BookOpen, TrendingUp, Target, Users, Chrome } from 'lucide-react';

const LearnometerLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleLogin = async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  try {
    const response = await axiosInstance.post('users/token/', {
      email: formData.email,
      password: formData.password
    });

    console.log('Login success:', response.data);

    // Save tokens
    localStorage.setItem('access', response.data.access);
    localStorage.setItem('refresh', response.data.refresh);

    // Save user info
    localStorage.setItem('email', response.data.email);
    localStorage.setItem('role', response.data.role);

    // Redirect user based on role
    const role = response.data.role;
    if (role === 'Learner') {
      navigate('/learner');
    } else if (role === 'Mentor') {
      navigate('/mentor');
    } else if (role === 'Admin') {
      navigate('/admin');
    } else {
      navigate('/'); // fallback
    }

  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    alert('Login failed: Invalid credentials');
  }
};


  const handleGoogleSSO = () => {
    console.log('Google SSO login');
    // Handle Google SSO logic here
  };

  const handleRegister = (role) => {
    console.log(`Register as ${role}`);
    // Handle registration redirect
    if (role === 'mentor') {

      navigate('/mregister');
    }
    else if (role === 'learner') {
      navigate('/lregister');
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Welcome Section */}
      <div className="lg:w-1/2 bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center p-8 lg:p-12 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-white bg-opacity-10 rounded-full animate-pulse"></div>
          <div className="absolute top-1/3 -right-20 w-60 h-60 bg-white bg-opacity-5 rounded-full animate-bounce" style={{animationDuration: '3s'}}></div>
          <div className="absolute bottom-10 left-1/4 w-32 h-32 bg-white bg-opacity-10 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>

        <div className="relative z-10 text-center max-w-md">
          {/* Dynamic Icons */}
          <div className="flex justify-center items-center space-x-4 mb-8">
            <div className="animate-bounce" style={{animationDelay: '0s'}}>
              <BookOpen className="w-12 h-12 text-white text-opacity-90" />
            </div>
            <div className="animate-bounce" style={{animationDelay: '0.5s'}}>
              <TrendingUp className="w-10 h-10 text-white text-opacity-80" />
            </div>
            <div className="animate-bounce" style={{animationDelay: '1s'}}>
              <Target className="w-8 h-8 text-white text-opacity-70" />
            </div>
            <div className="animate-bounce" style={{animationDelay: '1.5s'}}>
              <Users className="w-10 h-10 text-white text-opacity-80" />
            </div>
          </div>

          {/* Welcome Content */}
          <h1 className="text-4xl lg:text-5xl font-bold text-white text-opacity-90 mb-4 animate-fade-in">
            Welcome to Learnometer
          </h1>
          
          <p className="text-lg text-white text-opacity-80 mb-6 font-light tracking-wide">
            Track, Learn, Grow
          </p>
          
          <p className="text-white text-opacity-90 leading-relaxed text-base lg:text-lg">
            Continue your learning journey with Learnometer. Access your personalized dashboard and track your progress.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="lg:w-1/2 bg-gray-50 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-8 text-center">
              Login to Learnometer
            </h2>

            <div className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full pl-12 pr-4 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full pl-12 pr-12 py-3 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>

              {/* Options Row */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember Me</span>
                </label>
                <button 
                  type="button"
                  className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                  onClick={() => console.log('Forgot password clicked')}
                >
                  Forgot Password?
                </button>
              </div>

              {/* Login Button */}
              <button
                onClick={handleLogin}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all transform hover:scale-105"
              >
                Sign In
              </button>
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
              onClick={handleGoogleSSO}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all"
            >
              <Chrome className="w-5 h-5 mr-3 text-blue-500" />
              Continue with Google
            </button>

            {/* Registration Divider */}
            <div className="my-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Not registered yet?</span>
                </div>
              </div>
            </div>

            {/* Registration Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => handleRegister('learner')}
                className="px-4 py-3 border-2 border-indigo-600 text-indigo-600 rounded-lg font-medium hover:bg-indigo-600 hover:text-white focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all transform hover:scale-105"
              >
                Register as Learner
              </button>
              <button
                onClick={() => handleRegister('mentor')}
                className="px-4 py-3 border-2 border-green-600 text-green-600 rounded-lg font-medium hover:bg-green-600 hover:text-white focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all transform hover:scale-105"
              >
                Register as Mentor
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
      `}</style>
    </div>
  );
};

export default LearnometerLogin;