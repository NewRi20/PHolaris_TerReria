import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentView: string;
  setCurrentView: (view: string) => void;
}

export default function AdminLayout({ children, currentView, setCurrentView }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);

  const navItems = [
    { id: 'admin-dashboard', icon: 'dashboard', label: 'Admin Dashboard' },
    { id: 'underserved-areas', icon: 'map', label: 'Underserved Area Map' },
    { id: 'events-management', icon: 'calendar_month', label: 'Event Management' },
    { id: 'teacher-directory', icon: 'group', label: 'Teacher Directory' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-surface font-body text-on-surface">
      
      {/* Collapsible SideNavBar */}
      <aside className="group w-[4.5rem] hover:w-72 fixed left-0 top-0 bottom-0 flex flex-col bg-slate-50 border-r border-slate-200 transition-all duration-300 ease-in-out z-50 overflow-hidden">
        <div className="px-4 py-6 mb-4 flex items-center gap-3 w-72">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <h1 className="text-lg font-extrabold text-blue-900 font-headline leading-tight whitespace-nowrap">Precision Scholar</h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Teacher Data Admin</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 w-72">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-4 px-[1.125rem] py-3 transition-all duration-200 ease-in-out ${
                currentView === item.id 
                  ? 'bg-blue-50 text-blue-900 font-bold border-r-4 border-blue-900' 
                  : 'text-slate-600 hover:text-blue-800 hover:bg-white'
              }`}
            >
              <span className="material-symbols-outlined shrink-0">{item.icon}</span>
              <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity duration-200 text-sm">
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        <div className="pt-4 px-3 space-y-1 border-t border-slate-200 mt-auto w-72">
          {/* <button className="w-[calc(100%-1.5rem)] mb-4 py-3 px-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined text-sm shrink-0">analytics</span>
            <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity duration-200">Generate Report</span>
          </button>*/}
          
          <button className="w-full flex items-center gap-4 px-3 py-2 text-slate-600 hover:text-blue-800 hover:bg-white transition-all rounded-lg">
            <span className="material-symbols-outlined text-[20px] shrink-0">settings</span>
            <span className="opacity-0 group-hover:opacity-100 text-sm whitespace-nowrap transition-opacity duration-200">Settings</span>
          </button>
          
          {/* LOGOUT BUTTON */}
          <button onClick={logout} className="w-full flex items-center gap-4 px-3 py-2 text-slate-600 hover:text-error hover:bg-red-50 transition-all rounded-lg mb-2">
            <span className="material-symbols-outlined text-[20px] shrink-0">logout</span>
            <span className="opacity-0 group-hover:opacity-100 text-sm font-bold whitespace-nowrap transition-opacity duration-200">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar bg-surface relative ml-[4.5rem] w-[calc(100%-4.5rem)]">
        
        {/* TopAppBar */}
        <header className="flex justify-between items-center w-full px-6 sticky top-0 z-40 h-16 bg-white/80 backdrop-blur-md border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="relative flex items-center bg-slate-100 rounded-full px-4 h-10 w-96">
              <span className="material-symbols-outlined text-slate-400 mr-2">search</span>
              <input className="bg-transparent border-none focus:outline-none text-sm font-medium w-full text-slate-700" placeholder="Search by name, ID, or school..." type="text"/>
            </div>
          </div>
          
          <div className="flex items-center gap-3 relative">
            {/* Notifications */}
            <button onClick={() => setShowNotifs(!showNotifs)} className="p-2 text-slate-500 hover:bg-slate-50 transition-colors rounded-full relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-error rounded-full border-2 border-white"></span>
            </button>
            
            {showNotifs && (
              <div className="absolute top-12 right-12 w-64 bg-white border border-slate-200 shadow-xl rounded-xl p-4 z-50 text-sm">
                <p className="font-bold text-primary mb-2">Notifications</p>
                <div className="p-2 bg-slate-50 rounded text-slate-600 text-xs">New Teacher Registration from Region VIII requires review.</div>
              </div>
            )}

            <button className="p-2 text-slate-500 hover:bg-slate-50 transition-colors rounded-full">
              <span className="material-symbols-outlined">help_outline</span>
            </button>
            
            {/* Interactive Profile Section */}
            <div className="relative">
              <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-2 hover:bg-slate-50 p-1 rounded-full transition-colors">
                <div className="h-8 w-8 rounded-full overflow-hidden bg-primary flex items-center justify-center text-white font-bold text-xs">
                  {user?.full_name ? user.full_name.charAt(0) : 'A'}
                </div>
              </button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div className="absolute top-12 right-0 w-48 bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden z-50">
                  <div className="p-3 border-b border-slate-100 bg-slate-50">
                    <p className="font-bold text-primary text-sm truncate">{user?.full_name || 'System Admin'}</p>
                    <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                  </div>
                  <button onClick={logout} className="w-full text-left px-4 py-3 text-sm text-error hover:bg-red-50 font-bold flex items-center gap-2 transition-colors">
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