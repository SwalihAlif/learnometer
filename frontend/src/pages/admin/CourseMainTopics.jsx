import { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPaginatedData } from '../../redux/slices/paginationSlice';

const CourseMainTopics = () => {
  const { course_id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { results: topics, loading, error, page } = useSelector((state) => state.pagination);

  useEffect(() => {
    if (course_id) {
      dispatch(fetchPaginatedData({ url: `adminpanel/course/${course_id}/main-topics`, page }));
    }
  }, [dispatch, course_id, page]);

  const handlePageChange = useCallback(
    (newPage) => {
      dispatch(fetchPaginatedData({ url: `adminpanel/course/${course_id}/main-topics`, page: newPage }));
    },
    [dispatch, course_id]
  );

  return (
    <div className="p-4 bg-[#0D1117] min-h-screen text-[#F9FAFB]">
      <h1 className="text-2xl font-bold text-[#FACC15] mb-4">Main Topics</h1>
      <div className="grid gap-4">
        {topics.map(topic => (
          <div key={topic.id} className="bg-[#1F2937] p-4 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold">{topic.title}</h2>
            <p className="text-sm text-gray-400 mb-2">{topic.description}</p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => navigate(`/admin/sub-topics/${topic.id}`)}
                className="px-4 py-2 bg-[#4F46E5] text-white rounded-lg hover:bg-[#4338CA]"
              >
                Subtopics
              </button>
              <button
                onClick={() => navigate(`/admin/schedules/${topic.id}`)}
                className="px-4 py-2 bg-[#4F46E5] text-white rounded-lg hover:bg-[#4338CA]"
              >
                Schedules
              </button>
              <button
                onClick={() => navigate(`/admin/questions/${topic.id}`)}
                className="px-4 py-2 bg-[#4F46E5] text-white rounded-lg hover:bg-[#4338CA]"
              >
                Questions
              </button>
            </div>
          </div>
        ))}
      </div>

       {/* Pagination controls */}
      <div className="flex gap-2 mt-6">
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={page <= 1}
          className="bg-gray-700 px-3 py-1 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => handlePageChange(page + 1)}
          className="bg-gray-700 px-3 py-1 rounded"
        >
          Next
        </button>
      </div>
      
    </div>
  );
};

export default CourseMainTopics;