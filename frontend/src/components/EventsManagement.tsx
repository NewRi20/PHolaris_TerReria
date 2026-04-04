import React, { useState, useEffect } from 'react';

// --- MOCK DATA (Ready for Backend Replacement) ---
const MOCK_SUMMARY = {
  activeProposals: 12,
  targetedReach: "2.4k"
};

const MOCK_AI_REC = {
  title: "GIDA Physics Bootcamp",
  topic: "Quantum Mechanics Fundamentals",
  matchScore: "98%",
  description: "AI analysis identifies a 40% proficiency gap in Northern Samar's Geographically Isolated and Disadvantaged Areas (GIDA). Recommended launch: Q3.",
  expertVotes: 14
};

const MOCK_TIMELINE = [
  { id: 't1', term: "Immediate (0-3m)", title: "Regional Science Fair Logistics", desc: "Procurement for GIDA lab kits in Leyte.", date: "MAY 2026", icon: "bolt", colorClass: "text-error", bgClass: "bg-error-container" },
  { id: 't2', term: "Mid-term (3-6m)", title: "AI Literacy Faculty Workshop", desc: "Curriculum integration for Grade 10-12 teachers.", date: "AUG 2026", icon: "calendar_today", colorClass: "text-secondary", bgClass: "bg-secondary-container/20" },
  { id: 't3', term: "Long-term (6-12m)", title: "National STAR Olympiad", desc: "Large-scale event mobilization across 17 regions.", date: "JAN 2027", icon: "map", colorClass: "text-tertiary-container", bgClass: "bg-tertiary-fixed-dim/20" }
];

const MOCK_QUEUE = [
  { id: 'q1', title: 'Coastal Ecosystem Seminar', region: 'Region VIII', category: 'Environment', status: 'PENDING', sentiment: 'Positive', sentimentIcon: 'trending_up', sentimentColor: 'text-green-600', isReviewing: false },
  { id: 'q2', title: 'Mobile Robotics Lab', region: 'Region VI', category: 'Technology', status: 'REVIEWING', sentiment: 'Neutral', sentimentIcon: 'trending_flat', sentimentColor: 'text-sky-600', isReviewing: true },
  { id: 'q3', title: 'Algebraic Geometry Workshop', region: 'Region IV-A', category: 'Mathematics', status: 'PENDING', sentiment: 'Positive', sentimentIcon: 'trending_up', sentimentColor: 'text-green-600', isReviewing: false }
];

