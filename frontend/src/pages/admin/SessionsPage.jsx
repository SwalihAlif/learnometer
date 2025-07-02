import { useEffect, useState } from 'react';
import axiosInstance from '../../axios';
import FeedbackModal from './FeedbackModal';
import ReviewModal from './ReviewModal';

const SessionsPage = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);

  useEffect(() => {
    axiosInstance.get('adminpanel/sessions/').then(res => {
      setSessions(res.data.results || []);
    });
  }, []);

  return (
    <div className="p-4 bg-[#0D1117] min-h-screen text-[#F9FAFB]">
      <h1 className="text-2xl font-bold text-[#FACC15] mb-4">All Sessions</h1>
      <div className="grid gap-4">
        {sessions.map(session => (
          <div key={session.id} className="bg-[#1F2937] p-4 rounded-lg shadow-md">
            <p><span className="text-[#FACC15]">Session ID:</span> {session.id}</p>
            <p>Mentor: {session.mentor.email}</p>
            <p>Learner: {session.learner.email}</p>
            <p>Start: {session.start_time}</p>
            <p>End: {session.end_time}</p>
            <p>Duration: {session.duration}</p>
            <div className="mt-2 flex gap-3">
              <button
                onClick={() => setSelectedFeedback(session.id)}
                className="px-3 py-1 bg-[#4F46E5] text-white rounded hover:bg-[#4338CA]"
              >
                View Feedback
              </button>
              <button
                onClick={() => setSelectedReview(session.id)}
                className="px-3 py-1 bg-[#FACC15] text-[#0D1117] rounded hover:opacity-90"
              >
                View Review
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedFeedback && (
        <FeedbackModal sessionId={selectedFeedback} onClose={() => setSelectedFeedback(null)} />
      )}

      {selectedReview && (
        <ReviewModal sessionId={selectedReview} onClose={() => setSelectedReview(null)} />
      )}
    </div>
  );
};

export default SessionsPage;
