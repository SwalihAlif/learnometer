import { 
  LayoutDashboard, 
  BookOpen, 
  FileQuestion, 
  Calendar, 
  Video, 
  Heart, 
  Target, 
  Crown, 
  MessageCircle, 
  Download,
  Users
} from 'lucide-react';

const LearnerSidebar = () => {
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'My Courses', icon: BookOpen },
    { name: 'Assignments', icon: FileQuestion },
    { name: 'Schedule', icon: Calendar },
    { name: 'Video Library', icon: Video },
    { name: 'Favorites', icon: Heart },
    { name: 'Progress', icon: Target },
    { name: 'Premium', icon: Crown },
    { name: 'Messages', icon: MessageCircle },
    { name: 'Downloads', icon: Download }
  ];

  return (
    <aside className="w-64 h-full overflow-y-auto bg-gradient-to-b from-[#4F46E5] to-[#3730A3]">

      
      <nav className="p-4">
        <ul className="space-y-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <li key={index}>
                <a
                  href="#"
                  className="flex items-center px-3 py-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
                >
                  <Icon className="w-5 h-5 mr-3 text-white/90" />
                  <span className="text-sm font-medium text-white/90">{item.name}</span>
                </a>
              </li>
            );
          })}
          
          <li>
            <a
              href="#"
              className="flex items-center px-3 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-300 transition-colors duration-200"
            >
              <Users className="w-5 h-5 mr-3 text-indigo-700" />
              <span className="text-sm font-bold text-indigo-700">All Mentors</span>
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default LearnerSidebar;

