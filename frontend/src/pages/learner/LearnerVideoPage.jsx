// src/pages/LearnerVideoPage.jsx
import { useParams } from "react-router-dom";
import VideoCall from "../../components/video/VideoCall";

export default function LearnerVideoPage() {
  const { sessionId } = useParams();
  return <VideoCall role="learner" sessionId={sessionId} />;
}
