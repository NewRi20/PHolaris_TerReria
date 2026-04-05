import React, { useState, useEffect } from 'react';

// --- MOCK DATA (Ready to be replaced by Backend API) ---
const MOCK_PRIORITY_RANK = [
  { province: "Basilan", region: "BARMM Region", score: 9.4, rank: "01", isCritical: true },
  { province: "Sulu", region: "BARMM Region", score: 8.8, rank: "02", isCritical: false },
  { province: "Davao Occidental", region: "Region XI", score: 8.5, rank: "03", isCritical: false },
  { province: "Tawi-Tawi", region: "BARMM Region", score: 8.1, rank: "04", isCritical: false },
  { province: "Sarangani", region: "Region XII", score: 7.9, rank: "05", isCritical: false }
];

const MOCK_METRICS = {
  outOfField: { value: 64, trend: "+12%" },
  trainingDrought: { value: 8.2, status: "Critical" },
  experienceVoid: { value: 42, status: "Stable" }
};

const MOCK_DETAILED_REGIONS = [
  { city: "Lamitan City", location: "Basilan • Region IX", shortage: "48%", misalignment: "72%", rank: 1, action: "Immediate Action", actionClass: "bg-error/10 text-error" },
  { city: "Jolo", location: "Jolo • BARMM", shortage: "42%", misalignment: "65%", rank: 1, action: "Critical Void", actionClass: "bg-error/10 text-error" },
  { city: "Malita", location: "Davao Occidental • Region XI", shortage: "35%", misalignment: "40%", rank: 2, action: "Tier 2 Monitoring", actionClass: "bg-amber-100 text-amber-700" },
  { city: "Bongao", location: "Tawi-Tawi • BARMM", shortage: "28%", misalignment: "38%", rank: 3, action: "Stable/Low Gap", actionClass: "bg-secondary/10 text-secondary" }
];

