import MentorSidebar from '../components/sidebar/MentorSidebar';
import MentorNavbar from '../components/navbar/MentorNavbar';
import MentorFooter from '../components/footer/MentorFooter';

const MentorLayout = ({ children }) => {
  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: '#ECFDF5', color: '#064E3B' }}>
      <MentorNavbar />
      <div className="flex flex-1 overflow-hidden">
        <MentorSidebar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
      <MentorFooter />
    </div>
  );
};

export default MentorLayout;