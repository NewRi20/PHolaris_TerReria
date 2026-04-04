import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, BookOpen, ShieldCheck, TrendingUp } from 'lucide-react'

const GRADE_LEVELS = [
  'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
  'Grade 11', 'Grade 12', 'College',
]

export default function Step2AcademicProfile() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    gradeLevel: '',
    areaOfSpecialization: '',
    subjectTaught: '',
    teachingOutsideSpecialization: false,
  })

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm({ ...form, [field]: e.target.value })

  return (
    <div className="space-y-6">

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(0,30,64,0.05)] overflow-hidden">

        {/* Card header */}
        <div className="px-8 pt-8 pb-6 border-b border-[#f3f3f7]">
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-[0.6rem] font-bold tracking-widest text-[#115cb9] uppercase bg-[#115cb9]/8 px-2.5 py-1 rounded-full"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              Step 02 of 04
            </span>
          </div>
          <h1
            className="text-2xl font-bold text-[#001e40]"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            Academic Profile
          </h1>
          <p className="text-sm text-[#44474e]/70 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Please provide accurate details regarding your teaching foundations.
          </p>
        </div>

        {/* Form */}
        <div className="px-8 py-6 space-y-5">

          {/* Grade Level + Area of Specialization */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                className="text-[0.65rem] font-semibold tracking-widest text-[#44474e] uppercase"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                Grade Level Taught
              </label>
              <div className="relative">
                <select
                  value={form.gradeLevel}
                  onChange={set('gradeLevel')}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#f9f9fd] text-[#1a1c1e] text-sm outline-none focus:ring-2 focus:ring-[#115cb9]/25 transition-all appearance-none pr-9"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <option value="" disabled>Select Grade Level</option>
                  {GRADE_LEVELS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#44474e]/40 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                className="text-[0.65rem] font-semibold tracking-widest text-[#44474e] uppercase"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                Area of Specialization (Major)
              </label>
              <input
                type="text"
                placeholder="e.g. Theoretical Physics"
                value={form.areaOfSpecialization}
                onChange={set('areaOfSpecialization')}
                className="w-full px-4 py-2.5 rounded-xl bg-[#f9f9fd] text-[#1a1c1e] placeholder:text-[#44474e]/30 text-sm outline-none focus:ring-2 focus:ring-[#115cb9]/25 transition-all"
                style={{ fontFamily: 'Inter, sans-serif' }}
              />
            </div>
          </div>

          {/* Current Subject Taught */}
          <div className="space-y-1.5">
            <label
              className="text-[0.65rem] font-semibold tracking-widest text-[#44474e] uppercase"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              Current Subject Taught
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                <BookOpen className="w-4 h-4 text-[#44474e]/30" />
              </div>
              <input
                type="text"
                placeholder="e.g. Advanced Calculus & Differential Equations"
                value={form.subjectTaught}
                onChange={set('subjectTaught')}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#f9f9fd] text-[#1a1c1e] placeholder:text-[#44474e]/30 text-sm outline-none focus:ring-2 focus:ring-[#115cb9]/25 transition-all"
                style={{ fontFamily: 'Inter, sans-serif' }}
              />
            </div>
          </div>

          {/* Teaching outside specialization toggle */}
          <div className="rounded-xl bg-[#f9f9fd] px-5 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#115cb9]/10 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-4 h-4 text-[#115cb9]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#001e40]" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  Teaching outside specialization?
                </p>
                <p className="text-xs text-[#44474e]/60 mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Are you currently assigned to subjects outside your major?
                </p>
              </div>
            </div>

            {/* Toggle */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-[#44474e]/50" style={{ fontFamily: 'Inter, sans-serif' }}>NO</span>
              <button
                type="button"
                onClick={() => setForm({ ...form, teachingOutsideSpecialization: !form.teachingOutsideSpecialization })}
                className={`relative w-11 h-6 rounded-full transition-all duration-200 ${
                  form.teachingOutsideSpecialization ? 'bg-[#115cb9]' : 'bg-[#e1e1e7]'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${
                    form.teachingOutsideSpecialization ? 'left-[1.375rem]' : 'left-0.5'
                  }`}
                />
              </button>
              <span className="text-xs text-[#44474e]/50" style={{ fontFamily: 'Inter, sans-serif' }}>YES</span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-8 py-5 bg-[#f9f9fd] flex items-center justify-between">
          <button
            onClick={() => navigate('/onboarding/1')}
            className="flex items-center gap-1.5 text-sm text-[#44474e]/60 hover:text-[#001e40] transition-colors"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
              <path d="M11 7H3M6 4L3 7l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/onboarding/3')}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#001e40] to-[#1a3a5c] text-white text-sm font-semibold hover:shadow-[0_4px_20px_rgba(0,30,64,0.25)] active:scale-[0.99] transition-all"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              Continue
              <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_16px_rgba(0,30,64,0.05)] flex gap-4">
          <div className="w-9 h-9 rounded-xl bg-[#115cb9]/10 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-4 h-4 text-[#115cb9]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#001e40]" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Data Privacy Guard
            </p>
            <p className="text-xs text-[#44474e]/60 mt-1 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
              PHolaris encrypts all professional credentials in accordance with DOST security protocols.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_16px_rgba(0,30,64,0.05)] flex gap-4">
          <div className="w-9 h-9 rounded-xl bg-[#1a6b3a]/10 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-[#1a6b3a]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#001e40]" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Professional Growth
            </p>
            <p className="text-xs text-[#44474e]/60 mt-1 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
              Completing your profile unlocks specialized grants and equipment access for your specific academic field.
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}