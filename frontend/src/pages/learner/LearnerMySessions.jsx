import React, { useEffect, useState } from "react";
import axiosInstance from "../../axios";

const LearnerMySessions = () => {
  const [sessions, setSessions] = useState([]);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackData, setFeedbackData] = useState(null);

  const fetchSessions = async () => {
    try {
      const res = await axiosInstance.get("mentorship/my-sessions/?role=learner");
      setSessions(res.data);
    } catch (error) {
      console.error("Failed to fetch sessions", error);
    }
  };

  const cancelSession = async (id) => {
    try {
      await axiosInstance.post(`mentorship/session-bookings/${id}/cancel/`);
      alert("Session cancelled");
      fetchSessions();
    } catch (err) {
      alert("Cannot cancel now (maybe it's within 12 hours)");
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleGiveReview = (sessionId) => {
    setSelectedSessionId(sessionId);
    setRating(0);
    setComment("");
    setShowReviewModal(true);
  };

  const submitReview = async () => {
    if (rating < 1 || rating > 5) {
      alert("Please select a valid rating (1-5)");
      return;
    }

    try {
      await axiosInstance.post("mentorship/reviews/", {
        session: selectedSessionId,
        rating,
        comment,
      });
      alert("Review submitted!");
      setShowReviewModal(false);
      fetchSessions(); // Refresh list
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review.");
    }
  };

  const handleGetFeedback = async (sessionId) => {
    try {
      const res = await axiosInstance.get(`mentorship/sessions/${sessionId}/feedback/`);
      console.log("Received feedback data:", res.data); 
      setFeedbackData(res.data);
      setShowFeedbackModal(true);
    } catch (err) {
      console.error("Error fetching feedback:", err);
      alert("Feedback not available yet.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 px-6 py-8 sm:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">My Booked Sessions</h2>
            <p className="text-indigo-100 mt-2">Manage your mentorship sessions as a learner</p>
          </div>

          <div className="p-6 sm:p-8">
            {/* Review Modal */}
            {showReviewModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-200 max-h-[90vh] overflow-y-auto">
                  <div className="bg-gradient-to-r from-amber-400 to-yellow-500 px-6 py-4 rounded-t-xl">
                    <h3 className="text-xl font-bold text-indigo-900">Give Review</h3>
                  </div>

                  <div className="p-6">
                    <div className="mb-6">
                      <label className="block font-semibold mb-3 text-indigo-900">Rating (1 to 5):</label>
                      <div className="flex gap-2 justify-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            onClick={() => setRating(star)}
                            className={`cursor-pointer text-3xl transition-colors duration-200 hover:scale-110 transform ${star <= rating ? "text-amber-400" : "text-gray-300 hover:text-amber-200"
                              }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mb-6">
                      <label className="block font-semibold mb-2 text-indigo-900">Comment:</label>
                      <textarea
                        rows={4}
                        className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors duration-200 resize-none"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share your experience with this session..."
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                      <button
                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
                        onClick={() => setShowReviewModal(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium shadow-md"
                        onClick={submitReview}
                      >
                        Submit Review
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Feedback Modal */}
            {showFeedbackModal && feedbackData && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
                  <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 px-6 py-4 rounded-t-xl">
                    <h3 className="text-xl font-bold text-white">Mentor's Feedback</h3>
                  </div>

                  <div className="p-6">
                    {feedbackData.message && (
                      <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h4 className="font-semibold text-indigo-900 mb-2">Message:</h4>
                        <p className="text-gray-700 whitespace-pre-line leading-relaxed">{feedbackData.message}</p>
                      </div>
                    )}

                    {feedbackData.image && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-indigo-900 mb-2">Image:</h4>
                        <div className="flex justify-center">
                          <img
                            src={feedbackData.image}
                            alt="Feedback Image"
                            className="max-w-[70%] max-h-64 object-contain rounded-lg border border-gray-300 shadow-md"
                          />
                        </div>
                      </div>
                    )}


                    {feedbackData.video && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-indigo-900 mb-2">Video:</h4>
                        <div className="flex justify-center">
                          <video
                            controls
                            className="max-w-[70%] max-h-56 object-contain rounded-lg border border-gray-300 shadow-md"
                          >
                            <source src={feedbackData.video} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      </div>
                    )}


                    {feedbackData.audio && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-indigo-900 mb-2">Audio:</h4>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <audio controls className="w-full">
                            <source src={feedbackData.audio} type="audio/mp4" />
                            Your browser does not support the audio tag.
                          </audio>
                        </div>
                      </div>
                    )}

                    {feedbackData.external_links && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-indigo-900 mb-2">External Links:</h4>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <ul className="space-y-2">
                            {feedbackData.external_links.split(',').map((link, idx) => (
                              <li key={idx} className="flex items-center">
                                <span className="w-2 h-2 bg-indigo-600 rounded-full mr-3 flex-shrink-0"></span>
                                <a
                                  href={link.trim()}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 hover:text-indigo-800 underline break-all transition-colors duration-200"
                                >
                                  {link.trim()}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end pt-4 border-t border-gray-200">
                      <button
                        onClick={() => setShowFeedbackModal(false)}
                        className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 font-medium"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sessions List */}
            {sessions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No sessions yet</h3>
                <p className="text-gray-500">Your booked mentorship sessions will appear here</p>
              </div>
            ) : (
              <div className="space-y-6">
                {sessions.map((s) => (
                  <div key={s.id} className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-gray-300">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="lg:col-span-2 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-gray-500">Mentor:</span>
                          <span className="font-semibold text-indigo-900">{s.mentor_name}</span>
                          <span className="text-gray-600">({s.mentor_email})</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium text-gray-700">{s.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium text-gray-700">{s.start_time} - {s.end_time}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-500">Status:</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${s.status === "completed" ? "bg-green-100 text-green-800" :
                              s.status === "confirmed" ? "bg-blue-100 text-blue-800" :
                                s.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                                  "bg-gray-100 text-gray-800"
                            }`}>
                            {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col justify-center space-y-3">
                        {s.status === "completed" && (
                          <div className="flex flex-col sm:flex-row gap-2 lg:flex-col xl:flex-row">
                            <button
                              onClick={() => handleGiveReview(s.id)}
                              className="px-4 py-2 bg-amber-400 text-indigo-900 rounded-lg hover:bg-amber-500 transition-colors duration-200 font-medium shadow-sm flex-1 text-center"
                            >
                              Give Review
                            </button>
                            <button
                              onClick={() => handleGetFeedback(s.id)}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium shadow-sm flex-1 text-center"
                            >
                              Get Feedback
                            </button>
                          </div>
                        )}

                        {s.status === "confirmed" && (
                          <a
                            href={s.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium shadow-sm text-center inline-flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Join Meeting
                          </a>
                        )}

                        {s.status === "pending" && (
                          <button
                            onClick={() => cancelSession(s.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium shadow-sm"
                          >
                            Cancel Session
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearnerMySessions;