import LearnerSidebar from '../components/sidebar/LearnerSidebar';
import LearnerNavbar from '../components/navbar/LearnerNavbar';
import LearnerFooter from '../components/footer/LearnerFooter';

const LearnerLayout = ({ children }) => {
  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: '#F9FAFB', color: '#1E1B4B' }}>
      <LearnerNavbar />
      <div className="flex flex-1 overflow-hidden">
        <LearnerSidebar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
      <LearnerFooter />
    </div>
  );
};

export default LearnerLayout;