import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface TeacherLayoutProps {
  children: React.ReactNode;
  currentView: string;
  setCurrentView: (view: string) => void;
}

export default function TeacherLayout({ children, currentView, setCurrentView }: TeacherLayoutProps) {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-surface text-on-surface">
      
      {/* Fixed SideNavBar */}
      <aside className="flex flex-col h-screen w-64 bg-slate-100 p-4 gap-2 fixed left-0 top-0 overflow-y-auto z-50">
        <div className="mb-8 px-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white">
              <span className="material-symbols-outlined">school</span>
            </div>
            <div>
              <h2 className="text-lg font-black text-sky-950 uppercase tracking-widest leading-none font-headline">Teacher Portal</h2>
              <p className="text-xs text-slate-500 font-medium tracking-tight">Professional Growth</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <button 
            onClick={() => setCurrentView('teacher-portal')}
            className={`w-full flex items-center gap-3 px-4 py-3 font-bold rounded-xl shadow-sm transition-all text-sm ${
              currentView === 'teacher-portal' ? 'bg-white text-sky-900' : 'text-slate-600 hover:text-sky-700 hover:bg-slate-200/50'
            }`}
          >
            <span className="material-symbols-outlined">map</span>
            <span>Regional Events</span>
          </button>
          
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-sky-700 hover:bg-slate-200/50 rounded-xl transition-all text-sm font-medium">
            <span className="material-symbols-outlined">person</span>
            <span>My Profile</span>
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-200/50">
          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-sky-700 hover:bg-slate-200/50 rounded-lg transition-all text-sm">
              <span className="material-symbols-outlined">settings</span>
              <span>Settings</span>
            </button>
            
            {/* LOGOUT BUTTON */}
            <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-error hover:bg-red-50 rounded-lg transition-all font-bold text-sm">
              <span className="material-symbols-outlined">logout</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-64 flex-1 bg-surface flex flex-col h-screen relative">
        
        {/* TopNavBar */}
        <header className="bg-slate-50/70 backdrop-blur-xl shrink-0 z-40 flex justify-between items-center w-full px-8 py-4 shadow-sm border-b border-slate-200/50 sticky top-0">
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold tracking-tighter text-sky-950 font-headline">DOST STAR Integrated System</span>
          </div>
          
          <div className="flex items-center gap-6 relative">
            <div className="flex items-center gap-4">
              
              {/* Notifications */}
              <button onClick={() => setShowNotifs(!showNotifs)} className="text-slate-500 hover:text-primary transition-colors relative">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-0 right-0 w-2 h-2 bg-secondary rounded-full"></span>
              </button>

              {showNotifs && (
                <div className="absolute top-12 right-48 w-64 bg-white border border-slate-200 shadow-xl rounded-xl p-4 z-50 text-sm">
                  <p className="font-bold text-primary mb-2">Notifications</p>
                  <div className="p-2 bg-slate-50 rounded text-slate-600 text-xs">You have been invited to an Advanced STEM Integration Workshop.</div>
                </div>
              )}

              <div className="h-8 w-[1px] bg-slate-200"></div>
              
              {/* Interactive Profile Section */}
              <div className="relative">
                <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-3 pl-2 hover:bg-slate-50 p-1.5 rounded-xl transition-colors text-left">
                  <div className="hidden sm:block text-right">
                    <p className="text-xs font-bold text-sky-950 leading-none">{user?.full_name || 'Prof. Maria Clara'}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{user?.email || 'Educator'}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-secondary flex items-center justify-center text-white font-bold text-sm">
                    {user?.full_name ? user.full_name.charAt(0) : 'M'}
                  </div>
                </button>

                {/* Profile Dropdown */}
                {showProfileMenu && (
                  <div className="absolute top-14 right-0 w-48 bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden z-50">
                    <div className="p-3 border-b border-slate-100 bg-slate-50 sm:hidden">
                      <p className="font-bold text-primary text-sm truncate">{user?.full_name || 'Prof. Maria Clara'}</p>
                      <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                    </div>
                    <button className="w-full text-left px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 font-medium flex items-center gap-2 transition-colors">
                      <span className="material-symbols-outlined text-[18px]">person</span> Edit Profile
                    </button>
                    <button onClick={logout} className="w-full text-left px-4 py-3 text-sm text-error hover:bg-red-50 font-bold flex items-center gap-2 transition-colors border-t border-slate-100">
                      <span className="material-symbols-outlined text-[18px]">logout</span> Sign Out
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        </header>

        {/* Page Content Injected Here */}
        {children}

      </main>
    </div>
  );
}