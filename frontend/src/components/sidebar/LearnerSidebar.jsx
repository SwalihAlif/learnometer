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

import { NavLink } from 'react-router-dom';

const LearnerSidebar = () => {
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '' },
    { name: 'My Courses', icon: BookOpen, path: 'my-courses' },
    { name: 'Sessions', icon: FileQuestion, path: 'my-sessions' },
    { name: 'Schedule', icon: Calendar, path: 'schedule' },
    { name: 'habits', icon: Calendar, path: 'habits' },
    { name: 'Motivations', icon: Video, path: 'motivation' },
    { name: 'Feadbacks', icon: Heart, path: 'review-app' },
    // { name: 'Progress', icon: Target, path: 'progress' },
    { name: 'Premium', icon: Crown, path: 'premium' },
    { name: 'Earnings', icon: Crown, path: 'earnings' },
    { name: 'Messages', icon: MessageCircle, path: 'chat/general_chat_room' },
    { name: 'Downloads', icon: Download, path: 'downloads' }
  ];

  return (
    <aside className="w-64 h-full overflow-y-auto bg-gradient-to-b from-[#4F46E5] to-[#3730A3]">
      <nav className="p-4">
        <ul className="space-y-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <li key={index}>
                <NavLink
                  to={`/learner/${item.path}`}
                  end={item.path === ''}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-lg transition-colors duration-200 ${
                      isActive ? 'bg-white/20' : 'hover:bg-white/10'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 mr-3 text-white/90" />
                  <span className="text-sm font-medium text-white/90">{item.name}</span>
                </NavLink>
              </li>
            );
          })}

          <li>
            <NavLink
              to="/learner/all-mentors"
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-lg transition-colors duration-200 ${
                  isActive ? 'bg-yellow-300' : 'bg-yellow-400 hover:bg-yellow-300'
                }`
              }
            >
              <Users className="w-5 h-5 mr-3 text-indigo-700" />
              <span className="text-sm font-bold text-indigo-700">All Mentors</span>
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default LearnerSidebar;
