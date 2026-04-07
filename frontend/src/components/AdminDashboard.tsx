import { useState, useEffect } from 'react';
import { api } from '../services/api';

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

interface BackendDashboardResponse {
  generated_at?: string;
  total_regions?: number;
  critical_regions?: number;
  shortage_regions?: number;
  top_uplift_priorities?: Array<{
    region?: string;
    priority_score?: number;
    metrics_flagged_count?: number;
    color_code?: string;
    rank?: number;
  }>;
}

interface BackendUnderservedResponse {
  count?: number;
  items?: Array<{
    region?: string;
    priority_score?: number;
    metrics_flagged_count?: number;
    color_code?: string;
    rank?: number;
  }>;
}

const getColorClass = (colorCode?: string) => {
  if (colorCode === 'red') return 'bg-error';
  if (colorCode === 'orange') return 'bg-amber-500';
  if (colorCode === 'yellow') return 'bg-yellow-400';
  return 'bg-sky-500';
};

const getActionStyle = (colorCode?: string) => {
  if (colorCode === 'red') {
    return { action: 'Immediate Intervention', actionClass: 'bg-error/10 text-error' };
  }
  if (colorCode === 'orange') {
    return { action: 'High Priority', actionClass: 'bg-amber-100 text-amber-700' };
  }
  if (colorCode === 'yellow') {
    return { action: 'Monitor Closely', actionClass: 'bg-yellow-100 text-yellow-700' };
  }
  return { action: 'Stable', actionClass: 'bg-sky-100 text-sky-700' };
};

