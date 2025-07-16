import { GoogleOAuthProvider } from '@react-oauth/google';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Toast from "./components/common/Toast";
import { Toaster } from 'react-hot-toast';
import ConfirmDialog from './components/common/ConfirmDialog';
import { AuthProvider } from './contexts/AuthContext'; //import  context

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
import LearnerChat from './pages/learner/LearnerChat';
import LearnerVideoPage from './pages/learner/LearnerVideoPage';
import PremiumSuccessPage from './pages/learner/PremiumSuccessPage';
import PremiumCancelPage from './pages/learner/PremiumCancelPage';
import LearnerEarnings from './pages/learner/LearnerEarnings';

// Mentor pages
import MentorDashboard from "./pages/mentor/MentorDashboard";
import MentorProfile from './pages/mentor/MentorProfile';
import ManageAvailability from './pages/mentor/ManageAvailability';
import MentorMySessions from './pages/mentor/MentorMySessions';
import CheckingUpload from './pages/mentor/CheckingUpload';
import CheckingList from './pages/mentor/CheckingGet';
import MentorChat from './pages/mentor/MentorChat';
import MentorChatList from './pages/mentor/MentorChatList';
import MentorVideoPage from './pages/mentor/MentorVideoPage';
import MentorEarningsPage from './pages/mentor/MentorEarnings';

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageLearner from "./pages/admin/ManageLearner";
import ManageMentors from "./pages/admin/ManageMentors";
import AdminLearners from './pages/admin/CoursesEntry';
import LearnerCourses from './pages/admin/LearnerCourses';
import CourseMainTopics from './pages/admin/CourseMainTopics';
import Subtopics from './pages/admin/Subtopics';
import Schedules from './pages/admin/Schedules';
import Questions from './pages/admin/Questions';
import SessionsPage from './pages/admin/SessionsPage';
import FeedbackModal from './pages/admin/FeedbackModal';
import ReviewModal from './pages/admin/ReviewModal';
import AdminAddTestBalancePage from './pages/admin/TestBalance';
import AdminNotifications from './pages/admin/AdminNotifications';

// Auth pages
import LoginPage from "./components/auth/Login";
import LearnerRegistration from "./components/auth/RegisterLearner";
import RegisterMentor from "./components/auth/RegisterMentor";
import VerifyOTP from "./components/auth/VerifyOTP";
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import LearnerPremiumPage from './pages/learner/LearnerPremiumPage';


export default function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider> {/* ✅ Wrap everything inside */}
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
              <Route path="chat/:mentorId" element={<LearnerChat />} />
              <Route path="meet/:sessionId" element={<LearnerVideoPage />} />
              <Route path="premium-success" element={<PremiumSuccessPage />} />
              <Route path="premium-cancel" element={<PremiumCancelPage />} />
              <Route path="premium" element={<LearnerPremiumPage />} />
              <Route path="earnings" element={<LearnerEarnings />} />

            </Route>

            {/* Mentor Layout */}
            <Route path="/mentor" element={<MentorLayout />}>
              <Route index element={<MentorDashboard />} />
              <Route path="profile" element={<MentorProfile />} />
              <Route path="manage-availability" element={<ManageAvailability />} />
              <Route path="my-sessions" element={<MentorMySessions />} />
              <Route path="upload" element={<CheckingUpload />} />
              <Route path="check" element={<CheckingList />} />
              <Route path="chat-list" element={<MentorChatList />} />
              <Route path="chat/:learnerId" element={<MentorChat />} />
              <Route path="meet/:sessionId" element={<MentorVideoPage />} />
              <Route path="earnings" element={<MentorEarningsPage />} />
            </Route>

            {/* Admin Layout */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="learners" element={<ManageLearner />} />
              <Route path="mentors" element={<ManageMentors />} />
              <Route path="course-entry" element={<AdminLearners />} />
              <Route path="courses/:learner_id" element={<LearnerCourses />} />
              <Route path="main-topics/:course_id" element={<CourseMainTopics />} />
              <Route path="sub-topics/:main_topic_id" element={<Subtopics />} />
              <Route path="schedules/:main_topic_id" element={<Schedules />} />
              <Route path="questions/:main_topic_id" element={<Questions />} />
              <Route path="sessions" element={<SessionsPage />} />
              <Route path="sessions-feedbacks" element={<FeedbackModal />} />
              <Route path="sessions-reviews" element={<ReviewModal />} />
              <Route path="test-balance" element={<AdminAddTestBalancePage />} />
              <Route path="notifications" element={<AdminNotifications />} />
            </Route>

            {/* Auth Routes */}
            <Route path="/" element={<LoginPage />} />
            <Route path="/lregister" element={<LearnerRegistration />} />
            <Route path="/mregister" element={<RegisterMentor />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:uidb64/:token" element={<ResetPassword />} />
          </Routes>

          <Toaster position="top-right" reverseOrder={false} />
          <ConfirmDialog />
          <Toast />
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}


