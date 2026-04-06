import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import pholarisLogo from '../assets/pholarislogo.png';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentView: string;
  setCurrentView: (view: string) => void;
}

// --- TYPES (Ready for Backend Integration) ---
interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'critical' | 'info' | 'success';
}

interface AdminSettings {
  aiScanning: boolean;
  criticalAlerts: boolean;
  weeklyReports: boolean;
}

export default function AdminLayout({ children, currentView, setCurrentView }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  
  // Menu States
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Backend-Ready States
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  
  const [settings, setSettings] = useState<AdminSettings>({
    aiScanning: true,
    criticalAlerts: true,
    weeklyReports: false
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // --- ACTUAL BACKEND FETCH LOGIC (Notifications) ---
  useEffect(() => {
    async function fetchNotifications() {
      setLoadingNotifs(true);
      try {
        // REPLACE WITH ACTUAL ENDPOINT: const res = await fetch('/api/admin/notifications');
        // const data = await res.json();
        
        // TEMPORARY SIMULATION OF BACKEND DELAY
        setTimeout(() => {
          setNotifications([
            { id: 'n1', title: 'Critical Void Detected', message: 'Region VIII (Samar) math teacher capacity dropped below 60%. Immediate intervention recommended.', time: '10m ago', type: 'critical' },
            { id: 'n2', title: 'AI Engine Update', message: '2 new event recommendations have been generated based on the latest regional metrics.', time: '1h ago', type: 'info' },
            { id: 'n3', title: 'Data Sync Complete', message: '142 new educator profiles successfully imported from the DOST onboarding portal.', time: '3h ago', type: 'success' }
          ]);
          setLoadingNotifs(false);
        }, 1000);
        
      } catch (error) {
        console.error("Failed to load notifications:", error);
        setLoadingNotifs(false);
      }
    }
    
    // Fetch notifications initially and optionally set up a polling interval
    fetchNotifications();
  }, []);

  // --- HANDLERS ---
  const handleToggleNotifs = () => {
    setShowNotifs(!showNotifs);
    setShowProfileMenu(false);
  };

  const handleToggleProfile = () => {
    setShowProfileMenu(!showProfileMenu);
    setShowNotifs(false);
  };

  // Notification Actions (Connected to Backend)
  const handleClearAllNotifs = async () => {
    try {
      // await fetch('/api/admin/notifications', { method: 'DELETE' });
      setNotifications([]);
    } catch (error) {
      console.error("Failed to clear notifications:", error);
    }
  };

  const handleDismissNotif = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    try {
      // await fetch(`/api/admin/notifications/${id}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error("Failed to dismiss notification:", error);
    }
  };

  // Settings Action (Connected to Backend)
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      // await fetch('/api/admin/settings', { method: 'PATCH', body: JSON.stringify(settings) });
      setTimeout(() => {
        setSavingSettings(false);
        setShowSettings(false);
      }, 800);
    } catch (error) {
      console.error("Failed to save settings:", error);
      setSavingSettings(false);
    }
  };

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
          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-transparent flex items-center justify-center shadow-sm">
            <img 
              src={pholarisLogo} 
              alt="Pholaris Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <h1 className="text-lg font-extrabold text-blue-900 font-headline leading-tight whitespace-nowrap">Admin Portal</h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">DOST STAR Program</p>
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
          {/* SETTINGS BUTTON */}
          <button 
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center gap-4 px-3 py-2 text-slate-600 hover:text-blue-800 hover:bg-white transition-all rounded-lg"
          >
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
            <span className="text-xl font-bold tracking-tighter text-sky-950 font-headline hidden sm:block">PHOLARIS</span>
            <span className="text-xl font-bold tracking-tighter text-sky-950 font-headline sm:hidden">DOST STAR</span>
          </div>
          
          <div className="flex items-center gap-4 relative">
            
            {/* Interactive Notification Section */}
            <div className="relative">
              <button 
                onClick={handleToggleNotifs} 
                className="p-2 text-slate-500 hover:bg-slate-100 transition-colors rounded-full relative"
              >
                <span className="material-symbols-outlined">notifications</span>
                {notifications.length > 0 && !loadingNotifs && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-error rounded-full border-2 border-white animate-pulse"></span>
                )}
              </button>
              
              {showNotifs && (
                <div className="absolute top-12 right-0 w-80 bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden z-50 flex flex-col max-h-[80vh]">
                  <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <p className="font-extrabold text-primary text-sm font-headline">Notifications</p>
                    {notifications.length > 0 && !loadingNotifs && (
                      <button onClick={handleClearAllNotifs} className="text-[10px] font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-widest">
                        Clear All
                      </button>
                    )}
                  </div>
                  
                  <div className="overflow-y-auto">
                    {loadingNotifs ? (
                      <div className="p-8 text-center flex flex-col items-center justify-center">
                        <span className="material-symbols-outlined text-slate-300 text-3xl animate-spin mb-2">refresh</span>
                        <p className="text-xs font-bold text-slate-500">Syncing alerts...</p>
                      </div>
                    ) : notifications.length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {notifications.map(notif => (
                          <div key={notif.id} className={`p-4 hover:bg-slate-50 transition-colors relative group ${notif.type === 'critical' ? 'bg-error/5' : ''}`}>
                            <div className="flex gap-3 items-start pr-6">
                              <span className={`material-symbols-outlined text-[18px] mt-0.5 shrink-0 ${
                                notif.type === 'critical' ? 'text-error' : 
                                notif.type === 'success' ? 'text-emerald-500' : 'text-blue-500'
                              }`}>
                                {notif.type === 'critical' ? 'warning' : notif.type === 'success' ? 'check_circle' : 'info'}
                              </span>
                              <div>
                                <p className={`text-sm font-bold leading-tight mb-1 ${notif.type === 'critical' ? 'text-error' : 'text-slate-800'}`}>
                                  {notif.title}
                                </p>
                                <p className="text-xs text-slate-500 leading-relaxed">{notif.message}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2">{notif.time}</p>
                              </div>
                            </div>
                            {/* Dismiss single notification button */}
                            <button 
                              onClick={(e) => handleDismissNotif(notif.id, e)}
                              className="absolute top-4 right-4 text-slate-300 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center flex flex-col items-center">
                        <span className="material-symbols-outlined text-slate-200 text-4xl mb-2">notifications_paused</span>
                        <p className="text-sm font-bold text-slate-500">All caught up!</p>
                        <p className="text-xs text-slate-400 mt-1">No new alerts or critical warnings.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Profile Section */}
            <div className="relative">
              <button 
                onClick={handleToggleProfile} 
                className="flex items-center gap-2 hover:bg-slate-50 p-1 rounded-full transition-colors border border-transparent hover:border-slate-200"
              >
                <div className="h-8 w-8 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200 shadow-sm">
                  {/* High-quality placeholder profile picture */}
                  <img 
                    src={user?.profile_url || "https://ui-avatars.com/api/?name=System+Admin&background=0ea5e9&color=fff&rounded=true&bold=true"} 
                    alt="Admin Profile" 
                    className="h-full w-full object-cover"
                  />
                </div>
              </button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div className="absolute top-12 right-0 w-48 bg-white border border-slate-200 shadow-2xl rounded-xl overflow-hidden z-50">
                  <div className="p-3 border-b border-slate-100 bg-slate-50">
                    <p className="font-bold text-primary text-sm truncate">{user?.full_name || 'System Admin'}</p>
                    <p className="text-[10px] text-slate-500 truncate">{user?.email || 'admin@pholaris.gov.ph'}</p>
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
        <div onClick={() => { setShowNotifs(false); setShowProfileMenu(false); }}>
          {children}
        </div>
        
      </main>

      {/* --- SETTINGS MODAL --- */}
      {showSettings && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="font-headline font-extrabold text-xl text-primary">System Preferences</h3>
                <p className="text-xs text-slate-500 mt-0.5">Manage dashboard alerts and automation rules.</p>
              </div>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-700 transition-colors bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              
              {/* Setting Item 1 */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Automated AI Scanning</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Allow AI to passively scan DB for event recommendations.</p>
                </div>
                <button 
                  onClick={() => setSettings(prev => ({...prev, aiScanning: !prev.aiScanning}))}
                  className={`w-11 h-6 rounded-full transition-colors relative ${settings.aiScanning ? 'bg-primary' : 'bg-slate-300'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${settings.aiScanning ? 'translate-x-6' : 'translate-x-1'}`}></div>
                </button>
              </div>

              {/* Setting Item 2 */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Critical Shortage Email Alerts</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Send admin emails when a region drops below 60% capacity.</p>
                </div>
                <button 
                  onClick={() => setSettings(prev => ({...prev, criticalAlerts: !prev.criticalAlerts}))}
                  className={`w-11 h-6 rounded-full transition-colors relative ${settings.criticalAlerts ? 'bg-primary' : 'bg-slate-300'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${settings.criticalAlerts ? 'translate-x-6' : 'translate-x-1'}`}></div>
                </button>
              </div>

              {/* Setting Item 3 */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Weekly Summary Reports</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Receive a PDF report of map analytics every Monday.</p>
                </div>
                <button 
                  onClick={() => setSettings(prev => ({...prev, weeklyReports: !prev.weeklyReports}))}
                  className={`w-11 h-6 rounded-full transition-colors relative ${settings.weeklyReports ? 'bg-primary' : 'bg-slate-300'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${settings.weeklyReports ? 'translate-x-6' : 'translate-x-1'}`}></div>
                </button>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors shadow-md flex items-center gap-2 disabled:opacity-70"
              >
                {savingSettings ? (
                  <><span className="material-symbols-outlined text-sm animate-spin">refresh</span> Saving...</>
                ) : (
                  'Save Preferences'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}