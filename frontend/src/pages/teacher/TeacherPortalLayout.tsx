import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import TeacherLayout from '@/layouts/TeacherLayout';

const viewToPath: Record<string, string> = {
  'teacher-portal': '/app/teacher/dashboard',
  'admin-dashboard': '/app/admin/dashboard',
};

const pathToView: Record<string, string> = {
  '/app/teacher/dashboard': 'teacher-portal',
};

export default function TeacherPortalLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentView = pathToView[location.pathname] ?? 'teacher-portal';

  const setCurrentView = (view: string) => {
    const targetPath = viewToPath[view];
    if (!targetPath) {
      return;
    }

    navigate(targetPath);
  };

  return (
    <TeacherLayout currentView={currentView} setCurrentView={setCurrentView}>
      <Outlet />
    </TeacherLayout>
  );
}
