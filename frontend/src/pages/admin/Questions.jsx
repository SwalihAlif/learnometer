import { useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPaginatedData } from '../../redux/slices/paginationSlice';

const Questions = () => {
  const { main_topic_id } = useParams();
  const dispatch = useDispatch();

  const { results: questions, loading, error, page } = useSelector((state) => state.pagination);

  useEffect(() => {
    if (main_topic_id) {
      dispatch(fetchPaginatedData({ url: `adminpanel/main-topic/${main_topic_id}/questions`, page }));
    }
  }, [dispatch, main_topic_id, page]);

  const handlePageChange = useCallback(
    (newPage) => {
      dispatch(fetchPaginatedData({ url: `adminpanel/main-topic/${main_topic_id}/questions`, page: newPage }));
    },
    [dispatch, main_topic_id]
  );

  return (
    <div className="p-4 bg-[#0D1117] min-h-screen text-[#F9FAFB]">
      <h1 className="text-2xl font-bold text-[#FACC15] mb-4">Questions</h1>
      <div className="grid gap-4">
        {questions.map(q => (
          <div key={q.id} className="bg-[#1F2937] p-4 rounded-xl shadow-md">
            <p className="text-sm">{q.question_text}</p>
            <p className="text-xs text-gray-400">Created At: {new Date(q.created_at).toLocaleString()}</p>
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

export default Questions;