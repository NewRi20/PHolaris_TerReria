import React, { useState, useEffect } from 'react';
import TeacherMap, { type MapEventData } from './ui/TeacherMap'; 

// --- TYPES (Strictly defined for Backend Integration) ---
interface QueueItem {
  id: string;
  rank: string | number;
  name: string;
  region: string;
  detail: string;
  isCritical: boolean;
  score: number;
  icon: string;
}

interface MyActivityItem {
  id: string;
  title: string;
  region: string;
  date: string;
  time: string; 
  type: 'REGISTERED' | 'REQUESTED';
}

interface RecommendationItem {
  id: string;
  timeframe: 'IMMEDIATE' | 'MID_TERM' | 'LONG_TERM';
  timeLabel: string;
  region: string;
  trainingNeeded: string;
  description: string;
  isInterested: boolean;
}

export default function TeacherDashboard() {
  // --- STATES ---
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, title: '', msg: '', type: 'info' });
  
  // Dashboard Data
  const [upliftQueue, setUpliftQueue] = useState<QueueItem[]>([]);
  const [fullReportData, setFullReportData] = useState<QueueItem[]>([]);
  const [myActivities, setMyActivities] = useState<MyActivityItem[]>([]);
  const [mapEvents, setMapEvents] = useState<MapEventData[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);

  // Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // --- ACTUAL BACKEND FETCH LOGIC ---
  useEffect(() => {
    async function fetchTeacherDashboard() {
      setLoading(true);
      try {
        const response = await fetch('/api/teacher/dashboard');
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();

        // 1. Regional Queue Data
        const backendAllRegions: QueueItem[] = data.regionalQueue || [];
        setUpliftQueue(backendAllRegions.slice(0, 5)); // Sidebar gets top 5
        setFullReportData(backendAllRegions);          // Modal gets all

        // 2. Personal Activity & Map Events
        setMyActivities(data.myActivities || []);
        setMapEvents(data.mapEvents || []);
        
        // 3. AI Recommendations
        setRecommendations(data.recommendations || []);

      } catch (error) {
        console.error("Dashboard fetch error:", error);
        showToast('Sync Error', 'Could not load the latest dashboard data from the server.', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchTeacherDashboard();
  }, []);

  // --- HANDLERS ---

  const showToast = (title: string, msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ visible: true, title, msg, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 4000);
  };

  // Triggered by the Map Component
  const handleMapAction = async (actionType: 'register' | 'request', eventData: any) => {
    showToast('Processing', 'Syncing your action with the server...', 'info');

    try {
      // 1. Send the POST request to the backend
      const response = await fetch('/api/teacher/activity', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionType, title: eventData.title, region: eventData.regionName }) 
      });

      if (!response.ok) throw new Error('Failed to register activity');

      // 2. Optimistically update the UI
      const newActivity: MyActivityItem = {
        id: `activity_${Date.now()}`,
        title: eventData.title,
        region: eventData.regionName,
        date: eventData.date && eventData.date !== 'TBA' ? eventData.date : 'Pending Schedule',
        time: actionType === 'register' ? '08:00 AM - 05:00 PM' : '--',
        type: actionType === 'register' ? 'REGISTERED' : 'REQUESTED'
      };

      setMyActivities(prev => [newActivity, ...prev]);
      
      if (actionType === 'register') {
        showToast('Success!', `You are now officially registered for ${eventData.title}.`, 'success');
      } else {
        showToast('Request Sent', `Your training request for ${eventData.regionName} has been logged.`, 'success');
      }
    } catch (error) {
      console.error(error);
      showToast('Error', 'Could not process your request at this time.', 'error');
    }
  };

  // Triggered by the AI Recommendation Section
  const handleToggleInterest = async (rec: RecommendationItem) => {
    const isCurrentlyInterested = rec.isInterested;
    
    try {
      // 1. Send the PATCH request to the backend
      const response = await fetch(`/api/teacher/recommendations/${rec.id}/interest`, { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isInterested: !isCurrentlyInterested }) 
      });

      if (!response.ok) throw new Error('Failed to toggle interest');
      
      // 2. Optimistically update UI states
      setRecommendations(prev => prev.map(r => r.id === rec.id ? { ...r, isInterested: !isCurrentlyInterested } : r));
      
      const activityId = `act_rec_${rec.id}`;

      if (!isCurrentlyInterested) {
        const newActivity: MyActivityItem = {
          id: activityId,
          title: rec.trainingNeeded,
          region: rec.region,
          date: 'Pending Schedule',
          time: '--',
          type: 'REQUESTED'
        };
        setMyActivities(prev => [newActivity, ...prev]);
        showToast('Interest Registered', 'Event added to your requested activities.', 'success');
      } else {
        setMyActivities(prev => prev.filter(a => a.id !== activityId));
        showToast('Interest Withdrawn', 'Event removed from your requested activities.', 'info');
      }
    } catch (error) {
      console.error(error);
      showToast('Error', 'Could not update your interest status.', 'error');
    }
  };

  // Triggered by the "My Activities" Section
  const handleCancelActivity = async (id: string, title: string) => {
    try {
      // 1. Send the DELETE request to the backend
      const response = await fetch(`/api/teacher/activity/${id}`, { method: 'DELETE' });
      
      if (!response.ok) throw new Error('Failed to delete activity');
      
      // 2. Optimistically update UI lists
      setMyActivities(prev => prev.filter(activity => activity.id !== id));
      
      // If generated from AI recommendation, reset the AI toggle button as well
      if (id.startsWith('act_rec_')) {
        const recId = id.replace('act_rec_', '');
        setRecommendations(prev => prev.map(r => r.id === recId ? { ...r, isInterested: false } : r));
      }

      showToast('Activity Cancelled', `You have been removed from "${title}".`, 'info');
    } catch (error) {
      console.error(error);
      showToast('Error', 'Could not cancel your activity.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-primary bg-slate-50/50">
        <span className="material-symbols-outlined text-4xl mb-4 animate-spin">refresh</span>
        <div className="font-bold tracking-widest uppercase text-sm">Loading Your Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-8 p-8 relative">
      
      {/* Header */}
      <div className="flex flex-col gap-2 shrink-0">
        <h1 className="text-3xl font-extrabold text-primary tracking-tight font-headline">Regional Insights & Training</h1>
        <p className="text-slate-500 text-sm max-w-3xl leading-relaxed">
          Explore the interactive map below to discover upcoming professional development events, view teacher density, and formally request training for critical or historically underserved regions.
        </p>
      </div>

      {/* Grid Section for Map and Sidebar */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Main Map Area */}
        <div className="lg:col-span-8 xl:col-span-9 w-full">
          <div className="w-full h-[600px] bg-slate-900 rounded-3xl overflow-hidden shadow-xl border border-slate-800 z-0">
             <TeacherMap data={mapEvents} onEventAction={handleMapAction} />
          </div>
        </div>

        {/* Uplift Priority Queue Sidebar */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col bg-white rounded-3xl p-6 shadow-sm border border-slate-200 overflow-hidden h-[600px]">
          <div className="flex items-center justify-between mb-2 shrink-0">
            <h3 className="text-lg font-bold text-primary flex items-center gap-2 font-headline">
              <span className="material-symbols-outlined text-error">priority_high</span>
              Uplift Priority Queue
            </h3>
          </div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-6 border-b border-slate-100 pb-3">
            Top 5 Critical Regions
          </p>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 no-scrollbar">
            {upliftQueue.length > 0 ? upliftQueue.map((item) => (
              <div 
                key={item.id} 
                className={`p-4 rounded-2xl flex items-center justify-between group transition-all border ${
                  item.isCritical 
                    ? 'bg-error/5 border-error/20' 
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className={`text-xl font-black italic ${item.isCritical ? 'text-error/60' : 'text-slate-300'}`}>
                    {Number(item.rank) < 10 ? `0${item.rank}` : item.rank}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-primary">{item.name}</p>
                    <p className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${item.isCritical ? 'text-error' : 'text-slate-500'}`}>
                      {item.detail}
                    </p>
                  </div>
                </div>
                <span className={`material-symbols-outlined text-sm ${item.isCritical ? 'text-error' : 'text-slate-400'}`}>
                  {item.icon}
                </span>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-10 h-full text-slate-400 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50">
                <span className="material-symbols-outlined text-3xl mb-2">format_list_numbered</span>
                <span className="text-xs font-bold text-center">Awaiting regional<br/>analysis data...</span>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 shrink-0">
            <button 
              onClick={() => setIsReportModalOpen(true)}
              className="w-full bg-slate-50 border border-slate-200 text-primary text-xs font-bold py-3 rounded-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">format_list_bulleted</span>
              View Full Analysis Report
            </button>
          </div>
        </div>
      </section>

      {/* --- AI STRATEGIC ACTION TIMELINE --- */}
      <section className="mt-4 border-t border-slate-200 pt-10">
        <div className="flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-secondary text-3xl">auto_awesome</span>
          <div>
            <h2 className="text-2xl font-headline font-black text-primary tracking-tight">AI-Generated Action Timeline</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">Generative insights prioritizing where to deploy training and what specific topics are needed. Volunteer to assist or participate.</p>
          </div>
        </div>

        {recommendations.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {recommendations.map(rec => {
              const isImmediate = rec.timeframe === 'IMMEDIATE';
              const isMid = rec.timeframe === 'MID_TERM';
              const accentColor = isImmediate ? 'bg-error' : isMid ? 'bg-amber-500' : 'bg-primary';
              const lightColor = isImmediate ? 'bg-error/10 text-error' : isMid ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary';

              return (
                <div key={rec.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col">
                  {/* Top Timeline Indicator */}
                  <div className={`absolute top-0 left-0 w-full h-1.5 ${accentColor}`}></div>
                  
                  <div className="flex justify-between items-start mb-4 mt-2">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${lightColor}`}>
                      {rec.timeLabel}
                    </span>
                    <span className={`material-symbols-outlined ${isImmediate ? 'text-error' : isMid ? 'text-amber-500' : 'text-primary'}`}>
                      {isImmediate ? 'emergency' : isMid ? 'calendar_month' : 'update'}
                    </span>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">pin_drop</span> {rec.region}
                    </p>
                    <h4 className="text-lg font-headline font-extrabold text-primary leading-tight">{rec.trainingNeeded}</h4>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed mb-6 flex-1">
                    {rec.description}
                  </p>

                  <div className="mt-auto pt-4 border-t border-slate-100">
                    <button 
                      onClick={() => handleToggleInterest(rec)}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                        rec.isInterested 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                          : 'bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {rec.isInterested ? 'task_alt' : 'front_hand'}
                      </span>
                      {rec.isInterested ? 'Interest Registered' : 'I am Interested'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400">
            <span className="material-symbols-outlined text-4xl mb-3 animate-pulse">model_training</span>
            <p className="text-sm font-bold text-slate-600">Analyzing Regional Data...</p>
            <p className="text-xs mt-1">The AI is currently processing risk metrics to generate new action timelines.</p>
          </div>
        )}
      </section>

      {/* --- MY ACTIVITIES SECTION --- */}
      <section className="mt-4 border-t border-slate-200 pt-10">
        <div className="flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-primary text-3xl">local_activity</span>
          <div>
            <h2 className="text-2xl font-headline font-black text-primary tracking-tight">My Registered & Requested Events</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">Track the events you've signed up for or the training interventions you've requested via the map.</p>
          </div>
        </div>

        {myActivities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myActivities.map(activity => (
              <div key={activity.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col h-full group">
                <div className={`absolute top-0 right-0 text-white text-[9px] font-bold px-3 py-1 rounded-bl-lg tracking-widest ${
                  activity.type === 'REGISTERED' ? 'bg-emerald-500' : 'bg-blue-500'
                }`}>
                  {activity.type}
                </div>
                
                <div className="flex items-start gap-3 mb-6 mt-2">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                    activity.type === 'REGISTERED' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    <span className="material-symbols-outlined text-xl">
                      {activity.type === 'REGISTERED' ? 'how_to_reg' : 'campaign'}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-base font-headline font-bold text-primary leading-tight pr-6">{activity.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]">location_on</span> {activity.region}
                    </p>
                  </div>
                </div>

                <div className="mt-auto bg-slate-50 border border-slate-100 rounded-xl p-3 mb-4 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">calendar_month</span> Date
                    </span>
                    <span className="font-semibold text-slate-700">{activity.date}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">schedule</span> Time
                    </span>
                    <span className="font-semibold text-slate-700">{activity.time}</span>
                  </div>
                </div>

                <button 
                  onClick={() => handleCancelActivity(activity.id, activity.title)}
                  className="w-full py-2 rounded-lg border border-slate-200 text-slate-500 text-xs font-bold hover:bg-error/5 hover:text-error hover:border-error/30 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                  {activity.type === 'REGISTERED' ? 'Cancel Registration' : 'Withdraw Request'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400">
             <span className="material-symbols-outlined text-4xl mb-3">event_note</span>
             <p className="text-sm font-bold text-slate-600">No Active Registrations</p>
             <p className="text-xs mt-1">Register for an event via the map or an AI recommendation.</p>
           </div>
        )}
      </section>

      {/* --- FULL ANALYSIS REPORT MODAL --- */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
            
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-headline font-extrabold text-xl text-primary">Full Geographic Analysis Report</h3>
                <p className="text-xs text-slate-500 mt-1">Complete ranking of all divisions combining Out-of-Field and Drought metrics.</p>
              </div>
              <button onClick={() => setIsReportModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-slate-50/50 flex-1">
              {fullReportData.length > 0 ? (
                <div className="space-y-3">
                  {fullReportData.map((item) => (
                    <div key={item.id} className={`flex items-center gap-5 p-4 rounded-xl border bg-white shadow-sm transition-all hover:shadow-md ${item.isCritical ? 'border-error/30 border-l-4 border-l-error' : 'border-slate-200'}`}>
                      <div className={`text-2xl font-black italic w-8 text-center ${item.isCritical ? 'text-error' : 'text-slate-300'}`}>
                        {Number(item.rank) < 10 ? `0${item.rank}` : item.rank}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-bold text-slate-900">{item.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">map</span> {item.region}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                         <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${item.isCritical ? 'bg-error/10 text-error' : 'bg-slate-100 text-slate-500'}`}>
                           {item.detail}
                         </span>
                         <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Risk: <span className={item.isCritical ? 'text-error' : 'text-primary'}>{item.score}</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                  <span className="material-symbols-outlined text-3xl mb-2">format_list_numbered</span>
                  <span className="text-xs font-bold text-center">Awaiting regional<br/>analysis data...</span>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-end shrink-0">
              <button 
                onClick={() => setIsReportModalOpen(false)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors shadow-md"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* React Toast Notification System */}
      <div 
        className={`fixed bottom-8 right-8 z-[200] transition-all duration-500 ease-out ${toast.visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95 pointer-events-none'}`}
      >
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