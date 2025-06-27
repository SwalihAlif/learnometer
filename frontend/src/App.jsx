import { BrowserRouter, Routes, Route } from "react-router-dom";
import Toast from "./components/common/Toast";

// Layouts
import AdminLayout from "./layouts/AdminLayout";
import MentorLayout from "./layouts/MentorLayout";
import LearnerLayout from "./layouts/LearnerLayout";

// Learner pages
import LearnerDashboard from "./pages/learner/LearnerDashboard";
import LearnerMyCourses from "./pages/learner/LearnerMyCourses";
import MainTopics from "./pages/learner/MainTopics";
import SubTopics from "./pages/learner/SubTopics";

// Mentor pages
import MentorDashboard from "./pages/mentor/MentorDashboard";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageLearner from "./pages/admin/ManageLearner";
import ManageMentors from "./pages/admin/ManageMentors";

// Auth pages
import LoginPage from "./components/auth/Login";
import LearnerRegistration from "./components/auth/RegisterLearner";
import RegisterMentor from "./components/auth/RegisterMentor";
import VerifyOTP from "./components/auth/VerifyOTP";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Learner Layout */}
        <Route path="/learner" element={<LearnerLayout />}>
          <Route index element={<LearnerDashboard />} /> {/* /learner */}
          <Route path="my-courses" element={<LearnerMyCourses />} />
          <Route path="main-topics/:courseId" element={<MainTopics />} />
          <Route path="sub-topics/:mainTopicId" element={<SubTopics />} />
        </Route>

        {/* Mentor Layout */}
        <Route path="/mentor" element={<MentorLayout />}>
          <Route index element={<MentorDashboard />} /> {/* /mentor */}
        </Route>

        {/* Admin Layout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} /> {/* /admin */}
          <Route path="learners" element={<ManageLearner />} />
          <Route path="mentors" element={<ManageMentors />} />
        </Route>

        {/* Auth Routes */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/lregister" element={<LearnerRegistration />} />
        <Route path="/mregister" element={<RegisterMentor />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
      </Routes>

      <Toast />
    </BrowserRouter>
  );
}
