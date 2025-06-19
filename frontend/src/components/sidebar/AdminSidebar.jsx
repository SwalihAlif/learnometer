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

const AdminSidebar = () => {
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Manage Learners', icon: Users },
    { name: 'Manage Mentors', icon: UserCheck },
    { name: "Learner's Courses & Contents", icon: BookOpen },
    { name: 'Sessions', icon: Calendar },
    { name: 'Reviews', icon: MessageSquare },
    { name: 'Premium & Referrals', icon: Crown },
    { name: 'Payments', icon: CreditCard },
    { name: 'Notifications', icon: Bell },
    { name: 'Motivation Quotes', icon: Quote },
    { name: 'Motivation Books', icon: Book },
    { name: 'Motivation Videos', icon: Video },
    { name: 'Habit Tracker', icon: Target },
    { name: 'Reports & CMS', icon: BarChart3 }
  ];

  return (
    <aside className="w-64 h-full overflow-y-auto border-r border-gray-700" style={{ backgroundColor: '#0D1117', color: '#F9FAFB' }}>
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-lg font-bold" style={{ color: '#FACC15' }}>
          Learnometer Admin
        </h2>
      </div>
      
      <nav className="p-4">
        <ul className="space-y-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <li key={index}>
                <a
                  href="#"
                  className="flex items-center px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200"
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span className="text-sm font-medium">{item.name}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default AdminSidebar;