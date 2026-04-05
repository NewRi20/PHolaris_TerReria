import { useState } from 'react';

import AdminLayout from './layouts/AdminLayout';
import TeacherLayout from './layouts/TeacherLayout';

import AdminDashboard from "./components/AdminDashboard";
import UnderservedAreas from "./components/UnderservedAreas";
import EventsManagement from "./components/EventsManagement";
import TeacherDirectory from "./components/TeacherDirectory";
import TeacherDashboard from "./components/TeacherDashboard";
import TeacherProfile from "./components/TeacherProfile";

function App() {
  // Set your default starting view here (e.g., 'admin-dashboard' or 'teacher-portal')
  const [currentView, setCurrentView] = useState('admin-dashboard');

  const renderAdminView = () => {
    switch (currentView) {
      case 'admin-dashboard': return <AdminDashboard />;
      case 'underserved-areas': return <UnderservedAreas />;
      case 'events-management': return <EventsManagement />;
      case 'teacher-directory': return <TeacherDirectory />;
      default: return <AdminDashboard />;
    }
  };

  const isTeacherView = currentView === 'teacher-portal' || currentView === 'teacher-profile';

  // 1. Teacher Portal Routing
  if (isTeacherView) {
    return (
      <TeacherLayout currentView={currentView} setCurrentView={setCurrentView}>
        {currentView === 'teacher-profile' ? <TeacherProfile /> : <TeacherDashboard />}
      </TeacherLayout>
    );
  }

  // 2. Admin Portal Routing (Default)
  return (
    <AdminLayout currentView={currentView} setCurrentView={setCurrentView}>
      {renderAdminView()}
    </AdminLayout>
  );
}

export default App;