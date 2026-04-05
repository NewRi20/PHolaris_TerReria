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
  // Set your default starting view here
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

  // Switch to Teacher Portal view
  if (currentView === 'teacher-portal') {
    return (
      <TeacherLayout currentView={currentView} setCurrentView={setCurrentView}>
        <TeacherDashboard />
      </TeacherLayout>
    );
  }

  // Default Admin Portal view
  return (
    <AdminLayout currentView={currentView} setCurrentView={setCurrentView}>
      {renderAdminView()}
    </AdminLayout>
  );
}

export default App;