import React, { useState, useEffect } from 'react';

// --- MOCK DATA (Ready for Backend Replacement) ---
const MOCK_STATS = {
  highRiskAreas: 42,
  trainingDrought: 156,
  totalEducators: "1,248"
};

const MOCK_TEACHERS = [
  {
    id: "#STAR-2024-001",
    name: "Dr. Elena Rodriguez",
    tags: [{ label: "Mainland", bg: "bg-slate-100", text: "text-slate-500" }],
    school: "Manila Science HS",
    location: "NCR / Manila / Ermita",
    specialization: "Physics (Advanced)",
    status: "In-Specialization",
    isOutField: false,
    experience: "12 Years",
    lastTrainingDate: "Oct 2023",
    lastTrainingName: "Quantum Computing Seminar",
    isDrought: false,
    rowClass: ""
  },
  {
    id: "#STAR-2024-042",
    name: "Mark Anthony Santos",
    tags: [
      { label: "GIDA", bg: "bg-error-container", text: "text-on-error-container" },
      { label: "No Web", bg: "bg-slate-200", text: "text-slate-600" }
    ],
    school: "Sitio Libis National High",
    location: "Region VIII / Samar / Lowland",
    specialization: "General Science",
    status: "Teaching Math 10 (Outside)",
    isOutField: true,
    experience: "4 Years",
    lastTrainingDate: "Jan 2021",
    lastTrainingName: "Training Drought (3 yrs)",
    isDrought: true,
    rowClass: "bg-error/5"
  },
  {
    id: "#STAR-2024-015",
    name: "Maria Clara Reyes",
    tags: [{ label: "Connected", bg: "bg-blue-50", text: "text-blue-600" }],
    school: "Cebu City National Science",
    location: "Region VII / Cebu / City",
    specialization: "Chemistry",
    status: "In-Specialization",
    isOutField: false,
    experience: "8 Years",
    lastTrainingDate: "March 2024",
    lastTrainingName: "Lab Management Workshop",
    isDrought: false,
    rowClass: ""
  }
];

