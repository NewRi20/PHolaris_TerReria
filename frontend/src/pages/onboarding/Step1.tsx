import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ShieldCheck, TrendingUp } from 'lucide-react'
import regionsData from '@/constant/regions/regions_provinces.json'

export default function Step1BasicIdentity() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    teacherId: '',
    fullName: '',
    schoolName: '',
    region: '',
    divisionProvince: '',
  })

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm({ ...form, [field]: e.target.value })

  const selectedRegion = regionsData.regions.find((r) => r.code === form.region)

  const handleContinue = () => {
    navigate('/onboarding/2')
  }

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
              Step 01 of 04
            </span>
          </div>
          <h1
            className="text-2xl font-bold text-[#001e40]"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            Basic Identity
          </h1>
          <p className="text-sm text-[#44474e]/70 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Foundational data for your STAR Program record.
          </p>
        </div>

        {/* Form */}
        <div className="px-8 py-6 space-y-5">

          {/* Teacher ID + Full Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                className="text-[0.65rem] font-semibold tracking-widest text-[#44474e] uppercase"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                Teacher ID
              </label>
              <input
                type="text"
                placeholder="e.g. T-1234567"
                value={form.teacherId}
                onChange={set('teacherId')}
                className="w-full px-4 py-2.5 rounded-xl bg-[#f9f9fd] text-[#1a1c1e] placeholder:text-[#44474e]/30 text-sm outline-none focus:ring-2 focus:ring-[#115cb9]/25 transition-all"
                style={{ fontFamily: 'Inter, sans-serif' }}
              />
            </div>

            <div className="space-y-1.5">
              <label
                className="text-[0.65rem] font-semibold tracking-widest text-[#44474e] uppercase"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                Full Name
              </label>
              <input
                type="text"
                placeholder="First Name, Middle Initial, Surname"
                value={form.fullName}
                onChange={set('fullName')}
                className="w-full px-4 py-2.5 rounded-xl bg-[#f9f9fd] text-[#1a1c1e] placeholder:text-[#44474e]/30 text-sm outline-none focus:ring-2 focus:ring-[#115cb9]/25 transition-all"
                style={{ fontFamily: 'Inter, sans-serif' }}
              />
            </div>
          </div>

          {/* School Name */}
          <div className="space-y-1.5">
            <label
              className="text-[0.65rem] font-semibold tracking-widest text-[#44474e] uppercase"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              School Name
            </label>
            <input
              type="text"
              placeholder="Complete Name of Educational Institution"
              value={form.schoolName}
              onChange={set('schoolName')}
              className="w-full px-4 py-2.5 rounded-xl bg-[#f9f9fd] text-[#1a1c1e] placeholder:text-[#44474e]/30 text-sm outline-none focus:ring-2 focus:ring-[#115cb9]/25 transition-all"
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
          </div>

          {/* Region + Province/City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                className="text-[0.65rem] font-semibold tracking-widest text-[#44474e] uppercase"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                Region
              </label>
              <div className="relative">
                <select
                  value={form.region}
                  onChange={(e) => {
                    setForm({ ...form, region: e.target.value, divisionProvince: '' })
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#f9f9fd] text-[#1a1c1e] text-sm outline-none focus:ring-2 focus:ring-[#115cb9]/25 transition-all appearance-none pr-9"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <option value="" disabled>Select Region</option>
                  {regionsData.regions.map((r) => (
                    <option key={r.code} value={r.code}>{r.name}</option>
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
                Province / City
              </label>
              <div className="relative">
                <select
                  value={form.divisionProvince}
                  onChange={set('divisionProvince')}
                  disabled={!form.region}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#f9f9fd] text-[#1a1c1e] text-sm outline-none focus:ring-2 focus:ring-[#115cb9]/25 transition-all appearance-none pr-9 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <option value="" disabled>
                    {form.region ? 'Select Province' : 'Select region first'}
                  </option>
                  {selectedRegion?.provinces.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#44474e]/40 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-8 py-5 bg-[#f9f9fd] flex items-center justify-between">
          <button
            className="flex items-center gap-1.5 text-sm text-[#44474e]/60 hover:text-[#001e40] transition-colors"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
              <path d="M11 7H3M6 4L3 7l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            
          </button>

          <button
            onClick={handleContinue}
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
            <ShieldCheck className="w-4.5 h-4.5 text-[#115cb9]" />
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
            <TrendingUp className="w-4.5 h-4.5 text-[#1a6b3a]" />
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