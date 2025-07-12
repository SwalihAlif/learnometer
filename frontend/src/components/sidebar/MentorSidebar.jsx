import {
  LayoutDashboard,
  Calendar,
  MessageSquare,
  Star,
  Video,
  MessageCircle,
  DollarSign,
  Clock
} from 'lucide-react';

import { NavLink } from 'react-router-dom';

const MentorSidebar = () => {
  const navItems = [
    { name: 'Dashboard & Profile', icon: LayoutDashboard, path: '/mentor' },
    { name: 'Sessions', icon: Calendar, path: '/mentor/my-sessions' },
    { name: 'Manage Availability', icon: Clock, path: '/mentor/manage-availability' },
    { name: 'Feedback', icon: MessageSquare, path: '/mentor/feedback' },
    { name: 'Reviews', icon: Star, path: '/mentor/reviews' },
    // { name: 'Chat', icon: Video, path: '/mentor/chat' },
    { name: 'Messages', icon: MessageCircle, path: 'chat-list' },
    { name: 'Earnings', icon: DollarSign, path: '/mentor/earnings' },
  ];

  return (
    <aside className="w-64 h-full overflow-y-auto bg-gradient-to-b from-[#0F766E] to-[#0D5B54]">
      <nav className="p-4">
        <ul className="space-y-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <li key={index}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-lg transition-colors duration-200 ${
                      isActive ? 'bg-white/20 text-white font-semibold' : 'hover:bg-white/10 text-white/90'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span className="text-sm">{item.name}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default MentorSidebar;
