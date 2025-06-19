import { BellIcon } from 'lucide-react';

const AdminNavbar = () => {
  return (
    <nav className="h-16 flex items-center justify-between px-6 border-b border-gray-700" style={{ backgroundColor: '#0D1117', color: '#F9FAFB' }}>
      <div className="flex items-center">
        <h1 className="text-xl font-bold" style={{ color: '#FACC15' }}>
          Learnometer Admin
        </h1>
      </div>
      
      <div className="flex items-center space-x-4">
        <button className="p-2 rounded-lg hover:bg-gray-800 transition-colors">
          <BellIcon className="w-5 h-5" />
        </button>
        
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium" style={{ backgroundColor: '#4F46E5' }}>
          A
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;