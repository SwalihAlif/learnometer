import React, { useState } from 'react';
import { BookOpen, Plus, Edit, Trash2, Users, Eye, Search } from 'lucide-react';

const LearnerMyCourses = () => {
  const [courses, setCourses] = useState([
    {
      id: 1,
      title: "Machine Learning Fundamentals",
      category: "Computer Science",
      description: "A comprehensive introduction to machine learning algorithms, data preprocessing, and model evaluation techniques.",
      createdDate: "2024-01-15"
    },
    {
      id: 2,
      title: "Digital Marketing Strategy",
      category: "Marketing",
      description: "Learn modern digital marketing techniques including SEO, social media marketing, and content strategy.",
      createdDate: "2024-02-03"
    }
  ]);

  const [newCourse, setNewCourse] = useState({
    title: '',
    category: '',
    description: ''
  });

  const [categorySearch, setCategorySearch] = useState('');
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);

  // Mock category suggestions - can be replaced with API call
  const categorySuggestions = [
    'Computer Science', 'Marketing', 'Design', 'Business', 'Mathematics',
    'Science', 'Languages', 'Arts', 'Engineering', 'Health & Medicine'
  ];

  const filteredCategories = categorySuggestions.filter(cat =>
    cat.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const handleInputChange = (field, value) => {
    setNewCourse(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCategoryChange = (value) => {
    setCategorySearch(value);
    setNewCourse(prev => ({
      ...prev,
      category: value
    }));
    setShowCategorySuggestions(true);
  };

  const selectCategory = (category) => {
    setCategorySearch(category);
    setNewCourse(prev => ({
      ...prev,
      category: category
    }));
    setShowCategorySuggestions(false);
  };

  const handleCreateCourse = () => {
    if (newCourse.title && newCourse.category && newCourse.description) {
      const course = {
        id: courses.length + 1,
        ...newCourse,
        createdDate: new Date().toISOString().split('T')[0]
      };
      setCourses(prev => [...prev, course]);
      setNewCourse({ title: '', category: '', description: '' });
      setCategorySearch('');
      setShowCategorySuggestions(false);
    }
  };

  const handleDeleteCourse = (courseId) => {
    setCourses(prev => prev.filter(course => course.id !== courseId));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
<div className="mb-8 bg-[#4F46E5] px-6 py-8 rounded-lg shadow-md">
  <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
    My Courses
  </h1>
  <p className="text-[#F9FAFB] text-lg">
    Create, manage, and connect with mentors for your personalized learning journey
  </p>
</div>


        {/* Create New Course Section */}
        <div className="bg-[#F9FAFB] rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-[#1E1B4B] mb-6 flex items-center">
            <Plus className="w-5 h-5 mr-2 text-[#4F46E5]" />
            Create a New Course
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Course Title */}
            <div>
              <label className="block text-sm font-medium text-[#1E1B4B] mb-2">
                Course Title
              </label>
              <input
                type="text"
                value={newCourse.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent outline-none transition-all"
                placeholder="Enter course title"
              />
            </div>

            {/* Category with Search */}
            <div className="relative">
              <label className="block text-sm font-medium text-[#1E1B4B] mb-2">
                Category
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={categorySearch}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  onFocus={() => setShowCategorySuggestions(true)}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent outline-none transition-all"
                  placeholder="Search or type category"
                />
                <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                
                {/* Category Suggestions Dropdown */}
                {showCategorySuggestions && filteredCategories.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredCategories.map((category, index) => (
                      <button
                        key={index}
                        onClick={() => selectCategory(category)}
                        className="w-full text-left px-4 py-2 hover:bg-[#F9FAFB] text-gray-700 first:rounded-t-lg last:rounded-b-lg"
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-[#1E1B4B] mb-2">
              Description
            </label>
            <textarea
              value={newCourse.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent outline-none transition-all resize-none"
              placeholder="Describe your course objectives and content"
            />
          </div>

          {/* Create Button */}
          <div className="mt-6">
            <button
              onClick={handleCreateCourse}
              className="bg-[#4F46E5] text-white px-6 py-2 rounded-lg hover:bg-[#4338CA] transition-colors font-medium flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Course
            </button>
          </div>
        </div>

        {/* All My Courses Section */}
        <div>
          <h2 className="text-2xl font-semibold text-[#1E1B4B] mb-6 flex items-center">
            <BookOpen className="w-6 h-6 mr-2 text-[#4F46E5]" />
            All My Courses
          </h2>

          {courses.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-[#F9FAFB] rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg">You haven't created any courses yet.</p>
            </div>
          ) : (
            /* Courses Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  {/* Course Title */}
                  <h3 className="text-xl font-bold text-[#1E1B4B] mb-3 line-clamp-2">
                    {course.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {course.description}
                  </p>

                  {/* Date and Category */}
                  <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                    <span>Created: {formatDate(course.createdDate)}</span>
                    <span className="bg-[#F9FAFB] px-2 py-1 rounded text-[#4F46E5] font-medium">
                      {course.category}
                    </span>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="flex gap-2 mb-3">
                    <button className="flex-1 bg-[#4F46E5] text-white px-3 py-2 rounded-lg hover:bg-[#4338CA] transition-colors text-sm font-medium flex items-center justify-center">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteCourse(course.id)}
                      className="flex-1 bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm font-medium flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </button>
                    <button className="flex-1 bg-[#FACC15] text-[#1E1B4B] px-3 py-2 rounded-lg hover:bg-[#EAB308] transition-colors text-sm font-medium flex items-center justify-center">
                      <Users className="w-4 h-4 mr-1" />
                      View Mentors
                    </button>
                  </div>

                  {/* View Main Topics Button */}
                  <button className="w-full border-2 border-[#4F46E5] text-[#4F46E5] px-4 py-2 rounded-lg hover:bg-[#4F46E5] hover:text-white transition-colors text-sm font-medium flex items-center justify-center">
                    <Eye className="w-4 h-4 mr-2" />
                    View Main Topics
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearnerMyCourses;