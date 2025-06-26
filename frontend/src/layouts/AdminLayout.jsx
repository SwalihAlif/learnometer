import { Outlet } from "react-router-dom";
import AdminSidebar from '../components/sidebar/AdminSidebar';
import AdminNavbar from '../components/navbar/AdminNavbar';
import AdminFooter from '../components/footer/AdminFooter';

const AdminLayout = ({ children }) => {
  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: '#0D1117', color: '#F9FAFB' }}>
      <AdminNavbar />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
          <Outlet />
        </main>
      </div>
      <AdminFooter />
    </div>
  );
};

export default AdminLayout;