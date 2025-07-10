import React, { useEffect, useState } from "react";
import axiosInstance from "../../axios";

const MentorMySessions = () => {
  const [sessions, setSessions] = useState([]);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackImage, setFeedbackImage] = useState(null);
  const [feedbackVideo, setFeedbackVideo] = useState(null);
  const [feedbackAudio, setFeedbackAudio] = useState(null);
  const [feedbackPdf, setFeedbackPdf] = useState(null);
  const [externalLinks, setExternalLinks] = useState("");

  const fetchSessions = async () => {
    try {
      const res = await axiosInstance.get("mentorship/my-sessions/?role=mentor");
      setSessions(res.data);
    } catch (error) {
      console.error("❌ Failed to fetch sessions:", error);
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
    setFeedbackPdf(null);
    setExternalLinks("");
    setShowFeedbackModal(true);
  };

  const submitFeedback = async () => {
    const formData = new FormData();
    formData.append("session", selectedSessionId);
    formData.append("message", feedbackMessage);
    formData.append("external_links", externalLinks);

    if (feedbackImage instanceof File) {
      formData.append("image", feedbackImage);
    }
    if (feedbackVideo instanceof File) {
      formData.append("video", feedbackVideo);
    }
    if (feedbackAudio instanceof File) {
      formData.append("audio", feedbackAudio);
    }
    if (feedbackPdf instanceof File) {
      formData.append("pdf", feedbackPdf);
    }

    try {
      await axiosInstance.post("mentorship/feedbacks/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Feedback submitted!");
      setShowFeedbackModal(false);
      fetchSessions();
    } catch (err) {
      console.error("❌ Error submitting feedback:", err.response?.data || err);
      alert("Error submitting feedback.");
    }
  };

  return (
    <div>
      <h2>Your Mentor Sessions</h2>
      <table>
        <thead>
          <tr>
            <th>Session</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map(session => (
            <tr key={session.id}>
              <td>{session.title || session.id}</td>
              <td>
                <button onClick={() => handleGiveFeedback(session.id)}>
                  Give Feedback
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showFeedbackModal && (
        <div className="modal">
          <h3>Give Feedback</h3>
          <textarea
            value={feedbackMessage}
            onChange={e => setFeedbackMessage(e.target.value)}
            placeholder="Enter feedback message"
          />
          <div>
            <label>
              Image:
              <input
                type="file"
                accept="image/*"
                onChange={e => setFeedbackImage(e.target.files[0])}
              />
            </label>
          </div>
          <div>
            <label>
              Video:
              <input
                type="file"
                accept="video/*"
                onChange={e => setFeedbackVideo(e.target.files[0])}
              />
            </label>
          </div>
          <div>
            <label>
              Audio:
              <input
                type="file"
                accept="audio/*"
                onChange={e => setFeedbackAudio(e.target.files[0])}
              />
            </label>
          </div>
          <div>
            <label>
              PDF:
              <input
                type="file"
                accept="application/pdf"
                onChange={e => setFeedbackPdf(e.target.files[0])}
              />
            </label>
          </div>
          <input
            type="text"
            value={externalLinks}
            onChange={e => setExternalLinks(e.target.value)}
            placeholder="External links (comma separated)"
          />
          <button onClick={submitFeedback}>Submit</button>
          <button onClick={() => setShowFeedbackModal(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default MentorMySessions;