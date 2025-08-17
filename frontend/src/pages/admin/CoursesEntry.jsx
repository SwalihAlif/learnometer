import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../axios';
import { fetchPaginatedData } from '../../redux/slices/paginationSlice';

const AdminLearners = () => {

    const dispatch = useDispatch();
    const navigate = useNavigate();

  const { results: learners, count, page, loading } = useSelector((state) => state.pagination)

  useEffect(() => {
    dispatch(fetchPaginatedData({ url: 'adminpanel/learners', page }))
  }, [dispatch, page]);

  const handlePageChange = useCallback((newPage) => {
    dispatch(fetchPaginatedData({ url: 'adminpanel/learners', page: newPage}))
  }, [dispatch])

  return (
    <div className="p-4 bg-[#0D1117] min-h-screen text-[#F9FAFB]">
      <h1 className="text-2xl font-bold text-[#FACC15] mb-4">Learners</h1>
      <div className="grid gap-4">
        {learners.map(l => (
          <div key={l.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-[#1F2937] p-4 rounded-xl shadow-md">
            <div className="mb-2 sm:mb-0">
              <p className="font-semibold text-lg">{l.full_name}</p>
              <p className="text-sm text-gray-400">{l.email}</p>
              <p className="text-xs text-gray-500">User Since: {new Date(l.created_at).toLocaleDateString()}</p>
            </div>
            <button
              onClick={() => navigate(`/admin/course-metrics/${l.id}`)}
              className="px-4 py-2 bg-[#4F46E5] text-white rounded-lg hover:bg-[#4338CA] transition"
            >
              View Courses
            </button>
          </div>
        ))}
      </div>
       {/* Pagination Buttons */}
          <div className="flex justify-center mt-6 gap-2">
            {Array.from({ length: Math.ceil(count / 10) }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => handlePageChange(p)}
                className={`px-4 py-1 rounded ${
                  page === p ? 'bg-[#FACC15] text-[#0D1117]' : 'bg-[#4F46E5] text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
    </div>
  );
};

export default AdminLearners;