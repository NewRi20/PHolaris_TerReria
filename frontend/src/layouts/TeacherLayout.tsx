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
    <div className="flex h-screen overflow-hidden bg-surface font-body text-on-surface">
      
      {/* Collapsible SideNavBar (Matched to Admin style) */}
      <aside className="group w-[4.5rem] hover:w-72 fixed left-0 top-0 bottom-0 flex flex-col bg-slate-50 border-r border-slate-200 transition-all duration-300 ease-in-out z-50 overflow-hidden">
        <div className="px-4 py-6 mb-4 flex items-center gap-3 w-72">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-white">school</span>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <h1 className="text-lg font-extrabold text-blue-900 font-headline leading-tight whitespace-nowrap">Teacher Portal</h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-0.5">Professional Growth</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 w-72">
          <button 
            onClick={() => setCurrentView('teacher-portal')}
            className={`w-full flex items-center gap-4 px-[1.125rem] py-3 transition-all duration-200 ease-in-out ${
              currentView === 'teacher-portal' 
                ? 'bg-blue-50 text-blue-900 font-bold border-r-4 border-blue-900' 
                : 'text-slate-600 hover:text-blue-800 hover:bg-white'
            }`}
          >
            <span className="material-symbols-outlined shrink-0">map</span>
            <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity duration-200 text-sm">
              Regional Events
            </span>
          </button>
          
          <button 
            onClick={() => setCurrentView('teacher-profile')}
            className={`w-full flex items-center gap-4 px-[1.125rem] py-3 transition-all duration-200 ease-in-out ${
              currentView === 'teacher-profile' 
                ? 'bg-blue-50 text-blue-900 font-bold border-r-4 border-blue-900' 
                : 'text-slate-600 hover:text-blue-800 hover:bg-white'
            }`}
          >
            <span className="material-symbols-outlined shrink-0">person</span>
            <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity duration-200 text-sm">
              My Profile
            </span>
          </button>
        </nav>

        <div className="pt-4 px-3 space-y-1 border-t border-slate-200 mt-auto w-72">
          <button className="w-full flex items-center gap-4 px-3 py-2 text-slate-600 hover:text-blue-800 hover:bg-white transition-all rounded-lg">
            <span className="material-symbols-outlined text-[20px] shrink-0">settings</span>
            <span className="opacity-0 group-hover:opacity-100 text-sm whitespace-nowrap transition-opacity duration-200">Settings</span>
          </button>
          
          <button onClick={logout} className="w-full flex items-center gap-4 px-3 py-2 text-slate-600 hover:text-error hover:bg-red-50 transition-all rounded-lg mb-2">
            <span className="material-symbols-outlined text-[20px] shrink-0">logout</span>
            <span className="opacity-0 group-hover:opacity-100 text-sm font-bold whitespace-nowrap transition-opacity duration-200">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area (Shifted margin to match new sidebar width) */}
      <main className="flex-1 overflow-y-auto no-scrollbar bg-surface relative ml-[4.5rem] w-[calc(100%-4.5rem)]">
        
        {/* TopNavBar */}
        <header className="flex justify-between items-center w-full px-6 sticky top-0 z-40 h-16 bg-white/80 backdrop-blur-md border-b border-slate-100">
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold tracking-tighter text-sky-950 font-headline hidden sm:block">DOST STAR Integrated System</span>
            <span className="text-xl font-bold tracking-tighter text-sky-950 font-headline sm:hidden">DOST STAR</span>
          </div>
          
          <div className="flex items-center gap-3 relative">
              
            {/* Notifications */}
            <button onClick={() => setShowNotifs(!showNotifs)} className="p-2 text-slate-500 hover:bg-slate-50 transition-colors rounded-full relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-secondary rounded-full border-2 border-white"></span>
            </button>

            {showNotifs && (
              <div className="absolute top-12 right-12 w-64 bg-white border border-slate-200 shadow-xl rounded-xl p-4 z-50 text-sm">
                <p className="font-bold text-primary mb-2">Notifications</p>
                <div className="p-2 bg-slate-50 rounded text-slate-600 text-xs">You have been invited to an Advanced STEM Integration Workshop.</div>
              </div>
            )}

            <button className="p-2 text-slate-500 hover:bg-slate-50 transition-colors rounded-full hidden sm:block">
              <span className="material-symbols-outlined">help_outline</span>
            </button>
            
            <div className="h-8 w-[1px] bg-slate-200 hidden sm:block"></div>
            
            {/* Interactive Profile Section */}
            <div className="relative">
              <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-3 pl-2 hover:bg-slate-50 p-1.5 rounded-xl transition-colors text-left">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-bold text-sky-950 leading-none">{user?.full_name || 'Prof. Maria Clara'}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{user?.email || 'Educator'}</p>
                </div>
                <div className="w-9 h-9 rounded-full border-2 border-white shadow-sm bg-secondary flex items-center justify-center text-white font-bold text-sm shrink-0">
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
                  
                  <button 
                    onClick={() => {
                      setCurrentView('teacher-profile');
                      setShowProfileMenu(false);
                    }} 
                    className="w-full text-left px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 font-medium flex items-center gap-2 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">person</span> Edit Profile
                  </button>
                  
                  <button onClick={logout} className="w-full text-left px-4 py-3 text-sm text-error hover:bg-red-50 font-bold flex items-center gap-2 transition-colors border-t border-slate-100">
                    <span className="material-symbols-outlined text-[18px]">logout</span> Sign Out
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Page Content Injected Here */}
        {children}

      </main>
    </div>
  );
}