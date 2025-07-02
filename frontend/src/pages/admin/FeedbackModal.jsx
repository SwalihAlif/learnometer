import { useEffect, useState } from 'react';
import axiosInstance from '../../axios';

const FeedbackModal = ({ sessionId, onClose }) => {
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    axiosInstance
      .get(`adminpanel/feedback/${sessionId}/`)
      .then((res) => setFeedback(res.data));
  }, [sessionId]);

  if (!feedback) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4 py-8">
      <div className="bg-[#111827] rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="bg-[#FACC15] text-black px-6 py-4 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold">Session Feedback</h2>
          <button
            onClick={onClose}
            className="text-xl font-bold hover:scale-110 transition"
          >
            ×
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 text-white space-y-6 overflow-y-auto flex-grow">

          {/* Message & Image Side-by-Side */}
          {(feedback.message || feedback.image) && (
            <div className="flex flex-col sm:flex-row gap-6">
              {feedback.message && (
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">Message</h3>
                  <p className="text-gray-300">{feedback.message}</p>
                </div>
              )}
              {feedback.image && (
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">Image</h3>
                  <img
                    src={feedback.image}
                    alt="Feedback"
                    className="w-full h-48 object-contain rounded-md border border-gray-700"
                  />
                </div>
              )}
            </div>
          )}

          {/* Video Section */}
          {feedback.video && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Video</h3>
              <video
                controls
                className="w-full max-h-[400px] rounded-md border border-gray-700"
              >
                <source src={feedback.video} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          {/* Audio Section */}
          {feedback.audio && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Audio</h3>
              <audio
                controls
                className="w-full border border-gray-700 rounded-md"
              >
                <source src={feedback.audio} type="audio/mp4" />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          {/* External Links */}
          {feedback.external_links && (
            <div>
              <h3 className="text-lg font-semibold mb-2">External Links</h3>
              <ul className="list-disc list-inside text-blue-400 space-y-1">
                {feedback.external_links.split(',').map((link, i) => (
                  <li key={i}>
                    <a
                      href={link.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {link.trim()}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
