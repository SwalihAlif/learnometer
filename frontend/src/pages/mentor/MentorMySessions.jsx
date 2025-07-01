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
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">My Mentoring Sessions</h2>

      {showReviewModal && reviewData && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Review from Learner</h3>

            <div className="mb-4">
              <label className="font-medium block mb-1">Rating:</label>
              <div className="text-yellow-500 text-xl">
                {"★".repeat(reviewData.rating)}
                {"☆".repeat(5 - reviewData.rating)}
              </div>
            </div>

            <div className="mb-4">
              <label className="font-medium block mb-1">Comment:</label>
              <p className="text-gray-700">{reviewData.comment || "No comment provided."}</p>
            </div>

            <div className="flex justify-end">
              <button onClick={() => setShowReviewModal(false)} className="px-4 py-2 bg-gray-500 text-white rounded">Close</button>
            </div>
          </div>
        </div>
      )}




      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Give Feedback to Learner</h3>

            <div className="mb-4">
              <label className="block font-medium mb-1">Message:</label>
              <textarea
                rows={4}
                className="w-full border rounded p-2"
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
              />
            </div>

            <div className="mb-2">
              <label className="block">Image:</label>
              <input type="file" accept="image/*" onChange={(e) => setFeedbackImage(e.target.files[0])} />
            </div>
            <div className="mb-2">
              <label className="block">Video:</label>
              <input type="file" accept="video/*" onChange={(e) => setFeedbackVideo(e.target.files[0])} />
            </div>
            <div className="mb-4">
              <label className="block">Audio:</label>
              <input type="file" accept="audio/*" onChange={(e) => setFeedbackAudio(e.target.files[0])} />
            </div>

            <div className="mb-4">
              <label className="block">External Links (comma-separated):</label>
              <input
                type="text"
                className="w-full border rounded p-2"
                value={externalLinks}
                onChange={(e) => setExternalLinks(e.target.value)}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowFeedbackModal(false)} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
              <button onClick={submitFeedback} className="px-4 py-2 bg-green-600 text-white rounded">Submit</button>
            </div>
          </div>
        </div>
      )}



      {sessions.length === 0 ? (
        <p>No sessions yet.</p>
      ) : (
        <ul className="space-y-4">
          {sessions.map((s) => (
            <li key={s.id} className="p-4 border rounded bg-[#FFF7ED]">
              <p>
                <strong>Learner:</strong> {s.learner_name} ({s.learner_email})
              </p>
              <p>
                <strong>Date:</strong> {s.date} | <strong>Time:</strong> {s.start_time} - {s.end_time}
              </p>
              <p><strong>Status:</strong> {s.status}</p>

              {s.status === "completed" && (
                <div className="mt-2 space-x-2">
                  <button
                    onClick={() => handleGiveFeedback(s.id)}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Give Feedback
                  </button>

                  <button
                    onClick={() => handleGetReview(s.id)}
                    className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    Get Review
                  </button>
                </div>
              )}

              {s.status === "pending" && (
                <div className="mt-2 space-x-2">
                  <button
                    onClick={() => handleAction(s.id, "accept")}
                    className="px-3 py-1 bg-green-600 text-white rounded"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => handleAction(s.id, "reject")}
                    className="px-3 py-1 bg-red-600 text-white rounded"
                  >
                    Reject
                  </button>
                </div>
              )}
              {s.status === "confirmed" && s.meeting_link && (
                <a
                  href={s.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline"
                >
                  Start Meeting
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MentorMySessions;
