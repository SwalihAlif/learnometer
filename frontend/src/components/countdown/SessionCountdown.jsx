import { useState, useEffect } from "react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { useNavigate } from "react-router-dom";

dayjs.extend(duration);

export default function SessionCountdown({ meetingTime, sessionId, basePath }) {

  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  const handleJoin = () => {
    navigate(`${basePath}/meet/${sessionId}`);
  };

  function calculateTimeLeft() {
    const now = dayjs();
    const meeting = dayjs(meetingTime);
    const diff = meeting.diff(now);
    return diff > 0 ? diff : 0;
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [meetingTime]);


  if (timeLeft <= 0) {
    return (
      <button
        onClick={handleJoin}
        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg flex items-center justify-center"
      >
        Join Live Session
      </button>
    );
  }

  const durationObj = dayjs.duration(timeLeft);

  const days = durationObj.days();
  const hours = durationObj.hours();
  const minutes = durationObj.minutes();
  const seconds = durationObj.seconds();

  return (
    <button
      disabled
      className="px-6 py-3 bg-gray-500 text-white rounded-xl font-semibold shadow-lg flex items-center justify-center"
    >
      {timeLeft > 86400000
        ? `${days}d ${hours}h ${minutes}m`
        : `${hours}h ${minutes}m ${seconds}s`}
    </button>
  );
}
