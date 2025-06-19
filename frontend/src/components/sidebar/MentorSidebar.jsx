import {
  LayoutDashboard,
  Calendar,
  MessageSquare,
  Star,
  Video,
  DollarSign
} from 'lucide-react';

const MentorSidebar = () => {
  const navItems = [
    { name: 'Dashboard & Profile', icon: LayoutDashboard },
    { name: 'Sessions', icon: Calendar },
    { name: 'Feedback', icon: MessageSquare },
    { name: 'Reviews', icon: Star },
    { name: 'Chat & Video', icon: Video },
    { name: 'Earnings', icon: DollarSign }
  ];

  return (
    <aside className="w-64 h-full overflow-y-auto bg-gradient-to-b from-[#0F766E] to-[#0D5B54]">
      
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
        </ul>
      </nav>
    </aside>
  );
};

export default MentorSidebar;