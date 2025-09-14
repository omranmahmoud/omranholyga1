import { NavLink, Routes, Route } from 'react-router-dom';
// import icons are now handled by navigationConfig
  import { navigationConfig, AdminRoutes } from './Layout/navigationConfig';
  import { AdminSidebar } from './Layout/AdminSidebar';
import { UserIcon } from '../Common/UserIcon';
import { useAuth } from '../../context/AuthContext';

export function AdminLayout() {
  const { user } = useAuth();
  // location not needed currently

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <AdminSidebar user={{ name: user?.name || 'Admin', email: user?.email || 'admin@example.com' }} />
      {/* Main Content */}
      <div className="pl-64">
        <main className="p-8">
          <Routes>
            {AdminRoutes.map((item) => (
              <Route key={item.path} path={item.path.replace('/admin', '') || '/'} element={<item.component />} />
            ))}
          </Routes>
        </main>
      </div>
    </div>
  );
}
