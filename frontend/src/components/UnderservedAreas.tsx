import React, { useState, useEffect } from 'react';
import AdminMap from './ui/AdminMap'; // Make sure this path matches your folder structure!

// --- MOCK DATA (Ready for Backend Replacement) ---
const MOCK_STATS = {
  riskIndex: { value: "4.2", trend: "+0.3" },
  personnel: { value: "142,804", progress: 88 },
  shortage: { value: "12,400" }
};

const MOCK_PRIORITY_QUEUE = [
  { rank: "01", name: "Basilan Division", labels: ["High Out-of-Field", "Severe Drought"], score: "9.8", isCritical: true },
  { rank: "02", name: "Sulu Division", labels: ["Limited Training Availability"], score: "9.2", isCritical: false },
  { rank: "03", name: "Agusan del Sur", labels: ["Critical STEM Misalignment"], score: "8.8", isCritical: false },
  { rank: "04", name: "Lanao del Norte", labels: ["High Attrition Forecast"], score: "8.5", isCritical: false },
  { rank: "05", name: "Abra Division", labels: ["Infrastructure Gap Index"], score: "8.1", isCritical: false }
];

const MOCK_PREDICTIONS = [
  { 
    region: "Region IX (Zamboanga)", status: "Critical Shortage Trend", icon: "trending_down", gap: "-2,450 units", 
    formula: "Attrition Rate (4.2%) > Recruitment Rate (1.1%)", barWidth: "75%", colorClass: "bg-error", textClass: "text-error" 
  },
  { 
    region: "NCR (Metro Manila)", status: "Optimal Surplus", icon: "trending_up", gap: "+1,120 units", 
    formula: "Strategic Asset: Target for cross-regional deployment", barWidth: "100%", colorClass: "bg-secondary", textClass: "text-secondary" 
  },
  { 
    region: "Region IV-A", status: "Equilibrium State", icon: "drag_handle", gap: "±45 units", 
    formula: "Stability maintained via strong local university pipelines", barWidth: "50%", colorClass: "bg-yellow-500", textClass: "text-slate-500" 
  }
];

