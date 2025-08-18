import axiosInstance from '../../axios';
import { useEffect, useState } from 'react';
import { BookOpen, Plus, Edit, Trash2, Users, Eye, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { showToast } from '../../redux/slices/toastSlice';
import { showDialog } from '../../redux/slices/confirmDialogSlice';
import { fetchPaginatedData } from '../../redux/slices/paginationSlice';
import { showLoader, hideLoader } from '../../redux/slices/loaderSlice';
import Pagination from '../../components/common/Pagination';
import GlobalLoader from '../../components/common/GlobalLoader';


const LearnerMyCourses = () => {
  const { results: courses, count, page, loading } = useSelector((state) => state.pagination);
  const [newCourse, setNewCourse] = useState({
    title: '',
    category: '',
    description: ''
  });

  const [categorySearch, setCategorySearch] = useState('');
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);

  const [editingCourseId, setEditingCourseId] = useState(null);
  const [editedCourse, setEditedCourse] = useState({
    title: '',
    description: ''
  });
  const navigate = useNavigate();

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchPaginatedData({ url: 'courses', page: 1 }));
  }, [dispatch]);

  const handlePageChange = (newPage) => {
    dispatch(fetchPaginatedData({ url: 'courses', page: newPage }));
  };



  // Handle live category suggestions from backend
  const handleCategoryChange = async (value) => {
    setCategorySearch(value);
    setNewCourse(prev => ({ ...prev, category: value }));
    setShowCategorySuggestions(true);

    try {
      const res = await axiosInstance.get(`courses/category-suggestions/?q=${value}`);
      setFilteredCategories(res.data); // assumes backend returns a list of strings
    } catch (err) {
      console.error('Error fetching category suggestions:', err);
    }
  };

  const selectCategory = (name) => {
    setCategorySearch(name);
    setNewCourse(prev => ({ ...prev, category: name }));
    setShowCategorySuggestions(false);
  };


  const handleInputChange = (field, value) => {
    setNewCourse(prev => ({
      ...prev,
      [field]: value
    }));
  };

const handleCreateCourse = async () => {
  if (newCourse.title && newCourse.category && newCourse.description) {
    dispatch(showLoader());
    setTimeout(async () => {  
      try {
        const payload = {
          title: newCourse.title,
          description: newCourse.description,
          category_name: newCourse.category.trim().toLowerCase(),
        };

        console.log("Sending:", payload);

        const res = await axiosInstance.post('courses/', payload);

        setNewCourse({ title: '', category: '', description: '' });
        setCategorySearch('');
        setShowCategorySuggestions(false);

        dispatch(showToast({ message: 'Course created successfully!', type: 'success' }));
        dispatch(fetchPaginatedData({ url: 'courses', page: 1 }));

      } catch (err) {
        console.error('Error creating course:', err);
        if (err.response) {
          console.error('Backend error response:', err.response.data);
        }
        dispatch(showToast({ message: 'Failed to create course.', type: 'error' }));
      } finally {
        dispatch(hideLoader());
      }
    }, 1000);
  } else {
    dispatch(showToast({ message: 'Please fill all fields.', type: 'error' }));
    dispatch(hideLoader());
  }
};



  const handleEditClick = (course) => {
    setEditingCourseId(course.id);
    setEditedCourse({
      title: course.title,
      description: course.description
    });
  };

const handleUpdateCourse = async (id) => {
  dispatch(showLoader());
   setTimeout(async () => {
  try {
    const course = courses.find(c => c.id === id);
    const categoryName = course?.category?.name || '';

    const res = await axiosInstance.put(`courses/${id}/`, {
      title: editedCourse.title,
      description: editedCourse.description,
      category_name: categoryName
    });

    // ✅ Refetch updated list (you can keep current page or go to page 1)
    dispatch(fetchPaginatedData({ url: 'courses', page }));

    setEditingCourseId(null);
    dispatch(showToast({ message: 'Course updated successfully', type: 'success' }));
  } catch (err) {
    console.error('Error updating course:', err);
    if (err.response) {
      console.error('Backend response:', err.response.data);
    }
    dispatch(showToast({ message: 'Failed to update course', type: 'error' }));
  } finally {
      dispatch(hideLoader()); 
    }
    }, 1000);
};




