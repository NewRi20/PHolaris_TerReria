import React from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth'; // Make sure this path is correct for your setup
import pholarisLogo from '@/assets/pholarislogo.png'; // Make sure this path is correct

export default function TeacherPortalLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // We read the current URL to determine which button should be highlighted
  const currentPath = location.pathname;

  return (
    <div className="flex h-screen overflow-hidden bg-surface font-body text-on-surface">
      
      {/* Collapsible SideNavBar */}
      <aside className="group w-[4.5rem] hover:w-72 fixed left-0 top-0 bottom-0 flex flex-col bg-slate-50 border-r border-slate-200 transition-all duration-300 ease-in-out z-50 overflow-hidden">
        <div className="px-4 py-6 mb-4 flex items-center gap-3 w-72">
          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-transparent flex items-center justify-center shadow-sm">
            <img 
              src={pholarisLogo} 
              alt="Pholaris Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <h1 className="text-lg font-extrabold text-blue-900 font-headline leading-tight whitespace-nowrap">Teacher Portal</h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-0.5">Professional Growth</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 w-72">
          {/* UPDATED: Uses navigate() instead of setCurrentView */}
          <button 
            onClick={() => navigate('/app/teacher/dashboard')}
            className={`w-full flex items-center gap-4 px-[1.125rem] py-3 transition-all duration-200 ease-in-out ${
              currentPath === '/app/teacher/dashboard' 
                ? 'bg-blue-50 text-blue-900 font-bold border-r-4 border-blue-900' 
                : 'text-slate-600 hover:text-blue-800 hover:bg-white'
            }`}
          >
            <span className="material-symbols-outlined shrink-0">map</span>
            <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity duration-200 text-sm">
              Regional Events
            </span>
          </button>
          
          {/* UPDATED: Uses navigate() instead of setCurrentView */}
          <button 
            onClick={() => navigate('/app/teacher/profile')}
            className={`w-full flex items-center gap-4 px-[1.125rem] py-3 transition-all duration-200 ease-in-out ${
              currentPath === '/app/teacher/profile' 
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
          
          <button onClick={logout} className="w-full flex items-center gap-4 px-3 py-2 text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all rounded-lg mb-2">
            <span className="material-symbols-outlined text-[20px] shrink-0">logout</span>
            <span className="opacity-0 group-hover:opacity-100 text-sm font-bold whitespace-nowrap transition-opacity duration-200">Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 bg-surface flex flex-col h-screen ml-[4.5rem]">
        <header className="bg-white shrink-0 z-40 flex justify-between items-center w-full px-8 py-4 shadow-sm border-b border-slate-200">
          <span className="text-xl font-bold tracking-tighter text-sky-950 font-manrope">PHOLARIS</span>
          
          <div className="flex items-center gap-4 pl-2">
            <div className="text-right">
              {/* Optional: You can eventually replace "Prof. Maria Clara" with {user?.full_name} */}
              <p className="text-sm font-bold text-sky-950 leading-none">Prof. Maria Clara</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Science Educator</p>
            </div>
            <img 
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=150&auto=format&fit=crop" 
              alt="Profile" 
              className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 shadow-sm"
            />
          </div>
        </header>

        {/* UPDATED: The Router injects the actual page components (like TeacherProfile) into this Outlet! */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>

      </main>
    </div>
  );
}