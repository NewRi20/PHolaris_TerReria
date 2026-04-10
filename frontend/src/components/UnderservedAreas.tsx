import { useState, useEffect } from 'react';
import AdminMap, { type RegionRiskData } from './ui/AdminMap';
import { api } from '../services/api';
 

// --- TYPES (Ready for Backend Integration) ---
interface StatsData {
  riskIndex: { value: string; trend: string };
  personnel: { value: string; progress: number };
  shortage: { value: string };
}

interface PriorityItem {
  rank: string;
  name: string;
  labels: string[];
  score: string;
  isCritical: boolean;
}

interface PredictionItem {
  region: string;
  status: string;
  icon: string;
  gap: string;
  formula: string;
  barWidth: string;
  colorClass: string;
  textClass: string;
}

interface BackendPriorityItem {
  rank?: number;
  region?: string;
  priority_score?: number;
  metrics_flagged_count?: number;
}

interface BackendMapRegion {
  region?: string;
  metrics_flagged_count?: number;
  teacher_count?: number;
  color_code?: string;
}

interface BackendRegionDetail {
  region?: string;
  metrics?: {
    color_code?: string;
    regional_readiness_score?: number | null;
  };
}

interface BackendEventsByRegion {
  region?: string;
  events?: unknown[];
}

interface BackendPredictiveWorkforce {
  region: string;
  current_teacher_count: number;
  projected_hires: number;
  projected_retirements: number;
  projected_teacher_demand: number;
  workforce_projection: number;
  projected_shortage: number;
  status: "shortage" | "surplus";
}

const normalizeRegionKey = (value?: string) =>
  String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();

const canonicalRegionKey = (value?: string) => {
  const text = normalizeRegionKey(value);
  if (!text) return "";

  if (text.includes("NCR") || text.includes("NATIONAL CAPITAL")) return "NCR";
  if (text === "CAR" || text.includes("CORDILLERA")) return "CAR";
  if (text.includes("REGION IV A") || text.includes("REGION 4A") || text.includes("R4A") || text.includes("CALABARZON") || text.includes("REGION IV-A")) return "CALABARZON";
  if (text.includes("REGION IV B") || text.includes("REGION 4B") || text.includes("R4B") || text.includes("MIMAROPA")) return "MIMAROPA";
  if (text.includes("REGION XIII") || text.includes("REGION 13") || text.includes("CARAGA")) return "CARAGA";
  if (text.includes("REGION XII") || text.includes("REGION 12") || text.includes("SOCCSKSARGEN")) return "SOCCSKSARGEN";
  if (text.includes("REGION XI") || text.includes("REGION 11") || text.includes("DAVAO")) return "DAVAO";
  if (text.includes("REGION X") || text.includes("REGION 10") || text.includes("NORTHERN MINDANAO")) return "NORTHERN MINDANAO";
  if (text.includes("REGION IX") || text.includes("REGION 9") || text.includes("ZAMBOANGA PENINSULA")) return "ZAMBOANGA PENINSULA";
  if (text.includes("REGION VIII") || text.includes("REGION 8") || text.includes("EASTERN VISAYAS")) return "EASTERN VISAYAS";
  if (text.includes("REGION VII") || text.includes("REGION 7") || text.includes("CENTRAL VISAYAS")) return "CENTRAL VISAYAS";
  if (text.includes("REGION VI") || text.includes("REGION 6") || text.includes("WESTERN VISAYAS")) return "WESTERN VISAYAS";
  if (text.includes("REGION V") || text.includes("REGION 5") || text.includes("BICOL")) return "BICOL";
  if (text.includes("REGION III") || text.includes("REGION 3") || text.includes("CENTRAL LUZON")) return "CENTRAL LUZON";
  if (text.includes("REGION II") || text.includes("REGION 2") || text.includes("CAGAYAN VALLEY")) return "CAGAYAN VALLEY";
  if (text.includes("REGION I") || text.includes("REGION 1") || text.includes("ILOCOS")) return "ILOCOS";
  if (text.includes("BARMM") || text.includes("AUTONOMOUS REGION IN MUSLIM MINDANAO") || text.includes("ARMM")) return "BARMM";

  return text;
};

