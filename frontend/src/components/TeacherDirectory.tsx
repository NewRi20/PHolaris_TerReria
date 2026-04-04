// MOCK DATA FOR BACKEND INTEGRATION
const MOCK_TEACHERS = [
  { id: "#STAR-2024-001", name: "Dr. Elena Rodriguez", tag: "Mainland", school: "Manila Science HS", loc: "NCR / Manila", spec: "Physics (Advanced)", exp: "12 Years", train: "Oct 2023", risk: false },
  { id: "#STAR-2024-042", name: "Mark Anthony Santos", tag: "GIDA", school: "Sitio Libis National High", loc: "Region VIII / Samar", spec: "General Science", exp: "4 Years", train: "Jan 2021", risk: true },
];

export default function TeacherDirectory() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-black text-primary font-headline tracking-tight mb-2">Teacher Directory</h2>
          <p className="text-slate-500 font-body">Manage and monitor the educator database for the Science and Technology program.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-xl text-sm transition-all hover:shadow-lg">
            <span className="material-symbols-outlined text-[20px]">person_add</span> Add Teacher
          </button>
        </div>
      </section>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">Teacher ID & Name</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">Location & School</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">Specialization</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">Experience</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_TEACHERS.map((t, idx) => (
                <tr key={idx} className={`hover:bg-slate-50 transition-colors ${t.risk ? 'bg-red-50/30' : ''}`}>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-mono font-bold text-secondary">{t.id}</span>
                      <span className="font-headline font-bold text-primary">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-900">{t.school}</span>
                      <span className="text-xs text-slate-500">{t.loc}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="inline-flex w-fit px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold">{t.spec}</span>
                  </td>
                  <td className="px-6 py-5"><span className="text-sm font-semibold text-slate-700">{t.exp}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}