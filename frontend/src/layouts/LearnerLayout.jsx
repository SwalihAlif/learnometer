import { Outlet, useLocation } from 'react-router-dom';
import LearnerNavbar from '../components/navbar/LearnerNavbar';
import LearnerFooter from '../components/footer/LearnerFooter';
import LearnerSidebar from '../components/sidebar/LearnerSidebar';

const LearnerLayout = () => {
  const location = useLocation();
  const showSidebar = location.pathname === '/learner';

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] text-[#1E1B4B]">
      <LearnerNavbar />

      <div className="flex flex-1 overflow-hidden">
        {showSidebar && <LearnerSidebar />}
        <main className={`flex-1 overflow-y-auto p-6 ${showSidebar ? '' : 'w-full'}`}>
          <Outlet />
        </main>
      </div>

      <LearnerFooter />
    </div>
  );
};

export default LearnerLayout;
