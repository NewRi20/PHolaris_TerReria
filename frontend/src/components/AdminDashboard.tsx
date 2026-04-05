import { useState, useEffect } from 'react';

// --- TYPES (Strictly defined for Backend Integration) ---
interface HeatmapRegion {
  regionId: string;
  name: string;
  gap: string;
  intensity: string;
  percentage: string;
}

interface PriorityItem {
  province: string;
  region: string;
  score: number;
  rank: string;
  isCritical: boolean;
}

interface MetricsData {
  outOfField: { value: number; trend: string };
  trainingDrought: { value: number; status: string };
  experienceVoid: { value: number; status: string };
}

interface DetailedRegion {
  city: string;
  location: string;
  shortage: string;
  misalignment: string;
  rank: number;
  action: string;
  actionClass: string;
}

export default function AdminDashboard() {
  // --- STATE (Initialized empty/default for backend) ---
  const [priorityData, setPriorityData] = useState<PriorityItem[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapRegion[]>([]); 
  const [detailedRegions, setDetailedRegions] = useState<DetailedRegion[]>([]);
  const [metrics, setMetrics] = useState<MetricsData>({
    outOfField: { value: 0, trend: "-" },
    trainingDrought: { value: 0, status: "-" },
    experienceVoid: { value: 0, status: "-" }
  });
  
  const [loading, setLoading] = useState(true);

  /* // TODO: Uncomment when ready to connect to backend
  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const data = await api.getDashboardMetrics();
        setPriorityData(data.priorityRanks || []);
        setMetrics(data.metrics || metrics);
        setDetailedRegions(data.detailedRegions || []);
        setHeatmapData(data.heatmapData || []); 
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);
  */

  // TEMPORARY: Simulates an API call so you can see the loading state.
  // Remove this once your backend is connected above.
  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-primary">
        <span className="material-symbols-outlined text-4xl mb-4 animate-spin">refresh</span>
        <div className="font-bold tracking-widest uppercase text-sm">Loading Dashboard Analytics...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-error-container text-on-error-container text-[10px] font-bold rounded-full uppercase tracking-wider shadow-sm">
              Critical Analysis Required
            </span>
          </div>
          <h2 className="text-4xl font-extrabold text-primary tracking-tight mb-4 font-headline">Admin Dashboard</h2>
          <p className="text-slate-500 leading-relaxed">
            Detailed capacity-gap analysis for educational coverage. Metrics identify regions where instructional quality is compromised by teacher shortages and lack of professional development.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-surface-container-lowest px-4 py-3 rounded-xl border border-slate-200 shadow-sm">
            <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Last Data Sync</span>
            <span className="text-primary font-headline font-bold flex items-center gap-2">
              Just now <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </span>
          </div>
        </div>
      </div>

      {/* Bento Grid Content */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Top Critical Provinces (Priority Rank) */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-headline font-bold text-lg text-primary">Priority Rank</h3>
            <button className="text-slate-400 hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-slate-100 border border-transparent hover:border-slate-200">
              <span className="material-symbols-outlined text-sm">filter_list</span>
            </button>
          </div>
          
          <div className="space-y-4 flex-1">
            {priorityData.length > 0 ? (
              priorityData.map((item, index) => (
                <div 
                  key={index} 
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-sm ${item.isCritical ? 'bg-red-50/50 border-error border-l-4 rounded-l-none' : 'bg-slate-50 border-slate-100 hover:bg-white hover:border-slate-300'}`}
                >
                  <span className={`text-2xl font-black italic ${item.isCritical ? 'text-error opacity-40' : 'text-slate-300'}`}>
                    {item.rank}
                  </span>
                  <div className="flex-1">
                    <p className="font-bold text-primary">{item.province}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.region}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-black ${item.isCritical ? 'text-error' : item.rank === "02" || item.rank === "03" ? 'text-secondary' : 'text-slate-500'}`}>
                      {item.score}
                    </p>
                    <p className="text-[9px] text-slate-500 uppercase font-bold mt-0.5">Risk Score</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-10 text-slate-400 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50">
                <span className="material-symbols-outlined text-3xl mb-2">format_list_numbered</span>
                <span className="text-xs font-bold">Awaiting priority data...</span>
              </div>
            )}
          </div>
        </div>

        {/* Heatmap Preview and Quick Metrics */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          
          {/* Map Preview Image with NASA Background */}
          <div className="h-80 bg-[#0a0a0a] rounded-xl relative overflow-hidden shadow-inner border border-slate-800 group">
            <div className="absolute inset-0 bg-[url('https://assets.science.nasa.gov/content/dam/science/esd/eo/images/imagerecords/88000/88643/iss047e099713_lrg.jpg')] bg-cover bg-center bg-no-repeat opacity-40 group-hover:opacity-50 transition-opacity duration-700"></div>            
            
            <div className="absolute inset-0 flex p-8 gap-8 bg-gradient-to-r from-[#0a0a0a]/90 via-[#0a0a0a]/50 to-transparent">
              {/* Left Side: Text & Legend */}
              <div className="flex-1 flex flex-col justify-end max-w-sm z-10">
                <h3 className="text-2xl font-bold text-white mb-2 font-headline">Regional Heatmap</h3>
                <p className="text-white/80 text-sm mb-6 leading-relaxed">Visualizing teacher-to-student ratio voids across the archipelago. Red zones indicate a capacity gap exceeding 40%.</p>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-[10px] text-white font-bold uppercase tracking-widest bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/5">
                    <div className="w-2.5 h-2.5 rounded-full bg-error shadow-[0_0_8px_rgba(220,38,38,0.8)]"></div> High Risk
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-white font-bold uppercase tracking-widest bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/5">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></div> Training Gap
                  </div>
                </div>
              </div>

              {/* Right Side: Data-Driven Heatmap List */}
              <div className="w-64 ml-auto flex flex-col justify-center z-10 hidden sm:flex bg-black/40 p-5 rounded-2xl backdrop-blur-md border border-white/10 shadow-xl">
                <h4 className="text-[10px] text-slate-300 font-bold uppercase tracking-widest mb-4 border-b border-white/10 pb-2">Top Critical Voids</h4>
                
                {heatmapData.length > 0 ? (
                  <div className="space-y-4">
                    {heatmapData.map((region) => (
                      <div key={region.regionId}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-semibold text-white drop-shadow-sm">{region.name}</span>
                          <span className="text-white font-black drop-shadow-sm">{region.gap}</span>
                        </div>
                        <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`${region.intensity} h-1.5 rounded-full transition-all duration-700 ease-out`} 
                            style={{ width: region.percentage }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                    <span className="material-symbols-outlined text-2xl mb-2 animate-pulse">sync</span>
                    <span className="text-xs font-medium">Awaiting backend data...</span>
                  </div>
                )}
              </div>
            </div>

            <button className="absolute top-4 right-4 bg-black/20 backdrop-blur-md p-2 rounded-lg text-white hover:bg-black/40 transition-colors z-20 border border-white/10 shadow-sm">
              <span className="material-symbols-outlined">fullscreen</span>
            </button>
          </div>

          {/* Highlights: Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 transition-all hover:-translate-y-0.5 hover:shadow-md border border-slate-100 shadow-sm cursor-default">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">Out-of-Field Score</p>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-4xl font-black text-primary">{metrics.outOfField.value}%</span>
                {metrics.outOfField.trend !== "-" && (
                  <span className="text-error text-xs font-bold flex items-center mb-1 bg-error/10 px-1.5 py-0.5 rounded-md">
                    <span className="material-symbols-outlined text-sm mr-0.5">trending_up</span> {metrics.outOfField.trend}
                  </span>
                )}
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-error rounded-full transition-all duration-1000" style={{ width: `${metrics.outOfField.value}%` }}></div>
              </div>
              <p className="mt-3 text-[10px] text-slate-500 leading-tight">Teachers working outside their primary specialization.</p>
            </div>

            <div className="bg-white rounded-xl p-6 transition-all hover:-translate-y-0.5 hover:shadow-md border border-slate-100 shadow-sm cursor-default">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">Training Drought Index</p>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-4xl font-black text-primary">{metrics.trainingDrought.value}</span>
                {metrics.trainingDrought.status !== "-" && (
                  <span className="text-amber-600 text-xs font-bold flex items-center mb-1 bg-amber-100 px-1.5 py-0.5 rounded-md">
                    <span className="material-symbols-outlined text-sm mr-0.5">warning</span> {metrics.trainingDrought.status}
                  </span>
                )}
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full transition-all duration-1000" style={{ width: `${(metrics.trainingDrought.value / 10) * 100}%` }}></div>
              </div>
              <p className="mt-3 text-[10px] text-slate-500 leading-tight">Average years since last specialized training intervention.</p>
            </div>

            <div className="bg-white rounded-xl p-6 transition-all hover:-translate-y-0.5 hover:shadow-md border border-slate-100 shadow-sm cursor-default">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">Experience Void</p>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-4xl font-black text-primary">{metrics.experienceVoid.value}%</span>
                {metrics.experienceVoid.status !== "-" && (
                  <span className="text-secondary text-xs font-bold flex items-center mb-1 bg-secondary/10 px-1.5 py-0.5 rounded-md">
                    <span className="material-symbols-outlined text-sm mr-0.5">info</span> {metrics.experienceVoid.status}
                  </span>
                )}
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-secondary rounded-full transition-all duration-1000" style={{ width: `${metrics.experienceVoid.value}%` }}></div>
              </div>
              <p className="mt-3 text-[10px] text-slate-500 leading-tight">Proportion of faculty with less than 3 years of experience.</p>
            </div>
          </div>
        </div>

        {/* Detailed Capacity Gap List */}
        <div className="col-span-12 mt-4">
          <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200">
            <div className="p-6 flex justify-between items-center bg-slate-50/80 border-b border-slate-200">
              <h3 className="font-headline font-bold text-lg text-primary">Detailed Capacity-Gapped Regions</h3>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 text-xs font-bold bg-white rounded-lg shadow-sm border border-slate-200 text-primary hover:bg-slate-50 transition-colors">
                  All Regions
                </button>
                <button className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors border border-transparent">
                  High Priority
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              {detailedRegions.length > 0 ? (
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
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors bg-white">
                        <td className="px-8 py-6">
                          <p className="font-bold text-primary">{region.city}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{region.location}</p>
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
                          <div className="flex justify-center gap-1.5">
                            <div className={`w-4 h-1.5 rounded-full ${region.rank === 1 ? 'bg-error' : region.rank === 2 ? 'bg-amber-500' : 'bg-secondary'}`}></div>
                            <div className={`w-4 h-1.5 rounded-full ${region.rank === 1 || region.rank === 2 ? (region.rank === 1 ? 'bg-slate-200' : 'bg-amber-500') : 'bg-slate-200'}`}></div>
                            <div className="w-4 h-1.5 rounded-full bg-slate-200"></div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <span className={`px-3 py-1.5 text-[10px] font-bold rounded-full border border-transparent ${region.actionClass}`}>
                            {region.action}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-slate-50/50">
                  <span className="material-symbols-outlined text-3xl mb-2">table_rows</span>
                  <span className="text-xs font-bold">Awaiting regional data...</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}