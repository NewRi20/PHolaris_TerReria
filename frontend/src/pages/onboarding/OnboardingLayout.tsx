import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Save, User } from 'lucide-react'

const STEPS = [
  { number: 1, title: 'Basic Identity', subtitle: 'Personal & School Information', path: '/onboarding/1' },
  { number: 2, title: 'Academic Profile', subtitle: 'Specialization & Background', path: '/onboarding/2' },
  { number: 3, title: 'Experience', subtitle: 'Capacity & Workload', path: '/onboarding/3' },
  { number: 4, title: 'Professional Development', subtitle: 'Training History', path: '/onboarding/4' },
]

export default function OnboardingLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  const currentStep = STEPS.findIndex((s) => s.path === location.pathname) + 1

  return (
    <div className="min-h-screen bg-[#f3f3f7] flex flex-col">

      {/* Top Nav */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-[#44474e]/8 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img src="/src/assets/logo.png" alt="PHolaris Logo" className="w-10 h-10 object-contain" />
            <span className="font-bold text-[#001e40] text-sm tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
              PHOLARIS
            </span>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-6">
            {['Dashboard', 'Support', 'Resources'].map((item) => (
              <button
                key={item}
                className="text-xs text-[#44474e] hover:text-[#001e40] transition-colors font-medium"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {item}
              </button>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <button
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#f3f3f7] text-[#001e40] text-xs font-semibold hover:bg-[#e7e7ec] transition-all"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              <Save className="w-3.5 h-3.5" />
              Save Progress
            </button>
            <div className="w-8 h-8 rounded-full bg-[#001e40] flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 max-w-7xl mx-auto w-full px-6 py-8 gap-6">

        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(0,30,64,0.05)] p-6 sticky top-24">
            <h2
              className="text-xl font-bold text-[#001e40] mb-1"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              Onboarding
            </h2>
            <p className="text-xs text-[#44474e]/70 mb-6 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
              Please complete your professional profile to access the academy resources.
            </p>

            <div className="space-y-1">
              {STEPS.map((step) => {
                const isActive = step.number === currentStep
                const isDone = step.number < currentStep

                return (
                  <button
                    key={step.number}
                    onClick={() => isDone && navigate(step.path)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left
                      ${isActive ? 'bg-[#001e40]' : isDone ? 'hover:bg-[#f3f3f7] cursor-pointer' : 'cursor-default opacity-50'}`}
                  >
                    {/* Step number bubble */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold
                        ${isActive ? 'bg-white text-[#001e40]' : isDone ? 'bg-[#001e40] text-white' : 'bg-[#e1e1e7] text-[#44474e]'}`}
                      style={{ fontFamily: 'Manrope, sans-serif' }}
                    >
                      {isDone ? (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
                          <path d="M2 7l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : step.number}
                    </div>

                    <div>
                      <p
                        className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-[#001e40]'}`}
                        style={{ fontFamily: 'Manrope, sans-serif' }}
                      >
                        {step.title}
                      </p>
                      <p
                        className={`text-[0.65rem] mt-0.5 ${isActive ? 'text-white/60' : 'text-[#44474e]/60'}`}
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        {step.subtitle}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Progress bar */}
            <div className="mt-6 pt-5 border-t border-[#f3f3f7]">
              <div className="flex justify-between mb-2">
                <span className="text-[0.65rem] text-[#44474e]/60" style={{ fontFamily: 'Inter, sans-serif' }}>Progress</span>
                <span className="text-[0.65rem] font-semibold text-[#001e40]" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  {Math.round(((currentStep - 1) / 4) * 100)}%
                </span>
              </div>
              <div className="h-1.5 bg-[#f3f3f7] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#001e40] to-[#115cb9] transition-all duration-500"
                  style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white/60 border-t border-[#44474e]/8 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-[#44474e]/50" style={{ fontFamily: 'Inter, sans-serif' }}>
            <span className="font-semibold text-[#001e40]" style={{ fontFamily: 'Manrope, sans-serif' }}>PHolaris</span>
            {' '}· © 2026 PHolaris · DOST-SEI STAR Program. All rights reserved.
          </p>
          <nav className="flex items-center gap-4">
            {['Program Overview', 'Privacy Policy', 'Technical Support'].map((item) => (
              <a key={item} href="#" className="text-xs text-[#44474e]/50 hover:text-[#001e40] transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
                {item}
              </a>
            ))}
          </nav>
        </div>
      </footer>

    </div>
  )
}