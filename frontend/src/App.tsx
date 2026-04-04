import { useState } from 'react';

// FIX: Corrected import paths based on your actual folder structure
import AdminLayout from './layouts/AdminLayout';
import TeacherLayout from './layouts/TeacherLayout';

import AdminDashboard from "./components/AdminDashboard";
import UnderservedAreas from "./components/UnderservedAreas";
import EventsManagement from "./components/EventsManagement";
import TeacherDirectory from "./components/TeacherDirectory";
import TeacherDashboard from "./components/TeacherDashboard";

function App() {
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

  if (currentView === 'teacher-portal') {
    return (
      <TeacherLayout currentView={currentView} setCurrentView={setCurrentView}>
        <TeacherDashboard />
      </TeacherLayout>
    );
  }

  return (
    <AdminLayout currentView={currentView} setCurrentView={setCurrentView}>
      {renderAdminView()}
    </AdminLayout>
  );
}

export default App;