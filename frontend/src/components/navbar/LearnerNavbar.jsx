import { BellIcon, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LearnerNavbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear stored user data
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('email');
    localStorage.removeItem('role');

    // Redirect to login page
    navigate('/login');
  };
  return (
    <nav className="w-full h-16 flex items-center justify-between px-6 border-b border-gray-200 bg-gray-50 text-indigo-900">
      <div className="flex items-center">
        <h1 className="text-xl font-bold text-indigo-600">
          📚 Learnometer Learner
        </h1>
      </div>
      
      <div className="flex-1 max-w-md mx-8 hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses, content..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <button className="p-2 rounded-lg hover:bg-indigo-100 transition-colors">
          <BellIcon className="w-5 h-5" />
        </button>
        
        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-sm font-medium text-white">
          L
        </div>
        
        <button onClick={handleLogout}
         className="px-4 py-2 rounded-lg text-sm font-medium transition-colors" style={{ backgroundColor: '#FACC15', color: '#4F46E5' }}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default LearnerNavbar;