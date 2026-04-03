import AdminMap from "./components/ui/AdminMap";
import TeacherMap from "./components/ui/TeacherMap";

function App() {
  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      
      {/* Centered container that limits the width */}
      <div className="max-w-5xl mx-auto">
        
        {/* Main Page Header */}
        <div className="mb-8 border-b border-slate-200 pb-4">
          <h1 className="text-3xl font-bold text-slate-900">PHOLARIS</h1>
          <p className="text-slate-500 mt-1">Interactive Regional Underserved Area Map</p>
        </div>

        {/* Admin Map Container */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          {/* NEW: Admin Map Header */}
          <div className="mb-4 px-2">
            <h2 className="text-xl font-bold text-slate-800">Admin View</h2>
            <p className="text-sm text-slate-500">Regional Risk Metrics and Capacity Needs</p>
          </div>
          
          <AdminMap />
        </div>

        {/* Teacher Map Container */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mt-8">
          {/* NEW: Teacher Map Header */}
          <div className="mb-4 px-2">
            <h2 className="text-xl font-bold text-slate-800">Teacher View</h2>
            <p className="text-sm text-slate-500">Upcoming Events and Training Opportunities</p>
          </div>
          
          <TeacherMap />
        </div>

      </div>
      
    </div>
  )
}

export default App