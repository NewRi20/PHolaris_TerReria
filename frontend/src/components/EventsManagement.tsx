import React, { useState, useEffect } from 'react';

// --- TYPES (Ready for Backend & Map Integration) ---
interface SummaryData {
  activeProposals: number;
  targetedReach: string;
}

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
  // --- STATE ---
  const [summary, setSummary] = useState<SummaryData>({ activeProposals: 0, targetedReach: "-" });
  const [featuredAiRec, setFeaturedAiRec] = useState<EventItem | null>(null);
  const [queue, setQueue] = useState<EventItem[]>([]);
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

  // TEMPORARY: Simulate initial data load from backend
  useEffect(() => {
    setTimeout(() => {
      setSummary({ activeProposals: 12, targetedReach: "2.4k" });
      
      const initialDraft: EventItem = {
        id: 'rec_1',
        title: "GIDA Physics Bootcamp",
        topic: "Quantum Mechanics Fundamentals",
        region: "Region VIII - Samar",
        category: "Physics",
        status: 'DRAFT',
        matchScore: "98%",
        description: "AI analysis identifies a 40% proficiency gap in Northern Samar's Geographically Isolated and Disadvantaged Areas (GIDA).",
        expertVotes: 14,
        sentiment: 'Positive', sentimentIcon: 'trending_up', sentimentColor: 'text-green-600',
        coordinates: { lat: 11.7716, lng: 124.8770 }
      };
      
      setFeaturedAiRec(initialDraft);
      
      setQueue([
        { id: 'q1', title: 'Coastal Ecosystem Seminar', topic: 'Marine Biology', region: 'Region VIII', category: 'Environment', status: 'PENDING', matchScore: "85%", description: "Focus on coastal preservation.", expertVotes: 5, sentiment: 'Positive', sentimentIcon: 'trending_up', sentimentColor: 'text-green-600' },
        { id: 'q2', title: 'Mobile Robotics Lab', topic: 'Intro to Arduino', region: 'Region VI', category: 'Technology', status: 'REVIEWING', matchScore: "78%", description: "Hands on robotics training.", expertVotes: 3, sentiment: 'Neutral', sentimentIcon: 'trending_flat', sentimentColor: 'text-sky-600' }
      ]);

      setTimeline([
        { id: 't1', term: "Immediate (0-3m)", title: "Regional Science Fair Logistics", desc: "Procurement for GIDA lab kits in Leyte.", date: "MAY 2026", icon: "bolt", colorClass: "text-error", bgClass: "bg-error-container" },
        { id: 't2', term: "Mid-term (3-6m)", title: "AI Literacy Faculty Workshop", desc: "Curriculum integration for Grade 10-12 teachers.", date: "AUG 2026", icon: "calendar_today", colorClass: "text-secondary", bgClass: "bg-secondary-container/20" }
      ]);
      setLoading(false);
    }, 800);
  }, []);

  // --- HANDLERS ---

  const showToast = (title: string, msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ visible: true, title, msg, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 4000);
  };

  // 1. GENERATE AI EVENTS
  const handleGenerateAi = () => {
    setIsGeneratingAi(true);
    showToast(`AI Engine Active`, `Computing regional metrics and generating targeted events...`, 'info');
    
    setTimeout(() => {
      const newFeatured: EventItem = {
        id: `rec_${Date.now()}`,
        title: "Advanced Mathematics Symposium",
        topic: "Calculus Pedagogy",
        region: "NCR - Metro Manila",
        category: "Mathematics",
        status: "DRAFT",
        matchScore: "96%",
        description: "Recent data shows a sharp decline in Math proficiency. This symposium targets high school educators with modern pedagogical techniques.",
        expertVotes: 8,
        sentiment: "Neutral", sentimentIcon: "trending_flat", sentimentColor: "text-sky-600",
        coordinates: { lat: 14.5995, lng: 120.9842 }
      };

      const newQueueItem: EventItem = {
        id: `q_${Date.now() + 1}`,
        title: "Chemistry Lab Safety Certification",
        topic: "Hazardous Materials",
        region: "Region IV-A",
        category: "Chemistry",
        status: "PENDING",
        matchScore: "89%",
        description: "Mandatory certification update for public school lab coordinators.",
        expertVotes: 4,
        sentiment: "Positive", sentimentIcon: "trending_up", sentimentColor: "text-green-600"
      };

      setFeaturedAiRec(newFeatured);
      setQueue(prev => [newQueueItem, ...prev]);
      setSummary(prev => ({ ...prev, activeProposals: prev.activeProposals + 2 }));
      
      setIsGeneratingAi(false);
      showToast(`Generation Complete`, `Generated 2 new events and added to the Approval Queue.`, 'success');
    }, 2500);
  };

  // 2. APPROVE & AUTOMATE OUTREACH
  const handleApprove = (event: EventItem) => {
    setProcessingId(event.id);
    showToast(`Outreach Initiated`, `Querying DB for ${event.category} teachers in ${event.region}...`, 'info');

    setTimeout(() => {
      showToast(`Emails Sent!`, `Successfully dispatched automated Gmail invitations to registered teachers in ${event.region}. Map coordinates updated.`, 'success');
      
      setQueue(prev => {
        const exists = prev.find(q => q.id === event.id);
        if (exists) return prev.map(item => item.id === event.id ? { ...item, status: 'APPROVED' } : item);
        return [{ ...event, status: 'APPROVED' }, ...prev];
      });

      if (featuredAiRec?.id === event.id) setFeaturedAiRec(null);
      setProcessingId(null);
    }, 2500);
  };

  // 3. DELETE UNAPPROVED EVENTS
  const handleDeleteEvent = (id: string, title: string) => {
    setQueue(prev => prev.filter(item => item.id !== id));
    setSummary(prev => ({ ...prev, activeProposals: Math.max(0, prev.activeProposals - 1) }));
    showToast('Event Deleted', `"${title}" has been permanently removed from the queue.`, 'info');
  };

  // 4. MANUALLY CREATE EVENT
  const handleCreateEvent = () => {
    if (!newEventDraft.title || !newEventDraft.region) {
      showToast('Validation Error', 'Please provide at least a title and region.', 'error');
      return;
    }

    const newEvent: EventItem = {
      id: `manual_${Date.now()}`,
      title: newEventDraft.title,
      topic: newEventDraft.topic || 'General Pedagogy',
      region: newEventDraft.region,
      category: newEventDraft.category || 'General',
      status: 'PENDING',
      matchScore: 'N/A (Manual)',
      description: newEventDraft.description || 'Manually created event proposal.',
      expertVotes: 1, 
      sentiment: 'Neutral',
      sentimentIcon: 'person',
      sentimentColor: 'text-slate-500',
    };

    setQueue(prev => [newEvent, ...prev]);
    setSummary(prev => ({ ...prev, activeProposals: prev.activeProposals + 1 }));
    setIsCreatingEvent(false);
    setNewEventDraft({});
    showToast('Event Created', `Successfully added "${newEvent.title}" to the queue.`, 'success');
  };

  // 5. SAVE MODIFICATIONS
  const handleSaveModification = (updatedEvent: EventItem) => {
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
      <div className="flex h-screen flex-col items-center justify-center text-primary">
        <span className="material-symbols-outlined text-4xl mb-4 animate-spin">refresh</span>
        <div className="font-bold tracking-widest uppercase text-sm">Loading Event Intelligence...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-12 relative">
      
      {/* Hero Dashboard Summary */}
      <section className="flex flex-col md:flex-row gap-6 items-end">
        <div className="flex-1">
          <span className="inline-block px-3 py-1 rounded-full bg-secondary/10 text-secondary font-bold text-[10px] uppercase tracking-widest mb-4 border border-secondary/20">Event Intelligence Console</span>
          <h1 className="text-4xl font-headline font-extrabold text-primary tracking-tight leading-tight">AI-Driven Outreach & <br/><span className="text-secondary">Program Optimization</span></h1>
        </div>
        <div className="flex gap-4">
          <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200 min-w-[160px]">
            <p className="text-[10px] uppercase font-bold text-slate-500">Active Proposals</p>
            <p className="text-2xl font-headline font-black text-primary">{summary.activeProposals}</p>
          </div>
          <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200 min-w-[160px]">
            <p className="text-[10px] uppercase font-bold text-slate-500">Targeted Reach</p>
            <p className="text-2xl font-headline font-black text-sky-700">{summary.targetedReach}</p>
          </div>
        </div>
      </section>

      {/* Asymmetric Grid: Approval Workflow & AI Recommendations */}
      <div className="grid grid-cols-12 gap-8">
        
        {/* Left Column: AI Recommendations & Outreach */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest text-primary">Top AI Recommendation</h3>
            <button 
              onClick={handleGenerateAi}
              disabled={isGeneratingAi}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors border border-primary/20 disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-sm ${isGeneratingAi ? 'animate-spin' : ''}`}>
                {isGeneratingAi ? 'refresh' : 'psychology'}
              </span>
              {isGeneratingAi ? 'Generating...' : 'New Ideas'}
            </button>
          </div>
          
          {/* Featured Recommendation Card */}
          {featuredAiRec ? (
            <div className={`group relative overflow-hidden rounded-xl bg-white border border-slate-200 p-6 shadow-sm transition-all duration-500 ${isGeneratingAi ? 'opacity-50 blur-[2px]' : 'hover:shadow-md'}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-headline font-bold text-primary">{featuredAiRec.title}</h4>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Region: {featuredAiRec.region} • {featuredAiRec.category}</p>
                </div>
                <div className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold px-2.5 py-1.5 rounded-lg">MATCH: {featuredAiRec.matchScore}</div>
              </div>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">{featuredAiRec.description}</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleApprove(featuredAiRec)}
                  disabled={processingId === featuredAiRec.id}
                  className="flex-1 py-2.5 bg-primary text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-all active:scale-95 shadow-sm disabled:opacity-70"
                >
                  {processingId === featuredAiRec.id ? (
                    <><span className="material-symbols-outlined text-sm animate-spin">refresh</span> Processing...</>
                  ) : (
                    <><span className="material-symbols-outlined text-sm">send</span> Approve & Queue</>
                  )}
                </button>
                <button 
                  onClick={() => setEditingEvent(featuredAiRec)}
                  className="flex-1 py-2.5 bg-slate-50 border border-slate-200 text-primary text-xs font-bold rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Modify
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-8 text-center flex flex-col items-center">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">auto_awesome</span>
              <p className="text-sm font-bold text-slate-600">Queue Processed</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Click "New Ideas" to analyze regional metrics and generate new proposals.</p>
            </div>
          )}

          {/* Outreach Automation Feature Panel */}
          <div className="bg-sky-50 rounded-xl border border-sky-100 p-6 relative">
            <div className="absolute -top-3 right-6 bg-sky-600 text-white text-[10px] px-3 py-1 rounded-full font-bold shadow-sm">LIVE AUTOMATION</div>
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-sky-700">mail</span>
              <h4 className="text-sm font-bold text-sky-800 font-headline">Automated Gmail Pipeline</h4>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-sm text-xs space-y-3 border border-sky-100">
              <div className="flex justify-between items-center text-slate-500 font-medium">
                <span>Listening for Approved Events...</span>
                <span className={`material-symbols-outlined text-[16px] text-sky-500 ${processingId ? 'animate-spin' : 'animate-pulse'}`}>
                  {processingId ? 'refresh' : 'cell_tower'}
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full bg-sky-500 transition-all duration-1000 ${processingId ? 'w-full' : 'w-1/3 animate-pulse'}`}></div>
              </div>
              <div className="pt-2 italic text-slate-600 leading-relaxed bg-slate-50 p-3 rounded border border-slate-100">
                "Dear Teacher, based on your specialized curriculum data, we invite you to an exclusive professional development event matching your profile..."
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Approval Queue Table */}
        <div className="col-span-12 lg:col-span-7 space-y-8">
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest text-primary">Event Approval Queue</h3>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsCreatingEvent(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-[10px] font-bold hover:bg-primary/90 transition-all shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm">add</span> Create Event
                </button>
                <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-lg border border-primary/20">
                  <span className="material-symbols-outlined text-primary text-xs">list_alt</span>
                  <span className="text-[10px] font-bold text-primary uppercase">{queue.length} IN QUEUE</span>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto no-scrollbar bg-white rounded-xl border border-slate-200 shadow-sm">
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
                    {queue.map((event) => (
                      <tr key={event.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-primary">{event.title}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{event.region} • {event.category}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {event.status === 'APPROVED' ? (
                             <span className="px-3 py-1 rounded-full bg-green-100 border border-green-200 text-green-700 text-[10px] font-bold">APPROVED</span>
                          ) : (
                            <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold">
                              {event.status}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {event.status !== 'APPROVED' && (
                              <>
                                <button 
                                  onClick={() => setEditingEvent(event)}
                                  className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-primary transition-colors shadow-sm"
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
                                  onClick={() => handleApprove(event)}
                                  disabled={processingId !== null}
                                  className="px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 bg-primary text-white hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50"
                                >
                                  {processingId === event.id ? (
                                    <span className="material-symbols-outlined text-xs animate-spin">refresh</span>
                                  ) : (
                                    <span className="material-symbols-outlined text-xs">send</span>
                                  )}
                                  Approve
                                </button>
                              </>
                            )}
                            {event.status === 'APPROVED' && (
                               <button disabled className="px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 cursor-not-allowed">
                                 <span className="material-symbols-outlined text-xs">check</span> Deployed
                               </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <p className="text-sm font-bold">Queue is empty.</p>
                  <p className="text-xs mt-1">Generate AI ideas or create one manually.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* System Performance & Analytics Section */}
      <section className="space-y-8 mt-12 border-t border-slate-200 pt-10">
        <div className="flex items-end justify-between border-b-2 border-slate-100 pb-4">
          <div>
            <h2 className="text-2xl font-headline font-black text-primary tracking-tight">System Performance & Analytics</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">Monitoring regional intervention impact and teacher engagement</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-6 hover:shadow-md transition-shadow">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h4 className="text-lg font-headline font-bold text-primary">Physics Bootcamp for Grade 9</h4>
                  <span className="px-2.5 py-0.5 rounded-lg bg-error/10 border border-error/20 text-error text-[10px] font-bold">IMMEDIATE: 0-3M</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest mb-0.5 text-[9px]">Target Region</p>
                    <p className="text-slate-700 font-semibold">Region VIII - Samar</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest mb-0.5 text-[9px]">Training Type</p>
                    <p className="text-slate-700 font-semibold">Subject Mastery</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="bg-white rounded-[2rem] p-8 h-full shadow-sm border-2 border-blue-100 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-10 -mt-10"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-blue-100 p-2.5 rounded-xl border border-blue-200">
                    <span className="material-symbols-outlined text-blue-600">rocket_launch</span>
                  </div>
                  <h3 className="text-xl font-headline font-extrabold tracking-tight text-blue-950">Smart Outreach</h3>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">
                  Clicking <span className="font-bold text-blue-600 underline underline-offset-4 decoration-blue-200">"Approve"</span> activates our automated outreach engine.
                </p>
                <div className="space-y-5">
                  <div className="flex gap-3">
                    <span className="material-symbols-outlined text-blue-500 text-sm mt-0.5">check_circle</span>
                    <p className="text-xs text-slate-600 leading-relaxed">Personalized Gmail drafts sent to teachers.</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="material-symbols-outlined text-blue-500 text-sm mt-0.5">check_circle</span>
                    <p className="text-xs text-slate-600 leading-relaxed">Map coordinates instantly published to Teacher Portal.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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