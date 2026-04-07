import React, { useState, useEffect } from 'react';

// --- TYPES (Ready for Backend Integration) ---
interface TeacherTag {
  label: string;
  bg: string;
  text: string;
}

interface Teacher {
  id: string;
  name: string;
  tags: TeacherTag[];
  school: string;
  location: string;
  specialization: string;
  status: string;
  isOutField: boolean;
  experience: string;
  lastTrainingDate: string;
  lastTrainingName: string;
  isDrought: boolean;
}

interface DirectoryStats {
  highRiskAreas: number;
  trainingDrought: number;
  totalEducators: number; 
}

interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
}

// Type for the Events fetched from EventsManagement
interface AvailableEvent {
  id: string;
  title: string;
  region: string;
  category: string;
}

export default function TeacherDirectory() {
  // --- STATE (Initialized empty for backend) ---
  const [stats, setStats] = useState<DirectoryStats>({ highRiskAreas: 0, trainingDrought: 0, totalEducators: 0 });
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({ currentPage: 1, totalPages: 1, totalCount: 0, limit: 10 });
  
  // Filter States
  const [filterRegion, setFilterRegion] = useState('All Regions');
  const [filterSpecialization, setFilterSpecialization] = useState('All Subjects');
  const [searchTrigger, setSearchTrigger] = useState(0); 

  // Interactive UI States
  const [loading, setLoading] = useState(true);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState({ visible: false, title: '', msg: '', type: 'info' });

  // Event Queue Modal States
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
  const [availableEvents, setAvailableEvents] = useState<AvailableEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [isQueueing, setIsQueueing] = useState(false);

  // --- ACTUAL BACKEND FETCH LOGIC ---
  useEffect(() => {
    async function fetchDirectoryData() {
      setLoading(true);
      try {
        // Build query string based on filters and pagination
        const queryParams = new URLSearchParams({
          page: pagination.currentPage.toString(),
          limit: pagination.limit.toString(),
        });
        
        if (filterRegion !== 'All Regions') queryParams.append('region', filterRegion);
        if (filterSpecialization !== 'All Subjects') queryParams.append('specialization', filterSpecialization);

        // REPLACE WITH ACTUAL BACKEND ENDPOINT
        const response = await fetch(`/api/teachers?${queryParams.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch directory data');
        
        const data = await response.json();
        
        // The backend calculates these stats based on the live database!
        setStats(data.stats || { highRiskAreas: 0, trainingDrought: 0, totalEducators: 0 });
        setTeachers(data.teachers || []);
        
        if (data.pagination) {
          setPagination({
            currentPage: data.pagination.currentPage,
            totalPages: data.pagination.totalPages,
            totalCount: data.pagination.totalCount,
            limit: data.pagination.limit
          });
        }
      } catch (error) {
        console.error("Directory API Error:", error);
      } finally {
        setLoading(false);
        setSelectedTeacherIds(new Set()); // Clear selection when data changes
      }
    }
    
    fetchDirectoryData();
  }, [pagination.currentPage, searchTrigger]); 


  // --- INTERACTIVE ACTION HANDLERS ---

  const showToast = (title: string, msg: string, type: 'success' | 'error' | 'info') => {
    setToast({ visible: true, title, msg, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 4000);
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    setSearchTrigger(prev => prev + 1); 
  };

  // 1. Open the Queue Modal and fetch available events
  const handleOpenQueueModal = async () => {
    if (selectedTeacherIds.size === 0) {
      showToast('Action Failed', 'Please select at least one teacher using the checkboxes.', 'error');
      return;
    }
    
    // Simulate fetching active/approved events from EventsManagement API
    // const res = await fetch('/api/events/active');
    // const events = await res.json();
    const mockEventsFromBackend: AvailableEvent[] = [
      { id: 'evt_1', title: 'GIDA Physics Bootcamp', region: 'Region VIII', category: 'Physics' },
      { id: 'evt_2', title: 'Advanced Mathematics Workshop', region: 'BARMM', category: 'Mathematics' },
      { id: 'evt_3', title: 'Chemistry Lab Safety', region: 'CALABARZON', category: 'Chemistry' }
    ];
    
    setAvailableEvents(mockEventsFromBackend);
    if (mockEventsFromBackend.length > 0) {
      setSelectedEventId(mockEventsFromBackend[0].id);
    }
    setIsQueueModalOpen(true);
  };

  // 2. Confirm and submit teachers to the specific event queue
  const handleConfirmQueue = async () => {
    if (!selectedEventId) return;
    setIsQueueing(true);

    try {
      // TODO: Actual API POST to link teachers to the event
      /*
      await fetch('/api/events/assign-teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          eventId: selectedEventId, 
          teacherIds: Array.from(selectedTeacherIds) 
        })
      });
      */

      setTimeout(() => {
        setIsQueueing(false);
        setIsQueueModalOpen(false);
        showToast(
          'Queue Successful', 
          `Successfully assigned ${selectedTeacherIds.size} educators to the selected event.`, 
          'success'
        );
        setSelectedTeacherIds(new Set()); 
      }, 1500);
      
    } catch (error) {
      setIsQueueing(false);
      showToast('Queue Failed', 'An error occurred while assigning teachers.', 'error');
    }
  };

  // Row selection logic
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedTeacherIds(new Set(teachers.map(t => t.id)));
    } else {
      setSelectedTeacherIds(new Set());
    }
  };

  const handleSelectTeacher = (id: string) => {
    setSelectedTeacherIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };

  // Calculate the text for "Showing X to Y of Z"
  const startItem = pagination.totalCount > 0 ? (pagination.currentPage - 1) * pagination.limit + 1 : 0;
  const endItem = Math.min(pagination.currentPage * pagination.limit, pagination.totalCount);

  return (
    <div className="p-8 max-w-[1600px] mx-auto w-full space-y-8 relative">
      
      {/* Header Actions Section */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-black text-primary font-headline tracking-tight mb-2">Teacher Directory</h2>
          <p className="text-slate-500 font-body leading-relaxed">
            Manage and monitor the educator database for the Science and Technology Academic Research (STAR) program. 
            Track specializations and training requirements across all regions, updating in real-time as teachers onboard.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleOpenQueueModal} 
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl text-sm transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          >
            <span className="material-symbols-outlined text-[20px]">event_repeat</span>
            Queue for Event {selectedTeacherIds.size > 0 && `(${selectedTeacherIds.size})`}
          </button>
        </div>
      </section>

      {/* Filters & Stats Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* High-Risk Areas Filter */}
        <div className="p-5 bg-white rounded-xl shadow-sm flex flex-col justify-between border border-slate-200 border-l-4 border-l-error cursor-pointer hover:shadow-md group transition-all">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Status Filter</span>
            <h3 className="font-headline font-bold text-lg text-primary">High-Risk Areas</h3>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-3xl font-black text-error">{stats.highRiskAreas}</span>
            <div className="flex items-center bg-error/10 text-error px-2.5 py-1 rounded-md text-[10px] font-bold border border-error/20">
              Priority Action
            </div>
          </div>
        </div>

        {/* Training Drought Filter */}
        <div className="p-5 bg-white rounded-xl shadow-sm flex flex-col justify-between border border-slate-200 border-l-4 border-l-secondary cursor-pointer hover:shadow-md group transition-all">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Program Need</span>
            <h3 className="font-headline font-bold text-lg text-primary">Training Drought</h3>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-3xl font-black text-secondary">{stats.trainingDrought}</span>
            <div className="flex items-center bg-secondary/10 text-secondary px-2.5 py-1 rounded-md text-[10px] font-bold border border-secondary/20">
              &gt; 2 Years
            </div>
          </div>
        </div>

        {/* Dynamic Dropdowns & Search */}
        <div className="md:col-span-2 p-5 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap gap-4 items-center shadow-inner">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Filter by Region</label>
            <select 
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary py-2.5 px-3 outline-none transition-all shadow-sm"
            >
              <option value="All Regions">All Regions</option>
              <option value="NCR">NCR - National Capital Region</option>
              <option value="CAR">CAR - Cordillera Administrative Region</option>
              <option value="Region I">Region I - Ilocos Region</option>
              <option value="Region II">Region II - Cagayan Valley</option>
              <option value="Region III">Region III - Central Luzon</option>
              <option value="Region IV-A">Region IV-A - CALABARZON</option>
              <option value="MIMAROPA">MIMAROPA Region</option>
              <option value="Region V">Region V - Bicol Region</option>
              <option value="Region VI">Region VI - Western Visayas</option>
              <option value="Region VII">Region VII - Central Visayas</option>
              <option value="Region VIII">Region VIII - Eastern Visayas</option>
              <option value="Region IX">Region IX - Zamboanga Peninsula</option>
              <option value="Region X">Region X - Northern Mindanao</option>
              <option value="Region XI">Region XI - Davao Region</option>
              <option value="Region XII">Region XII - SOCCSKSARGEN</option>
              <option value="Region XIII">Region XIII - Caraga</option>
              <option value="BARMM">BARMM - Bangsamoro Autonomous Region in Muslim Mindanao</option>
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Specialization</label>
<select 
              value={filterSpecialization}
              onChange={(e) => setFilterSpecialization(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary py-2.5 px-3 outline-none transition-all shadow-sm"
            >
              <option value="All Subjects">All Subjects</option>
              
              {/* Core / General Science & Math */}
              <option disabled className="bg-slate-100 font-bold text-slate-500">Core Subjects</option>
              <option value="General Science">General Science</option>
              <option value="Earth Science">Earth Science</option>
              <option value="Earth and Life Science">Earth and Life Science</option>
              <option value="Disaster Readiness and Risk Reduction">Disaster Readiness & Risk Reduction</option>
              <option value="General Mathematics">General Mathematics</option>
              <option value="Statistics and Probability">Statistics and Probability</option>
              
              {/* Specialized STEM Subjects */}
              <option disabled className="bg-slate-100 font-bold text-slate-500 mt-2">Specialized STEM</option>
              <option value="Pre-Calculus">Pre-Calculus</option>
              <option value="Basic Calculus">Basic Calculus</option>
              <option value="General Biology">General Biology</option>
              <option value="General Chemistry">General Chemistry</option>
              <option value="General Physics">General Physics</option>
              
              {/* Technology & Applied Subjects */}
              <option disabled className="bg-slate-100 font-bold text-slate-500 mt-2">Applied Tech / Robotics</option>
              <option value="Empowerment Technologies">Empowerment Technologies</option>
              <option value="STEM Robotics">STEM Robotics</option>
            </select>
          </div>
          <button 
            onClick={handleSearch}
            className="h-[42px] w-[42px] bg-white border border-slate-200 text-slate-500 rounded-lg flex items-center justify-center self-end hover:bg-primary hover:text-white hover:border-primary transition-colors shadow-sm active:scale-95"
          >
            <span className="material-symbols-outlined">search</span>
          </button>
        </div>
      </section>

      {/* Data Table Section */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-primary">
            <span className="material-symbols-outlined text-4xl mb-4 animate-spin">refresh</span>
            <div className="font-bold tracking-widest uppercase text-sm">Querying Database...</div>
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 w-10">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer" 
                      checked={teachers.length > 0 && selectedTeacherIds.size === teachers.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Teacher ID & Name</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Location & School</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Specialization</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Experience</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Last Training</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions needed based on analysis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                
                {teachers.length > 0 ? teachers.map((teacher) => (
                  <tr key={teacher.id} className={`hover:bg-slate-50 transition-colors ${selectedTeacherIds.has(teacher.id) ? 'bg-primary/5' : teacher.isDrought ? 'bg-red-50/30' : 'bg-white'}`}>
                    <td className="px-6 py-5 w-10">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer" 
                        checked={selectedTeacherIds.has(teacher.id)}
                        onChange={() => handleSelectTeacher(teacher.id)}
                      />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-mono font-bold text-slate-400 mb-0.5">{teacher.id}</span>
                        <span className="font-headline font-bold text-primary whitespace-nowrap">{teacher.name}</span>
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {teacher.tags.map((tag, tIndex) => (
                            <span key={tIndex} className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${tag.bg} ${tag.text} border border-transparent`}>
                              {tag.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700 whitespace-nowrap">{teacher.school}</span>
                        <span className="text-xs text-slate-500 mt-0.5 whitespace-nowrap">{teacher.location}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col items-start gap-1.5">
                        <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold border ${teacher.isOutField ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                          {teacher.specialization}
                        </span>
                        <span className={`text-[10px] font-bold flex items-center gap-1 mt-0.5 ${teacher.isOutField ? 'text-error' : 'text-emerald-600'}`}>
                          <span className="material-symbols-outlined text-[14px]">
                            {teacher.isOutField ? 'warning' : 'check_circle'}
                          </span>
                          {teacher.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-bold text-slate-700">{teacher.experience}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className={`text-sm ${teacher.isDrought ? 'font-bold text-error' : 'font-bold text-slate-700'}`}>
                          {teacher.lastTrainingDate}
                        </span>
                        <span className={`text-[10px] mt-0.5 ${teacher.isDrought ? 'text-error font-medium italic' : 'text-slate-500'}`}>
                          {teacher.lastTrainingName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => showToast('View Profile', `Opening records for ${teacher.name}`, 'info')} title="View Profile" className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-primary hover:bg-slate-50 transition-colors shadow-sm">
                          <span className="material-symbols-outlined text-sm">visibility</span>
                        </button>
                        <button onClick={() => showToast('Edit Record', `Opening editor for ${teacher.name}`, 'info')} title="Edit Record" className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-primary hover:bg-slate-50 transition-colors shadow-sm">
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 bg-slate-50/50">
                      <span className="material-symbols-outlined text-4xl mb-2">person_search</span>
                      <p className="text-sm font-bold">No educators found matching your criteria.</p>
                    </td>
                  </tr>
                )}

              </tbody>
            </table>
          </div>
        )}
        
        {/* Dynamic Pagination Footer */}
        <div className="px-6 py-4 bg-slate-50 flex flex-col md:flex-row items-center justify-between border-t border-slate-200 gap-4">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">
            {pagination.totalCount > 0 
              ? `Showing ${startItem} to ${endItem} of ${pagination.totalCount.toLocaleString()} educators` 
              : 'No educators found'
            }
          </span>
          
          {pagination.totalCount > 0 && (
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1 || loading}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-primary hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              
              <div className="flex items-center px-3 gap-1">
                <span className="text-sm font-bold text-primary">{pagination.currentPage}</span>
                <span className="text-sm font-medium text-slate-400">/</span>
                <span className="text-sm font-medium text-slate-500">{pagination.totalPages}</span>
              </div>

              <button 
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages || loading}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-primary hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          )}
        </div>

      </div>

      {/* --- EVENT ASSIGNMENT QUEUE MODAL --- */}
      {isQueueModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="font-headline font-bold text-lg text-primary">Assign Teachers to Event</h3>
                <p className="text-xs text-slate-500 mt-0.5">Queueing {selectedTeacherIds.size} selected educators.</p>
              </div>
              <button onClick={() => setIsQueueModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 bg-slate-50/50">
              <label className="block text-sm font-bold text-slate-700 mb-2">Select Target Event</label>
              
              {availableEvents.length > 0 ? (
                <div className="space-y-3">
                  {availableEvents.map(event => (
                    <label 
                      key={event.id}
                      className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedEventId === event.id 
                          ? 'bg-primary/5 border-primary shadow-sm' 
                          : 'bg-white border-slate-200 hover:border-primary/50'
                      }`}
                    >
                      <div className="mt-0.5">
                        <input 
                          type="radio" 
                          name="event_selection" 
                          value={event.id}
                          checked={selectedEventId === event.id}
                          onChange={(e) => setSelectedEventId(e.target.value)}
                          className="w-4 h-4 text-primary border-slate-300 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-primary">{event.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{event.region} • {event.category}</p>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 bg-white border border-slate-200 rounded-xl">
                  <p className="text-sm">No active events found.</p>
                  <p className="text-xs mt-1">Please create an event in Events Management first.</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-end gap-3">
              <button 
                onClick={() => setIsQueueModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmQueue}
                disabled={!selectedEventId || isQueueing}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {isQueueing ? (
                  <><span className="material-symbols-outlined text-sm animate-spin">refresh</span> Processing...</>
                ) : (
                  <><span className="material-symbols-outlined text-sm">event_available</span> Confirm Assignment</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* React Toast Notification System */}
      <div 
        className={`fixed bottom-8 right-8 z-[150] transition-all duration-500 ease-out ${toast.visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95 pointer-events-none'}`}
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