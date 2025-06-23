import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import AdminPage from "./pages/admin/AdminPage";
import MentorPage from './pages/mentor/MentorPage';
import LearnerPage from './pages/learner/LearnerPage';
import LoginPage from "./components/auth/Login";
import LearnerRegistration from "./components/auth/RegisterLearner";
import RegisterMentor from "./components/auth/RegisterMentor";
import VerifyOTP from "./components/auth/VerifyOTP";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/mentor" element={<MentorPage />} />
        <Route path="/learner" element={<LearnerPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/lregister" element={<LearnerRegistration />} />
        <Route path="/mregister" element={<RegisterMentor />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />

        {/* Add other routes like /mentor or /learner later */}
      </Routes>
    </BrowserRouter>
  );
}