export default function AdminDashboard() {
  // State ready for backend integration
  const [priorityData, setPriorityData] = useState(MOCK_PRIORITY_RANK);
  const [metrics, setMetrics] = useState(MOCK_METRICS);
  const [detailedRegions, setDetailedRegions] = useState(MOCK_DETAILED_REGIONS);
  const [loading, setLoading] = useState(false);

  /* // TODO: Uncomment when ready to connect to backend
  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const data = await api.getDashboardMetrics();
        setPriorityData(data.priorityRanks);
        setMetrics(data.metrics);
        setDetailedRegions(data.detailedRegions);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);
  */

  if (loading) {
    return <div className="flex h-screen items-center justify-center font-bold text-primary">Loading Dashboard Analytics...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-error-container text-on-error-container text-[10px] font-bold rounded-full uppercase tracking-wider">
              Critical Analysis Required
            </span>
          </div>
          <h2 className="text-4xl font-extrabold text-primary tracking-tight mb-4 font-headline">Admin Dashboard</h2>
          <p className="text-slate-500 leading-relaxed">
            Detailed capacity-gap analysis for educational coverage. Metrics identify regions where instructional quality is compromised by teacher shortages and lack of professional development.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-surface-container-low px-4 py-3 rounded-xl border border-slate-200">
            <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Last Data Sync</span>
            <span className="text-primary font-headline font-bold">Just now</span>
          </div>
        </div>
      </div>

      {/* Bento Grid Content */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Top 5 Critical Provinces (Priority Rank) */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-headline font-bold text-lg text-primary">Priority Rank</h3>
            <span className="material-symbols-outlined text-secondary">filter_list</span>
          </div>
          <div className="space-y-4">
            {priorityData.map((item, index) => (
              <div 
                key={index} 
                className={`flex items-center gap-4 p-4 rounded-xl border ${item.isCritical ? 'bg-red-50 border-error border-l-4 rounded-l-none' : 'bg-slate-50 border-slate-100'}`}
              >
                <span className={`text-2xl font-black italic ${item.isCritical ? 'text-error opacity-40' : 'text-slate-300'}`}>
                  {item.rank}
                </span>
                <div className="flex-1">
                  <p className="font-bold text-primary">{item.province}</p>
                  <p className="text-xs text-slate-500">{item.region}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-black ${item.isCritical ? 'text-error' : item.rank === "02" || item.rank === "03" ? 'text-secondary' : 'text-slate-500'}`}>
                    {item.score}
                  </p>
                  <p className="text-[9px] text-slate-500 uppercase font-bold">Risk Score</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap Preview and Quick Metrics */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          
          {/* Map Preview Image */}
          <div className="h-80 bg-slate-900 rounded-xl relative overflow-hidden group">
            <img 
              src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop" 
              alt="Heat map visualization" 
              className="w-full h-full object-cover brightness-[0.3] group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-transparent flex flex-col justify-end p-8">
              <h3 className="text-2xl font-bold text-white mb-2 font-headline">Regional Heatmap</h3>
              <p className="text-white/80 text-sm max-w-md">Visualizing teacher-to-student ratio voids across the archipelago. Red zones indicate a capacity gap exceeding 40%.</p>
              <div className="flex gap-4 mt-4">
                <div className="flex items-center gap-2 text-[10px] text-white font-bold uppercase tracking-widest">
                  <div className="w-2 h-2 rounded-full bg-error"></div> High Risk
                </div>
                <div className="flex items-center gap-2 text-[10px] text-white font-bold uppercase tracking-widest">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div> Training Gap
                </div>
              </div>
            </div>
            <button className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-lg text-white hover:bg-white/40 transition-colors">
              <span className="material-symbols-outlined">fullscreen</span>
            </button>
          </div>

          {/* Highlights: Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 transition-all hover:bg-slate-50 border border-slate-100 shadow-sm">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">Out-of-Field Score</p>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-4xl font-black text-primary">{metrics.outOfField.value}%</span>
                <span className="text-error text-xs font-bold flex items-center mb-1">
                  <span className="material-symbols-outlined text-sm">trending_up</span> {metrics.outOfField.trend}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-error rounded-full" style={{ width: `${metrics.outOfField.value}%` }}></div>
              </div>
              <p className="mt-3 text-[10px] text-slate-500 leading-tight">Teachers working outside their primary specialization.</p>
            </div>

            <div className="bg-white rounded-xl p-6 transition-all hover:bg-slate-50 border border-slate-100 shadow-sm">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">Training Drought Index</p>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-4xl font-black text-primary">{metrics.trainingDrought.value}</span>
                <span className="text-amber-500 text-xs font-bold flex items-center mb-1">
                  <span className="material-symbols-outlined text-sm">warning</span> {metrics.trainingDrought.status}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(metrics.trainingDrought.value / 10) * 100}%` }}></div>
              </div>
              <p className="mt-3 text-[10px] text-slate-500 leading-tight">Average years since last specialized training intervention.</p>
            </div>

            <div className="bg-white rounded-xl p-6 transition-all hover:bg-slate-50 border border-slate-100 shadow-sm">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">Experience Void</p>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-4xl font-black text-primary">{metrics.experienceVoid.value}%</span>
                <span className="text-secondary text-xs font-bold flex items-center mb-1">
                  <span className="material-symbols-outlined text-sm">info</span> {metrics.experienceVoid.status}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-secondary rounded-full" style={{ width: `${metrics.experienceVoid.value}%` }}></div>
              </div>
              <p className="mt-3 text-[10px] text-slate-500 leading-tight">Proportion of faculty with less than 3 years of experience.</p>
            </div>
          </div>
        </div>

        {/* Detailed Capacity Gap List */}
        <div className="col-span-12 mt-4">
          <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200">
            <div className="p-6 flex justify-between items-center bg-slate-50 border-b border-slate-200">
              <h3 className="font-headline font-bold text-lg text-primary">Detailed Capacity-Gapped Regions</h3>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 text-xs font-bold bg-white rounded-lg shadow-sm border border-slate-200 text-primary">All Regions</button>
                <button className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-primary transition-colors">High Priority</button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] text-slate-500 font-bold uppercase tracking-widest border-b border-slate-200 bg-white">
                    <th className="px-8 py-4">Province / Municipality</th>
                    <th className="px-8 py-4 text-center">Teacher Shortage</th>
                    <th className="px-8 py-4 text-center">Spec. Misalignment</th>
                    <th className="px-8 py-4 text-center">Infrastr. Rank</th>
                    <th className="px-8 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {detailedRegions.map((region, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors bg-white">
                      <td className="px-8 py-6">
                        <p className="font-bold text-primary">{region.city}</p>
                        <p className="text-xs text-slate-500">{region.location}</p>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className={`font-black ${region.rank === 1 ? 'text-error' : region.rank === 2 ? 'text-amber-500' : 'text-secondary'}`}>
                          {region.shortage}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="text-primary font-medium">{region.misalignment}</span>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className="flex justify-center gap-1">
                          <div className={`w-4 h-1.5 rounded-full ${region.rank === 1 ? 'bg-error' : region.rank === 2 ? 'bg-amber-500' : 'bg-secondary'}`}></div>
                          <div className={`w-4 h-1.5 rounded-full ${region.rank === 1 || region.rank === 2 ? (region.rank === 1 ? 'bg-slate-200' : 'bg-amber-500') : 'bg-slate-200'}`}></div>
                          <div className="w-4 h-1.5 rounded-full bg-slate-200"></div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className={`px-3 py-1 text-[10px] font-bold rounded-full ${region.actionClass}`}>
                          {region.action}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}