import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';

import { fetchPaginatedData } from '../../redux/slices/paginationSlice';

const LearnerCourses = () => {
  const { learner_id } = useParams();
  const dispatch = useDispatch();
  const { results: courses, loading, error, page } = useSelector((state) => state.pagination);
  const navigate = useNavigate();

  useEffect(() => {
    if (learner_id) {
        dispatch(fetchPaginatedData({ url: `adminpanel/learner/${learner_id}/courses`, page}))
    }
  }, [dispatch, learner_id, page]);

  const handlePageChange = useCallback(
  (newPage) => {
    dispatch(fetchPaginatedData({ url: `adminpanel/learner/${learner_id}/courses`, page: newPage }));
  },
  [dispatch, learner_id] 
);

  return (
    <div className="p-4 bg-[#0D1117] min-h-screen text-[#F9FAFB]">
      <h1 className="text-2xl font-bold text-[#FACC15] mb-4">Courses</h1>
      <div className="grid gap-4">
        {courses.map(course => (
          <div key={course.id} className="bg-[#1F2937] p-4 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold">{course.title}</h2>
            <p className="text-sm text-gray-400 mb-2">{course.description}</p>
            <button
              onClick={() => navigate(`/admin/main-topics/${course.id}`)}
              className="px-4 py-2 bg-[#4F46E5] text-white rounded-lg hover:bg-[#4338CA] transition"
            >
              View Main Topics
            </button>
          </div>
        ))}
      </div>
        {/* pagination */}
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

export default LearnerCourses;