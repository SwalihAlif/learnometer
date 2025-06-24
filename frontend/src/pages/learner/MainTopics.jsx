import React, { useState } from 'react';
import { Plus, Eye, Edit3, Trash2, FileText, Brain, Calendar } from 'lucide-react';

const MainTopics = () => {
  const [topics, setTopics] = useState([
    {
      id: 1,
      title: 'HTML Fundamentals',
      description: 'Learn the building blocks of web pages with semantic HTML elements, forms, and accessibility best practices.',
      subtopicsCount: 8,
      createdDate: 'Jun 20, 2025'
    },
    {
      id: 2,
      title: 'CSS Styling & Layout',
      description: 'Master styling techniques, flexbox, grid systems, and responsive design principles for modern web layouts.',
      subtopicsCount: 12,
      createdDate: 'Jun 18, 2025'
    },
    {
      id: 3,
      title: 'JavaScript Basics',
      description: 'Introduction to programming concepts, DOM manipulation, events, and interactive web functionality.',
      subtopicsCount: 15,
      createdDate: 'Jun 15, 2025'
    },
    {
      id: 4,
      title: 'Responsive Web Design',
      description: 'Create mobile-first designs that work seamlessly across all devices and screen sizes.',
      subtopicsCount: 6,
      createdDate: 'Jun 12, 2025'
    }
  ]);

  const [newTopic, setNewTopic] = useState({
    title: '',
    description: ''
  });

  const handleAddTopic = (e) => {
    e.preventDefault();
    if (newTopic.title.trim() && newTopic.description.trim()) {
      const topic = {
        id: topics.length + 1,
        title: newTopic.title,
        description: newTopic.description,
        subtopicsCount: 0,
        createdDate: new Date().toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        })
      };
      setTopics([...topics, topic]);
      setNewTopic({ title: '', description: '' });
    }
  };

  const handleDeleteTopic = (id) => {
    setTopics(topics.filter(topic => topic.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Breadcrumb */}
      <div className="mb-4">
        <p className="text-sm text-gray-500">
          My Courses / Web Development Fundamentals / Main Topics
        </p>
      </div>

      {/* Course Title Section */}
      <div className="bg-indigo-600 rounded-lg p-6 mb-6 text-white">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          Web Development Fundamentals
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
                <button className="flex items-center justify-center px-3 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-md hover:bg-indigo-50 transition-colors duration-200">
                  <Eye className="w-4 h-4 mr-1" />
                  View Subtopics
                </button>
                <button className="flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200">
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
    </div>
  );
};

export default MainTopics;