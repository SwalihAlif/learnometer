    import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from '../../axios'

const CourseContentMetrics = () => {
  // Mock learnerId for demo purposes - replace with useParams() in your app
  const { learnerId } = useParams();
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get(`adminpanel/course-content-metrics/${learnerId}/`)
      .then(res => {
        setMetrics(res.data);
        console.log("course and content metrics: ", res.data)
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch metrics", err);
        setLoading(false);
      });

  }, [learnerId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-gray-300 text-lg">Loading metrics...</p>
        </div>
      </div>
    );
  }

  // Calculate totals for the AI cards
  const totalAIAnswers = metrics.reduce((sum, row) => sum + row.ai_answers, 0);
  const totalAISchedules = metrics.reduce((sum, row) => sum + row.ai_schedules, 0);
  const totalAIQuizzes = metrics.reduce((sum, row) => sum + row.ai_quizzes, 0);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
            📊 Course & Content Metrics
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-500 mx-auto rounded-full"></div>
        </div>

        {/* AI Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* AI Answers Card */}
          <div className="bg-gray-800 rounded-lg shadow-2xl p-6 border border-gray-700 text-center">
            <h3 className="text-xl font-semibold text-indigo-400 mb-2">The learner generated AI answers</h3>
            <p className="text-5xl font-extrabold text-indigo-300">{totalAIAnswers}</p>
          </div>
          {/* AI Schedules Card */}
          <div className="bg-gray-800 rounded-lg shadow-2xl p-6 border border-gray-700 text-center">
            <h3 className="text-xl font-semibold text-cyan-400 mb-2">The learner generated AI Schedules</h3>
            <p className="text-5xl font-extrabold text-cyan-300">{totalAISchedules}</p>
          </div>
          {/* AI Quizzes Card */}
          <div className="bg-gray-800 rounded-lg shadow-2xl p-6 border border-gray-700 text-center">
            <h3 className="text-xl font-semibold text-orange-400 mb-2">The learner generated AI Quizzes</h3>
            <p className="text-5xl font-extrabold text-orange-300">{totalAIQuizzes}</p>
          </div>
        </div>

        {/* Main Content Table (Hidden on small screens) */}
        <div className="hidden md:block overflow-x-auto">
          <div className="bg-gray-800 rounded-lg shadow-2xl border border-gray-700">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-700 border-b border-gray-600">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Main Topics
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Subtopics
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Questions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {metrics.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-700 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-medium text-blue-400">{row.course}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center justify-center w-12 h-12 bg-green-500 bg-opacity-20 text-white-400 rounded-full text-lg font-bold">
                        {row.main_topics}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center justify-center w-12 h-12 bg-yellow-500 bg-opacity-20 text-white-400 rounded-full text-lg font-bold">
                        {row.sub_topics}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center justify-center w-12 h-12 bg-pink-500 bg-opacity-20 text-white-400 rounded-full text-lg font-bold">
                        {row.questions}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {metrics.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No metrics available</h3>
            <p className="text-gray-500">Data will appear here once available.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseContentMetrics;