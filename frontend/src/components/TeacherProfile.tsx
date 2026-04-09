import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';

// --- TYPES (Ready for Backend Integration) ---
export interface TeacherProfileData {
  id: string;
  fullName: string;
  role: string;
  specialization: string;
  school: string;
  email: string;
  serviceStartDate?: string; // Optional derived value when backend only has years_experience
  yearsExperience?: number;
  avatarUrl: string;
}

export interface Achievement {
  id: string;
  title: string;
  date: string; // ISO Format (e.g., "2024-03-15") for sorting and drought calc
  icon: string;
  type: 'EVENT' | 'CERTIFICATION' | 'LOCKED';
  issuer: string;
}

interface BackendTeacherProfileResponse {
  id: string;
  teacher_id_number?: string | null;
  school?: string | null;
  grade_level_taught?: string | null;
  current_subject?: string | null;
  specialization?: string | null;
  years_experience?: number | null;
}

interface BackendTrainingResponse {
  id: string;
  training_name: string;
  training_type?: string | null;
  date_attended?: string | null;
  provider?: string | null;
  created_at: string;
}

interface BackendTeacherFullResponse {
  profile: BackendTeacherProfileResponse;
  trainings: BackendTrainingResponse[];
  email: string;
  full_name?: string | null;
}

function deriveServiceStartDate(yearsExperience?: number | null) {
  if (typeof yearsExperience !== 'number' || yearsExperience < 0) return undefined;
  const today = new Date();
  const derived = new Date(today.getFullYear() - yearsExperience, today.getMonth(), today.getDate());
  return derived.toISOString().slice(0, 10);
}

function deriveYearsFromServiceStartDate(serviceStartDate?: string) {
  if (!serviceStartDate) return undefined;

  const start = new Date(serviceStartDate);
  if (Number.isNaN(start.getTime())) return undefined;

  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  if (now.getMonth() < start.getMonth() || (now.getMonth() === start.getMonth() && now.getDate() < start.getDate())) {
    years -= 1;
  }

  return Math.max(0, years);
}

function mapTrainingToAchievement(training: BackendTrainingResponse): Achievement {
  const normalizedType = (training.training_type ?? '').toLowerCase();
  const isEvent = normalizedType.includes('event') || normalizedType.includes('seminar') || normalizedType.includes('workshop');

  return {
    id: `training_${training.id}`,
    title: training.training_name,
    date: training.date_attended ?? training.created_at,
    icon: isEvent ? 'event_available' : 'workspace_premium',
    type: isEvent ? 'EVENT' : 'CERTIFICATION',
    issuer: training.provider ?? 'DOST STAR',
  };
}

function mapTeacherApiToProfile(data: BackendTeacherFullResponse): TeacherProfileData {
  const yearsExperience = data.profile.years_experience ?? undefined;

  return {
    id: data.profile.teacher_id_number ?? String(data.profile.id),
    fullName: data.full_name ?? 'Teacher',
    role: data.profile.grade_level_taught ?? 'STEM Educator',
    specialization: data.profile.specialization ?? data.profile.current_subject ?? 'Not set',
    school: data.profile.school ?? 'Not set',
    email: data.email,
    yearsExperience,
    serviceStartDate: deriveServiceStartDate(yearsExperience),
    avatarUrl: '',
  };
}

export default function TeacherProfile() {
  // --- STATES ---
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ visible: false, title: '', msg: '', type: 'info' });
  
  const [profile, setProfile] = useState<TeacherProfileData | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  // Profile Edit States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editDraft, setEditDraft] = useState<Partial<TeacherProfileData>>({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Certification Edit/Create States
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [certDraft, setCertDraft] = useState<Partial<Achievement>>({});
  
  // Full History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const loadTeacherProfile = async () => {
    setLoading(true);
    try {
      const data = await api.getMyTeacherProfile() as BackendTeacherFullResponse;
      setProfile((previous) => ({
        ...mapTeacherApiToProfile(data),
        avatarUrl: previous?.avatarUrl ?? '',
      }));
      setAchievements(
        (data.trainings ?? [])
          .map(mapTrainingToAchievement)
          .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()),
      );
    } catch (error) {
      console.error('Error fetching teacher profile:', error);
      setToast({
        visible: true,
        title: 'Sync Error',
        msg: 'Could not load your latest profile records.',
        type: 'error',
      });
      setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 4000);
    } finally {
      setLoading(false);
    }
  };

  // --- ACTUAL BACKEND FETCH LOGIC ---
  useEffect(() => {
    void loadTeacherProfile();
  }, []);


  // --- DYNAMIC COMPUTATIONS ---

  // 1. Calculate Years of Experience dynamically based on serviceStartDate
  const yearsOfExperience = useMemo(() => {
    if (typeof profile?.yearsExperience === 'number') {
      return Math.max(0, profile.yearsExperience);
    }

    if (!profile?.serviceStartDate) return 0;
    const start = new Date(profile.serviceStartDate);
    const now = new Date();
    let years = now.getFullYear() - start.getFullYear();
    if (now.getMonth() < start.getMonth() || (now.getMonth() === start.getMonth() && now.getDate() < start.getDate())) {
      years--;
    }
    return Math.max(0, years);
  }, [profile?.serviceStartDate, profile?.yearsExperience]);

  // 2. Automatically compute "Training Drought" and "Last Training Date" from the achievements list
  const { isDrought, lastTrainingStr } = useMemo(() => {
    const validTrainings = achievements
      .filter(a => a.type !== 'LOCKED')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (validTrainings.length === 0) {
      return { isDrought: true, lastTrainingStr: "No training records found" };
    }

    const latest = validTrainings[0];
    const latestDate = new Date(latest.date);
    const now = new Date();
    
    // Check if the latest training is older than 2 years (Drought threshold)
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(now.getFullYear() - 2);

    const formattedDate = latestDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    return { 
      isDrought: latestDate < twoYearsAgo, 
      lastTrainingStr: formattedDate 
    };
  }, [achievements]);


  // --- HANDLERS ---

  const showToast = (title: string, msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ visible: true, title, msg, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 4000);
  };

  // Profile File Upload Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const yearsExperience =
        deriveYearsFromServiceStartDate(editDraft.serviceStartDate) ??
        profile.yearsExperience ??
        deriveYearsFromServiceStartDate(profile.serviceStartDate);

      await api.updateMyTeacherProfile({
        school: editDraft.school ?? profile.school,
        grade_level_taught: editDraft.role ?? profile.role,
        specialization: editDraft.specialization ?? profile.specialization,
        current_subject: editDraft.specialization ?? profile.specialization,
        years_experience: yearsExperience,
      });

      setProfile((previous) => {
        if (!previous) return previous;
        return {
          ...previous,
          school: editDraft.school ?? previous.school,
          role: editDraft.role ?? previous.role,
          specialization: editDraft.specialization ?? previous.specialization,
          yearsExperience: yearsExperience ?? previous.yearsExperience,
          serviceStartDate: editDraft.serviceStartDate ?? previous.serviceStartDate,
          avatarUrl: avatarPreview ?? previous.avatarUrl,
        };
      });

      if (editDraft.fullName && editDraft.fullName !== profile.fullName) {
        showToast('Partial Update', 'Full name updates are not available from this endpoint yet.', 'info');
      } else if (editDraft.email && editDraft.email !== profile.email) {
        showToast('Partial Update', 'Email updates are not available from this endpoint yet.', 'info');
      } else {
        showToast('Profile Updated', 'Your identity details have been successfully updated.', 'success');
      }

      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating teacher profile:', error);
      showToast('Error', 'Could not update profile at this time.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Certification Handlers
  const openCertModal = (cert?: Achievement) => {
    if (cert) setCertDraft(cert);
    else setCertDraft({ type: 'CERTIFICATION' }); // Default for new
    setIsCertModalOpen(true);
  };

  const handleSaveCert = async () => {
    if (!certDraft.title || !certDraft.issuer || !certDraft.date) {
      showToast('Validation Error', 'Please fill out all fields.', 'error');
      return;
    }

    setSaving(true);
    try {
      if (certDraft.id) {
        showToast('Not Supported Yet', 'Updating an existing training record is not available yet.', 'info');
        return;
      }

      const created = await api.addMyTraining({
        training_name: certDraft.title,
        training_type: certDraft.type === 'EVENT' ? 'Seminar' : 'Certification',
        date_attended: certDraft.date,
        provider: certDraft.issuer,
        subject_area: profile?.specialization,
      }) as BackendTrainingResponse;

      const newAchievement = mapTrainingToAchievement(created);
      setAchievements((previous) => [newAchievement, ...previous]);
      setIsCertModalOpen(false);
      showToast('Record Saved', `Successfully saved "${certDraft.title}".`, 'success');
    } catch (error) {
      console.error('Error saving training record:', error);
      showToast('Error', 'Could not save certification.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCert = async (id: string) => {
    if(!confirm("Are you sure you want to remove this record?")) return;

    try {
      if (id.startsWith('training_')) {
        showToast('Not Supported Yet', 'Deleting an existing training record is not available yet.', 'info');
        return;
      }

      setAchievements((prev) => prev.filter((a) => a.id !== id));
      showToast('Record Removed', 'The local certification draft has been deleted.', 'info');
    } catch (error) {
      showToast('Error', 'Could not delete certification.', 'error');
    }
  };

  // Format Helper for dates inside the list
  const formatDisplayDate = (isoStr: string) => {
    if(isoStr === '9999-12-31') return 'Locked';
    try {
      return new Date(isoStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return isoStr;
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-primary bg-slate-50/50">
        <span className="material-symbols-outlined text-4xl mb-4 animate-spin">refresh</span>
        <div className="font-bold tracking-widest uppercase text-sm">Syncing Identity Records...</div>
      </div>
    );
  }

  // Display max 6 achievements on the main page
  const displayedAchievements = achievements.slice(0, 6);
  const hasMoreAchievements = achievements.length > 6;
  
  // Safe Avatar Generator
  const displayAvatar = profile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName)}&background=0ea5e9&color=fff&rounded=true&bold=true`;

  return (
    <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-8 p-8 relative">
      
      {/* Header */}
      <div className="flex flex-col gap-2 shrink-0">
        <h1 className="text-3xl font-extrabold text-primary tracking-tight font-headline">My Profile</h1>
        <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
          Manage your professional identity, view your academic records, and monitor your training compliance with the DOST STAR Program.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Identity & Contact (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-50 to-transparent"></div>
            
            {/* Edit Button */}
            <button 
              onClick={() => {
                setEditDraft(profile);
                setAvatarPreview(null);
                setIsEditModalOpen(true);
              }}
              className="absolute top-6 right-6 p-2 bg-white rounded-full shadow-sm border border-slate-200 text-slate-400 hover:text-primary hover:border-primary transition-all z-10"
              title="Edit Profile"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
            </button>

            {/* Avatar & Name */}
            <div className="relative z-10 flex flex-col items-center text-center mt-4">
              <div className="relative mb-5">
                <img 
                  src={displayAvatar} 
                  alt="Teacher Profile" 
                  className="w-32 h-32 rounded-full object-cover ring-4 ring-white shadow-md border border-slate-100 bg-white"
                />
              </div>
              <h2 className="text-2xl font-headline font-extrabold text-primary tracking-tight">{profile.fullName}</h2>
              <p className="text-sm font-bold text-blue-600 mt-1">{profile.role}</p>
              
              <div className="flex gap-2 mt-4 flex-wrap justify-center">
                <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                  {profile.school}
                </span>
                <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md bg-primary/5 text-primary border border-primary/20">
                  {profile.specialization}
                </span>
              </div>
            </div>

            {/* Details List */}
            <div className="mt-8 space-y-4 pt-8 border-t border-slate-100 relative z-10">
              <div className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">badge</span>
                </div>
                <div className="overflow-hidden">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Teacher ID</p>
                  <p className="text-sm font-semibold text-slate-800 truncate">{profile.id}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                </div>
                <div className="overflow-hidden">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Official Email</p>
                  <p className="text-sm font-semibold text-slate-800 truncate">{profile.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">work_history</span>
                </div>
                <div className="overflow-hidden">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Experience</p>
                  <p className="text-sm font-semibold text-slate-800 truncate">{yearsOfExperience} Years in Service</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Professional Development (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Training Compliance Status Banner */}
          <div className={`rounded-3xl p-6 shadow-sm border flex items-center justify-between ${
            isDrought 
              ? 'bg-error/5 border-error/20' 
              : 'bg-emerald-50 border-emerald-200'
          }`}>
            <div className="flex items-start gap-4">
              <span className={`material-symbols-outlined text-3xl mt-1 ${isDrought ? 'text-error' : 'text-emerald-500'}`}>
                {isDrought ? 'warning' : 'verified'}
              </span>
              <div>
                <h3 className={`text-lg font-bold font-headline ${isDrought ? 'text-error' : 'text-emerald-700'}`}>
                  {isDrought ? 'Training Drought Detected' : 'Training Compliant'}
                </h3>
                <p className={`text-sm mt-0.5 ${isDrought ? 'text-error/80' : 'text-emerald-600/80'}`}>
                  Last recorded professional development: <strong>{lastTrainingStr}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Achievements & Certifications Grid */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h4 className="text-xl font-headline font-extrabold text-primary">Professional Development</h4>
                <p className="text-xs text-slate-500 mt-1">Manage your completed events and certifications.</p>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-slate-200 flex items-center">
                  {achievements.filter(a => a.type !== 'LOCKED').length} Records
                </span>
                <button 
                  onClick={() => openCertModal()}
                  className="px-3 py-1.5 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-lg flex items-center gap-1 hover:bg-primary/90 transition-all shadow-sm"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span> Add Record
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedAchievements.map((item) => (
                <div 
                  key={item.id} 
                  className={`flex items-center gap-4 p-5 rounded-2xl border transition-all group ${
                    item.type === 'LOCKED' 
                      ? 'bg-slate-50/50 border-slate-200 opacity-60' 
                      : 'bg-white border-slate-200 hover:shadow-md hover:border-slate-300'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    item.type === 'LOCKED' ? 'bg-slate-200 text-slate-400' :
                    item.type === 'EVENT' ? 'bg-blue-50 text-blue-600' : 
                    'bg-emerald-50 text-emerald-600'
                  }`}>
                    <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h5 className="text-sm font-bold text-slate-900 truncate">{item.title}</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5">{item.issuer}</p>
                  </div>
                  
                  {/* Clean Edit/Delete Buttons Setup */}
                  <div className="w-20 shrink-0 h-8 relative flex items-center justify-end">
                    {/* Default State: Date */}
                    <div className="absolute right-0 transition-opacity duration-200 group-hover:opacity-0">
                      {item.type === 'LOCKED' ? (
                        <span className="material-symbols-outlined text-slate-400 text-sm">lock</span>
                      ) : (
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200 whitespace-nowrap">
                          {formatDisplayDate(item.date)}
                        </span>
                      )}
                    </div>

                    {/* Hover State: Actions */}
                    {item.type !== 'LOCKED' && (
                      <div className="absolute right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white pl-2">
                        <button onClick={() => openCertModal(item)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-md transition-colors" title="Edit">
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button onClick={() => handleDeleteCert(item.id)} className="p-1.5 text-slate-400 hover:text-error hover:bg-error/10 rounded-md transition-colors" title="Delete">
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* View More Button (Shows if > 6 records) */}
            {hasMoreAchievements && (
              <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center">
                 <button 
                    onClick={() => setIsHistoryModalOpen(true)}
                    className="px-6 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-primary hover:bg-slate-100 hover:shadow-sm transition-all flex items-center gap-2"
                  >
                   View All Training History ({achievements.length}) <span className="material-symbols-outlined text-[16px]">expand_content</span>
                 </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- EDIT PROFILE MODAL (WITH FILE UPLOAD) --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-headline font-extrabold text-xl text-primary">Edit Identity & Records</h3>
                <p className="text-xs text-slate-500 mt-0.5">Update your basic information and academic status.</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Basic Identity with File Upload */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Basic Identity</h4>
                
                {/* File Upload Section */}
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <img 
                    src={avatarPreview || editDraft.avatarUrl || displayAvatar} 
                    alt="Preview" 
                    className="w-16 h-16 rounded-full object-cover border border-slate-300 bg-white"
                  />
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Profile Picture</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                    <input 
                      type="text" 
                      value={editDraft.fullName || ''}
                      onChange={(e) => setEditDraft({...editDraft, fullName: e.target.value})}
                      className="w-full bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary p-3 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 ml-1">Contact Email</label>
                    <input 
                      type="email" 
                      value={editDraft.email || ''}
                      onChange={(e) => setEditDraft({...editDraft, email: e.target.value})}
                      className="w-full bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary p-3 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Academic & Experience */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Academic & Experience</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 ml-1">Current School</label>
                    <input 
                      type="text" 
                      value={editDraft.school || ''}
                      onChange={(e) => setEditDraft({...editDraft, school: e.target.value})}
                      className="w-full bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary p-3 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 ml-1">Role / Title</label>
                    <input 
                      type="text" 
                      value={editDraft.role || ''}
                      onChange={(e) => setEditDraft({...editDraft, role: e.target.value})}
                      className="w-full bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary p-3 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 ml-1">Specialization</label>
                    <select 
                      value={editDraft.specialization || ''}
                      onChange={(e) => setEditDraft({...editDraft, specialization: e.target.value})}
                      className="w-full bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary p-3 outline-none transition-all"
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
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 ml-1">Service Start Date</label>
                    <input 
                      type="date" 
                      value={editDraft.serviceStartDate || ''}
                      onChange={(e) => setEditDraft({...editDraft, serviceStartDate: e.target.value})}
                      className="w-full bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary p-3 outline-none transition-all text-slate-700"
                    />
                  </div>
                </div>
              </div>

            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveProfile}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors shadow-md flex items-center gap-2 disabled:opacity-70"
              >
                {saving ? (
                  <><span className="material-symbols-outlined text-sm animate-spin">refresh</span> Saving...</>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD / EDIT CERTIFICATION MODAL --- */}
      {isCertModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-headline font-extrabold text-lg text-primary">
                {certDraft.id ? 'Edit Record' : 'Add New Record'}
              </h3>
              <button onClick={() => setIsCertModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 ml-1">Record Type</label>
                <select 
                  value={certDraft.type || 'CERTIFICATION'}
                  onChange={(e) => setCertDraft({...certDraft, type: e.target.value as any})}
                  className="w-full bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary p-3 outline-none transition-all"
                >
                  <option value="CERTIFICATION">Certification / Course</option>
                  <option value="EVENT">Event / Seminar</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 ml-1">Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Advanced Pedagogy Workshop"
                  value={certDraft.title || ''}
                  onChange={(e) => setCertDraft({...certDraft, title: e.target.value})}
                  className="w-full bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary p-3 outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 ml-1">Issuer / Organizer</label>
                  <input 
                    type="text" 
                    placeholder="e.g. DepEd"
                    value={certDraft.issuer || ''}
                    onChange={(e) => setCertDraft({...certDraft, issuer: e.target.value})}
                    className="w-full bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary p-3 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 ml-1">Date Completed</label>
                  <input 
                    type="date" 
                    value={certDraft.date || ''}
                    onChange={(e) => setCertDraft({...certDraft, date: e.target.value})}
                    className="w-full bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary p-3 outline-none transition-all text-slate-700"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsCertModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveCert}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors shadow-md flex items-center gap-2 disabled:opacity-70"
              >
                {saving ? <span className="material-symbols-outlined text-sm animate-spin">refresh</span> : <span className="material-symbols-outlined text-sm">save</span>}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- FULL TRAINING HISTORY MODAL ("View More") --- */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
            
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-headline font-extrabold text-xl text-primary">Full Training History</h3>
                <p className="text-xs text-slate-500 mt-1">Complete record of your professional development.</p>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-slate-50/50 flex-1">
              <div className="space-y-3">
                {achievements.map((item) => (
                  <div key={item.id} className={`flex items-center gap-4 p-4 rounded-2xl border bg-white shadow-sm transition-all group ${item.type === 'LOCKED' ? 'opacity-60 bg-slate-50 border-slate-200' : 'border-slate-200 hover:border-slate-300'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      item.type === 'LOCKED' ? 'bg-slate-200 text-slate-400' :
                      item.type === 'EVENT' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{item.title}</h4>
                      <p className="text-xs text-slate-500 truncate">{item.issuer}</p>
                    </div>
                    
                    {/* Consistent Modify Buttons for the Modal */}
                    <div className="w-24 shrink-0 h-8 relative flex items-center justify-end">
                      <div className="absolute right-0 transition-opacity duration-200 group-hover:opacity-0">
                        {item.type === 'LOCKED' ? (
                          <span className="material-symbols-outlined text-slate-400 text-sm">lock</span>
                        ) : (
                          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200 whitespace-nowrap">
                            {formatDisplayDate(item.date)}
                          </span>
                        )}
                      </div>

                      {item.type !== 'LOCKED' && (
                        <div className="absolute right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white pl-2">
                          <button onClick={() => openCertModal(item)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-md transition-colors" title="Edit">
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button onClick={() => handleDeleteCert(item.id)} className="p-1.5 text-slate-400 hover:text-error hover:bg-error/10 rounded-md transition-colors" title="Delete">
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* React Toast Notification System */}
      <div 
        className={`fixed bottom-8 right-8 z-[400] transition-all duration-500 ease-out ${toast.visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95 pointer-events-none'}`}
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