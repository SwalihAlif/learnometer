import axiosInstance from '../../axios';
import React, { useState } from 'react';
import { User, Upload, Clock, Globe, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RegisterMentor = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    experience: '',
    profilePicture: null,
    expertiseCategory: [],
    languages: [],
    bio: '',
    linkedinProfile: '',
    portfolioWebsite: '',
    availability: {
      monday: { startTime: '', endTime: '' },
      tuesday: { startTime: '', endTime: '' },
      wednesday: { startTime: '', endTime: '' },
      thursday: { startTime: '', endTime: '' },
      friday: { startTime: '', endTime: '' },
      saturday: { startTime: '', endTime: '' },
      sunday: { startTime: '', endTime: '' }
    },
    agreeToTerms: false
  });

  const navigate = useNavigate();

  const [formErrors, setFormErrors] = useState({});

  const [dragActive, setDragActive] = useState(false);

  const expertiseCategories = [
    'Software Development', 'Data Science', 'Web Design', 'Digital Marketing',
    'Business Strategy', 'Project Management', 'Graphic Design', 'UI/UX Design',
    'Mobile Development', 'DevOps', 'Cybersecurity', 'Artificial Intelligence',
    'Machine Learning', 'Cloud Computing', 'Database Management', 'Other'
  ];

  const languages = [
    'English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese',
    'Korean', 'Portuguese', 'Italian', 'Russian', 'Arabic', 'Hindi'
  ];

  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleExpertiseChange = (expertise) => {
    setFormData(prev => ({
      ...prev,
      expertiseCategory: prev.expertiseCategory.includes(expertise)
        ? prev.expertiseCategory.filter(cat => cat !== expertise)
        : [...prev.expertiseCategory, expertise]
    }));
  };

  const handleLanguageChange = (language) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(lang => lang !== language)
        : [...prev.languages, language]
    }));
  };

  const handleAvailabilityChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          [field]: value
        }
      }
    }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        profilePicture: file
      }));
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setFormData(prev => ({
        ...prev,
        profilePicture: file
      }));
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  const data = new FormData();

  // Required fields
  data.append('email', formData.email);
  data.append('password', formData.password);
  data.append('confirm_password', formData.confirmPassword);
  data.append('full_name', formData.fullName);

  // Optional profile fields
  data.append('phone', formData.phone || '');
  data.append('bio', formData.bio || '');
  data.append('experience_years', formData.experience || '');
  data.append('linkedin_profile', formData.linkedinProfile || '');
  data.append('portfolio_website', formData.portfolioWebsite || '');
  data.append('learning_goals', formData.learningGoals || '');

  // File upload
  if (formData.profilePicture) {
    data.append('profile_picture', formData.profilePicture);
  }

  // Array fields
  formData.expertiseCategory.forEach((cat) => {
    data.append('preferred_categories', cat);
  });

  formData.languages.forEach((lang) => {
    data.append('languages_known', lang);
  });

  // Availability as JSON string
  data.append('availability_schedule', JSON.stringify(formData.availability));

  const errors = {};

if (!formData.fullName) errors.fullName = "Full Name is required";
if (!formData.email) errors.email = "Email is required";
else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Invalid email format";

if (!formData.password) errors.password = "Password is required";
if (!formData.confirmPassword) errors.confirmPassword = "Please confirm your password";
else if (formData.password !== formData.confirmPassword)
  errors.confirmPassword = "Passwords do not match";

if (!formData.phone) errors.phone = "Phone number is required";

if (!formData.expertiseCategory.length)
  errors.expertiseCategory = "Select at least one expertise category";

if (!formData.languages.length)
  errors.languages = "Select at least one language";

if (!formData.agreeToTerms)
  errors.agreeToTerms = "You must agree to the terms and conditions";

