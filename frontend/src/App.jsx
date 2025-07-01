import { GoogleOAuthProvider } from '@react-oauth/google';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Toast from "./components/common/Toast";
import ConfirmDialog from './components/common/ConfirmDialog';

// Layouts
import AdminLayout from "./layouts/AdminLayout";
import MentorLayout from "./layouts/MentorLayout";
import LearnerLayout from "./layouts/LearnerLayout";

// Learner pages
import LearnerDashboard from "./pages/learner/LearnerDashboard";
import LearnerMyCourses from "./pages/learner/LearnerMyCourses";
import MainTopics from "./pages/learner/MainTopics";
import SubTopics from "./pages/learner/SubTopics";
import LearnerProfile from './pages/learner/LearnerProfile';
import NotesPage from './pages/learner/NotesPage';
import LearningSchedulePage from './pages/learner/SchedulePage';
import Quiz from './pages/learner/Quiz';
import MentorList from './pages/learner/MentorList';
import BookSession from './pages/learner/BookSession';
import LearnerMySessions from './pages/learner/LearnerMySessions';

// Mentor pages
import MentorDashboard from "./pages/mentor/MentorDashboard";
import MentorProfile from './pages/mentor/MentorProfile';
import ManageAvailability from './pages/mentor/ManageAvailability';
import MentorMySessions from './pages/mentor/MentorMySessions';
import CheckingUpload from './pages/mentor/CheckingUpload';

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageLearner from "./pages/admin/ManageLearner";
import ManageMentors from "./pages/admin/ManageMentors";

// Auth pages
import LoginPage from "./components/auth/Login";
import LearnerRegistration from "./components/auth/RegisterLearner";
import RegisterMentor from "./components/auth/RegisterMentor";
import VerifyOTP from "./components/auth/VerifyOTP";
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';

export default function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <Routes>
          {/* Learner Layout */}
          <Route path="/learner" element={<LearnerLayout />}>
            <Route index element={<LearnerDashboard />} />
            <Route path="my-courses" element={<LearnerMyCourses />} />
            <Route path="main-topics/:courseId" element={<MainTopics />} />
            <Route path="sub-topics/:mainTopicId" element={<SubTopics />} />
            <Route path="profile" element={<LearnerProfile />} />
            <Route path="main-topics/:topicId/notes" element={<NotesPage />} />
            <Route path="schedule" element={<LearningSchedulePage />} />
            <Route path="quiz/:mainTopicId" element={<Quiz />} />
            <Route path="all-mentors" element={<MentorList />} />
            <Route path="book-session/:mentorId" element={<BookSession />} />
            <Route path="my-sessions" element={<LearnerMySessions />} />

            
          </Route>

          {/* Mentor Layout */}
          <Route path="/mentor" element={<MentorLayout />}>
            <Route index element={<MentorDashboard />} />
            <Route path="profile" element={<MentorProfile />} />
            <Route path="manage-availability" element={<ManageAvailability />} />
            <Route path="my-sessions" element={<MentorMySessions />} />
            <Route path="upload" element={<CheckingUpload />} />

          </Route>

          {/* Admin Layout */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="learners" element={<ManageLearner />} />
            <Route path="mentors" element={<ManageMentors />} />
          </Route>

          {/* Auth Routes */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/lregister" element={<LearnerRegistration />} />
          <Route path="/mregister" element={<RegisterMentor />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:uidb64/:token" element={<ResetPassword />} />
        </Routes>
        <ConfirmDialog />
        <Toast />
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

