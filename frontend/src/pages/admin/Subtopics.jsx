import { useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPaginatedData } from '../../redux/slices/paginationSlice';

const Subtopics = () => {
  const { main_topic_id } = useParams();
  const dispatch = useDispatch();

  const { results: subtopics, loading, error, page } = useSelector((state) => state.pagination);

  useEffect(() => {
    if (main_topic_id) {
      dispatch(fetchPaginatedData({ url: `adminpanel/main-topic/${main_topic_id}/subtopics`, page }));
    }
  }, [dispatch, main_topic_id, page]);

  const handlePageChange = useCallback(
    (newPage) => {
      dispatch(fetchPaginatedData({ url: `adminpanel/main-topic/${main_topic_id}/subtopics`, page: newPage }));
    },
    [dispatch, main_topic_id]
  );

  return (
    <div className="p-4 bg-[#0D1117] min-h-screen text-[#F9FAFB]">
      <h1 className="text-2xl font-bold text-[#FACC15] mb-4">Subtopics</h1>
      <div className="grid gap-4">
        {subtopics.map(sub => (
          <div key={sub.id} className="bg-[#1F2937] p-4 rounded-xl shadow-md">
            <h2 className="text-lg font-semibold">{sub.title}</h2>
            <p className="text-sm text-gray-400">{sub.description}</p>
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

export default Subtopics;