// Stop submission if any errors exist
if (Object.keys(errors).length > 0) {
  setFormErrors(errors);
  return;
}


  try {
    const response = await axiosInstance.post('register/mentor/', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // ✅ Success alert here
    alert("Mentor registered successfully!");

    // ✅ Optional: clear form
    setFormData({
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      experience: '',
      profilePicture: null,
      expertiseCategory: [],
      languages: [],
      bio: '',
      linkedinProfile: '',
      portfolioWebsite: '',
      availability: {
        monday: { startTime: '', endTime: '' },
        tuesday: { startTime: '', endTime: '' },
        wednesday: { startTime: '', endTime: '' },
        thursday: { startTime: '', endTime: '' },
        friday: { startTime: '', endTime: '' },
        saturday: { startTime: '', endTime: '' },
        sunday: { startTime: '', endTime: '' },
      },
      agreeToTerms: false,
    });

    // ✅ Optional: redirect
    navigate('/mentor'); // if using React Router
    console.log('Mentor registered successfully:', response.data);
    // Optionally redirect or show success message
  } catch (error) {
    console.error('Registration failed:', error.response?.data || error.message);
    // Optionally show error to user
  }
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50">
      {/* Header Section */}
      <div className="bg-[#ECFDF5] py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-600 to-teal-700 rounded-full shadow-lg mb-6">
              <User className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-[#064E3B] mb-4">
            Become a Mentor
          </h1>
          <p className="text-lg text-teal-700 max-w-2xl mx-auto leading-relaxed">
            Share your expertise and help learners grow on their educational journey with Learnometer
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-8">
          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-teal-100">
            <h2 className="text-2xl font-semibold text-[#064E3B] mb-6 flex items-center gap-2">
              <User className="w-6 h-6 text-teal-600" />
              Personal Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#064E3B] mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your full name"
                />
                {formErrors.fullName && (
                  <p className="text-red-600 text-sm mt-1">{formErrors.fullName}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#064E3B] mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your email address"
                />
                {formErrors.email && (
                  <p className="text-red-600 text-sm mt-1">{formErrors.email}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#064E3B] mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                  placeholder="Create a secure password"
                />
                {formErrors.password && (
                  <p className="text-red-600 text-sm mt-1">{formErrors.password}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#064E3B] mb-2">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                  placeholder="Confirm your password"
                />
                {formErrors.confirmPassword && (
                  <p className="text-red-600 text-sm mt-1">{formErrors.confirmPassword}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#064E3B] mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your phone number"
                />
                {formErrors.phone && (
  <p className="text-red-600 text-sm mt-1">{formErrors.phone}</p>
)}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#064E3B] mb-2">
                  Years of Experience *
                </label>
                <input
                  type="number"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full px-4 py-3 border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                  placeholder="Years of experience"
                />
                {formErrors.experience && (
  <p className="text-red-600 text-sm mt-1">{formErrors.experience}</p>
)}
              </div>
            </div>
          </div>

          {/* Profile Picture Upload */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-teal-100">
            <h2 className="text-2xl font-semibold text-[#064E3B] mb-6 flex items-center gap-2">
              <Upload className="w-6 h-6 text-teal-600" />
              Profile Picture
            </h2>
            
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                dragActive
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-teal-300 hover:border-teal-400 hover:bg-teal-50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 text-teal-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-[#064E3B] mb-2">
                Click to upload your profile picture
              </p>
              <p className="text-sm text-teal-600 mb-4">
                Or drag and drop your image here
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="profilePicture"
              />
              <label
                htmlFor="profilePicture"
                className="inline-flex items-center px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors duration-200 cursor-pointer"
              >
                Choose File
              </label>
              {formData.profilePicture && (
                <p className="mt-2 text-sm text-teal-700">
                  Selected: {formData.profilePicture.name}
                </p>
              )}
            </div>
          </div>

          {/* Professional Information */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-teal-100">
            <h2 className="text-2xl font-semibold text-[#064E3B] mb-6 flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-teal-600" />
              Professional Information
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#064E3B] mb-2">
                  Expertise Categories *
                </label>
                <div className="border border-teal-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {expertiseCategories.map(category => (
                      <label key={category} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.expertiseCategory.includes(category)}
                          onChange={() => handleExpertiseChange(category)}
                          className="w-4 h-4 text-teal-600 border-teal-300 rounded focus:ring-teal-500"
                        />
                        <span className="text-sm text-[#064E3B]">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {formData.expertiseCategory.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.expertiseCategory.map(category => (
                      <span
                        key={category}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800"
                      >
                        {category}
                        <button
                          type="button"
                          onClick={() => handleExpertiseChange(category)}
                          className="ml-2 text-teal-600 hover:text-teal-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                 {/* ✅ Error Message */}
    {formErrors.expertiseCategory && (
      <p className="text-red-600 text-sm mt-2">{formErrors.expertiseCategory}</p>
    )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#064E3B] mb-2">
                  Languages Known *
                </label>
                <div className="border border-teal-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {languages.map(language => (
                      <label key={language} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.languages.includes(language)}
                          onChange={() => handleLanguageChange(language)}
                          className="w-4 h-4 text-teal-600 border-teal-300 rounded focus:ring-teal-500"
                        />
                        <span className="text-sm text-[#064E3B]">{language}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {formData.languages.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.languages.map(language => (
                      <span
                        key={language}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800"
                      >
                        {language}
                        <button
                          type="button"
                          onClick={() => handleLanguageChange(language)}
                          className="ml-2 text-amber-600 hover:text-amber-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {/* ✅ Error Message */}
    {formErrors.languages && (
      <p className="text-red-600 text-sm mt-2">{formErrors.languages}</p>
    )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#064E3B] mb-2">
                  Short Bio / About *
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-4 py-3 border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                  placeholder="Tell us about yourself, your expertise, and what makes you a great mentor..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#064E3B] mb-2">
                    LinkedIn Profile
                  </label>
                  <input
                    type="url"
                    name="linkedinProfile"
                    value={formData.linkedinProfile}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#064E3B] mb-2">
                    Portfolio Website
                  </label>
                  <input
                    type="url"
                    name="portfolioWebsite"
                    value={formData.portfolioWebsite}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                    placeholder="https://yourportfolio.com"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Availability Schedule */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-teal-100">
            <h2 className="text-2xl font-semibold text-[#064E3B] mb-6 flex items-center gap-2">
              <Clock className="w-6 h-6 text-teal-600" />
              Availability Schedule
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {daysOfWeek.map(day => (
                <div key={day.key} className="bg-teal-50 rounded-lg p-4 border border-teal-200 hover:shadow-md transition-all duration-200">
                  <h3 className="font-semibold text-[#064E3B] mb-3">{day.label}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-teal-700 mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={formData.availability[day.key].startTime}
                        onChange={(e) => handleAvailabilityChange(day.key, 'startTime', e.target.value)}
                        className="w-full px-3 py-2 border border-teal-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-teal-700 mb-1">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={formData.availability[day.key].endTime}
                        onChange={(e) => handleAvailabilityChange(day.key, 'endTime', e.target.value)}
                        className="w-full px-3 py-2 border border-teal-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Agreement */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-teal-100">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleInputChange}
                required
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
              {formErrors.agreeToTerms && (
  <p className="text-red-600 text-sm mt-1">{formErrors.agreeToTerms}</p>
)}
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full bg-[#0F766E] text-white py-4 px-8 rounded-lg font-bold text-lg hover:bg-teal-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Register as Mentor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterMentor;