import React, { useState } from 'react';
import { Check, Plus, Edit, Trash2, BookOpen, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const SubTopics = () => {
  const [subtopics, setSubtopics] = useState([
    { id: 1, title: 'HTML Tags', completed: true },
    { id: 2, title: 'HTML Attributes', completed: true },
    { id: 3, title: 'HTML Forms', completed: true },
    { id: 4, title: 'HTML Tables', completed: false },
    { id: 5, title: 'HTML Semantic Elements', completed: false },
    { id: 6, title: 'HTML Media Elements', completed: false },
    { id: 7, title: 'HTML Links and Navigation', completed: false },
    { id: 8, title: 'HTML Best Practices', completed: false }
  ]);

  const [newSubtopic, setNewSubtopic] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const toggleCompletion = (id) => {
    setSubtopics(subtopics.map(subtopic => 
      subtopic.id === id 
        ? { ...subtopic, completed: !subtopic.completed }
        : subtopic
    ));
  };

  const deleteSubtopic = (id) => {
    setSubtopics(subtopics.filter(subtopic => subtopic.id !== id));
  };

  const addSubtopic = () => {
    if (newSubtopic.trim()) {
      const newId = Math.max(...subtopics.map(s => s.id), 0) + 1;
      setSubtopics([...subtopics, { 
        id: newId, 
        title: newSubtopic.trim(), 
        completed: false 
      }]);
      setNewSubtopic('');
      setShowAddForm(false);
    }
  };

  const completedCount = subtopics.filter(s => s.completed).length;
  const totalCount = subtopics.length;
  const remainingCount = totalCount - completedCount;

  const chartData = [
    { name: 'Completed', value: completedCount, color: '#10B981' },
    { name: 'Remaining', value: remainingCount, color: '#E5E7EB' }
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-4">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6">
          My Courses / Web Development Fundamentals / HTML Fundamentals / Subtopics
        </nav>

        {/* Main Topic Header */}
        <div className="bg-[#4F46E5] text-white py-6 px-4 rounded-lg mb-6">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8" />
            <h1 className="text-2xl font-bold">HTML Fundamentals</h1>
          </div>
          <p className="text-indigo-100">Track your progress by marking what you've learned</p>
        </div>

        {/* Add Subtopic Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-[#FACC15] text-[#1E1B4B] font-semibold rounded px-4 py-2 flex items-center gap-2 hover:bg-yellow-300 transition-colors w-fit"
            >
              <Plus className="w-4 h-4" />
              Add New Subtopic
            </button>
            <h2 className="text-xl font-bold text-[#1E1B4B]">
              All Subtopics ({totalCount})
            </h2>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubtopic}
                  onChange={(e) => setNewSubtopic(e.target.value)}
                  placeholder="Enter subtopic name..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  onKeyPress={(e) => e.key === 'Enter' && addSubtopic()}
                />
                <button
                  onClick={addSubtopic}
                  className="bg-[#4F46E5] text-white px-4 py-2 rounded hover:bg-indigo-600 transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewSubtopic('');
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Subtopics List */}
          <div className="space-y-3">
            {subtopics.map((subtopic) => (
              <div
                key={subtopic.id}
                className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
                  subtopic.completed 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleCompletion(subtopic.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      subtopic.completed
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-[#4F46E5]'
                    }`}
                  >
                    {subtopic.completed && <Check className="w-4 h-4" />}
                  </button>
                  <span
                    className={`font-medium transition-all ${
                      subtopic.completed
                        ? 'text-gray-400 line-through'
                        : 'text-[#1E1B4B]'
                    }`}
                  >
                    {subtopic.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="p-2 text-gray-500 hover:text-[#4F46E5] hover:bg-indigo-50 rounded transition-all"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteSubtopic(subtopic.id)}
                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Chart Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-[#4F46E5]" />
            <h2 className="text-xl font-bold text-[#1E1B4B]">
              Your Progress in HTML Fundamentals
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Stats */}
            <div className="flex flex-col justify-center space-y-4">
              <div className="text-center lg:text-left">
                <div className="text-3xl font-bold text-[#1E1B4B] mb-2">
                  {Math.round((completedCount / totalCount) * 100)}%
                </div>
                <div className="text-gray-600">Overall Progress</div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{completedCount}</div>
                  <div className="text-sm text-green-800">Completed</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">{remainingCount}</div>
                  <div className="text-sm text-gray-800">Remaining</div>
                </div>
                <div className="p-3 bg-[#4F46E5] bg-opacity-10 rounded-lg">
                  <div className="text-2xl font-bold text-[#4F46E5]">{totalCount}</div>
                  <div className="text-sm text-[#4F46E5]">Total</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${(completedCount / totalCount) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubTopics;