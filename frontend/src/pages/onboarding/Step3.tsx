import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, TrendingUp } from 'lucide-react'

export default function Step3Workload() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    yearsOfExperience: '',
    numberOfClasses: '',
    studentsPerClass: '',
    workingHours: 40,
    isGIDA: false,
  })

  const getWorkloadLabel = (hours: number) => {
    if (hours < 30) return { label: 'Part-time', color: '#115cb9' }
    if (hours <= 45) return { label: 'Standard', color: '#1a6b3a' }
    return { label: 'Overtime', color: '#d95e00' }
  }

  const workload = getWorkloadLabel(form.workingHours)

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
              Step 03 of 04
            </span>
          </div>
          <h1
            className="text-2xl font-bold text-[#001e40]"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            Professional Workload
          </h1>
          <p className="text-sm text-[#44474e]/70 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Provide precise details about your current teaching commitments to calibrate your profile's research visibility.
          </p>
        </div>

        {/* Form */}
        <div className="px-8 py-6 space-y-5">

          {/* Years of experience */}
          <div className="space-y-1.5">
            <label
              className="text-[0.65rem] font-semibold tracking-widest text-[#44474e] uppercase"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              Total Teaching Experience
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={60}
                placeholder="0"
                value={form.yearsOfExperience}
                onChange={(e) => setForm({ ...form, yearsOfExperience: e.target.value })}
                className="w-full px-4 py-2.5 pr-16 rounded-xl bg-[#f9f9fd] text-[#1a1c1e] placeholder:text-[#44474e]/30 text-sm outline-none focus:ring-2 focus:ring-[#115cb9]/25 transition-all"
                style={{ fontFamily: 'Inter, sans-serif' }}
              />
              <span
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#44474e]/50 font-medium"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Years
              </span>
            </div>
          </div>

          {/* Number of classes + Students per class */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                className="text-[0.65rem] font-semibold tracking-widest text-[#44474e] uppercase"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                Number of Classes
              </label>
              <input
                type="number"
                min={0}
                placeholder="0"
                value={form.numberOfClasses}
                onChange={(e) => setForm({ ...form, numberOfClasses: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#f9f9fd] text-[#1a1c1e] placeholder:text-[#44474e]/30 text-sm outline-none focus:ring-2 focus:ring-[#115cb9]/25 transition-all"
                style={{ fontFamily: 'Inter, sans-serif' }}
              />
              <p className="text-[0.6rem] text-[#44474e]/40 italic" style={{ fontFamily: 'Inter, sans-serif' }}>
                Weekly active course sections
              </p>
            </div>

            <div className="space-y-1.5">
              <label
                className="text-[0.65rem] font-semibold tracking-widest text-[#44474e] uppercase"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                Students Per Class
              </label>
              <input
                type="number"
                min={0}
                placeholder="0"
                value={form.studentsPerClass}
                onChange={(e) => setForm({ ...form, studentsPerClass: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#f9f9fd] text-[#1a1c1e] placeholder:text-[#44474e]/30 text-sm outline-none focus:ring-2 focus:ring-[#115cb9]/25 transition-all"
                style={{ fontFamily: 'Inter, sans-serif' }}
              />
              <p className="text-[0.6rem] text-[#44474e]/40 italic" style={{ fontFamily: 'Inter, sans-serif' }}>
                Average enrollment per section
              </p>
            </div>
          </div>

          {/* Working Hours Slider */}
          <div className="rounded-xl bg-[#f9f9fd] px-5 py-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#001e40]" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Total Working Hours
              </p>
              <div className="flex items-baseline gap-1">
                <span
                  className="text-2xl font-bold"
                  style={{ fontFamily: 'Manrope, sans-serif', color: workload.color }}
                >
                  {form.workingHours}
                </span>
                <span className="text-xs text-[#44474e]/50" style={{ fontFamily: 'Inter, sans-serif' }}>Hrs/Week</span>
              </div>
            </div>

            <div className="relative">
              <input
                type="range"
                min={10}
                max={80}
                value={form.workingHours}
                onChange={(e) => setForm({ ...form, workingHours: Number(e.target.value) })}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #001e40 0%, #115cb9 ${((form.workingHours - 10) / 70) * 100}%, #e1e1e7 ${((form.workingHours - 10) / 70) * 100}%, #e1e1e7 100%)`,
                  accentColor: '#001e40',
                }}
              />
            </div>

            <div className="flex justify-between">
              {['Part-time', 'Standard', 'Overtime'].map((label) => (
                <span
                  key={label}
                  className="text-[0.6rem] tracking-widest uppercase text-[#44474e]/40"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-8 py-5 bg-[#f9f9fd] flex items-center justify-between">
          <button
            onClick={() => navigate('/onboarding/2')}
            className="flex items-center gap-1.5 text-sm text-[#44474e]/60 hover:text-[#001e40] transition-colors"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
              <path d="M11 7H3M6 4L3 7l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>

          <button
            onClick={() => navigate('/onboarding/4')}
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