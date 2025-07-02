import { useEffect, useState } from 'react';
import axiosInstance from '../../axios';

const ReviewModal = ({ sessionId, onClose }) => {
  const [review, setReview] = useState(null);

  useEffect(() => {
    axiosInstance.get(`adminpanel/review/${sessionId}/`).then(res => setReview(res.data));
  }, [sessionId]);

  if (!review) return null;

  // Helper to render stars
  const renderStars = (count) => {
    const fullStars = '★'.repeat(count);
    const emptyStars = '☆'.repeat(5 - count);
    return fullStars + emptyStars;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4 py-8">
      <div className="bg-[#111827] rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">

        {/* Header */}
        <div className="bg-[#FACC15] text-black px-6 py-4 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold">Review</h2>
          <button onClick={onClose} className="text-xl font-bold hover:scale-110 transition">×</button>
        </div>

        {/* Content */}
        <div className="p-6 text-white space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-200 mb-1">Rating</h3>
            <p className="text-yellow-400 text-xl font-semibold tracking-wide">
              {renderStars(review.rating)}
            </p>
          </div>

          {review.comment && (
            <div>
              <h3 className="text-lg font-semibold text-gray-200 mb-1">Comment</h3>
              <p className="text-gray-300">{review.comment}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
