// src/pages/MentorVideoPage.jsx
import { useParams } from "react-router-dom";
import VideoCall from "../../components/video/VideoCall";

export default function MentorVideoPage() {
  const { sessionId } = useParams();
  return <VideoCall role="mentor" sessionId={sessionId} />;
}
