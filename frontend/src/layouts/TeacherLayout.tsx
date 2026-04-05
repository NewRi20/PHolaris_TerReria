import React from 'react';

interface TeacherLayoutProps {
  children: React.ReactNode;
  currentView: string;
  setCurrentView: (view: string) => void;
}

export default function TeacherLayout({ children, currentView, setCurrentView }: TeacherLayoutProps) {
  return (
    <div className="bg-surface text-on-surface overflow-hidden h-screen flex">
      <aside className="flex flex-col h-screen w-64 bg-slate-100 p-4 gap-2 border-r-0 fixed left-0 top-0 overflow-y-auto z-50">
        <div className="mb-8 px-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-white">
              <span className="material-symbols-outlined">school</span>
            </div>
            <div>
              <h2 className="text-lg font-black text-sky-950 uppercase tracking-widest leading-none">Teacher Portal</h2>
              <p className="text-xs text-slate-500 font-medium tracking-tight">Professional Growth</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 space-y-1">
          <button onClick={() => setCurrentView('teacher-portal')} className="w-full flex items-center gap-3 px-4 py-3 bg-white text-secondary font-bold rounded-xl shadow-sm transition-all duration-300 ease-in-out font-manrope text-sm">
            <span className="material-symbols-outlined">map</span>
            <span>Regional Events</span>
          </button>
          <button onClick={() => setCurrentView('admin-dashboard')} className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-secondary hover:bg-slate-200/50 transition-all duration-300 ease-in-out font-manrope text-sm font-medium">
            <span className="material-symbols-outlined">swap_horiz</span>
            <span>Switch to Admin</span>
          </button>
        </nav>
      </aside>

      <main className="ml-64 flex-1 bg-surface flex flex-col h-screen">
        <header className="bg-slate-50/70 backdrop-blur-xl shrink-0 z-40 flex justify-between items-center w-full px-8 py-4 shadow-sm border-b border-slate-200/50">
          <span className="text-xl font-bold tracking-tighter text-sky-950 font-manrope">DOST STAR</span>
          <div className="flex items-center gap-3 pl-2">
            <div className="text-right">
              <p className="text-xs font-bold text-sky-950 leading-none">Prof. Maria Clara</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Region VII Administrator</p>
            </div>
            <img alt="Portrait" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" src="https://ui-avatars.com/api/?name=Maria+Clara&background=115cb9&color=fff"/>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}