import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Register() {
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
})

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm({ ...form, [field]: e.target.value })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Register submitted', form)
  }

  return (
    <div className="min-h-screen flex flex-col">

      {/* Split layout */}
      <div className="flex flex-1 min-h-screen">

        {/* LEFT — Dark sticky hero panel */}
        <div
          className="hidden lg:sticky lg:top-0 lg:flex lg:w-[45%] lg:h-screen relative flex-col justify-between p-12 overflow-hidden flex-shrink-0"
          style={{ background: 'linear-gradient(145deg, #001e40 0%, #0a2d5a 50%, #0f3a7a 100%)' }}
        >
          {/* Background decorative elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div
              className="absolute -top-32 -left-32 w-96 h-96 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(17,92,185,0.15) 0%, transparent 70%)' }}
            />
            <div
              className="absolute bottom-0 right-0 w-80 h-80 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(17,92,185,0.1) 0%, transparent 70%)' }}
            />
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />
          </div>

          {/* Logo */}
          <div className="relative z-10 flex items-center gap-2.5">
            <img src="/src/assets/logo.png" alt="PHolaris Logo" className="w-12 h-12 object-contain" />
            <span
              className="text-white font-bold text-lg tracking-tight"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              PHOLARIS
            </span>
          </div>

          {/* Hero text */}
          <div className="relative z-10 space-y-6">
            <div>
              <p className="text-[#115cb9] text-xs font-semibold tracking-widest uppercase mb-4">
                Official STAR Portal
              </p>
              <h1
                className="text-white leading-[1.1]"
                style={{
                  fontFamily: 'Manrope, sans-serif',
                  fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
                  fontWeight: 800,
                }}
              >
                Your{' '}
                <span style={{ color: '#4d8ef0' }}>North Star</span>
                {' '}for STEM Education Excellence
              </h1>
            </div>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
              PHolaris uses teaching data and transforms it into actionable insights — helping DOST administrators identify underserved regions and deliver targeted capacity-building programs where they matter most.
            </p>

            {/* Stats */}
            <div className="flex gap-10 pt-4">
              <div>
                <p className="text-white text-2xl font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>30K+</p>
                <p className="text-white/40 text-xs tracking-widest uppercase mt-0.5">Teachers Reached</p>
              </div>
              <div>
                <p className="text-white text-2xl font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>17</p>
                <p className="text-white/40 text-xs tracking-widest uppercase mt-0.5">Regions Nationwide</p>
              </div>
            </div>
          </div>

          {/* Bottom tagline */}
          <div className="relative z-10">
            <p className="text-white/20 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
              Precision in Science, Excellence in Service. Empowering educators since 2026.
            </p>
          </div>
        </div>

        

        {/* RIGHT — Scrollable form panel */}
        <div className="flex-1 bg-[#f9f9fd] overflow-y-auto">
          
          <div className="px-8 sm:px-16 lg:px-20 pt-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#44474e]/60 hover:text-[#001e40] transition-colors"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
              <path d="M11 7H3M6 4L3 7l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Landing Page
          </Link>
        </div>

          <div className="px-8 sm:px-16 lg:px-20 py-12">
            <div className="max-w-md w-full mx-auto lg:mx-0">

              <div className="mb-8">
                <h2
                  className="text-[#001e40] font-bold text-3xl"
                  style={{ fontFamily: 'Manrope, sans-serif' }}
                >
                  Create Account
                </h2>
                <p className="text-[#44474e] text-sm mt-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Join PHolaris — the precision platform mapping, analyzing, and uplifting STEM educators across the Philippines.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-7">

                {/* Section 1 — Basic Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#001e40] flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-[0.6rem] font-bold">1</span>
                    </div>
                    <h3 className="text-[#001e40] font-semibold text-sm" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      Basic Information
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[0.65rem] font-semibold tracking-widest text-[#44474e] uppercase" style={{ fontFamily: 'Manrope, sans-serif' }}>
                        Full Name
                      </label>
                      <input type="text" placeholder="John Ray Doe" value={form.fullName} onChange={set('fullName')}
                        className="w-full px-4 py-2.5 rounded-xl bg-white text-[#1a1c1e] placeholder:text-[#44474e]/30 text-sm outline-none focus:ring-2 focus:ring-[#115cb9]/25 transition-all shadow-[0_1px_4px_rgba(0,30,64,0.06)]"
                        style={{ fontFamily: 'Inter, sans-serif' }} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[0.65rem] font-semibold tracking-widest text-[#44474e] uppercase" style={{ fontFamily: 'Manrope, sans-serif' }}>
                        Email Address
                      </label>
                      <input type="email" placeholder="j.doe@school.edu.ph" value={form.email} onChange={set('email')}
                        className="w-full px-4 py-2.5 rounded-xl bg-white text-[#1a1c1e] placeholder:text-[#44474e]/30 text-sm outline-none focus:ring-2 focus:ring-[#115cb9]/25 transition-all shadow-[0_1px_4px_rgba(0,30,64,0.06)]"
                        style={{ fontFamily: 'Inter, sans-serif' }} />
                    </div>
                  </div>
                </div>

                {/* Section 2 — Account Security */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#001e40] flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-[0.6rem] font-bold">2</span>
                    </div>
                    <h3 className="text-[#001e40] font-semibold text-sm" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      Account Security
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[0.65rem] font-semibold tracking-widest text-[#44474e] uppercase" style={{ fontFamily: 'Manrope, sans-serif' }}>
                        Password
                      </label>
                      <div className="relative">
                        <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={set('password')}
                          className="w-full px-4 pr-11 py-2.5 rounded-xl bg-white text-[#1a1c1e] placeholder:text-[#44474e]/30 text-sm outline-none focus:ring-2 focus:ring-[#115cb9]/25 transition-all shadow-[0_1px_4px_rgba(0,30,64,0.06)]"
                          style={{ fontFamily: 'Inter, sans-serif' }} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-3.5 flex items-center text-[#44474e]/40 hover:text-[#44474e] transition-colors">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[0.65rem] font-semibold tracking-widest text-[#44474e] uppercase" style={{ fontFamily: 'Manrope, sans-serif' }}>
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={form.confirmPassword} onChange={set('confirmPassword')}
                          className="w-full px-4 pr-11 py-2.5 rounded-xl bg-white text-[#1a1c1e] placeholder:text-[#44474e]/30 text-sm outline-none focus:ring-2 focus:ring-[#115cb9]/25 transition-all shadow-[0_1px_4px_rgba(0,30,64,0.06)]"
                          style={{ fontFamily: 'Inter, sans-serif' }} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-3.5 flex items-center text-[#44474e]/40 hover:text-[#44474e] transition-colors">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-[0.65rem] text-[#44474e]/50 tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Minimum 8 characters with at least one number
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl font-semibold text-white text-sm tracking-wide transition-all bg-gradient-to-r from-[#001e40] to-[#1a3a5c] hover:from-[#001830] hover:to-[#152f4a] hover:shadow-[0_4px_20px_rgba(0,30,64,0.25)] active:scale-[0.99] flex items-center justify-center gap-2"
                  style={{ fontFamily: 'Manrope, sans-serif' }}
                >
                  Create Account
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                <p className="text-center text-sm text-[#44474e]" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Already have an account?{' '}
                  <Link to="/login" className="text-[#115cb9] font-semibold hover:text-[#001e40] transition-colors">
                    Sign In
                  </Link>
                </p>

              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-[#44474e]/8">
        <div className="max-w-7xl mx-auto px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <nav className="flex items-center gap-5">
            {['Privacy Policy', 'Terms of Service', 'DOST Main', 'Data Privacy'].map((item) => (
              <Link
                key={item}
                to="#"
                className="text-xs text-[#44474e]/50 hover:text-[#001e40] transition-colors"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {item}
              </Link>
            ))}
          </nav>
          <p className="text-xs text-[#44474e]/40" style={{ fontFamily: 'Inter, sans-serif' }}>
            © 2026 PHolaris · DOST-SEI STAR Program. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  )
}