import { useState } from 'react'
import { Eye, EyeOff, FlaskConical, User, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [keepAuth, setKeepAuth] = useState(false)
  const [credentials, setCredentials] = useState({ id: '', password: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Login submitted', credentials)
  }

  return (
    <div className="min-h-screen bg-[#eef1f8] flex flex-col">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 20%, rgba(17, 92, 185, 0.06) 0%, transparent 50%),
                            radial-gradient(circle at 80% 80%, rgba(0, 30, 64, 0.05) 0%, transparent 50%)`,
        }}
      />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 relative z-10">
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#001e40] flex items-center justify-center shadow-[0_4px_24px_rgba(0,30,64,0.18)]">
              <FlaskConical className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-[#001e40]" style={{ fontFamily: 'Manrope, sans-serif' }}>
              PHolaris
            </span>
          </div>
          <div className="text-center">
            <h1 className="text-[1.6rem] font-bold text-[#001e40] leading-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Your North Star for STEM Education Excellence
            </h1>
            <p className="text-sm text-[#44474e] mt-1 tracking-wide">
              Science Teacher Academy for the Regions (STAR) Program Portal 
            </p>
          </div>
        </div>

        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,30,64,0.08)] overflow-hidden">
            <div className="px-8 py-8">
              <form onSubmit={handleSubmit} className="space-y-5">

                <div className="space-y-1.5">
                  <label htmlFor="id" className="text-[0.7rem] font-semibold tracking-widest text-[#44474e] uppercase" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    ID / Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                      <User className="w-4 h-4 text-[#44474e]/50" />
                    </div>
                    <input
                      id="id"
                      type="text"
                      placeholder="Enter your credentials"
                      value={credentials.id}
                      onChange={(e) => setCredentials({ ...credentials, id: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#f3f3f7] text-[#1a1c1e] placeholder:text-[#44474e]/40 text-sm outline-none focus:ring-2 focus:ring-[#115cb9]/30 transition-all"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-[0.7rem] font-semibold tracking-widest text-[#44474e] uppercase" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      Password
                    </label>
                    <Link to="/forgot-password" className="text-xs text-[#115cb9] hover:text-[#001e40] transition-colors font-medium">
                      Forgot?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-[#44474e]/50" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={credentials.password}
                      onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                      className="w-full pl-10 pr-11 py-3 rounded-xl bg-[#f3f3f7] text-[#1a1c1e] placeholder:text-[#44474e]/40 text-sm outline-none focus:ring-2 focus:ring-[#115cb9]/30 transition-all"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3.5 flex items-center text-[#44474e]/50 hover:text-[#44474e] transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setKeepAuth(!keepAuth)}
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0 ${
                      keepAuth ? 'bg-[#001e40] border-[#001e40]' : 'bg-transparent border-[#44474e]/30 hover:border-[#44474e]/60'
                    }`}
                  >
                    {keepAuth && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                        <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                  <span className="text-sm text-[#44474e]" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Keep me authenticated
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl font-semibold text-white text-sm tracking-wide transition-all bg-gradient-to-r from-[#001e40] to-[#1a3a5c] hover:from-[#001830] hover:to-[#152f4a] hover:shadow-[0_4px_20px_rgba(0,30,64,0.3)] active:scale-[0.99] flex items-center justify-center gap-2"
                  style={{ fontFamily: 'Manrope, sans-serif' }}
                >
                  Sign In to Portal
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

              </form>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-[#44474e]/10 bg-white/60 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[#001e40]" style={{ fontFamily: 'Manrope, sans-serif' }}>
              PHolaris
            </p>
            <p className="text-xs text-[#44474e]/70 mt-0.5">
              © 2026 DOST STAR Program. All rights reserved. Precision in Pedagogy.
            </p>
          </div>
          <nav className="flex items-center gap-5">
            {['Privacy Policy', 'Terms of Service', 'Contact Us', 'System Status'].map((item) => (
              <Link key={item} to="#" className="text-xs text-[#44474e]/70 hover:text-[#001e40] transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
                {item}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  )
}