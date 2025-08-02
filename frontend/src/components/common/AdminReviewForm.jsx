import React, { useEffect, useState } from 'react';
import { Star, Edit3, Trash2 } from 'lucide-react';
import axiosInstance from '../../axios';
import { useAuth } from '../../contexts/AuthContext';

const ROLE_STYLES = {
  Mentor: {
    primary: 'from-[#0F766E] to-[#F59E0B]',
    text: 'text-[#064E3B]',
    bg: 'bg-[#ECFDF5]',
    star: 'text-[#F59E0B]',
  },
  Learner: {
    primary: 'from-[#4F46E5] to-[#FACC15]',
    text: 'text-[#1E1B4B]',
    bg: 'bg-[#F9FAFB]',
    star: 'text-[#FACC15]',
  },
  Default: {
    primary: 'from-purple-600 to-pink-600',
    text: 'text-gray-800',
    bg: 'bg-white',
    star: 'text-yellow-500',
  }
};

const AdminReviewForm = () => {
  const { user } = useAuth();
  const role = user?.role || 'Default';
  const styles = ROLE_STYLES[role] || ROLE_STYLES.Default;

  const [review, setReview] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [existingReviewId, setExistingReviewId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    axiosInstance
      .get('adminpanel/user-reviews/')
      .then((res) => {
        if (res.data.length > 0) {
          const userReview = res.data[0];
          setReview(userReview.review);
          setRating(userReview.rating);
          setExistingReviewId(userReview.id);
        }
      })
      .catch((err) => {
        console.error("Error fetching user review:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg('');
    setIsSubmitting(true);

    const payload = { rating, review };

    try {
      if (existingReviewId) {
        await axiosInstance.put(`adminpanel/user-reviews/${existingReviewId}/`, payload);
        setStatusMsg('Review updated successfully!');
      } else {
        const res = await axiosInstance.post('adminpanel/user-reviews/', payload);
        setExistingReviewId(res.data.id);
        setStatusMsg('Review submitted successfully!');
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      setStatusMsg('Something went wrong. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;

    setIsSubmitting(true);
    try {
      await axiosInstance.delete(`adminpanel/user-reviews/${existingReviewId}/`);
      setReview('');
      setRating(5);
      setExistingReviewId(null);
      setStatusMsg('Review deleted successfully.');
    } catch (error) {
      console.error("Error deleting review:", error);
      setStatusMsg('Failed to delete review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = () => {
    if (statusMsg.includes('successfully')) return 'text-green-600 bg-green-50 border-green-200';
    if (statusMsg.includes('deleted')) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (statusMsg.includes('wrong') || statusMsg.includes('Failed')) return 'text-red-600 bg-red-50 border-red-200';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your review...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-2xl mx-auto p-6 ${styles.bg}`}>
      <div className={`bg-gradient-to-r ${styles.primary} p-6 rounded-t-xl text-white`}>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Edit3 size={24} /> Submit Your Review
        </h2>
      </div>

      <div className="bg-white p-6 border rounded-b-xl shadow space-y-6">
        {statusMsg && (
          <div className={`p-3 rounded border text-sm ${getStatusColor()}`}>
            {statusMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star Rating */}
          <div>
            <label className={`block text-lg font-semibold ${styles.text} mb-2`}>
              Your Rating:
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus:outline-none"
                >
                  <Star
                    size={32}
                    className={`transition-all duration-200 ${
                      star <= (hoverRating || rating)
                        ? styles.star
                        : 'text-gray-300'
                    }`}
                    fill={star <= (hoverRating || rating) ? 'currentColor' : 'none'}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600">({rating}/5)</span>
            </div>
          </div>

          {/* Textarea */}
          <div>
            <label className={`block text-lg font-semibold ${styles.text} mb-2`}>
              Your Feedback:
            </label>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg"
              rows={4}
              placeholder="Write your review..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              required
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4 items-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 transition-all"
            >
              {existingReviewId ? 'Update Review' : 'Submit Review'}
            </button>

            {existingReviewId && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="flex items-center gap-1 text-red-500 hover:underline text-sm"
              >
                <Trash2 size={16} /> Delete Review
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminReviewForm;