export default function TeacherDirectory() {
  // State initialization for future backend data
  const [stats, setStats] = useState(MOCK_STATS);
  const [teachers, setTeachers] = useState(MOCK_TEACHERS);
  const [loading, setLoading] = useState(false);

  /* // TODO: Uncomment when backend API is ready
  useEffect(() => {
    async function fetchDirectoryData() {
      setLoading(true);
      try {
        const response = await api.getTeacherDirectory(); 
        setStats(response.stats);
        setTeachers(response.teachers);
      } catch (error) {
        console.error("Error fetching directory data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDirectoryData();
  }, []);
  */

  if (loading) {
    return <div className="flex h-screen items-center justify-center font-bold text-primary">Loading Directory...</div>;
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto w-full">
      
      {/* Header Actions Section */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-black text-primary font-headline tracking-tight mb-2">Teacher Directory</h2>
          <p className="text-on-surface-variant font-body">
            Manage and monitor the educator database for the Science and Technology Academic Research program. Track specializations and training requirements across all regions.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-surface-container-highest text-primary font-bold rounded-xl text-sm transition-all hover:bg-surface-variant">
            <span className="material-symbols-outlined text-[20px]">upload_file</span>
            Import Data
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 border-2 border-primary text-primary font-bold rounded-xl text-sm transition-all hover:bg-primary/5">
            <span className="material-symbols-outlined text-[20px]">event_repeat</span>
            Queue for Event
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-bold rounded-xl text-sm transition-all hover:shadow-lg hover:shadow-primary/20">
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            Add Teacher
          </button>
        </div>
      </section>

      {/* Filters Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        
        {/* High-Risk Areas Filter */}
        <div className="p-5 bg-surface-container-lowest rounded-xl shadow-sm flex flex-col justify-between border-l-4 border-error/20 cursor-pointer hover:shadow-md group transition-all">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Status Filter</span>
            <h3 className="font-headline font-bold text-lg text-primary">High-Risk Areas</h3>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-3xl font-black text-error">{stats.highRiskAreas}</span>
            <div className="flex items-center bg-error-container text-on-error-container px-2 py-1 rounded-full text-xs font-bold">
              Priority Action
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold text-primary uppercase mt-1">
              Apply Filter <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </div>
          </div>
        </div>

        {/* Training Drought Filter */}
        <div className="p-5 bg-surface-container-lowest rounded-xl shadow-sm flex flex-col justify-between border-l-4 border-secondary/20 cursor-pointer hover:shadow-md group transition-all">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Program Need</span>
            <h3 className="font-headline font-bold text-lg text-primary">Training Drought</h3>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-3xl font-black text-secondary">{stats.trainingDrought}</span>
            <div className="flex items-center bg-secondary-container/20 text-secondary px-2 py-1 rounded-full text-xs font-bold">
              &gt; 2 Years
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold text-primary uppercase mt-1">
              Apply Filter <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </div>
          </div>
        </div>

        {/* Dropdowns */}
        <div className="md:col-span-2 p-5 bg-surface-container-low rounded-xl flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Region</label>
            <select className="w-full bg-surface-container-lowest border-none rounded-lg text-sm font-medium focus:ring-secondary/20 py-2.5 px-3 outline-none">
              <option>All Regions</option>
              <option>NCR - Metro Manila</option>
              <option>Region IV-A - CALABARZON</option>
              <option>Region VII - Central Visayas</option>
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Specialization</label>
            <select className="w-full bg-surface-container-lowest border-none rounded-lg text-sm font-medium focus:ring-secondary/20 py-2.5 px-3 outline-none">
              <option>All Subjects</option>
              <option>Physics</option>
              <option>Advanced Chemistry</option>
              <option>Marine Biology</option>
              <option>STEM Robotics</option>
            </select>
          </div>
          <button className="h-[42px] w-[42px] bg-primary-container text-on-primary-container rounded-lg flex items-center justify-center self-end hover:bg-primary hover:text-white transition-colors">
            <span className="material-symbols-outlined">filter_list</span>
          </button>
        </div>
      </section>

      {/* Data Table Section */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-slate-100">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50">
                <th className="px-6 py-4 border-b border-slate-100 w-10">
                  <input className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4" type="checkbox" />
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Teacher ID & Name</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Location & School</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Specialization</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Experience</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Last Training</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              
              {teachers.map((teacher, index) => (
                <tr key={index} className={`hover:bg-slate-50/80 transition-colors ${teacher.rowClass}`}>
                  <td className="px-6 py-5 w-10">
                    <input className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4" type="checkbox" />
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-mono font-bold text-secondary">{teacher.id}</span>
                      <span className="font-headline font-bold text-primary whitespace-nowrap">{teacher.name}</span>
                      <div className="flex gap-1 mt-1">
                        {teacher.tags.map((tag, tIndex) => (
                          <span key={tIndex} className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${tag.bg} ${tag.text}`}>
                            [{tag.label}]
                          </span>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-on-surface whitespace-nowrap">{teacher.school}</span>
                      <span className="text-xs text-on-surface-variant whitespace-nowrap">{teacher.location}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1.5">
                      <span className={`inline-flex w-fit px-2 py-0.5 rounded-full text-[11px] font-bold ${teacher.isOutField ? 'bg-slate-200 text-slate-600' : 'bg-primary-container text-on-primary-container'}`}>
                        {teacher.specialization}
                      </span>
                      <span className={`text-[10px] font-bold flex items-center gap-1 ${teacher.isOutField ? 'text-error' : 'text-green-600'}`}>
                        <span className="material-symbols-outlined text-xs">
                          {teacher.isOutField ? 'warning' : 'check_circle'}
                        </span>
                        {teacher.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm font-semibold">{teacher.experience}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className={`text-sm ${teacher.isDrought ? 'font-bold text-error' : 'font-medium'}`}>
                        {teacher.lastTrainingDate}
                      </span>
                      <span className={`text-[10px] ${teacher.isDrought ? 'text-error font-medium italic' : 'text-slate-400'}`}>
                        {teacher.lastTrainingName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex gap-2 justify-end">
                      <button className={`p-2 rounded-lg transition-all border ${teacher.isDrought ? 'bg-white border-slate-200 text-primary hover:bg-primary hover:text-white' : 'bg-surface-container-low border-transparent text-primary hover:bg-primary hover:text-white'}`}>
                        <span className="material-symbols-outlined text-sm">visibility</span>
                      </button>
                      <button className={`p-2 rounded-lg transition-all border ${teacher.isDrought ? 'bg-white border-slate-200 text-primary hover:bg-primary hover:text-white' : 'bg-surface-container-low border-transparent text-primary hover:bg-primary hover:text-white'}`}>
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button className="p-2 bg-surface-container-low text-primary rounded-lg hover:bg-primary hover:text-white transition-all">
                        <span className="material-symbols-outlined text-sm">calendar_add_on</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

            </tbody>
          </table>
        </div>
        
        {/* Table Footer / Pagination */}
        <div className="px-6 py-4 bg-slate-50 flex items-center justify-between border-t border-slate-100">
          <span className="text-sm text-slate-500 font-medium">Showing 1 to {teachers.length} of {stats.totalEducators} educators</span>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-primary disabled:opacity-50" disabled>
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button className="px-3 py-1 rounded-lg bg-primary text-white text-sm font-bold">1</button>
            <button className="px-3 py-1 rounded-lg bg-white text-slate-600 text-sm font-bold hover:bg-slate-100 border border-transparent">2</button>
            <button className="px-3 py-1 rounded-lg bg-white text-slate-600 text-sm font-bold hover:bg-slate-100 border border-transparent">3</button>
            <span className="text-slate-400">...</span>
            <button className="px-3 py-1 rounded-lg bg-white text-slate-600 text-sm font-bold hover:bg-slate-100 border border-transparent">312</button>
            <button className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-primary">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}