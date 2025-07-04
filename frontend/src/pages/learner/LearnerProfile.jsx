import axiosInstance from '../../axios';
import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, Clock, User, Globe, Tag, Camera, Save, Check, ChevronDown, Briefcase, Phone, Target, Calendar, Shield } from 'lucide-react';

const LearnerProfile = () => {
  // State management
  const [profile, setProfile] = useState({});
  // Selected options
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);

  // Availability state
  const [availability, setAvailability] = useState({
    Monday: { start: '', end: '', enabled: false },
    Tuesday: { start: '', end: '', enabled: false },
    Wednesday: { start: '', end: '', enabled: false },
    Thursday: { start: '', end: '', enabled: false },
    Friday: { start: '', end: '', enabled: false },
    Saturday: { start: '', end: '', enabled: false },
    Sunday: { start: '', end: '', enabled: false }
  });

  const [profilePic, setProfilePic] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [profilePicPreview, setProfilePicPreview] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Dropdown options (would be fetched from API)
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableLanguages] = useState(['English', 'Hindi', 'Spanish', 'French', 'German', 'Mandarin', 'Arabic']);

  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
  const [languagesDropdownOpen, setLanguagesDropdownOpen] = useState(false);



  // Refs
  const fileInputRef = useRef(null);

  // Time options for dropdowns
  const timeOptions = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute of ['00', '30']) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute}`;
      timeOptions.push(timeString);
    }
  }

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axiosInstance.get("users/profile/", {

        });

        const data = res.data;

        setProfile(data);

        // Optional: initialize other states like dropdowns or file
        setSelectedCategories(data.preferred_categories || []);
        setSelectedLanguages(data.languages_known || []);

        // ✅ Format incoming availability
        const loadedAvailability = {};
        const days = Object.keys(availability); // use existing structure
        for (let day of days) {
          const dayData = data.availability_schedule?.[day];
          loadedAvailability[day] = {
            enabled: !!(dayData?.start && dayData?.end),
            start: dayData?.start || '',
            end: dayData?.end || '',
          };
        }

        setAvailability(loadedAvailability);

      } catch (err) {
        console.error("Error fetching mentor profile:", err);
        alert("Failed to load profile");
      }
    };

    fetchProfile();
  }, []);


  // fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axiosInstance.get("users/categories/");
        setAvailableCategories(res.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  // Handle file upload
  const handleFileChange = (file) => {
    if (file && file.type.startsWith('image/')) {
      setProfilePic(file);
      const reader = new FileReader();
      reader.onload = (e) => setProfilePicPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileChange(files[0]);
    }
  };

  // Multi-select dropdown handlers
  const toggleCategory = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleLanguage = (language) => {
    setSelectedLanguages(prev =>
      prev.includes(language)
        ? prev.filter(l => l !== language)
        : [...prev, language]
    );
  };

  const removeCategory = (category) => {
    setSelectedCategories(prev => prev.filter(c => c !== category));
  };

  const removeLanguage = (language) => {
    setSelectedLanguages(prev => prev.filter(l => l !== language));
  };


  // Availability handlers
  const toggleDay = (day) => {
    setAvailability(prev => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled }
    }));
  };

  const updateTimeSlot = (day, field, value) => {
    setAvailability(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };


  // Handle form submission

  const handleSave = async () => {
    setIsLoading(true);

    try {
      const formData = new FormData();

      // Add editable profile fields
      if (profile.full_name) formData.append("full_name", profile.full_name);
      if (profile.phone) formData.append("phone", profile.phone);
      if (profile.bio) formData.append("bio", profile.bio);
      if (profile.learning_goals) formData.append("learning_goals", profile.learning_goals);
      if (profile.linkedin_profile) formData.append("linkedin_profile", profile.linkedin_profile);
      if (profile.portfolio_website) formData.append("portfolio_website", profile.portfolio_website);

         // Append availability as a JSON string
      if (availability && typeof availability === 'object') {
        formData.append("availability_schedule", JSON.stringify(availability));
      }

      // Append multi-select arrays
      selectedCategories.forEach(category => {
        formData.append("preferred_categories", category);
      });

      selectedLanguages.forEach(language => {
        formData.append("languages_known", language);
      });

      // Append profile picture if selected
      if (profilePic) {
        formData.append("profile_picture", profilePic);
      }

      // Send PATCH request to update profile
const response = await axiosInstance.patch("users/profile/", formData, {
  headers: {
    "Content-Type": "multipart/form-data",
  },
  withCredentials: true, // ensures cookie is sent with request
});

      // Update local state after success
      console.log("Profile updated successfully:", response.data);
      alert("Profile updated successfully.");
      setProfile(response.data);

    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please check console for errors.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-gray-50 to-gray-100 py-8 px-4">

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-800 mb-2">Learner Profile</h1>
          <p className="text-indigo-600 text-lg">Create your personalized learning profile</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Profile Picture Section */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-900 p-8 text-white">

            <div className="flex flex-col items-center">
              <div className="relative mb-6">
                {profilePicPreview || profile.profile_picture ? (
                  <div className="relative">
                    <img
                      src={profilePicPreview || profile.profile_picture}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                    <button
                      onClick={() => {
                        setProfilePic(null);
                        setProfilePicPreview('');
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div
                    className={`w-32 h-32 rounded-full border-4 border-dashed border-white/50 flex items-center justify-center cursor-pointer transition-all duration-300 ${isDragOver ? 'border-amber-400 bg-white/10' : 'hover:border-white hover:bg-white/5'
                      }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="text-center">
                      <Camera size={32} className="mx-auto mb-2 opacity-70" />
                      <p className="text-sm opacity-70">Upload Photo</p>
                    </div>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e.target.files[0])}
                className="hidden"
              />

              <div
                className={`border-2 border-dashed border-white/30 rounded-lg p-6 w-full max-w-md text-center cursor-pointer transition-all duration-300 ${isDragOver ? 'border-amber-400 bg-white/10' : 'hover:border-white/50 hover:bg-white/5'
                  }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={24} className="mx-auto mb-2 opacity-70" />
                <p className="text-sm opacity-70">Drag & drop your profile picture here, or click to browse</p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-8 space-y-8">
            {/* Basic Information */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-indigo-800 mb-2">
                  <User size={16} className="inline mr-2" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-indigo-100 rounded-lg focus:border-indigo-700 focus:ring-2 focus:ring-indigo-700/20 transition-all duration-200 bg-indigo-50/30"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-indigo-800 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={profile.email}
                  readOnly
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  placeholder="your.email@example.com"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
            </div>

            {/* Phone and Experience */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-indigo-800 mb-2">
                  <Phone size={16} className="inline mr-2" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-indigo-100 rounded-lg focus:border-indigo-700 focus:ring-2 focus:ring-indigo-700/20 transition-all duration-200 bg-indigo-50/30"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            {/* Bio and Learning Goals */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-indigo-800 mb-2">
                  Professional Bio
                </label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-indigo-100 rounded-lg focus:border-indigo-700 focus:ring-2 focus:ring-indigo-700/20 transition-all duration-200 bg-indigo-50/30 resize-none"
                  placeholder="Tell us about your professional background and experience..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-indigo-800 mb-2">
                  <Target size={16} className="inline mr-2" />
                  Learning Goals
                </label>
                <textarea
                  value={profile.learning_goals}
                  onChange={(e) => setProfile(prev => ({ ...prev, learning_goals: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-indigo-100 rounded-lg focus:border-indigo-700 focus:ring-2 focus:ring-indigo-700/20 transition-all duration-200 bg-indigo-50/30 resize-none"
                  placeholder="What are your learning objectives and goals..."
                />
              </div>
            </div>

            {/* Social Links */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-indigo-800 mb-2">
                  LinkedIn Profile
                </label>
                <input
                  type="url"
                  value={profile.linkedin_profile}
                  onChange={(e) => setProfile(prev => ({ ...prev, linkedin_profile: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-indigo-100 rounded-lg focus:border-indigo-700 focus:ring-2 focus:ring-indigo-700/20 transition-all duration-200 bg-indigo-50/30"
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-indigo-800 mb-2">
                  Portfolio Website
                </label>
                <input
                  type="url"
                  value={profile.portfolio_website}
                  onChange={(e) => setProfile(prev => ({ ...prev, portfolio_website: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-indigo-100 rounded-lg focus:border-indigo-700 focus:ring-2 focus:ring-indigo-700/20 transition-all duration-200 bg-indigo-50/30"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>

            {/* Read-only fields */}
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  Role
                </label>
                <input
                  type="text"
                  value={profile.role}
                  readOnly
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  <Calendar size={16} className="inline mr-2" />
                  Member Since
                </label>
                <input
                  type="text"
                  value={profile.created_at ? new Date(profile.created_at).toLocaleDateString() : ''}
                  readOnly
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  <Shield size={16} className="inline mr-2" />
                  Approval Status
                </label>
                <div className="flex items-center px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50">
                  <div className={`w-3 h-3 rounded-full mr-2 ${profile.is_approved ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  <span className="text-gray-600 text-sm">
                    {profile.is_approved ? 'Approved' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            {/* Categories Selection - Dropdown */}
            <div className="relative">
              <label className="block text-sm font-semibold text-indigo-800 mb-3">
                <Tag size={16} className="inline mr-2" />
                Preferred Categories
              </label>

              {/* Selected Categories Display */}
              {selectedCategories.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {selectedCategories.map((category) => (
                    <span
                      key={category}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-700 text-white"
                    >
                      {category}
                      <button
                        onClick={() => removeCategory(category)}
                        className="ml-2 hover:bg-indigo-800 rounded-full p-0.5"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Dropdown Button */}
              <button
                type="button"
                onClick={() => setCategoriesDropdownOpen(!categoriesDropdownOpen)}
                className="w-full px-4 py-3 border-2 border-indigo-100 rounded-lg focus:border-indigo-700 focus:ring-2 focus:ring-indigo-700/20 transition-all duration-200 bg-indigo-50/30 flex items-center justify-between text-left"
              >
                <span className="text-indigo-700">
                  {selectedCategories.length === 0 ? 'Select categories...' : `${selectedCategories.length} selected`}
                </span>
                <ChevronDown
                  size={20}
                  className={`text-indigo-600 transition-transform duration-200 ${categoriesDropdownOpen ? 'transform rotate-180' : ''
                    }`}
                />
              </button>

              {/* Dropdown Menu */}
              {categoriesDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border-2 border-indigo-100 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {availableCategories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className={`w-full px-4 py-3 text-left hover:bg-indigo-50 transition-colors duration-150 flex items-center justify-between ${selectedCategories.includes(category) ? 'bg-indigo-50 text-indigo-700' : 'text-indigo-700'
                        }`}
                    >
                      <span>{category}</span>
                      {selectedCategories.includes(category) && (
                        <Check size={16} className="text-indigo-700" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Languages Selection - Dropdown */}
            <div className="relative">
              <label className="block text-sm font-semibold text-indigo-800 mb-3">
                <Globe size={16} className="inline mr-2" />
                Languages Known
              </label>

              {/* Selected Languages Display */}
              {selectedLanguages.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {selectedLanguages.map((language) => (
                    <span
                      key={language}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-amber-500 text-white"
                    >
                      {language}
                      <button
                        onClick={() => removeLanguage(language)}
                        className="ml-2 hover:bg-amber-600 rounded-full p-0.5"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Dropdown Button */}
              <button
                type="button"
                onClick={() => setLanguagesDropdownOpen(!languagesDropdownOpen)}
                className="w-full px-4 py-3 border-2 border-indigo-100 rounded-lg focus:border-indigo-700 focus:ring-2 focus:ring-indigo-700/20 transition-all duration-200 bg-indigo-50/30 flex items-center justify-between text-left"
              >
                <span className="text-indigo-700">
                  {selectedLanguages.length === 0 ? 'Select languages...' : `${selectedLanguages.length} selected`}
                </span>
                <ChevronDown
                  size={20}
                  className={`text-indigo-600 transition-transform duration-200 ${languagesDropdownOpen ? 'transform rotate-180' : ''
                    }`}
                />
              </button>

              {/* Dropdown Menu */}
              {languagesDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border-2 border-indigo-100 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {availableLanguages.map((language) => (
                    <button
                      key={language}
                      type="button"
                      onClick={() => toggleLanguage(language)}
                      className={`w-full px-4 py-3 text-left hover:bg-indigo-50 transition-colors duration-150 flex items-center justify-between ${selectedLanguages.includes(language) ? 'bg-indigo-50 text-amber-600' : 'text-indigo-700'
                        }`}
                    >
                      <span>{language}</span>
                      {selectedLanguages.includes(language) && (
                        <Check size={16} className="text-amber-600" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Availability Schedule */}
            <div>
              <label className="block text-sm font-semibold text-indigo-800 mb-4">
                <Clock size={16} className="inline mr-2" />
                Availability Schedule
              </label>
              <div className="bg-indigo-50/50 rounded-xl p-6 space-y-4">
                {Object.keys(availability).map((day) => (
                  <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-white rounded-lg border border-indigo-100">
                    <div className="flex items-center space-x-3 sm:w-32">
                      <input
                        type="checkbox"
                        checked={availability[day].enabled}
                        onChange={() => toggleDay(day)}
                        className="w-4 h-4 text-teal-700 bg-indigo-100 border-indigo-300 rounded focus:ring-teal-700 focus:ring-2"
                      />
                      <span className="font-medium text-indigo-800 text-sm">{day}</span>
                    </div>

                    {availability[day].enabled && (
                      <div className="flex items-center space-x-3 flex-1">
                        <select
                          value={availability[day].start}
                          onChange={(e) => updateTimeSlot(day, 'start', e.target.value)}
                          className="px-3 py-2 border border-indigo-200 rounded-lg focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 bg-white text-sm"
                        >
                          <option value="">Start Time</option>
                          {timeOptions.map((time) => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>

                        <span className="text-indigo-600 font-medium">to</span>

                        <select
                          value={availability[day].end}
                          onChange={(e) => updateTimeSlot(day, 'end', e.target.value)}
                          className="px-3 py-2 border border-indigo-200 rounded-lg focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 bg-white text-sm"
                        >
                          <option value="">End Time</option>
                          {timeOptions.map((time) => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-center pt-6">
              <button
                onClick={handleSave}
                disabled={isLoading}
                className={`px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 shadow-lg ${isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-700 to-indigo-700 hover:from-indigo-800 hover:to-indigo-800 hover:shadow-xl'
                  }`}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Save size={18} />
                    <span>Save Profile</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearnerProfile;
