import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../../axios';

const MainTopicsDummy = () => {
  const { courseId } = useParams(); // extract course ID from URL
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await axiosInstance.get(`courses/main-topic/?course_id=${courseId}`);
        setTopics(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching topics:', err);
        setError('Failed to load topics.');
        setLoading(false);
      }
    };

    if (courseId) {
      fetchTopics();
    }
  }, [courseId]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold text-indigo-800 mb-4">Main Topics for Course ID: {courseId}</h1>

      {loading ? (
        <p className="text-gray-500">Loading topics...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : topics.length === 0 ? (
        <p className="text-gray-500">No topics found for this course.</p>
      ) : (
        <ul className="bg-white p-4 rounded shadow-md space-y-2">
          {topics.map((topic) => (
            <li key={topic.id} className="border-b pb-2">
              <h2 className="text-lg font-semibold text-indigo-700">{topic.title}</h2>
              <p className="text-sm text-gray-600">{topic.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MainTopicsDummy;
