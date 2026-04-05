import { useState, useEffect } from 'react';
import { api } from '../services/api';

// MOCK DATA: Used only if the backend server is offline!
const FALLBACK_DASHBOARD = {
  total_teachers: 1250,
  pending_events: 8,
  sent_invitations: 2341,
  regional_readiness: 0.72
};

const FALLBACK_UNDERSERVED = [
  { province: "Basilan", region: "BARMM Region", priority_score: 9.4 },
  { province: "Sulu", region: "BARMM Region", priority_score: 8.8 },
  { province: "Davao Occidental", region: "Region XI", priority_score: 8.5 },
  { province: "Tawi-Tawi", region: "BARMM Region", priority_score: 8.1 },
  { province: "Sarangani", region: "Region XII", priority_score: 7.9 }
];

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [underservedData, setUnderservedData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [dashRes, underservedRes] = await Promise.all([
          api.getAdminDashboard(),
          api.getUnderservedAreas()
        ]);
        
        // If the API returns an error HTML page instead of JSON, it will throw an error and go to catch
        if (dashRes.total_teachers === undefined) throw new Error("Invalid Backend Response");

        setDashboardData(dashRes);
        setUnderservedData(underservedRes.top_underserved);
      } catch (error) {
        console.warn("Backend is offline. Using Fallback Mock Data.");
        setIsOffline(true);
        setDashboardData(FALLBACK_DASHBOARD);
        setUnderservedData(FALLBACK_UNDERSERVED);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-primary font-bold">Loading Database Metrics...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            {isOffline ? (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">wifi_off</span> Backend Offline - Mock Data
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-green-100 text-green-800 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">cloud_sync</span> Live System Sync
              </span>
            )}
          </div>
          <h2 className="text-4xl font-extrabold text-primary tracking-tight mb-4 font-headline">Admin Dashboard</h2>
          <p className="text-slate-600 leading-relaxed">Detailed capacity-gap analysis. Total Active Teachers: <span className="font-bold">{dashboardData.total_teachers}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Priority Rank Section */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-headline font-bold text-lg text-primary">Priority Rank</h3>
            <span className="material-symbols-outlined text-secondary">filter_list</span>
          </div>
          <div className="space-y-4">
            {underservedData?.map((area: any, idx: number) => (
              <div key={idx} className={`flex items-center gap-4 p-4 rounded-xl border-l-4 ${idx === 0 ? 'bg-red-50 border-error' : 'bg-slate-50 border-slate-200'}`}>
                <span className={`text-2xl font-black opacity-40 italic ${idx === 0 ? 'text-error' : 'text-slate-400'}`}>0{idx + 1}</span>
                <div className="flex-1">
                  <p className="font-bold text-primary">{area.province}</p>
                  <p className="text-xs text-slate-500">{area.region}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-black ${idx === 0 ? 'text-error' : 'text-slate-700'}`}>{area.uplift_priority || area.priority_score}</p>
                  <p className="text-[9px] text-slate-500 uppercase font-bold">Priority Score</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">Pending Events</p>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-4xl font-black text-primary">{dashboardData.pending_events}</span>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">Sent Invitations</p>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-4xl font-black text-primary">{dashboardData.sent_invitations}</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">Regional Readiness</p>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-4xl font-black text-primary">{(dashboardData.regional_readiness * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${dashboardData.regional_readiness * 100}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}