import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import AdminPage from "./pages/admin/AdminPage";
import MentorPage from './pages/mentor/MentorPage';
import LearnerPage from './pages/learner/LearnerPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/mentor" element={<MentorPage />} />
        <Route path="/learner" element={<LearnerPage />} />
        <Route path="/" element={<h1 className="text-center text-2xl mt-20">🏠 Welcome to Learnometer</h1>} />
        {/* Add other routes like /mentor or /learner later */}
      </Routes>
    </BrowserRouter>
  );
}
