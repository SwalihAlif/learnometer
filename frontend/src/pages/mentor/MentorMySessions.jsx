import React, { useEffect, useState } from "react";
import axiosInstance from "../../axios";

const MentorMySessions = () => {
  const [sessions, setSessions] = useState([]);

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackImage, setFeedbackImage] = useState(null);
  const [feedbackVideo, setFeedbackVideo] = useState(null);
  const [feedbackAudio, setFeedbackAudio] = useState(null);
  const [externalLinks, setExternalLinks] = useState("");

  const [reviewData, setReviewData] = useState(null);

  const fetchSessions = async () => {
    try {
      console.log("🔄 Fetching mentor sessions...");
      const res = await axiosInstance.get("mentorship/my-sessions/?role=mentor");
      console.log("✅ Sessions fetched:", res.data);
      setSessions(res.data);
    } catch (error) {
      console.error("❌ Failed to fetch sessions:", error);
    }
  };

  const handleAction = async (id, action) => {
    const url = `mentorship/session-bookings/${id}/${action}/`;
    console.log(`🚀 Attempting to ${action} session with ID ${id} at URL:`, url);
    try {
      const res = await axiosInstance.post(url);
      console.log(`✅ Session ${action} successful:`, res.data);
      alert(`Session ${action}`);
      fetchSessions(); // refresh list
    } catch (err) {
      console.error(`❌ Failed to ${action} session with ID ${id}:`, err.response || err);
      alert(`Failed to ${action} session`);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleGiveFeedback = (sessionId) => {
    setSelectedSessionId(sessionId);
    setFeedbackMessage("");
    setFeedbackImage(null);
    setFeedbackVideo(null);
    setFeedbackAudio(null);
    setExternalLinks("");
    setShowFeedbackModal(true);
  };

  const submitFeedback = async () => {
    const formData = new FormData();
    formData.append("session", selectedSessionId);
    formData.append("message", feedbackMessage);

    if (feedbackImage instanceof File) {
      formData.append("image", feedbackImage);
    } else if (feedbackImage) {
      console.warn("⚠️ Image is not a valid File object:", feedbackImage);
    }

    if (feedbackVideo instanceof File) {
      formData.append("video", feedbackVideo);
    }

    if (feedbackAudio instanceof File) {
      formData.append("audio", feedbackAudio);
    }

    formData.append("external_links", externalLinks);

    // 🧾 Console log all form data for debugging
    console.log("📤 Submitting feedback with the following data:");
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}: [File] name=${value.name}, type=${value.type}, size=${value.size}`);
      } else {
        console.log(`${key}:`, value);
      }
    }

    try {
      await axiosInstance.post("mentorship/feedbacks/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Feedback submitted!");
      setShowFeedbackModal(false);
      fetchSessions(); // optional refresh
    } catch (err) {
      console.error("❌ Error submitting feedback:", err);
      alert("Error submitting feedback.");
    }
  };

  const handleGetReview = async (sessionId) => {
    try {
      const res = await axiosInstance.get(`mentorship/sessions/${sessionId}/review/`);
      setReviewData(res.data);
      setShowReviewModal(true);
    } catch (err) {
      alert("No review given yet.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
{/* Header Section */}
<div className="text-center mb-12 bg-emerald-700 py-8 rounded-2xl shadow-md">
  <h1 className="text-4xl font-bold text-white mb-4">
    My Mentoring Sessions
  </h1>
  <div className="w-24 h-1 bg-gradient-to-r from-white to-emerald-200 mx-auto"></div>
</div>


        {/* Review Modal */}
        {showReviewModal && reviewData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
              <div className="p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Learner Review</h3>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Rating</label>
                  <div className="flex justify-center text-3xl">
                    <span className="text-yellow-400">
                      {"★".repeat(reviewData.rating)}
                    </span>
                    <span className="text-gray-300">
                      {"☆".repeat(5 - reviewData.rating)}
                    </span>
                  </div>
                </div>

                <div className="mb-8">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Comment</label>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 leading-relaxed">
                      {reviewData.comment || "No comment provided."}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setShowReviewModal(false)} 
                  className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-gray-600 hover:to-gray-700 transform hover:scale-105 transition-all duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Modal */}
        {showFeedbackModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Give Feedback to Learner</h3>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                    <textarea
                      rows={4}
                      className="w-full border-2 border-gray-200 rounded-xl p-4 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 resize-none"
                      placeholder="Share your feedback and insights..."
                      value={feedbackMessage}
                      onChange={(e) => setFeedbackMessage(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Image</label>
                      <div className="relative">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => setFeedbackImage(e.target.files[0])}
                          className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 focus:border-blue-500 transition-all duration-200"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Video</label>
                      <input 
                        type="file" 
                        accept="video/*" 
                        onChange={(e) => setFeedbackVideo(e.target.files[0])}
                        className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 focus:border-green-500 transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Audio</label>
                      <input 
                        type="file" 
                        accept="audio/*" 
                        onChange={(e) => setFeedbackAudio(e.target.files[0])}
                        className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 focus:border-purple-500 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">External Links</label>
                    <input
                      type="text"
                      className="w-full border-2 border-gray-200 rounded-xl p-4 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                      placeholder="Enter comma-separated links..."
                      value={externalLinks}
                      onChange={(e) => setExternalLinks(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4 mt-8">
                  <button 
                    onClick={() => setShowFeedbackModal(false)} 
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transform hover:scale-105 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={submitFeedback} 
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                  >
                    Submit Feedback
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sessions List */}
        {sessions.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Sessions Yet</h3>
            <p className="text-gray-500">You haven't received any mentoring session requests yet.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {sessions.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
                <div className="p-8">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1 mb-6 lg:mb-0">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                          <span className="text-white font-bold text-lg">
                            {s.learner_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{s.learner_name}</h3>
                          <p className="text-gray-600">{s.learner_email}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center text-gray-700">
                          <svg className="w-5 h-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                          </svg>
                          <span className="font-medium">{s.date}</span>
                        </div>
                        <div className="flex items-center text-gray-700">
                          <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                          </svg>
                          <span className="font-medium">{s.start_time} - {s.end_time}</span>
                        </div>
                        <div className="flex items-center">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            s.status === 'completed' ? 'bg-green-100 text-green-800' :
                            s.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            s.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 lg:ml-6">
                      {s.status === "completed" && (
                        <>
                          <button
                            onClick={() => handleGiveFeedback(s.id)}
                            className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-200 shadow-lg flex items-center justify-center"
                          >
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd"/>
                            </svg>
                            Give Feedback
                          </button>

                          <button
                            onClick={() => handleGetReview(s.id)}
                            className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl font-semibold hover:from-yellow-500 hover:to-orange-600 transform hover:scale-105 transition-all duration-200 shadow-lg flex items-center justify-center"
                          >
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                            </svg>
                            View Review
                          </button>
                        </>
                      )}

                      {s.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleAction(s.id, "accept")}
                            className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-200 shadow-lg flex items-center justify-center"
                          >
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                            Confirm
                          </button>
                          <button
                            onClick={() => handleAction(s.id, "reject")}
                            className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transform hover:scale-105 transition-all duration-200 shadow-lg flex items-center justify-center"
                          >
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                            </svg>
                            Reject
                          </button>
                        </>
                      )}

                      {s.status === "confirmed" && s.meeting_link && (
                        <a
                          href={s.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg flex items-center justify-center"
                        >
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
                          </svg>
                          Start Meeting
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorMySessions;