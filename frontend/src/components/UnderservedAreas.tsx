import AdminMap from './ui/AdminMap'; 

export default function UnderservedAreas() {
  return (
    <div className="p-8 max-w-[1600px] mx-auto w-full space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col relative overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="font-extrabold text-primary uppercase tracking-tight">Interactive Instructional Risk Map</h3>
              <p className="text-xs text-slate-500">Real-time geographic risk analysis</p>
            </div>
          </div>
          <div className="relative flex-1 bg-slate-900 min-h-[600px] flex flex-col overflow-hidden">
            <AdminMap />
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col flex-1 p-5">
            <h3 className="font-extrabold text-primary uppercase tracking-tight mb-4">Uplift Priority Queue</h3>
            <div className="flex items-center gap-4 p-4 rounded-xl border border-error/20 bg-red-50">
              <div className="text-xl font-black text-error italic">01</div>
              <div className="flex-1"><h4 className="text-sm font-bold text-slate-900">Basilan Division</h4></div>
              <div className="text-right"><p className="text-xs font-black text-error">9.8</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}