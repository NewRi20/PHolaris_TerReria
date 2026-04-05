import React, { useState, useEffect } from 'react';

// --- MOCK DATA (Ready for Backend Replacement) ---
const MOCK_PROFILE = {
  name: "Dr. Elena Rodriguez",
  role: "Senior Science Educator",
  tags: [
    { label: "Junior High", bgClass: "bg-primary/5", textClass: "text-primary", borderClass: "border-primary/10" },
    { label: "Physics", bgClass: "bg-secondary/5", textClass: "text-secondary", borderClass: "border-secondary/10" }
  ],
  avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop",
  details: [
    { id: "id", icon: "badge", label: "Teacher ID", value: "PH-STAR-2024-0892" },
    { id: "school", icon: "school", label: "Current School", value: "Metro Manila Science High" },
    { id: "email", icon: "mail", label: "Official Email", value: "e.rodriguez@science.edu.ph" },
    { id: "years", icon: "calendar_month", label: "Years of Service", value: "12 Years" }
  ]
};

const MOCK_ACHIEVEMENTS = [
  { 
    id: 'a1', title: "STEM Integration Master", date: "Issued Oct 2023", icon: "biotech", 
    wrapperClass: "bg-primary-container text-on-primary-container", locked: false 
  },
  { 
    id: 'a2', title: "Digital Literacy 2024", date: "Issued Jan 2024", icon: "devices", 
    wrapperClass: "bg-sky-100 text-sky-700", locked: false 
  },
  { 
    id: 'a3', title: "Pedagogical Expert", date: "Issued Mar 2024", icon: "psychology", 
    wrapperClass: "bg-secondary-container/20 text-secondary", locked: false 
  },
  { 
    id: 'a4', title: "Global Mentor (Locked)", date: "Requires Level 5", icon: "workspace_premium", 
    wrapperClass: "bg-outline-variant text-on-surface-variant", locked: true 
  }
];

export default function TeacherProfile() {
  const [profile, setProfile] = useState(MOCK_PROFILE);
  const [achievements, setAchievements] = useState(MOCK_ACHIEVEMENTS);
  const [loading, setLoading] = useState(false);

  /* // TODO: Uncomment when backend API is ready
  useEffect(() => {
    async function fetchTeacherProfile() {
      setLoading(true);
      try {
        const response = await api.getTeacherProfileData(); 
        setProfile(response.profile);
        setAchievements(response.achievements);
      } catch (error) {
        console.error("Error fetching teacher profile:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTeacherProfile();
  }, []);
  */

  if (loading) {
    return <div className="flex h-screen items-center justify-center font-bold text-primary">Loading Profile...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="mb-10">
        <h2 className="text-4xl font-headline font-extrabold tracking-tight text-primary mb-2">Teacher Profile</h2>
        <p className="text-on-surface-variant font-medium">Manage your academic identity and professional records.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column: Profile Details Section */}
        <section className="space-y-6">
          <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/15 shadow-sm h-full">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="relative mb-6">
                <img 
                  alt="Teacher Headshot" 
                  className="w-40 h-40 rounded-full object-cover ring-4 ring-primary-fixed" 
                  src={profile.avatarUrl} 
                />
                <button className="absolute bottom-2 right-2 bg-primary text-on-primary p-2.5 rounded-full shadow-lg hover:scale-105 transition-transform active:scale-95">
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
              </div>
              <h3 className="text-2xl font-headline font-bold text-primary">{profile.name}</h3>
              <p className="text-secondary font-semibold">{profile.role}</p>
              <div className="mt-4 flex gap-2">
                {profile.tags.map((tag, index) => (
                  <span key={index} className={`px-3 py-1 text-xs font-bold rounded-full border ${tag.bgClass} ${tag.textClass} ${tag.borderClass}`}>
                    {tag.label}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              {profile.details.map((detail) => (
                <div key={detail.id} className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl hover:bg-surface-container transition-colors">
                  <span className="material-symbols-outlined text-primary text-2xl">{detail.icon}</span>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">{detail.label}</p>
                    <p className="text-base font-semibold text-on-surface">{detail.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right Column: Achievements & Actions Section */}
        <section className="space-y-6">
          <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/15 shadow-sm h-full">
            
            {/* Achievements Header */}
            <div className="flex justify-between items-center mb-8">
              <h4 className="text-xl font-headline font-bold text-primary">Achievements</h4>
              <span className="text-sm text-secondary font-bold hover:underline cursor-pointer">View All</span>
            </div>
            
            {/* Achievements Grid */}
            <div className="grid grid-cols-2 gap-4">
              {achievements.map((item) => (
                <div 
                  key={item.id} 
                  className={`flex flex-col items-center gap-3 bg-surface-container p-6 rounded-2xl transition-transform ${item.locked ? 'opacity-50' : 'hover:scale-[1.02]'}`}
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${item.wrapperClass}`}>
                    <span className="material-symbols-outlined text-3xl">{item.icon}</span>
                  </div>
                  <span className="text-xs font-bold text-center leading-tight text-on-surface">{item.title}</span>
                  <p className="text-[10px] text-on-surface-variant text-center">{item.date}</p>
                </div>
              ))}
            </div>

            {/* Quick Actions List */}
            <div className="mt-8 pt-8 border-t border-surface-container-high space-y-4">
              <h5 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Quick Actions</h5>
              <div className="grid grid-cols-1 gap-3">
                
                <button className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl hover:bg-surface-container transition-colors group">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">description</span>
                    <span className="text-sm font-semibold text-on-surface">Service Record</span>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform">chevron_right</span>
                </button>
                
                <button className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl hover:bg-surface-container transition-colors group">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">file_download</span>
                    <span className="text-sm font-semibold text-on-surface">Download PRC License Copy</span>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform">chevron_right</span>
                </button>

              </div>
            </div>
            
          </div>
        </section>

      </div>
    </div>
  );
}