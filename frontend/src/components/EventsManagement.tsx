const MOCK_EVENTS = [
  { title: "Coastal Ecosystem Seminar", region: "Region VIII", status: "PENDING" },
  { title: "Mobile Robotics Lab", region: "Region VI", status: "REVIEWING" },
];

export default function EventsManagement() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      <section className="flex flex-col md:flex-row gap-6 items-end">
        <div className="flex-1">
          <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-secondary font-bold text-[10px] uppercase tracking-widest mb-4">Event Intelligence Console</span>
          <h1 className="text-4xl font-headline font-extrabold text-primary tracking-tight leading-tight">AI-Driven Outreach & <br /><span className="text-secondary">Program Optimization</span></h1>
        </div>
      </section>

      <section className="space-y-8 border-t-2 border-slate-100 pt-8">
        <h2 className="text-2xl font-headline font-black text-primary tracking-tight">AI Recommendations</h2>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-6 shadow-sm">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="text-lg font-headline font-bold text-primary">Physics Bootcamp for Grade 9</h4>
              <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold">IMMEDIATE</span>
            </div>
            <p className="text-sm text-slate-500">Target Region: Region VIII - Samar</p>
          </div>
          <div className="flex gap-3">
            <button className="bg-primary text-white px-5 py-2.5 rounded-xl text-xs font-bold">Approve</button>
          </div>
        </div>
      </section>
    </div>
  );
}