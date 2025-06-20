import React, { useState } from 'react';
import { User, Mail, Phone, Upload, ChevronDown, BookOpen, Target, Globe, Check } from 'lucide-react';

const LearnerRegistration = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    profilePicture: null,
    learningCategories: [],
    learningGoals: '',
    languages: [],
    agreeToTerms: false
  });

  const [showOtpSection, setShowOtpSection] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState({
    categories: false,
    languages: false
  });

  const learningCategories = [
    'Technology & Programming',
    'Business & Finance',
    'Design & Creativity',
    'Health & Wellness',
    'Languages',
    'Science & Mathematics',
    'Arts & Humanities',
    'Personal Development',
    'Marketing & Sales',
    'Music & Audio',
    'Photography & Video',
    'Other'
  ];

  const languages = [
    'English',
    'Spanish',
    'French',
    'German',
    'Italian',
    'Portuguese',
    'Russian',
    'Chinese (Mandarin)',
    'Japanese',
    'Korean',
    'Arabic',
    'Hindi',
    'Dutch',
    'Swedish',
    'Norwegian',
    'Other'
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      profilePicture: e.target.files[0]
    }));
  };

  const handleMultiSelect = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const toggleDropdown = (dropdown) => {
    setDropdownOpen(prev => ({
      ...prev,
      [dropdown]: !prev[dropdown]
    }));
  };

  const handleRegister = () => {
    // Basic validation
    if (!formData.fullName || !formData.email || !formData.password || !formData.phoneNumber) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    if (!formData.agreeToTerms) {
      alert('Please agree to the Terms and Conditions');
      return;
    }

    // Simulate sending OTP
    setOtpSent(true);
    setShowOtpSection(true);
    alert('OTP has been sent to your email and phone number!');
  };

  const handleOtpVerification = (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      alert('Please enter a valid 6-digit OTP');
      return;
    }
    alert('Registration successful! Welcome to Learnometer!');
    // Here you would typically redirect to dashboard or login
  };

  if (showOtpSection) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] py-8 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-[#4F46E5] mr-2" />
                <h1 className="text-3xl font-bold text-[#1E1B4B]">Learnometer</h1>
              </div>
              <h2 className="text-2xl font-bold text-[#1E1B4B] mb-2">Verify Your Account</h2>
              <p className="text-gray-600">
                We've sent a 6-digit OTP to your email ({formData.email}) and phone number ({formData.phoneNumber})
              </p>
            </div>

            <form onSubmit={handleOtpVerification} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#1E1B4B] mb-2">
                  Enter OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  maxLength="6"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5] text-center text-2xl tracking-widest"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#4F46E5] text-white font-bold py-3 px-4 rounded-lg hover:bg-[#3730A3] transition duration-300 transform hover:scale-105"
              >
                Verify & Complete Registration
              </button>

              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="w-full text-[#4F46E5] font-medium py-2 hover:underline"
              >
                Resend OTP
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <BookOpen className="w-12 h-12 text-[#4F46E5] mr-3" />
            <h1 className="text-4xl md:text-5xl font-bold text-[#1E1B4B]">Learnometer</h1>
          </div>
          
          <div className="mb-6">
            <User className="w-16 h-16 text-[#FACC15] mx-auto mb-4" />
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-[#1E1B4B] mb-4">
            Start Your Self-learning Journey with Learnometer
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Join thousands of learners discovering new skills and achieving their goals
          </p>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <form className="space-y-8">
            {/* Personal Information Section */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-[#1E1B4B] border-b-2 border-[#FACC15] pb-2">
                Personal Information
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
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
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5]"
                      required
                    />
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
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5]"
                      required
                    />
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5]"
                    required
                  />
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1E1B4B] mb-2">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      placeholder="Enter your phone number"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1E1B4B] mb-2">
                    Profile Picture (Optional)
                  </label>
                  <div className="relative">
                    <Upload className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5] file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-[#4F46E5] file:text-white hover:file:bg-[#3730A3]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Learning Preferences Section */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-[#1E1B4B] border-b-2 border-[#FACC15] pb-2 flex items-center">
                <Target className="w-6 h-6 mr-2" />
                Learning Preferences
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Preferred Learning Categories */}
                <div>
                  <label className="block text-sm font-medium text-[#1E1B4B] mb-2">
                    Preferred Learning Categories
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => toggleDropdown('categories')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5] text-left flex items-center justify-between"
                    >
                      <span className="text-gray-500">
                        {formData.learningCategories.length > 0 
                          ? `${formData.learningCategories.length} selected`
                          : 'Select categories'
                        }
                      </span>
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    </button>
                    
                    {dropdownOpen.categories && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {learningCategories.map((category) => (
                          <div
                            key={category}
                            onClick={() => handleMultiSelect('learningCategories', category)}
                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center"
                          >
                            <div className={`w-4 h-4 border rounded mr-3 flex items-center justify-center ${
                              formData.learningCategories.includes(category) 
                                ? 'bg-[#4F46E5] border-[#4F46E5]' 
                                : 'border-gray-300'
                            }`}>
                              {formData.learningCategories.includes(category) && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <span className="text-sm">{category}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Languages Known */}
                <div>
                  <label className="block text-sm font-medium text-[#1E1B4B] mb-2">
                    Languages Known
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => toggleDropdown('languages')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5] text-left flex items-center justify-between"
                    >
                      <span className="text-gray-500">
                        {formData.languages.length > 0 
                          ? `${formData.languages.length} selected`
                          : 'Select languages'
                        }
                      </span>
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    </button>
                    
                    {dropdownOpen.languages && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {languages.map((language) => (
                          <div
                            key={language}
                            onClick={() => handleMultiSelect('languages', language)}
                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center"
                          >
                            <div className={`w-4 h-4 border rounded mr-3 flex items-center justify-center ${
                              formData.languages.includes(language) 
                                ? 'bg-[#4F46E5] border-[#4F46E5]' 
                                : 'border-gray-300'
                            }`}>
                              {formData.languages.includes(language) && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <span className="text-sm">{language}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Learning Goals */}
              <div>
                <label className="block text-sm font-medium text-[#1E1B4B] mb-2">
                  Learning Goals
                </label>
                <textarea
                  name="learningGoals"
                  value={formData.learningGoals}
                  onChange={handleInputChange}
                  placeholder="Tell us about your learning goals and what you hope to achieve..."
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5] resize-none"
                />
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

            {/* Register Button */}
            <button
              type="button"
              onClick={handleRegister}
              className="w-full bg-[#4F46E5] text-white font-bold py-4 px-6 rounded-lg hover:bg-[#3730A3] transition duration-300 transform hover:scale-105 shadow-lg"
            >
              Register as Learner
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-8 text-center space-y-3">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <a href="/login" className="text-[#4F46E5] hover:underline font-medium">
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