export default function AdminDashboard() {
  // --- CORE DATA STATE ---
  const [priorityData, setPriorityData] = useState<PriorityItem[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapRegion[]>([]); 
  const [detailedRegions, setDetailedRegions] = useState<DetailedRegion[]>([]);
  const [metrics, setMetrics] = useState<MetricsData>({
    outOfField: { value: 0, trend: "-" },
    trainingDrought: { value: 0, status: "-" },
    experienceVoid: { value: 0, status: "-" }
  });
  
  // --- UI & FUNCTIONAL STATES ---
  const [loading, setLoading] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  // Filter & Sort States
  const [prioritySort, setPrioritySort] = useState<'desc' | 'asc'>('desc');
  const [regionFilter, setRegionFilter] = useState<'all' | 'high_priority'>('all');

  // --- ACTUAL BACKEND FETCH LOGIC ---
  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [dashboardRaw, underservedRaw] = await Promise.all([
          api.getAdminDashboard(),
          api.getUnderservedAreas(),
        ]);

        if (dashboardRaw?.detail) {
          throw new Error(typeof dashboardRaw.detail === 'string' ? dashboardRaw.detail : 'Failed to fetch dashboard data');
        }

        const dashboard = (dashboardRaw ?? {}) as BackendDashboardResponse;
        const underserved = (underservedRaw ?? {}) as BackendUnderservedResponse;

        const prioritiesSource = Array.isArray(dashboard.top_uplift_priorities)
          ? dashboard.top_uplift_priorities
          : [];

        const priorities: PriorityItem[] = prioritiesSource.map((item, index) => {
          const colorCode = item.color_code;
          return {
            province: item.region || 'Unknown Region',
            region: item.region || 'Unknown Region',
            score: Number(item.priority_score ?? 0),
            rank: String(item.rank ?? index + 1).padStart(2, '0'),
            isCritical: colorCode === 'red' || colorCode === 'orange',
          };
        });

        const maxPriorityScore = Math.max(1, ...prioritiesSource.map((item) => Number(item.priority_score ?? 0)));
        const heatmap: HeatmapRegion[] = prioritiesSource.slice(0, 5).map((item, index) => {
          const score = Number(item.priority_score ?? 0);
          return {
            regionId: `${item.region || 'region'}-${index}`,
            name: item.region || 'Unknown Region',
            gap: `${score.toFixed(1)} pts`,
            intensity: getColorClass(item.color_code),
            percentage: `${Math.max(8, Math.round((score / maxPriorityScore) * 100))}%`,
          };
        });

        const underservedItems = Array.isArray(underserved.items) ? underserved.items : prioritiesSource;
        const detailed: DetailedRegion[] = underservedItems.map((item, index) => {
          const { action, actionClass } = getActionStyle(item.color_code);
          return {
            city: item.region || 'Unknown Region',
            location: 'Region',
            shortage: `${Number(item.priority_score ?? 0).toFixed(1)} pts`,
            misalignment: `${Number(item.metrics_flagged_count ?? 0)} flagged metrics`,
            rank: Number(item.rank ?? index + 1),
            action,
            actionClass,
          };
        });

        const totalRegions = Math.max(1, Number(dashboard.total_regions ?? 0));
        const criticalRegions = Number(dashboard.critical_regions ?? 0);
        const shortageRegions = Number(dashboard.shortage_regions ?? 0);
        const avgFlagged = prioritiesSource.length
          ? prioritiesSource.reduce((sum, item) => sum + Number(item.metrics_flagged_count ?? 0), 0) / prioritiesSource.length
          : 0;

        const nextMetrics: MetricsData = {
          outOfField: {
            value: Math.round((criticalRegions / totalRegions) * 100),
            trend: criticalRegions > 0 ? `${criticalRegions} critical` : '-',
          },
          trainingDrought: {
            value: Number(avgFlagged.toFixed(1)),
            status: avgFlagged >= 3 ? 'Elevated' : avgFlagged > 0 ? 'Moderate' : '-',
          },
          experienceVoid: {
            value: Math.round((shortageRegions / totalRegions) * 100),
            status: shortageRegions > 0 ? `${shortageRegions} shortage regions` : '-',
          },
        };

        setPriorityData(priorities);
        setMetrics(nextMetrics);
        setDetailedRegions(detailed);
        setHeatmapData(heatmap);
        
        // Update the Last Sync Time when data successfully arrives
        setLastSyncTime(dashboard.generated_at ? new Date(dashboard.generated_at) : new Date());

      } catch (error) {
        console.error("Dashboard API Error:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadDashboardData();
    
    // Auto-refresh data every 5 minutes (300,000 ms) to keep the dashboard live
    const interval = setInterval(loadDashboardData, 300000);
    return () => clearInterval(interval);
  }, []);

  // --- DERIVED LOGIC & FILTERS ---

  // 1. Dynamic Header Badge
  const needsCriticalAnalysis = priorityData.some(p => p.isCritical) || metrics.trainingDrought.value > 10;

  // 2. Priority Rank Sorter
  const togglePrioritySort = () => {
    setPrioritySort(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  const sortedPriorityData = [...priorityData].sort((a, b) => {
    return prioritySort === 'desc' ? b.score - a.score : a.score - b.score;
  });

  // 3. Detailed Regions Filter
  const filteredDetailedRegions = detailedRegions.filter(region => {
    if (regionFilter === 'all') return true;
    // Assumes rank 1 represents 'High Priority'. Adjust based on your DB logic.
    if (regionFilter === 'high_priority') return region.rank === 1; 
    return true;
  });

  // Helper for formatting the sync time
  const formatTime = (date: Date | null) => {
    if (!date) return "Syncing...";
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (loading && !lastSyncTime) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-primary bg-slate-50/50">
        <span className="material-symbols-outlined text-4xl mb-4 animate-spin">refresh</span>
        <div className="font-bold tracking-widest uppercase text-sm">Loading Dashboard Analytics...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto w-full space-y-8 relative">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            {needsCriticalAnalysis ? (
              <span className="px-2 py-0.5 bg-error-container text-on-error-container text-[10px] font-bold rounded-full uppercase tracking-wider shadow-sm transition-all">
                Critical Analysis Required
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full uppercase tracking-wider shadow-sm transition-all">
                System Stable
              </span>
            )}
          </div>
          <h2 className="text-4xl font-extrabold text-primary tracking-tight mb-4 font-headline">Admin Dashboard</h2>
          <p className="text-slate-500 leading-relaxed">
            Detailed capacity-gap analysis for educational coverage. Metrics identify regions where instructional quality is compromised by teacher shortages and lack of professional development.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-surface-container-lowest px-4 py-3 rounded-xl border border-slate-200 shadow-sm flex flex-col items-end">
            <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Last Data Sync</span>
            <span className="text-primary font-headline font-bold flex items-center gap-2">
              {formatTime(lastSyncTime)} 
              {loading ? (
                <span className="material-symbols-outlined text-[14px] animate-spin text-blue-500">refresh</span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.5)]"></span>
              )}
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
            <button 
              onClick={togglePrioritySort}
              title={`Sort ${prioritySort === 'desc' ? 'Ascending' : 'Descending'}`}
              className="text-slate-400 hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-slate-100 border border-transparent hover:border-slate-200 flex items-center"
            >
              <span className="material-symbols-outlined text-sm">
                {prioritySort === 'desc' ? 'arrow_downward' : 'arrow_upward'}
              </span>
            </button>
          </div>
          
          <div className="space-y-4 flex-1">
            {sortedPriorityData.length > 0 ? (
              sortedPriorityData.map((item, index) => (
                <div 
                  key={index} 
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-sm ${item.isCritical ? 'bg-red-50/50 border-error border-l-4 rounded-l-none' : 'bg-slate-50 border-slate-100 hover:bg-white hover:border-slate-300'}`}
                >
                  <span className={`text-2xl font-black italic ${item.isCritical ? 'text-error opacity-40' : 'text-slate-300'}`}>
                    {index + 1 < 10 ? `0${index + 1}` : index + 1}
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
                <button 
                  onClick={() => setRegionFilter('all')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors border ${
                    regionFilter === 'all' 
                      ? 'bg-white shadow-sm border-slate-200 text-primary' 
                      : 'text-slate-500 hover:text-primary hover:bg-slate-100 border-transparent'
                  }`}
                >
                  All Regions
                </button>
                <button 
                  onClick={() => setRegionFilter('high_priority')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors border ${
                    regionFilter === 'high_priority' 
                      ? 'bg-white shadow-sm border-slate-200 text-primary' 
                      : 'text-slate-500 hover:text-primary hover:bg-slate-100 border-transparent'
                  }`}
                >
                  High Priority
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              {filteredDetailedRegions.length > 0 ? (
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
                    {filteredDetailedRegions.map((region, idx) => (
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
                  <span className="text-xs font-bold">No regions match the current filter.</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}