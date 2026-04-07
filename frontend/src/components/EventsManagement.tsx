import React, { useState, useEffect } from 'react';

// --- TYPES (Ready for Backend & Map Integration) ---
export interface EventItem {
  id: string;
  title: string;
  topic: string;
  region: string;
  category: string;
  status: 'DRAFT' | 'PENDING' | 'REVIEWING' | 'APPROVED';
  description: string;
  matchScore: string;
  expertVotes: number;
  sentiment: string;
  sentimentIcon: string;
  sentimentColor: string;
  coordinates?: { lat: number; lng: number };
  target_audience?: string; 
  expiresAt?: string; // 1-month deadline from backend
  isCriticalArea?: boolean; // Flag to show it targets underserved areas
}

interface TimelineEvent {
  id: string;
  term: string;
  title: string;
  desc: string;
  date: string;
  icon: string;
  colorClass: string;
  bgClass: string;
}

export default function EventsManagement() {
  // --- STATE (Initialized empty for backend) ---
  const [featuredAiRec, setFeaturedAiRec] = useState<EventItem | null>(null);
  const [queue, setQueue] = useState<EventItem[]>([]);
  const [approvedEvents, setApprovedEvents] = useState<EventItem[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  
  // UI & Interactive States
  const [loading, setLoading] = useState(true);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toast, setToast] = useState({ visible: false, title: '', msg: '', type: 'info' });
  
  // Modification & Creation Modal States
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [newEventDraft, setNewEventDraft] = useState<Partial<EventItem>>({});

  // --- ACTUAL BACKEND FETCH LOGIC ---
  useEffect(() => {
    async function loadEventData() {
      setLoading(true);
      try {
        // REPLACE WITH ACTUAL ENDPOINT
        const response = await fetch('/api/events/intelligence'); 
        if (!response.ok) throw new Error('Failed to fetch events data');
        
        const data = await response.json();
        setFeaturedAiRec(data.featuredAiRec || null);
        setQueue(data.queue || []);
        setApprovedEvents(data.approvedEvents || []);
        setTimeline(data.timeline || []);

      } catch (error) {
        console.error("Events API Error:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadEventData();
  }, []);

  // Helper to check 1-month deadline
  const isEventExpired = (dateString?: string) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  // --- HANDLERS ---

  const showToast = (title: string, msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ visible: true, title, msg, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 4000);
  };

  // 1. GENERATE AI EVENTS FOR CRITICAL AREAS
  const handleGenerateAi = async () => {
    setIsGeneratingAi(true);
    showToast(`AI Engine Active`, `Analyzing backend risk data for critical regions...`, 'info');
    
    try {
      // TODO: Replace with actual POST request to ai_service.py
      // const res = await fetch('/api/events/generate-critical', { method: 'POST' });
      // const data = await res.json();
      
      setTimeout(() => {
        // Simulated backend response with 1-month deadline logic
        const expirationDate = new Date();
        expirationDate.setMonth(expirationDate.getMonth() + 1);

        const newFeatured: EventItem = {
          id: `rec_${Date.now()}`,
          title: "Critical Remedial Math Training",
          topic: "Algebraic Foundations",
          region: "Region VIII - Samar",
          category: "Mathematics",
          status: "DRAFT",
          matchScore: "99%",
          description: "Backend analysis flagged a critical out-of-field teaching rate in Samar. This urgent training targets deployed math educators.",
          expertVotes: 12,
          sentiment: "Neutral", sentimentIcon: "warning", sentimentColor: "text-amber-500",
          coordinates: { lat: 11.7716, lng: 124.8770 },
          expiresAt: expirationDate.toISOString(),
          isCriticalArea: true
        };

        setFeaturedAiRec(newFeatured);
        setIsGeneratingAi(false);
        showToast(`Analysis Complete`, `New critical intervention generated based on risk index.`, 'success');
      }, 2000);
    } catch (error) {
      showToast('Generation Failed', 'Could not reach AI service.', 'error');
      setIsGeneratingAi(false);
    }
  };

  // 2. QUEUE TOP RECOMMENDATION
  const handleQueueFeatured = () => {
    if (!featuredAiRec) return;
    setQueue(prev => [{ ...featuredAiRec, status: 'PENDING' }, ...prev]);
    setFeaturedAiRec(null);
    showToast('Event Queued', 'Recommendation added to the Approval Queue for final review.', 'success');
  };

  // 3. APPROVE FROM QUEUE
  const handleApproveFromQueue = async (event: EventItem) => {
    setProcessingId(event.id);
    showToast(`Deploying Event`, `Syncing ${event.title} to Map and notifying teachers...`, 'info');

    try {
      // TODO: Actual API PUT/PATCH request to approve event
      // await fetch(`/api/events/${event.id}/approve`, { method: 'PATCH' });

      setTimeout(() => {
        setQueue(prev => prev.filter(q => q.id !== event.id));
        setApprovedEvents(prev => [{ ...event, status: 'APPROVED' }, ...prev]);
        setProcessingId(null);
        showToast(`Successfully Deployed`, `Event is now live on the Teacher Map.`, 'success');
      }, 1500);
    } catch (error) {
      showToast('Deployment Failed', 'Could not process approval.', 'error');
      setProcessingId(null);
    }
  };

  // 4. DELETE EVENT
  const handleDeleteEvent = (id: string, title: string) => {
    // TODO: Actual API DELETE request
    setQueue(prev => prev.filter(item => item.id !== id));
    showToast('Event Removed', `"${title}" has been deleted from the queue.`, 'info');
  };

  // 5. MANUALLY CREATE EVENT
  const handleCreateEvent = () => {
    if (!newEventDraft.title || !newEventDraft.region) {
      showToast('Validation Error', 'Please provide at least a title and region.', 'error');
      return;
    }

    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + 1);

    const newEvent: EventItem = {
      id: `manual_${Date.now()}`,
      title: newEventDraft.title,
      topic: newEventDraft.topic || 'General Pedagogy',
      region: newEventDraft.region,
      category: newEventDraft.category || 'General',
      status: 'PENDING',
      matchScore: 'N/A',
      description: newEventDraft.description || 'Manually created event proposal.',
      expertVotes: 1, 
      sentiment: 'Neutral',
      sentimentIcon: 'person',
      sentimentColor: 'text-slate-500',
      expiresAt: expirationDate.toISOString(),
      isCriticalArea: false
    };

    setQueue(prev => [newEvent, ...prev]);
    setIsCreatingEvent(false);
    setNewEventDraft({});
    showToast('Event Created', `Successfully added to the queue. Expires in 1 month.`, 'success');
  };

  // 6. SAVE MODIFICATIONS
  const handleSaveModification = (updatedEvent: EventItem) => {
    // TODO: Actual API PATCH request
    if (featuredAiRec?.id === updatedEvent.id) {
      setFeaturedAiRec(updatedEvent);
    } else {
      setQueue(prev => prev.map(item => item.id === updatedEvent.id ? updatedEvent : item));
    }
    setEditingEvent(null);
    showToast('Event Modified', `Successfully updated the details for ${updatedEvent.title}.`, 'success');
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-primary bg-slate-50/50">
        <span className="material-symbols-outlined text-4xl mb-4 animate-spin">refresh</span>
        <div className="font-bold tracking-widest uppercase text-sm">Loading Event Intelligence...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto w-full space-y-12 relative">
      
      {/* Hero Dashboard Summary */}
      <section className="flex flex-col md:flex-row gap-6 items-start md:items-end">
        <div className="flex-1">
          <h1 className="text-4xl font-headline font-extrabold text-primary tracking-tight leading-tight">AI-Driven Outreach & <br/><span className="text-secondary">Program Optimization</span></h1>
          <p className="text-slate-500 mt-3 max-w-2xl leading-relaxed">
            Automate and manage professional development interventions. Generate AI-driven event proposals targeting critical teacher shortages and training droughts across all regions.
          </p>
        </div>
        <div className="flex gap-4 shrink-0">
          <div className="p-5 bg-white rounded-2xl shadow-sm border border-slate-200 min-w-[200px] flex flex-col justify-between h-full">
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Active Proposals (Approved)</p>
            <p className="text-4xl font-headline font-black text-primary mt-2">{approvedEvents.length}</p>
          </div>
        </div>
      </section>

      {/* Asymmetric Grid: Approval Workflow & AI Recommendations */}
      <div className="grid grid-cols-12 gap-8">
        
        {/* Left Column: AI Recommendations */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest text-primary">Top AI Recommendation</h3>
            <button 
              onClick={handleGenerateAi}
              disabled={isGeneratingAi}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors border border-primary/20 disabled:opacity-50 shadow-sm"
            >
              <span className={`material-symbols-outlined text-sm ${isGeneratingAi ? 'animate-spin' : ''}`}>
                {isGeneratingAi ? 'refresh' : 'psychology'}
              </span>
              {isGeneratingAi ? 'Analyzing Backend...' : 'Scan Critical Areas'}
            </button>
          </div>
          
          {/* Featured Recommendation Card */}
          {featuredAiRec ? (
            <div className={`group relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 shadow-sm transition-all duration-500 flex flex-col ${isGeneratingAi ? 'opacity-50 blur-[2px]' : 'hover:shadow-md'}`}>
              {featuredAiRec.isCriticalArea && (
                <div className="absolute top-0 left-0 w-full h-1.5 bg-error"></div>
              )}
              <div className="flex justify-between items-start mb-4 mt-2">
                <div>
                  <h4 className="text-lg font-headline font-bold text-primary">{featuredAiRec.title}</h4>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Region: {featuredAiRec.region} • {featuredAiRec.category}</p>
                </div>
                <div className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold px-2.5 py-1.5 rounded-lg whitespace-nowrap">MATCH: {featuredAiRec.matchScore}</div>
              </div>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed flex-1">{featuredAiRec.description}</p>
              
              <div className="flex gap-3 mt-auto">
                <button 
                  onClick={handleQueueFeatured}
                  className="flex-1 py-2.5 bg-primary text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all active:scale-95 shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm">queue</span> Add to Queue
                </button>
                <button 
                  onClick={() => setEditingEvent(featuredAiRec)}
                  className="flex-1 py-2.5 bg-slate-50 border border-slate-200 text-primary text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Modify
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center flex flex-col items-center justify-center min-h-[250px]">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">auto_awesome</span>
              <p className="text-sm font-bold text-slate-600">No Pending AI Recommendations</p>
              <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto">Click "Scan Critical Areas" to have the backend evaluate risk indices and generate urgent intervention proposals.</p>
            </div>
          )}
        </div>

        {/* Right Column: Approval Queue Table */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest text-primary">Event Approval Queue</h3>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsCreatingEvent(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-[10px] font-bold hover:bg-primary/90 transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">add</span> Create Manual Event
              </button>
              <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-lg border border-primary/20">
                <span className="material-symbols-outlined text-primary text-xs">list_alt</span>
                <span className="text-[10px] font-bold text-primary uppercase">{queue.length} IN QUEUE</span>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto no-scrollbar bg-white rounded-2xl border border-slate-200 shadow-sm min-h-[250px]">
            {queue.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4">Event Details</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {queue.map((event) => {
                    const expired = isEventExpired(event.expiresAt);
                    return (
                      <tr key={event.id} className={`transition-colors ${expired ? 'bg-red-50/20' : 'hover:bg-slate-50'}`}>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-bold ${expired ? 'text-slate-500' : 'text-primary'}`}>{event.title}</p>
                            {event.isCriticalArea && !expired && <span className="material-symbols-outlined text-error text-[14px]" title="Targets Critical Area">priority_high</span>}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">{event.region} • {event.category}</p>
                        </td>
                        <td className="px-6 py-5 text-center">
                          {expired ? (
                            <span className="px-3 py-1 rounded-full bg-error/10 border border-error/20 text-error text-[10px] font-bold">VOID (EXPIRED)</span>
                          ) : (
                            <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold">
                              {event.status}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => setEditingEvent(event)}
                              disabled={expired}
                              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-primary transition-colors shadow-sm disabled:opacity-50"
                              title="Modify Event"
                            >
                              <span className="material-symbols-outlined text-sm">edit</span>
                            </button>
                            <button 
                              onClick={() => handleDeleteEvent(event.id, event.title)}
                              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-error hover:border-error/30 hover:bg-error/5 transition-colors shadow-sm"
                              title="Delete Event"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                            <button 
                              onClick={() => handleApproveFromQueue(event)}
                              disabled={processingId !== null || expired}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all shadow-sm ${
                                expired ? 'bg-slate-200 text-slate-400' : 'bg-primary text-white hover:bg-primary/90'
                              }`}
                            >
                              {processingId === event.id ? (
                                <span className="material-symbols-outlined text-xs animate-spin">refresh</span>
                              ) : (
                                <span className="material-symbols-outlined text-xs">check_circle</span>
                              )}
                              Approve
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <span className="material-symbols-outlined text-4xl mb-2">inbox</span>
                <p className="text-sm font-bold">Queue is empty.</p>
                <p className="text-xs mt-1">Generate AI ideas or create one manually.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- APPROVED & ONGOING EVENTS SECTION --- */}
      <section className="mt-12 border-t border-slate-200 pt-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-headline font-black text-primary tracking-tight">Approved & Ongoing Events</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">Events that are actively deployed to the Teacher Map and receiving registrations.</p>
          </div>
        </div>
        
        {approvedEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {approvedEvents.map((event) => (
              <div key={event.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col h-full">
                {event.isCriticalArea && (
                  <div className="absolute top-0 right-0 bg-error text-white text-[9px] font-bold px-3 py-1 rounded-bl-lg tracking-widest">
                    CRITICAL AREA
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-xl">event_available</span>
                  </div>
                  <div>
                    <h4 className="text-base font-headline font-bold text-primary leading-tight pr-12">{event.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{event.topic}</p>
                  </div>
                </div>
                
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Region</span>
                    <span className="font-semibold text-slate-700">{event.region}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Category</span>
                    <span className="font-semibold text-slate-700">{event.category}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Status</span>
                    <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">LIVE</span>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">pin_drop</span> Coordinates Synced
                  </span>
                  <button className="text-primary text-[10px] font-bold hover:underline">View Analytics</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
           <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400">
             <span className="material-symbols-outlined text-4xl mb-3">event_busy</span>
             <p className="text-sm font-bold text-slate-600">No Approved Events</p>
             <p className="text-xs mt-1">Approve events from the queue to deploy them to the map.</p>
           </div>
        )}
      </section>

      {/* --- CREATE NEW EVENT MODAL --- */}
      {isCreatingEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-headline font-bold text-lg text-primary">Create Manual Event</h3>
              <button onClick={() => setIsCreatingEvent(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Event Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Regional Biology Conference"
                  value={newEventDraft.title || ''}
                  onChange={(e) => setNewEventDraft({...newEventDraft, title: e.target.value})}
                  className="w-full bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary p-3 outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Target Region</label>
                  <input 
                    type="text" 
                    placeholder="e.g. NCR"
                    value={newEventDraft.region || ''}
                    onChange={(e) => setNewEventDraft({...newEventDraft, region: e.target.value})}
                    className="w-full bg-white border border-slate-300 rounded-lg text-sm p-3 outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Category / Subject</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Science"
                    value={newEventDraft.category || ''}
                    onChange={(e) => setNewEventDraft({...newEventDraft, category: e.target.value})}
                    className="w-full bg-white border border-slate-300 rounded-lg text-sm p-3 outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Specific Topic</label>
                <input 
                  type="text" 
                  placeholder="e.g. Cellular Structures"
                  value={newEventDraft.topic || ''}
                  onChange={(e) => setNewEventDraft({...newEventDraft, topic: e.target.value})}
                  className="w-full bg-white border border-slate-300 rounded-lg text-sm p-3 outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Description & Justification</label>
                <textarea 
                  rows={3}
                  placeholder="Provide context on why this event is needed..."
                  value={newEventDraft.description || ''}
                  onChange={(e) => setNewEventDraft({...newEventDraft, description: e.target.value})}
                  className="w-full bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary p-3 outline-none transition-all resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsCreatingEvent(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateEvent}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors shadow-md flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">add</span> Create to Queue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT EXISTING EVENT MODAL --- */}
      {editingEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-headline font-bold text-lg text-primary">Modify Event Draft</h3>
              <button onClick={() => setEditingEvent(null)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Event Title</label>
                <input 
                  type="text" 
                  value={editingEvent.title}
                  onChange={(e) => setEditingEvent({...editingEvent, title: e.target.value})}
                  className="w-full bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary p-3 outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Target Region</label>
                  <input 
                    type="text" 
                    value={editingEvent.region}
                    onChange={(e) => setEditingEvent({...editingEvent, region: e.target.value})}
                    className="w-full bg-white border border-slate-300 rounded-lg text-sm p-3 outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Category / Subject</label>
                  <input 
                    type="text" 
                    value={editingEvent.category}
                    onChange={(e) => setEditingEvent({...editingEvent, category: e.target.value})}
                    className="w-full bg-white border border-slate-300 rounded-lg text-sm p-3 outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Specific Topic</label>
                <input 
                  type="text" 
                  value={editingEvent.topic}
                  onChange={(e) => setEditingEvent({...editingEvent, topic: e.target.value})}
                  className="w-full bg-white border border-slate-300 rounded-lg text-sm p-3 outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Description & Justification</label>
                <textarea 
                  rows={4}
                  value={editingEvent.description}
                  onChange={(e) => setEditingEvent({...editingEvent, description: e.target.value})}
                  className="w-full bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary p-3 outline-none transition-all resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setEditingEvent(null)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleSaveModification(editingEvent)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors shadow-md"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* React Toast Notification */}
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