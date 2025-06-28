import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../axios';
import { Plus, Eye, Edit3, Trash2, FileText, Brain, Calendar } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { showDialog } from '../../redux/slices/confirmDialogSlice'
import { fetchPaginatedData } from '../../redux/slices/paginationSlice';
import Pagination from '../../components/common/Pagination';

const MainTopics = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const { results: topics, page, count, loading } = useSelector((state) => state.pagination);

  const dispatch = useDispatch();

  const [newTopic, setNewTopic] = useState({
    title: '',
    description: ''
  });

  const [course, setCourse] = useState(null);

  const [editModal, setEditModal] = useState({
    visible: false,
    id: null,
    title: '',
    description: '',
  });


  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await axiosInstance.get(`courses/${courseId}/`);
        setCourse(response.data);
      } catch (error) {
        console.error('Error fetching course details:', error);
      }
    };

    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

useEffect(() => {
  if (courseId) {
    dispatch(
      fetchPaginatedData({
        url: "topics/main-topic",
        page: 1,
        queryParams: { course_id: courseId },
      })
    );
  }
}, [dispatch, courseId]);

const handlePageChange = (newPage) => {
  dispatch(
    fetchPaginatedData({
      url: "topics/main-topic",
      page: newPage,
      queryParams: { course_id: courseId },
    })
  );
};



const handleAddTopic = async (e) => {
  e.preventDefault();

  if (newTopic.title.trim() && newTopic.description.trim()) {
    try {
      await axiosInstance.post('topics/main-topic/', {
        title: newTopic.title,
        description: newTopic.description,
        course: courseId,
      });

      // Re-fetch paginated topics from the server
      dispatch(fetchPaginatedData({
        url: 'topics/main-topic',
        page, // current page from Redux
        queryParams: { course_id: courseId },
      }));

      // Clear the form inputs
      setNewTopic({ title: '', description: '' });
    } catch (err) {
      console.error('Failed to create topic:', err);
    }
  }
};


const handleUpdateTopic = async () => {
  try {
    const { id, title, description } = editModal;

    await axiosInstance.put(`topics/main-topic/${id}/`, {
      title,
      description,
      course: courseId, // required field
    });

    // ✅ Refresh the updated list of topics from the server
    dispatch(fetchPaginatedData({
      url: 'topics/main-topic',
      page, // from Redux state
      queryParams: { course_id: courseId },
    }));

    // 🔄 Reset modal state
    setEditModal({ visible: false, id: null, title: '', description: '' });
  } catch (err) {
    console.error('Failed to update topic:', err);
  }
};



const handleDeleteTopic = (id) => {
  dispatch(showDialog({
    title: "Delete Main-Topic?",
    message: "Are you sure you want to permanently delete this main-topic?",
    onConfirm: async () => {
      try {
        await axiosInstance.delete(`topics/main-topic/${id}/`);

        // 🔄 Re-fetch topics after deletion to keep Redux in sync
        dispatch(fetchPaginatedData({
          url: 'topics/main-topic',
          page, // current page from Redux
          queryParams: { course_id: courseId },
        }));
      } catch (err) {
        console.error('Failed to delete topic:', err);
      }
    },
    onCancel: () => {
      console.log("Topic delete cancelled");
    }
  }));
};


  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Breadcrumb */}
      <div className="mb-4">
        <p className="text-sm text-gray-500">
          My Courses / {course ? course.title : '...'} / Main Topics
        </p>
      </div>

      {/* Course Title Section */}
      <div className="bg-indigo-600 rounded-lg p-6 mb-6 text-white">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          {course ? course.title : 'Loading...'}
        </h1>
        <p className="text-lg md:text-xl text-indigo-100">
          Manage your learning journey by adding key topics.
        </p>
      </div>

      {/* Add New Topic Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold text-indigo-900 mb-4">
          Add New Main Topic
        </h2>
        <div>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="e.g., HTML Basics, CSS Fundamentals"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                value={newTopic.title}
                onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder="Brief description of what this topic covers"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                value={newTopic.description}
                onChange={(e) => setNewTopic({ ...newTopic, description: e.target.value })}
              />
            </div>
          </div>
          <button
            onClick={handleAddTopic}
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-200"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Main Topic
          </button>
        </div>
      </div>

      {/* All Main Topics Section */}
      <div>
        <h2 className="text-2xl font-bold text-indigo-900 mb-6">
          All Main Topics ({topics.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {topics.map((topic) => (
            <div key={topic.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {/* Topic Header */}
              <div className="mb-4">
                <h3 className="text-xl font-bold text-indigo-900 mb-2">
                  {topic.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {topic.description}
                </p>
              </div>

              {/* Topic Stats */}
              <div className="text-sm text-gray-500 mb-4 pb-4 border-b border-gray-100">
                <span className="font-medium">{topic.subtopicsCount} subtopics</span>
                <span className="mx-2">•</span>
                <span>Created on {topic.createdDate}</span>
              </div>

              {/* Action Buttons Row 1 */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button onClick={() => navigate(`/learner/sub-topics/${topic.id}`)}
                className="flex items-center justify-center px-3 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-md hover:bg-indigo-50 transition-colors duration-200">
                  <Eye className="w-4 h-4 mr-1" />
                  View Subtopics
                </button>
                <button
                  onClick={() =>
                    setEditModal({
                      visible: true,
                      id: topic.id,
                      title: topic.title,
                      description: topic.description,
                    })
                  }
                  className="flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
                >
                  <Edit3 className="w-4 h-4 mr-1" />
                  Edit
                </button>

                <button
                  onClick={() => handleDeleteTopic(topic.id)}
                  className="flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors duration-200"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </button>
                <button className="flex items-center justify-center px-3 py-2 text-sm font-medium text-yellow-600 border border-yellow-200 rounded-md hover:bg-yellow-50 transition-colors duration-200">
                  <FileText className="w-4 h-4 mr-1" />
                  Make Notes
                </button>
              </div>

              {/* Action Buttons Row 2 */}
              <div className="grid grid-cols-2 gap-2">
                <button className="flex items-center justify-center px-3 py-2 text-sm font-medium text-purple-600 border border-purple-200 rounded-md hover:bg-purple-50 transition-colors duration-200">
                  <Brain className="w-4 h-4 mr-1" />
                  Attend Quiz
                </button>
                <button className="flex items-center justify-center px-3 py-2 text-sm font-medium text-emerald-600 border border-emerald-200 rounded-md hover:bg-emerald-50 transition-colors duration-200">
                  <Calendar className="w-4 h-4 mr-1" />
                  View Schedules
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {topics.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No topics yet</h3>
            <p className="text-gray-500">
              Start building your learning path by adding your first main topic.
            </p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModal.visible && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <h2 className="text-xl font-semibold mb-4 text-indigo-900">Edit Topic</h2>
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2 mb-3"
              value={editModal.title}
              onChange={(e) =>
                setEditModal((prev) => ({ ...prev, title: e.target.value }))
              }
            />
            <textarea
              className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
              rows={4}
              value={editModal.description}
              onChange={(e) =>
                setEditModal((prev) => ({ ...prev, description: e.target.value }))
              }
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditModal({ visible: false })}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTopic}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}


<Pagination
  page={page}
  totalPages={Math.ceil(count / 10)}
  onPageChange={handlePageChange}
/>


    </div>
  );
};

export default MainTopics;