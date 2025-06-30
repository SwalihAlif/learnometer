import React, { useEffect, useState } from "react";
import axiosInstance from "../../axios";

const MentorMySessions = () => {
  const [sessions, setSessions] = useState([]);

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

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">My Mentoring Sessions</h2>
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
