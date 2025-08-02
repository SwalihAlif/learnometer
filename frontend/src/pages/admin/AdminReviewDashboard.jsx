import React, { useEffect, useState } from "react";
import axiosInstance from "../../axios";
import { Trash2, Star } from "lucide-react";

const PAGE_SIZE = 10;

const AdminReviewDashboard = () => {
  const [reviews, setReviews] = useState([]);
  const [count, setCount] = useState(0); // total number of reviews
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async (currentPage = 1) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`adminpanel/admin-reviews/?page=${currentPage}&page_size=${PAGE_SIZE}`);
      setReviews(res.data.results || res.data); // if paginated, assume results key
      setCount(res.data.count || 0);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteReview = async (id) => {
    if (!window.confirm("Are you sure to delete this review?")) return;
    try {
      await axiosInstance.delete(`adminpanel/user-reviews/${id}/`);
      fetchReviews(page); // reload the same page after deletion
    } catch (err) {
      console.error("Error deleting review:", err);
    }
  };

  useEffect(() => {
    fetchReviews(page);
  }, [page]);

  const totalPages = Math.ceil(count / PAGE_SIZE);

  if (loading) return <p className="p-4">Loading reviews...</p>;

return (
  <div className="bg-[#0D1117] min-h-screen py-10 px-4 sm:px-6 lg:px-8">
    <div className="max-w-4xl mx-auto bg-[#F9FAFB] p-6 rounded-xl shadow-xl">
      <h2 className="text-3xl font-bold text-[#4F46E5] mb-6">User Reviews</h2>

      {reviews.length === 0 ? (
        <p className="text-gray-600 text-lg">No reviews yet.</p>
      ) : (
        <>
          <div className="space-y-6 mb-8">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white border border-gray-200 shadow-sm p-6 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div>
                  <p className="font-semibold text-[#0D1117]">{review.user_email || "Anonymous User"}</p>
                  <p className="text-gray-700 mt-1">{review.review}</p>
                  <div className="flex items-center mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={18}
                        className={`mr-1 ${
                          i < review.rating ? "text-[#FACC15]" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => deleteReview(review.id)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 rounded-lg bg-[#4F46E5] text-white hover:bg-[#4338ca] transition disabled:opacity-50"
            >
              Previous
            </button>
            <p className="text-gray-700 font-medium">
              Page {page} of {totalPages}
            </p>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-lg bg-[#FACC15] text-[#0D1117] hover:bg-yellow-400 transition disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  </div>
);

};

export default AdminReviewDashboard;
