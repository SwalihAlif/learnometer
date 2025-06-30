
import React, { useEffect, useState } from "react";
import axiosInstance from "../../axios";

const LearnerMySessions = () => {
  const [sessions, setSessions] = useState([]);

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

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">My Booked Sessions (Learner)</h2>
      {sessions.length === 0 ? (
        <p>No sessions yet.</p>
      ) : (
        <ul className="space-y-4">
          {sessions.map((s) => (
            <li key={s.id} className="p-4 border rounded bg-[#F0FDF4]">
              <p>
                <strong>Mentor:</strong> {s.mentor_name} ({s.mentor_email})
              </p>
              <p>
                <strong>Date:</strong> {s.date} | <strong>Time:</strong> {s.start_time} - {s.end_time}
              </p>
              <p><strong>Status:</strong> {s.status}</p>
              {s.status === "confirmed" && (
                <a href={s.meeting_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Join Meeting</a>
              )}
              {s.status === "pending" && (
                <button
                  onClick={() => cancelSession(s.id)}
                  className="ml-4 px-4 py-1 bg-red-600 text-white rounded"
                >
                  Cancel
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LearnerMySessions;



