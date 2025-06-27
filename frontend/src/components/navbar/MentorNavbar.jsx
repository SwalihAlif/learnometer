import axiosInstance from '../../axios'
import { BellIcon, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MentorNavbar = () => {

   const navigate = useNavigate();

  const handleLogout = async () => {
  try {
    const refresh = localStorage.getItem('refresh');
    console.log("🪙 Refresh token before logout:", refresh); 

    if (!refresh) {
      alert("Logout failed: No refresh token found.");
      return;
    }

    await axiosInstance.post('users/logout/', { refresh });

    localStorage.clear();
    navigate('/');
  } catch (error) {
    console.error("Logout failed:", error.response?.data || error.message);
    alert("Logout failed. Please try again.");
  }
};
  return (
    <nav className="w-full h-16 flex items-center justify-between px-6 border-b border-teal-200" style={{ backgroundColor: '#ECFDF5', color: '#064E3B' }}>
      <div className="flex items-center">
        <h1 className="text-xl font-bold" style={{ color: '#0F766E' }}>
          🎓 Learnometer Mentor
        </h1>
      </div>
      
      <div className="flex-1 max-w-md mx-8 hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search learners, sessions..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <button className="p-2 rounded-lg hover:bg-teal-100 transition-colors">
          <BellIcon className="w-5 h-5" />
        </button>
        
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white" style={{ backgroundColor: '#0F766E' }}>
          M
        </div>
        
        <button onClick={handleLogout} 
        className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-amber-600" style={{ backgroundColor: '#F59E0B', color: '#064E3B' }}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default MentorNavbar;