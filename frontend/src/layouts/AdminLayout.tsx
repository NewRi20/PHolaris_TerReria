import React from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentView: string;
  setCurrentView: (view: string) => void;
}

export default function AdminLayout({ children, currentView, setCurrentView }: AdminLayoutProps) {
  const navItems = [
    { id: 'admin-dashboard', icon: 'dashboard', label: 'Admin Dashboard' },
    { id: 'underserved-areas', icon: 'map', label: 'Underserved Area Map' },
    { id: 'events-management', icon: 'calendar_month', label: 'Event Management' },
    { id: 'teacher-directory', icon: 'group', label: 'Teacher Directory' },
  ];

  return (
    <div className="bg-surface font-body text-on-surface flex h-screen overflow-hidden">
      {/* Shared Admin Sidebar */}
      <aside className="sidebar-base flex flex-col h-screen py-4 bg-slate-50 border-r border-slate-200 transition-all duration-300 ease-in-out z-50 shrink-0">
        <div className="px-4 py-6 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            </div>
            <div className="logo-text">
              <h1 className="text-lg font-extrabold text-blue-900 font-headline leading-tight whitespace-nowrap">Precision Scholar</h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Teacher Data Admin</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar text-sm">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-4 px-[1.125rem] py-3 transition-all duration-200 ease-in-out group ${
                currentView === item.id
                  ? 'bg-blue-100/50 text-primary font-bold border-r-4 border-primary'
                  : 'text-slate-600 hover:text-primary hover:bg-white'
              }`}
            >
              <span className="material-symbols-outlined shrink-0">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="pt-4 px-3 space-y-1 border-t border-slate-200 mt-auto">
          <button className="w-full mb-4 py-3 px-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined text-sm shrink-0">analytics</span>
            <span className="generate-btn-text whitespace-nowrap">Generate Report</span>
          </button>
          <button onClick={() => setCurrentView('teacher-portal')} className="w-full flex items-center gap-4 text-slate-600 px-3 py-2 text-sm hover:text-primary hover:bg-white transition-all duration-200">
            <span className="material-symbols-outlined text-[20px] shrink-0">swap_horiz</span>
            <span className="nav-label">Switch to Teacher</span>
          </button>
        </div>
      </aside>

      {/* Shared Header & Main Content Injection */}
      <main className="flex-1 overflow-y-auto bg-surface relative main-content-shifted no-scrollbar">
        <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm px-6 py-3 flex justify-between items-center w-full h-16">
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold text-primary">DOST STAR Integrated System</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-900">Dr. Helena Vance</p>
                <p className="text-[10px] text-slate-500">System Access: Root</p>
              </div>
              <img alt="Admin Profile" className="w-10 h-10 rounded-full border border-slate-200 object-cover" src="https://ui-avatars.com/api/?name=Helena+Vance&background=003366&color=fff" />
            </div>
          </div>
        </header>

        {/* THIS IS WHERE YOUR PAGES RENDER */}
        {children}
      </main>
    </div>
  );
}