export default function UnderservedAreas() {
  // State initialization for future backend data
  const [stats, setStats] = useState(MOCK_STATS);
  const [priorityQueue, setPriorityQueue] = useState(MOCK_PRIORITY_QUEUE);
  const [predictions, setPredictions] = useState(MOCK_PREDICTIONS);
  const [loading, setLoading] = useState(false);

  /* // TODO: Uncomment when backend API is ready
  useEffect(() => {
    async function fetchUnderservedData() {
      setLoading(true);
      try {
        const response = await api.getUnderservedAreas(); // Replace with your actual API call
        setStats(response.stats);
        setPriorityQueue(response.priorityQueue);
        setPredictions(response.predictions);
      } catch (error) {
        console.error("Error fetching map data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchUnderservedData();
  }, []);
  */

  if (loading) {
    return <div className="flex h-screen items-center justify-center font-bold text-primary">Loading Regional Data...</div>;
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto w-full space-y-8">
      
      {/* 1. Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Instructional Risk Index</p>
          <h3 className="text-3xl font-extrabold text-primary">
            {stats.riskIndex.value} <span className="text-sm font-medium text-error ml-1">{stats.riskIndex.trend}</span>
          </h3>
          <p className="text-[10px] text-slate-400 mt-2 italic">National Average Score (Scale 1-10)</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Active Personnel</p>
          <h3 className="text-3xl font-extrabold text-primary">{stats.personnel.value}</h3>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4">
            <div className="bg-secondary h-full rounded-full" style={{ width: `${stats.personnel.progress}%` }}></div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Predicted Shortage</p>
          <h3 className="text-3xl font-extrabold text-error">{stats.shortage.value}</h3>
          <p className="text-[10px] text-slate-400 mt-2 font-medium">Aggregated across 17 Regions (Q3 Projection)</p>
        </div>
      </div>

      {/* 2. Primary Map & Sidebar Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Map Container */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col relative overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="font-extrabold text-primary uppercase tracking-tight">Interactive Instructional Risk Map</h3>
              <p className="text-xs text-slate-500">Real-time geographic risk analysis & underserved area forecasting</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Map Layers</span>
              <button className="p-1.5 rounded bg-white border border-slate-200 text-slate-400 hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-sm">layers</span>
              </button>
            </div>
          </div>
          
          {/* Replaced static HTML SVG with your actual React Leaflet Map! */}
          <div className="w-full bg-slate-950">
            <AdminMap /> 
          </div>
        </div>

        {/* Uplift Priority Queue Sidebar */}
        <div className="lg:col-span-4 flex flex-col space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col flex-1">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-extrabold text-primary uppercase tracking-tight">Uplift Priority Queue</h3>
              <span className="material-symbols-outlined text-slate-400">priority_high</span>
            </div>
            <div className="p-5 flex-1">
              <p className="text-xs text-slate-500 mb-6 font-medium leading-relaxed">
                  Top 5 Divisions requiring immediate intervention based on the 
                  <span className="text-primary font-bold"> Out-of-Field Metric</span> and 
                  <span className="text-primary font-bold"> Training Drought Index</span>.
              </p>
              
              <div className="space-y-4">
                {priorityQueue.map((item, index) => (
                  <div key={index} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${item.isCritical ? 'border-error/20 bg-error/5 group' : 'border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200 cursor-default'}`}>
                    <div className={`text-xl font-black italic ${item.isCritical ? 'text-error' : 'text-slate-300'}`}>{item.rank}</div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-900">{item.name}</h4>
                      {item.isCritical ? (
                        <div className="flex gap-2 mt-1">
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
                ))}
              </div>

              <button className="w-full mt-8 py-2.5 text-xs font-bold text-primary border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors uppercase tracking-widest">
                  Full Risk Rankings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Predictive Analysis Layer */}
      <div className="bg-slate-50 p-8 border-y border-slate-200 mt-8 rounded-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h3 className="text-xl font-extrabold text-primary font-headline">Predictive Analysis: Workforce Dynamics</h3>
            <p className="text-sm text-slate-500">24-month regional forecasting model based on attrition, recruitment, and graduation pipelines</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
              <span className="w-3 h-3 rounded bg-secondary"></span>
              <span className="text-[10px] font-bold text-slate-600 uppercase">Surplus</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
              <span className="w-3 h-3 rounded bg-error"></span>
              <span className="text-[10px] font-bold text-slate-600 uppercase">Shortage</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {predictions.map((pred, index) => (
            <div key={index} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className={`absolute top-0 left-0 w-1 h-full ${pred.colorClass}`}></div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-extrabold text-primary">{pred.region}</h4>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${pred.textClass}`}>{pred.status}</p>
                </div>
                <span className={`material-symbols-outlined ${pred.textClass}`}>{pred.icon}</span>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">Estimated Status (2025):</span>
                  <span className={`font-bold ${pred.textClass}`}>{pred.gap}</span>
                </div>
                <div className="relative pt-1">
                  <div className="flex items-center justify-between">
                    <div className="text-[9px] font-bold text-slate-400">DEMAND</div>
                    <div className="text-[9px] font-bold text-slate-400">SUPPLY</div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-slate-100 mt-1">
                    <div className={`${pred.colorClass} rounded-r shadow-none flex flex-col`} style={{ width: pred.barWidth }}></div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed italic">{pred.formula}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Footer Action */}
      <div className="pt-4 flex justify-end">
        <button className="bg-slate-900 text-white font-bold px-8 py-3 rounded-lg hover:bg-slate-800 transition-all flex items-center gap-3 shadow-xl">
          <span className="material-symbols-outlined">picture_as_pdf</span>
          Download Executive Geographic Risk Report
        </button>
      </div>

    </div>
  );
}