import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import AdminLayout from '@/layouts/AdminLayout';

const viewToPath: Record<string, string> = {
  'admin-dashboard': '/app/admin/dashboard',
  'underserved-areas': '/app/admin/underserved-areas',
  'events-management': '/app/admin/events-management',
  'teacher-directory': '/app/admin/teacher-directory',
  'teacher-portal': '/app/teacher/dashboard',
};

const pathToView: Record<string, string> = {
  '/app/admin/dashboard': 'admin-dashboard',
  '/app/admin/underserved-areas': 'underserved-areas',
  '/app/admin/events-management': 'events-management',
  '/app/admin/teacher-directory': 'teacher-directory',
};

export default function AdminPortalLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentView = pathToView[location.pathname] ?? 'admin-dashboard';

  const setCurrentView = (view: string) => {
    const targetPath = viewToPath[view];
    if (!targetPath) {
      return;
    }

    navigate(targetPath);
  };

  return (
    <AdminLayout currentView={currentView} setCurrentView={setCurrentView}>
      <Outlet />
    </AdminLayout>
  );
}