const handleDeleteCourse = (courseId) => {
  dispatch(showDialog({
    title: "Delete Course?",
    message: "Are you sure you want to permanently delete this course?",
    onConfirm: () => {
      dispatch(showLoader());
      setTimeout(async () => {
      try {
        await axiosInstance.delete(`courses/${courseId}/`);
        dispatch(fetchPaginatedData({ url: 'courses', page }));  // 🔁 Re-fetch updated data
      } catch (err) {
        console.error('Error deleting course:', err);
      } finally {
          dispatch(hideLoader());   
        }

      }, 1000);
    },
    onCancel: () => {
      console.log("Course delete cancelled");
    }
  }));
};

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewMainTopics = (courseId) => {
    navigate(`/learner/main-topics/${courseId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <GlobalLoader />
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

          {Array.isArray(courses) && courses.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-[#F9FAFB] rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg">You haven't created any courses yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.isArray(courses) &&
                courses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    {/* Conditional rendering for edit mode */}
                    {editingCourseId === course.id ? (
                      <div className="space-y-2 mb-4">
                        <input
                          type="text"
                          value={editedCourse.title}
                          onChange={(e) =>
                            setEditedCourse((prev) => ({ ...prev, title: e.target.value }))
                          }
                          className="w-full border border-gray-300 rounded px-2 py-1"
                          placeholder="Title"
                        />
                        <textarea
                          value={editedCourse.description}
                          onChange={(e) =>
                            setEditedCourse((prev) => ({ ...prev, description: e.target.value }))
                          }
                          className="w-full border border-gray-300 rounded px-2 py-1"
                          placeholder="Description"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateCourse(course.id)}
                            className="bg-green-600 text-white px-3 py-1 rounded"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingCourseId(null)}
                            className="bg-gray-400 text-white px-3 py-1 rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-xl font-bold text-[#1E1B4B] mb-3 line-clamp-2">
                          {course.title}
                        </h3>
                        <p className="text-gray-600 mb-4 line-clamp-3">{course.description}</p>
                      </>
                    )}

                    <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                      <span>Created: {formatDate(course.created_at)}</span>
                      <span className="bg-[#F9FAFB] px-2 py-1 rounded text-[#4F46E5] font-medium">
                        {course.category?.name}
                      </span>
                    </div>

                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => handleEditClick(course)}
                        className="flex-1 bg-[#4F46E5] text-white px-3 py-2 rounded-lg hover:bg-[#4338CA] transition-colors text-sm font-medium flex items-center justify-center"
                      >
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
                      <button 
                      onClick={() => navigate('/learner/all-mentors')}   
                      className="flex-1 bg-[#FACC15] text-[#1E1B4B] px-3 py-2 rounded-lg hover:bg-[#EAB308] transition-colors text-sm font-medium flex items-center justify-center">
                        <Users className="w-4 h-4 mr-1" />
                        View Mentors
                      </button>
                    </div>

                    <button
                      onClick={() => handleViewMainTopics(course.id)}
                      className="w-full border-2 border-[#4F46E5] text-[#4F46E5] px-4 py-2 rounded-lg hover:bg-[#4F46E5] hover:text-white transition-colors text-sm font-medium flex items-center justify-center">
                      <Eye className="w-4 h-4 mr-2" />
                      View Main Topics
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>

      </div>
                <Pagination
            page={page}
            totalPages={Math.ceil(count / 10)}
            onPageChange={handlePageChange}
          />
    </div>
  );

};

export default LearnerMyCourses;