export default function EventsManagement() {
  // State initialization for future backend data
  const [summary, setSummary] = useState(MOCK_SUMMARY);
  const [aiRec, setAiRec] = useState(MOCK_AI_REC);
  const [timeline, setTimeline] = useState(MOCK_TIMELINE);
  const [queue, setQueue] = useState(MOCK_QUEUE);
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toast, setToast] = useState({ visible: false, title: '', msg: '' });

  /* // TODO: Uncomment when backend API is ready
  useEffect(() => {
    async function fetchEventData() {
      setLoading(true);
      try {
        const response = await api.getEventIntelligence(); 
        setSummary(response.summary);
        setAiRec(response.aiRecommendation);
        setTimeline(response.timeline);
        setQueue(response.approvalQueue);
      } catch (error) {
        console.error("Error fetching event data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchEventData();
  }, []);
  */

  // React-based Approval Workflow
  const handleApprove = (id: string, title: string, region: string) => {
    setProcessingId(id);
    setToast({ visible: true, title: `Outreach: ${title}`, msg: `Drafting invites for ${region} teachers...` });

    // Simulate Backend Processing Time
    setTimeout(() => {
      setToast({ visible: true, title: `Outreach: ${title}`, msg: `Success! Invites sent via Gmail API to ${region}.` });
      
      // Update local state to reflect approval
      setQueue(prev => prev.map(item => item.id === id ? { ...item, status: 'APPROVED' } : item));
      setProcessingId(null);

      // Hide toast after a few seconds
      setTimeout(() => {
        setToast(prev => ({ ...prev, visible: false }));
      }, 3000);
    }, 2000);
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center font-bold text-primary">Loading Event Intelligence...</div>;
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-12 relative">
      
      {/* Hero Dashboard Summary */}
      <section className="flex flex-col md:flex-row gap-6 items-end">
        <div className="flex-1">
          <span className="inline-block px-3 py-1 rounded-full bg-secondary-container/20 text-secondary font-bold text-[10px] uppercase tracking-widest mb-4">Event Intelligence Console</span>
          <h1 className="text-4xl font-headline font-extrabold text-primary tracking-tight leading-tight">AI-Driven Outreach & <br/><span className="text-secondary">Program Optimization</span></h1>
        </div>
        <div className="flex gap-4">
          <div className="p-4 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 min-w-[160px]">
            <p className="text-[10px] uppercase font-bold text-on-surface-variant">Active Proposals</p>
            <p className="text-2xl font-headline font-black text-primary">{summary.activeProposals}</p>
          </div>
          <div className="p-4 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 min-w-[160px]">
            <p className="text-[10px] uppercase font-bold text-on-surface-variant">Targeted Reach</p>
            <p className="text-2xl font-headline font-black text-tertiary-container">{summary.targetedReach}</p>
          </div>
        </div>
      </section>

      {/* Asymmetric Grid: Approval Workflow & AI Recommendations */}
      <div className="grid grid-cols-12 gap-8">
        
        {/* Left Column: AI Recommendations & Outreach */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest text-primary-container">AI-Generated Recommendations</h3>
            <span className="material-symbols-outlined text-secondary animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
          </div>
          
          {/* Recommendation Card */}
          <div className="group relative overflow-hidden rounded-xl bg-surface-container-low p-6 transition-all hover:bg-surface-container hover:shadow-xl hover:shadow-sky-900/5">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-headline font-bold text-primary">{aiRec.title}</h4>
                <p className="text-xs text-on-surface-variant font-medium">Topic: {aiRec.topic}</p>
              </div>
              <div className="bg-primary text-white text-[10px] font-bold px-2 py-1 rounded">MATCH: {aiRec.matchScore}</div>
            </div>
            <p className="text-sm text-on-surface mb-6 leading-relaxed">{aiRec.description}</p>
            <div className="flex items-center gap-3 mb-8">
              <div className="flex -space-x-2">
                <div className="h-6 w-6 rounded-full border-2 border-white bg-slate-300"></div>
                <div className="h-6 w-6 rounded-full border-2 border-white bg-slate-400"></div>
                <div className="h-6 w-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[8px] font-bold">+{aiRec.expertVotes}</div>
              </div>
              <span className="text-[10px] font-semibold text-secondary">Expert Votings favoring approval</span>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 py-2 bg-primary text-on-primary text-xs font-bold rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                <span className="material-symbols-outlined text-sm">check_circle</span> Approve
              </button>
              <button className="flex-1 py-2 bg-surface-variant text-primary text-xs font-bold rounded-lg hover:bg-surface-container-high transition-colors">
                Modify
              </button>
            </div>
          </div>

          {/* Outreach Automation Feature Panel */}
          <div className="bg-tertiary-container/5 rounded-xl border border-tertiary/10 p-6 relative">
            <div className="absolute -top-3 right-6 bg-tertiary text-on-tertiary text-[10px] px-3 py-1 rounded-full font-bold">LIVE AUTOMATION</div>
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-tertiary-container">mail</span>
              <h4 className="text-sm font-bold text-tertiary-container font-headline">Automated Gmail Invitation</h4>
            </div>
            <div className="bg-surface-container-lowest p-4 rounded-lg shadow-inner text-xs space-y-2 border border-outline-variant/20">
              <p className="text-slate-400">Drafting for 142 Targeted Teachers...</p>
              <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-tertiary-container w-2/3 animate-pulse"></div>
              </div>
              <div className="pt-2 italic text-slate-500 leading-relaxed">
                "Dear Teacher, Based on your recent curriculum interest in high-energy physics, we invite you to the STAR GIDA Bootcamp..."
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Timeline & Approval Queue */}
        <div className="col-span-12 lg:col-span-7 space-y-8">
          
          {/* Action Timeline View */}
          <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black uppercase tracking-tighter text-primary font-headline">Action Timeline</h3>
              <div className="flex gap-2">
                <span className="px-3 py-1 rounded bg-slate-100 text-[10px] font-bold text-slate-500">Filter: 2026</span>
              </div>
            </div>
            
            <div className="space-y-12 relative before:content-[''] before:absolute before:left-[15px] before:top-4 before:bottom-4 before:w-[2px] before:bg-slate-100">
              {timeline.map((item) => (
                <div key={item.id} className="relative pl-10">
                  <div className={`absolute left-0 top-0 h-8 w-8 rounded-full ${item.bgClass} flex items-center justify-center z-10 border-4 border-surface-container-lowest`}>
                    <span className={`material-symbols-outlined ${item.colorClass} text-xs`} style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`text-[10px] font-bold ${item.colorClass} uppercase mb-1`}>{item.term}</p>
                      <h5 className="text-md font-bold text-primary font-headline">{item.title}</h5>
                      <p className="text-xs text-on-surface-variant">{item.desc}</p>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400">{item.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Event Approval Queue Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest text-primary-container">AI Event Approval Queue</h3>
              <div className="flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-lg border border-primary/10">
                <span className="material-symbols-outlined text-primary text-xs">auto_awesome</span>
                <span className="text-[10px] font-bold text-primary uppercase">{queue.length} READY</span>
              </div>
            </div>
            
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-[10px] font-bold text-on-surface-variant uppercase">
                    <th className="px-4 py-2">Event Title</th>
                    <th className="px-4 py-2 text-center">Status</th>
                    <th className="px-4 py-2">Sentiment</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((event) => (
                    <tr key={event.id} className="bg-surface-container-lowest shadow-sm rounded-xl overflow-hidden group border border-outline-variant/10">
                      <td className="px-4 py-4 rounded-l-xl">
                        <p className="text-sm font-bold text-primary">{event.title}</p>
                        <p className="text-[10px] text-on-surface-variant">{event.region} • {event.category}</p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {event.status === 'APPROVED' ? (
                           <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">APPROVED</span>
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${event.isReviewing ? 'bg-secondary-container/20 text-secondary' : 'bg-slate-100 text-slate-600'}`}>
                            {event.status}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className={`flex items-center gap-1 ${event.sentimentColor}`}>
                          <span className="material-symbols-outlined text-sm">{event.sentimentIcon}</span>
                          <span className="text-[10px] font-bold">{event.sentiment}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right rounded-r-xl">
                        <div className="flex items-center justify-end gap-2">
                          {event.status === 'APPROVED' ? (
                            <button disabled className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 opacity-50 cursor-not-allowed">
                              <span className="material-symbols-outlined text-xs">check</span> Approved
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleApprove(event.id, event.title, event.region)}
                              disabled={processingId !== null}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all ${
                                processingId === event.id 
                                  ? 'bg-blue-200 text-blue-800 cursor-wait' 
                                  : 'bg-primary text-on-primary hover:opacity-90 active:scale-95'
                              }`}
                            >
                              {processingId === event.id ? (
                                <><span className="material-symbols-outlined text-xs animate-spin">refresh</span> Sending...</>
                              ) : (
                                <><span className="material-symbols-outlined text-xs">send</span> Approve</>
                              )}
                            </button>
                          )}
                          <button className="text-primary hover:text-secondary p-1 transition-colors">
                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics & Smart Outreach Section */}
      <section className="space-y-8 mt-12 border-t border-slate-200 pt-10">
        <div className="flex items-end justify-between border-b-2 border-primary/10 pb-4">
          <div>
            <h2 className="text-2xl font-headline font-black text-primary tracking-tight">System Performance & Analytics</h2>
            <p className="text-sm text-slate-500 font-medium">Monitoring regional intervention impact and teacher engagement</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Queue List */}
          <div className="lg:col-span-8 space-y-4">
            {/* Hardcoded Sample Rows for Layout Testing */}
            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-6 hover:shadow-md transition-shadow">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-lg font-headline font-bold text-primary">Physics Bootcamp for Grade 9</h4>
                  <span className="px-2 py-0.5 rounded bg-error-container text-error text-[10px] font-bold">IMMEDIATE: 0-3M</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-slate-400 font-bold uppercase tracking-tighter">Target Region</p>
                    <p className="text-on-surface font-semibold">Region VIII - Samar</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase tracking-tighter">Training Type</p>
                    <p className="text-on-surface font-semibold">Subject Mastery</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 border-l md:pl-6 border-slate-100">
                <button className="bg-primary text-on-primary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/10">
                  <span className="material-symbols-outlined text-sm">send</span> Approve & Invite
                </button>
                <button className="bg-surface-container-high text-primary px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all">Modify</button>
              </div>
            </div>
            
            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-6 hover:shadow-md transition-shadow">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-lg font-headline font-bold text-primary">Advanced Mathematics Workshop</h4>
                  <span className="px-2 py-0.5 rounded bg-secondary-container/20 text-secondary text-[10px] font-bold">MID-TERM: 3-6M</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-slate-400 font-bold uppercase tracking-tighter">Target Region</p>
                    <p className="text-on-surface font-semibold">Sulu Division</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase tracking-tighter">Training Type</p>
                    <p className="text-on-surface font-semibold">Pedagogical Training</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 border-l md:pl-6 border-slate-100">
                <button className="bg-primary text-on-primary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/10">
                  <span className="material-symbols-outlined text-sm">send</span> Approve & Invite
                </button>
                <button className="bg-surface-container-high text-primary px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all">Modify</button>
              </div>
            </div>
          </div>

          {/* Smart Outreach Sidebar Highlight */}
          <div className="lg:col-span-4">
            <div className="bg-gradient-to-br from-primary to-primary-container rounded-[2rem] p-8 text-on-primary h-full shadow-xl shadow-primary/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
                    <span className="material-symbols-outlined text-on-primary">rocket_launch</span>
                  </div>
                  <h3 className="text-lg font-headline font-extrabold tracking-tight">Smart Outreach</h3>
                </div>
                <p className="text-primary-fixed text-sm leading-relaxed mb-6">
                  Clicking <span className="font-bold text-white underline underline-offset-4 decoration-secondary">"Approve"</span> activates our automated outreach engine.
                </p>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <span className="material-symbols-outlined text-secondary-fixed-dim text-sm mt-1">check_circle</span>
                    <p className="text-xs text-primary-fixed/80">Personalized Gmail drafts sent to teachers identified via the <span className="text-white font-semibold">Instructional Risk Index</span>.</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="material-symbols-outlined text-secondary-fixed-dim text-sm mt-1">check_circle</span>
                    <p className="text-xs text-primary-fixed/80">Targeting based on metrics like <span className="text-white font-semibold">out-of-field teaching</span> or 2+ year <span className="text-white font-semibold">training droughts</span>.</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="material-symbols-outlined text-secondary-fixed-dim text-sm mt-1">check_circle</span>
                    <p className="text-xs text-primary-fixed/80">Real-time engagement tracking synced to admin dashboard.</p>
                  </div>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-white/10">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-primary-fixed/60 mb-2">
                  <span>Automation Status</span>
                  <span className="text-secondary-fixed-dim flex items-center gap-1">
                    <span className="h-1.5 w-1.5 bg-secondary-fixed-dim rounded-full animate-pulse"></span> Ready
                  </span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-secondary-fixed-dim w-full"></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* React Toast Notification */}
      <div 
        className={`fixed bottom-24 right-8 z-[70] transition-all duration-300 ease-in-out ${toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}
      >
        <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4">
          <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
            {toast.msg.includes('Success') ? (
               <span className="material-symbols-outlined text-green-400 text-sm">check_circle</span>
            ) : (
               <span className="material-symbols-outlined text-blue-400 text-sm animate-spin">refresh</span>
            )}
          </div>
          <div>
            <p className="text-sm font-bold">{toast.title}</p>
            <p className="text-[10px] text-slate-400">{toast.msg}</p>
          </div>
        </div>
      </div>

    </div>
  );
}