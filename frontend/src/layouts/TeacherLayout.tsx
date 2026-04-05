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

      <main className="ml-64 flex-1 bg-surface flex flex-col h-screen">
        <header className="bg-slate-50/70 backdrop-blur-xl shrink-0 z-40 flex justify-between items-center w-full px-8 py-4 shadow-sm border-b border-slate-200/50">
          <span className="text-xl font-bold tracking-tighter text-sky-950 font-manrope">DOST STAR</span>
          <div className="flex items-center gap-3 pl-2">
            <div className="text-right">
              <p className="text-xs font-bold text-sky-950 leading-none">Prof. Maria Clara</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Region VII Administrator</p>
            </div>

          </div>
        </header>

        {/* Page Content Injected Here */}
        {children}

      </main>
    </div>
  );
}