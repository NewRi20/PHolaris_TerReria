import React, { useState, useEffect } from 'react';
import TeacherMap from './ui/TeacherMap'; // Ensure this matches your file structure!

// --- MOCK DATA (Ready for Backend Replacement) ---
const MOCK_QUEUE = [
  {
    id: "q1",
    rank: "01",
    name: "Sulu Division",
    detail: "68% Out-of-Field",
    isCritical: true,
    icon: "trending_up"
  },
  {
    id: "q2",
    rank: "02",
    name: "Masbate Province",
    detail: "Severe Drought",
    isCritical: false,
    icon: "bar_chart"
  },
  {
    id: "q3",
    rank: "03",
    name: "Tawi-Tawi",
    detail: "Infrastructure Gap",
    isCritical: false,
    icon: "analytics"
  },
  {
    id: "q4",
    rank: "04",
    name: "Bukidnon",
    detail: "Science Deficit",
    isCritical: false,
    icon: "show_chart"
  }
];

export default function TeacherDashboard() {
  const [upliftQueue, setUpliftQueue] = useState(MOCK_QUEUE);
  const [loading, setLoading] = useState(false);

  /* // TODO: Uncomment when backend API is ready
  useEffect(() => {
    async function fetchTeacherDashboard() {
      setLoading(true);
      try {
        const response = await api.getTeacherDashboardData(); 
        setUpliftQueue(response.upliftQueue);
      } catch (error) {
        console.error("Error fetching teacher dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTeacherDashboard();
  }, []);
  */

  if (loading) {
    return <div className="flex h-screen items-center justify-center font-bold text-primary">Loading Dashboard...</div>;
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-8">
      {/* Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Main Map Area */}
        <div className="lg:col-span-9 flex flex-col gap-6 w-full">
          <div className="flex flex-col gap-1 shrink-0">
            <span className="text-secondary font-bold tracking-widest text-[10px] uppercase">Strategic Oversight</span>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h1 className="text-3xl font-extrabold text-primary tracking-tight font-headline">Regional Insights & Training</h1>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 rounded-lg bg-surface-container-high text-primary text-xs font-bold flex items-center gap-2 hover:bg-slate-200 transition-colors">
                  <span className="material-symbols-outlined text-sm">filter_alt</span> Filter Map
                </button>
                <button className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold flex items-center gap-2 hover:opacity-90 transition-opacity">
                  <span className="material-symbols-outlined text-sm">share</span> Export View
                </button>
              </div>
            </div>
          </div>

          {/* Map Interactive Canvas - FIXED HEIGHT AND WIDTH */}
          <div className="relative w-full h-[600px] bg-slate-900 rounded-3xl overflow-hidden shadow-xl border border-slate-800 z-0">
             <TeacherMap />
          </div>
        </div>

        {/* Uplift Priority Queue Sidebar */}
        <div className="lg:col-span-3 flex flex-col bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-slate-100 overflow-hidden h-[600px] lg:mt-[76px]">
          <div className="flex items-center justify-between mb-6 shrink-0">
            <h3 className="text-lg font-bold text-primary flex items-center gap-2 font-headline">
              <span className="material-symbols-outlined text-secondary">priority_high</span>
              Uplift Queue
            </h3>
            <span className="material-symbols-outlined text-slate-300 cursor-pointer hover:text-primary transition-colors">info</span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 no-scrollbar">
            {upliftQueue.map((item) => (
              <div 
                key={item.id} 
                className={`p-4 rounded-2xl flex items-center justify-between group transition-all cursor-pointer border ${
                  item.isCritical 
                    ? 'bg-error-container/10 hover:bg-error-container/20 border-error/5' 
                    : 'bg-surface-container-low hover:bg-surface-container border-transparent hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xl font-black ${item.isCritical ? 'text-error/40' : 'text-slate-300'}`}>
                    {item.rank}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-primary">{item.name}</p>
                    <p className={`text-[9px] font-semibold uppercase tracking-wide ${item.isCritical ? 'text-error' : 'text-on-surface-variant'}`}>
                      {item.detail}
                    </p>
                  </div>
                </div>
                <span className={`material-symbols-outlined text-sm ${item.isCritical ? 'text-error' : 'text-slate-400'}`}>
                  {item.icon}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-50 shrink-0">
            <button className="w-full text-secondary text-xs font-bold hover:underline py-2 transition-all">
              View Full Analysis Report
            </button>
          </div>
        </div>

      </section>
    </div>
  );
}