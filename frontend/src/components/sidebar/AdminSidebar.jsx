import {
  LayoutDashboard,
  Users,
  UserCheck,
  BookOpen,
  Calendar,
  MessageSquare,
  Crown,
  CreditCard,
  Bell,
  Quote,
  Book,
  Video,
  Target,
  BarChart3
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

const AdminSidebar = () => {
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { name: 'Manage Learners', icon: Users, path: '/admin/learners' },
    { name: 'Manage Mentors', icon: UserCheck, path: '/admin/mentors' },
    { name: "Learner's Courses & Contents", icon: BookOpen, path: '/admin/course-entry' },
    { name: 'Sessions', icon: Calendar, path: '/admin/sessions' },
    { name: 'Reviews', icon: MessageSquare, path: '/admin/reviews' },
    { name: 'Premium & Referrals', icon: Crown, path: '/admin/premium' },
    { name: 'Payments', icon: CreditCard, path: '/admin/payments' },
    { name: 'Add Test Balance', icon: CreditCard, path: '/admin/test-balance' },
    { name: 'Notifications', icon: Bell, path: '/admin/notifications' },
    { name: 'Motivation Quotes', icon: Quote, path: '/admin/quotes' },
    { name: 'Motivation Books', icon: Book, path: '/admin/books' },
    { name: 'Motivation Videos', icon: Video, path: '/admin/videos' },
    { name: 'Habit Tracker', icon: Target, path: '/admin/habit' },
    { name: 'Wallet', icon: Target, path: '/admin/wallet' },
    { name: 'Reports & CMS', icon: BarChart3, path: '/admin/reports' }
  ];

  return (
    <aside
      className="w-64 h-full overflow-y-auto border-r border-gray-700"
      style={{ backgroundColor: '#0D1117', color: '#F9FAFB' }}
    >

      <nav className="p-4">
        <ul className="space-y-2">
          {navItems.map(({ name, icon: Icon, path }) => (
            <li key={name}>
              <NavLink
                to={path}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-[#1E1E2F] text-[#FACC15]'
                      : 'hover:bg-[#1E1E2F] text-[#F9FAFB]'
                  }`
                }
              >
                <Icon className="w-5 h-5 mr-3" />
                <span className="text-sm font-medium">{name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
