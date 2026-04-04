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

  // --- TEMPORARY DEV SWITCHER LOGIC ---
// Replace the old isTeacherView line with this one:
const isTeacherView = currentView === 'teacher-portal' || currentView === 'teacher-profile';
  
  const toggleRole = () => {
    setCurrentView(isTeacherView ? 'admin-dashboard' : 'teacher-portal');
  };

  // The floating button component
  const DevToggleButton = () => (
    <button
      onClick={toggleRole}
      className="fixed bottom-6 right-6 z-[9999] bg-slate-900 text-white px-5 py-3 rounded-full shadow-2xl font-bold text-xs flex items-center gap-2 hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all border-2 border-white/10"
    >
      <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
      Switch to {isTeacherView ? 'Admin' : 'Teacher'}
    </button>
  );
  // ------------------------------------

// Switch to Teacher Portal view
  if (isTeacherView) {
    return (
      <>
        <TeacherLayout currentView={currentView} setCurrentView={setCurrentView}>
          {currentView === 'teacher-profile' ? <TeacherProfile /> : <TeacherDashboard />}
        </TeacherLayout>
        <DevToggleButton />
      </>
    );
  }

  // Default Admin Portal view
  return (
    <>
      <AdminLayout currentView={currentView} setCurrentView={setCurrentView}>
        {renderAdminView()}
      </AdminLayout>
      <DevToggleButton />
    </>
  );
}

export default App;