const displayRegionLabel = (key: string, fallback?: string) => {
  const labels: Record<string, string> = {
    NCR: 'National Capital Region',
    CAR: 'Cordillera Administrative Region',
    ILOCOS: 'Ilocos Region',
    'CAGAYAN VALLEY': 'Cagayan Valley',
    'CENTRAL LUZON': 'Central Luzon',
    CALABARZON: 'CALABARZON',
    MIMAROPA: 'MIMAROPA',
    BICOL: 'Bicol Region',
    'WESTERN VISAYAS': 'Western Visayas',
    'CENTRAL VISAYAS': 'Central Visayas',
    'EASTERN VISAYAS': 'Eastern Visayas',
    'ZAMBOANGA PENINSULA': 'Zamboanga Peninsula',
    'NORTHERN MINDANAO': 'Northern Mindanao',
    DAVAO: 'Davao Region',
    SOCCSKSARGEN: 'SOCCSKSARGEN',
    CARAGA: 'Caraga',
    BARMM: 'BARMM',
  };
  return labels[key] ?? fallback ?? key;
};

export default function UnderservedAreas() {
  // --- STATE (Initialized empty for backend) ---
  const [stats, setStats] = useState<StatsData>({
    riskIndex: { value: "-", trend: "" },
    personnel: { value: "-", progress: 0 },
    shortage: { value: "-" }
  });
  
  const [priorityQueue, setPriorityQueue] = useState<PriorityItem[]>([]);
  const [fullRankings, setFullRankings] = useState<PriorityItem[]>([]); 
  const [predictions, setPredictions] = useState<PredictionItem[]>([]);
  
  // THE FIX: Added state to catch the map risk data from the backend
  const [mapData, setMapData] = useState<RegionRiskData[]>([]);
  
  // UI & Interactive States
  const [loading, setLoading] = useState(true); 
  const [isRankingsModalOpen, setIsRankingsModalOpen] = useState(false);
  const [toast, setToast] = useState({ visible: false, title: '', msg: '', type: 'info' });

  // --- ACTUAL BACKEND FETCH LOGIC ---
  useEffect(() => {
    async function fetchUnderservedData() {
      setLoading(true);
      try {
        const [underservedResult, mapRegionsResult, eventsByRegionResult, predictiveResult] = await Promise.allSettled([
          api.getUnderservedAreas(50),
          api.getMapRegions(),
          api.getMapEventsByRegion(),
          api.getPredictiveWorkforce(),
        ]);

        const underservedResponse = underservedResult.status === 'fulfilled'
          ? underservedResult.value
          : { items: [] };
        const mapRegionsResponse = mapRegionsResult.status === 'fulfilled'
          ? mapRegionsResult.value
          : [];
        const eventsByRegionResponse = eventsByRegionResult.status === 'fulfilled'
          ? eventsByRegionResult.value
          : [];
        const predictiveResponse = predictiveResult.status === 'fulfilled'
          ? predictiveResult.value
          : [];

        const priorities = Array.isArray((underservedResponse as { items?: unknown[] })?.items)
          ? ((underservedResponse as { items?: unknown[] }).items as BackendPriorityItem[])
          : [];

        const aggregatedPriorities = new Map<string, { name: string; flags: number; score: number }>();
        priorities.forEach((item) => {
          const key = canonicalRegionKey(item.region);
          if (!key) return;

          const flags = Number(item.metrics_flagged_count ?? 0);
          const score = Number(item.priority_score ?? 0);
          const existing = aggregatedPriorities.get(key);

          if (!existing) {
            aggregatedPriorities.set(key, {
              name: displayRegionLabel(key, String(item.region ?? key)),
              flags,
              score,
            });
            return;
          }

          aggregatedPriorities.set(key, {
            name: existing.name,
            flags: Math.max(existing.flags, flags),
            score: Math.max(existing.score, score),
          });
        });

        const mappedRankings: PriorityItem[] = Array.from(aggregatedPriorities.values())
          .sort((left, right) => right.score - left.score)
          .map((item, index) => ({
            rank: `#${index + 1}`,
            name: item.name,
            labels: [
              `${item.flags} flagged metric${item.flags === 1 ? '' : 's'}`,
              item.flags >= 3 ? 'High Intervention Need' : 'Monitoring',
            ],
            score: item.score.toFixed(2),
            isCritical: item.flags >= 3,
          }));

        const queueFlagsByRegion = new Map<string, number>();
        priorities.forEach((item) => {
          const key = canonicalRegionKey(item.region);
          if (!key) return;
          queueFlagsByRegion.set(key, Number(item.metrics_flagged_count ?? 0));
        });

        const mapRows = Array.isArray(mapRegionsResponse)
          ? (mapRegionsResponse as BackendMapRegion[])
          : [];

        const eventsByRegionRows = Array.isArray(eventsByRegionResponse)
          ? (eventsByRegionResponse as BackendEventsByRegion[])
          : [];

        const detailResults = await Promise.allSettled(
          mapRows
            .map((row) => row.region)
            .filter((region): region is string => Boolean(region))
            .map((region) => api.getMapRegionDetail(region))
        );

        const detailsByRegion = new Map<string, BackendRegionDetail>();
        detailResults.forEach((result) => {
          if (result.status !== 'fulfilled') return;
          const detail = result.value as BackendRegionDetail;
          if (!detail.region) return;
          detailsByRegion.set(canonicalRegionKey(detail.region), detail);
        });

        const eventsByRegionCount = new Map<string, number>();
        eventsByRegionRows.forEach((row) => {
          const region = canonicalRegionKey(row.region);
          if (!region) return;
          const count = Array.isArray(row.events) ? row.events.length : 0;
          eventsByRegionCount.set(region, count);
        });

        const colorCodeToFlags = (colorCode?: string) => {
          const normalized = String(colorCode ?? '').toLowerCase();
          if (normalized === 'red') return 5;
          if (normalized === 'orange') return 4;
          if (normalized === 'yellow') return 3;
          if (normalized === 'blue') return 2;
          return 1;
        };

        const mappedMapDataFromRows: RegionRiskData[] = mapRows.map((row) => {
          const regionName = String(row.region ?? 'Unknown Region');
          const regionKey = canonicalRegionKey(regionName);
          const detail = detailsByRegion.get(regionKey);
          const fallbackFromColor = colorCodeToFlags(row.color_code || detail?.metrics?.color_code);
          const mapFlagRaw = row.metrics_flagged_count;
          const mapFlags = typeof mapFlagRaw === 'number' && Number.isFinite(mapFlagRaw)
            ? mapFlagRaw
            : null;
          const queueFlags = queueFlagsByRegion.get(regionKey);
          const baseFlags = mapFlags ?? queueFlags ?? fallbackFromColor;
          const upcomingEvents = Number(eventsByRegionCount.get(regionKey) ?? 0);
          const flags = Math.min(5, Math.max(0, baseFlags + (upcomingEvents > 0 ? 0 : 1)));

          return {
            name: regionName,
            flags,
            needs: flags >= 4
              ? 'Urgent regional intervention needed.'
              : flags >= 2
              ? 'Targeted support and training recommended.'
              : 'No immediate action required.',
          };
        });

        const existingRegionKeys = new Set(mappedMapDataFromRows.map((item) => canonicalRegionKey(item.name)));
        const queueOnlyMapRows: RegionRiskData[] = priorities
          .filter((item) => !existingRegionKeys.has(canonicalRegionKey(item.region)))
          .map((item) => {
            const flags = Math.min(5, Math.max(0, Number(item.metrics_flagged_count ?? 0)));
            return {
              name: String(item.region ?? 'Unknown Region'),
              flags,
              needs: flags >= 4
                ? 'Urgent regional intervention needed.'
                : flags >= 2
                ? 'Targeted support and training recommended.'
                : 'No immediate action required.',
            };
          });

        const mappedMapData: RegionRiskData[] = [...mappedMapDataFromRows, ...queueOnlyMapRows];

        const totalTeachers = mapRows.reduce((sum, row) => sum + Number(row.teacher_count ?? 0), 0);
        const totalFlags = mappedMapData.reduce((sum, row) => sum + Number(row.flags ?? 0), 0);
        const avgRisk = mappedMapData.length > 0 ? totalFlags / mappedMapData.length : 0;
        const criticalCount = mappedMapData.filter((row) => Number(row.flags ?? 0) >= 3).length;

        // For Predicted Shortage, use either critical regions count or total projected shortage
        const predictiveWorkforce = Array.isArray(predictiveResponse)
          ? (predictiveResponse as BackendPredictiveWorkforce[])
          : [];
        const totalProjectedShortage = predictiveWorkforce.reduce((sum, item) => sum + Math.max(0, item.projected_shortage), 0);
        
        // Use critical count if available; otherwise use total projected shortage count
        const displayedShortage = criticalCount > 0 ? criticalCount : (totalProjectedShortage > 0 ? predictiveWorkforce.filter(p => p.projected_shortage > 0).length : 0);

        setStats({
          riskIndex: {
            value: avgRisk > 0 ? avgRisk.toFixed(2) : '-',
            trend: criticalCount > 0 ? `${criticalCount} critical regions` : totalProjectedShortage > 0 ? `${totalProjectedShortage} teacher shortage` : '',
          },
          personnel: {
            value: totalTeachers.toLocaleString(),
            progress: Math.min(100, Math.round((mapRows.length / 17) * 100)),
          },
          shortage: {
            value: `${displayedShortage}`,
          },
        });

        setPriorityQueue(mappedRankings.slice(0, 5));
        setFullRankings(mappedRankings);
        
        // Map predictive workforce data to PredictionItem[]
        const mappedPredictions: PredictionItem[] = predictiveWorkforce.map((item) => {
          const demand = Math.max(0, Number(item.projected_teacher_demand ?? 0));
          const projectedSupply = Math.max(0, Number(item.workforce_projection ?? 0));
          const shortageMagnitude = Math.max(0, Number(item.projected_shortage ?? 0));
          const surplusMagnitude = Math.max(0, projectedSupply - demand);
          const isShortage = item.status === "shortage" || shortageMagnitude > 0;
          const gapMagnitude = isShortage ? shortageMagnitude : surplusMagnitude;
          const barWidth = Math.min(100, Math.round((gapMagnitude / Math.max(1, demand)) * 100));
          
          return {
            region: item.region,
            status: isShortage ? "Shortage Projected" : "Surplus Projected",
            icon: isShortage ? "warning" : "check_circle",
            gap: `${isShortage ? '-' : '+'}${gapMagnitude}`,
            formula: `Demand: ${demand} | Supply: ${projectedSupply} | Hires: ${item.projected_hires} | Retirements: ${item.projected_retirements}`,
            barWidth: `${barWidth}%`,
            colorClass: isShortage ? "bg-red-500" : "bg-green-500",
            textClass: isShortage ? "text-error" : "text-success",
          };
        });

        // Debug logging for troubleshooting
        console.debug('[UnderservedAreas] Data Processing Summary:', {
          mapRowsCount: mapRows.length,
          totalTeachers,
          totalFlags,
          avgRisk: avgRisk.toFixed(2),
          criticalCount,
          predictiveCount: mappedPredictions.length,
          priorityCount: mappedRankings.length,
          regionSampleFlags: mapRows.slice(0, 3).map(r => ({ region: r.region, flags: r.metrics_flagged_count })),
          mapRowsWithoutFlags: mapRows.filter((r) => r.metrics_flagged_count == null).length,
        });
        
        if (totalFlags === 0 && mapRows.length > 0) {
          console.warn('[UnderservedAreas] ⚠ WARNING: No flagged metrics detected across any regions. This may indicate:');
          console.warn('  1. Analytics cache not updated - try refreshing analytics');
          console.warn('  2. Regional readiness scores not calculated yet');
          console.warn('  3. No teacher profile data loaded into system');
        }
        
        setMapData(mappedMapData);
        setPredictions(mappedPredictions);

      } catch (error) {
        console.warn("API Error, using fallback layout.", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUnderservedData();
  }, []);

  // --- ACTION HANDLERS ---

  const showToast = (title: string, msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ visible: true, title, msg, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 4000);
  };

  const handleDownloadReport = () => {
    if (fullRankings.length === 0) {
      showToast('Export Failed', 'No data available to export. Please wait for the backend sync.', 'error');
      return;
    }

    showToast('Generating Report', 'Compiling geographic risk data into CSV...', 'info');

    setTimeout(() => {
      const csvRows = [];
      csvRows.push(['Rank', 'Region/Division', 'Risk Score', 'Critical Status', 'Key Flags']);
      
      fullRankings.forEach(item => {
        csvRows.push([
          item.rank, 
          `"${item.name}"`, 
          item.score, 
          item.isCritical ? 'CRITICAL' : 'MONITORING',
          `"${item.labels.join(' | ')}"`
        ]);
      });

      const csvString = csvRows.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvString], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `Geographic_Risk_Report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      showToast('Download Complete', 'Your report has been downloaded successfully.', 'success');
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-primary bg-slate-50/50">
        <span className="material-symbols-outlined text-4xl mb-4 animate-spin">refresh</span>
        <div className="font-bold tracking-widest uppercase text-sm">Loading Regional Data...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto w-full space-y-8 relative">
      
      {/* --- HEADER SECTION --- */}
      <section className="mb-8">
        <h1 className="text-4xl font-extrabold text-primary font-headline tracking-tight">Underserved Areas Map</h1>
        <p className="text-slate-500 mt-3 max-w-3xl leading-relaxed">
          Monitor regional disparities, analyze instructional risk indices, and visualize forecasting models to prioritize educational interventions across the Philippine archipelago. Data is synced in real-time from the educator database.
        </p>
      </section>

      {/* 1. Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 transition-all hover:shadow-md">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Instructional Risk Index</p>
          <h3 className="text-3xl font-extrabold text-primary flex items-end gap-2">
            {stats.riskIndex.value} 
            {stats.riskIndex.trend && (
              <span className="text-sm font-bold text-error bg-error/10 px-2 py-0.5 rounded-md mb-1">
                {stats.riskIndex.trend}
              </span>
            )}
          </h3>
          <p className="text-[10px] text-slate-400 mt-2 italic">National Average Score (Scale 1-10)</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 transition-all hover:shadow-md">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Active Personnel</p>
          <h3 className="text-3xl font-extrabold text-primary">{stats.personnel.value}</h3>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-secondary h-full rounded-full transition-all duration-1000" style={{ width: `${stats.personnel.progress}%` }}></div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 transition-all hover:shadow-md">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Predicted Shortage</p>
          <h3 className="text-3xl font-extrabold text-error">{stats.shortage.value}</h3>
          <p className="text-[10px] text-slate-400 mt-2 font-medium">Aggregated across 17 Regions (Q3 Projection)</p>
        </div>
      </div>

      {/* 2. Primary Map & Sidebar Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Map Container */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col relative overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
            <div>
              <h3 className="font-extrabold text-primary uppercase tracking-tight">Interactive Instructional Risk Map</h3>
              <p className="text-xs text-slate-500 mt-0.5">Real-time geographic risk analysis & underserved area forecasting</p>
            </div>
          </div>
          
          <div className="w-full min-h-[500px] bg-slate-100 relative z-0">
            {/* THE FIX: mapData is now explicitly passed from the backend into the Map component */}
            <AdminMap data={mapData} /> 
          </div>
        </div>

        {/* Uplift Priority Queue Sidebar */}
        <div className="lg:col-span-4 flex flex-col space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col flex-1">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
              <h3 className="font-extrabold text-primary uppercase tracking-tight">Uplift Priority Queue</h3>
              <span className="material-symbols-outlined text-slate-400">priority_high</span>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <p className="text-xs text-slate-500 mb-6 font-medium leading-relaxed">
                  Top Divisions requiring immediate intervention based on the 
                  <span className="text-primary font-bold"> Out-of-Field Metric</span> and 
                  <span className="text-primary font-bold"> Training Drought Index</span>.
              </p>
              
              <div className="space-y-4">
                {priorityQueue.length > 0 ? (
                  priorityQueue.map((item, index) => (
                    <div key={index} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${item.isCritical ? 'border-error/30 bg-error/5 group hover:bg-error/10 hover:border-error/50 cursor-pointer' : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 hover:shadow-sm cursor-pointer'}`}>
                      <div className={`text-xl font-black italic ${item.isCritical ? 'text-error' : 'text-slate-300'}`}>{item.rank}</div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-slate-900">{item.name}</h4>
                        {item.isCritical ? (
                          <div className="flex gap-2 mt-1 flex-wrap">
                            {item.labels.map((label, idx) => (
                              <span key={idx} className="text-[9px] font-bold text-error uppercase bg-error/10 px-1.5 py-0.5 rounded">{label}</span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-500 uppercase font-medium mt-1">{item.labels[0]}</p>
                        )}
                      </div>
                      <div className={`text-right text-xs font-black ${item.isCritical ? 'text-error' : 'text-primary'}`}>{item.score}</div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                    <span className="material-symbols-outlined text-slate-300 text-3xl mb-2">inbox</span>
                    <p className="text-xs font-bold text-slate-500">Awaiting queue data...</p>
                  </div>
                )}
              </div>

              {/* Button to Open Rankings Modal */}
              <div className="mt-auto pt-8">
                <button 
                  onClick={() => setIsRankingsModalOpen(true)}
                  className="w-full py-3.5 text-xs font-bold text-primary bg-primary/5 border border-primary/20 rounded-xl hover:bg-primary/10 hover:border-primary/40 transition-all uppercase tracking-widest focus:ring-4 focus:ring-primary/10"
                >
                    Full Risk Rankings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Predictive Analysis Layer */}
      <div className="bg-slate-50 p-8 border border-slate-200 mt-8 rounded-xl shadow-inner">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h3 className="text-xl font-extrabold text-primary font-headline">Predictive Analysis: Workforce Dynamics</h3>
            <p className="text-sm text-slate-500 mt-1">24-month regional forecasting model based on attrition, recruitment, and graduation pipelines</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
              <span className="w-3 h-3 rounded-full bg-secondary shadow-sm"></span>
              <span className="text-[10px] font-bold text-slate-600 uppercase">Surplus</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
              <span className="w-3 h-3 rounded-full bg-error shadow-sm"></span>
              <span className="text-[10px] font-bold text-slate-600 uppercase">Shortage</span>
            </div>
          </div>
        </div>
        
        {predictions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {predictions.map((pred, index) => (
              <div key={index} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className={`absolute top-0 left-0 w-1.5 h-full ${pred.colorClass}`}></div>
                <div className="flex justify-between items-start mb-5 pl-2">
                  <div>
                    <h4 className="font-extrabold text-primary text-lg">{pred.region}</h4>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 bg-slate-50 inline-block px-2 py-0.5 rounded-md ${pred.textClass}`}>{pred.status}</p>
                  </div>
                  <span className={`material-symbols-outlined ${pred.textClass} bg-slate-50 p-1.5 rounded-lg`}>{pred.icon}</span>
                </div>
                <div className="space-y-4 pl-2">
                  <div className="flex justify-between items-end border-b border-slate-100 pb-3">
                    <span className="text-xs text-slate-500 font-medium">Estimated Status (2026):</span>
                    <span className={`text-lg font-black ${pred.textClass}`}>{pred.gap}</span>
                  </div>
                  <div className="relative pt-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-[9px] font-bold text-slate-400 tracking-wider">DEMAND</div>
                      <div className="text-[9px] font-bold text-slate-400 tracking-wider">SUPPLY</div>
                    </div>
                    <div className="overflow-hidden h-2.5 mb-3 text-xs flex rounded-full bg-slate-100">
                      <div className={`${pred.colorClass} rounded-full shadow-none flex flex-col transition-all duration-1000`} style={{ width: pred.barWidth }}></div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed bg-slate-50 p-2 rounded-lg italic border border-slate-100">{pred.formula}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-white">
             <span className="material-symbols-outlined text-4xl mb-3 animate-pulse">query_stats</span>
             <p className="text-sm font-bold">Awaiting predictive models from backend...</p>
          </div>
        )}
      </div>

      {/* 4. Footer Action */}
      <div className="pt-6 flex justify-end">
        <button 
          onClick={handleDownloadReport}
          className="bg-slate-900 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-slate-800 transition-all flex items-center gap-3 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 focus:ring-4 focus:ring-slate-900/20"
        >
          <span className="material-symbols-outlined">picture_as_pdf</span>
          Download Executive Geographic Risk Report (CSV)
        </button>
      </div>

      {/* --- MODALS & NOTIFICATIONS --- */}

      {/* Full Risk Rankings Modal */}
      {isRankingsModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="font-headline font-extrabold text-xl text-primary">Complete Geographic Risk Rankings</h3>
                <p className="text-xs text-slate-500 mt-1">Aggregated scoring based on Out-of-Field and Training Drought indices.</p>
              </div>
              <button onClick={() => setIsRankingsModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-slate-50/50">
              {fullRankings.length > 0 ? (
                <div className="space-y-3">
                  {fullRankings.map((item, index) => (
                    <div key={index} className={`flex items-center gap-5 p-4 rounded-xl border bg-white shadow-sm ${item.isCritical ? 'border-error/30 border-l-4 border-l-error' : 'border-slate-200'}`}>
                      <div className={`text-2xl font-black italic w-8 text-center ${item.isCritical ? 'text-error' : 'text-slate-300'}`}>
                        {item.rank}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-bold text-slate-900">{item.name}</h4>
                        <div className="flex gap-2 mt-1.5 flex-wrap">
                          {item.labels.map((label, idx) => (
                            <span key={idx} className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${item.isCritical ? 'bg-error/10 text-error' : 'bg-slate-100 text-slate-500'}`}>
                              {label}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xl font-black ${item.isCritical ? 'text-error' : 'text-primary'}`}>{item.score}</div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Risk Score</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                  <span className="material-symbols-outlined text-4xl mb-3 animate-spin">refresh</span>
                  <p className="text-sm font-bold">Fetching complete rankings from backend...</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-end">
              <button 
                onClick={() => setIsRankingsModalOpen(false)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors shadow-md"
              >
                Close Rankings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* React Toast Notification System */}
      <div className={`fixed bottom-8 right-8 z-[150] transition-all duration-500 ease-out ${toast.visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95 pointer-events-none'}`}>
        <div className="bg-slate-900 text-white px-6 py-5 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-700">
          <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
            {toast.type === 'success' ? (
               <span className="material-symbols-outlined text-green-400">check_circle</span>
            ) : toast.type === 'error' ? (
               <span className="material-symbols-outlined text-red-400">warning</span>
            ) : (
               <span className="material-symbols-outlined text-blue-400">info</span>
            )}
          </div>
          <div>
            <p className="text-sm font-bold tracking-wide">{toast.title}</p>
            <p className="text-xs text-slate-400 mt-0.5 max-w-xs">{toast.msg}</p>
          </div>
        </div>
      </div>

    </div>
  );
}