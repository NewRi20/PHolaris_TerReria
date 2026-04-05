import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, BarChart3, TrendingUp, Users, GraduationCap, ChevronRight } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ── NAVBAR ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#44474e]/8">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img src="/src/assets/logo.png" alt="PHolaris Logo" className="w-10 h-10 object-contain" />
            <span className="font-bold text-[#001e40] tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
              PHOLARIS
            </span>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-7">
            {[
              { label: 'Mission', active: true },
              { label: 'Features' },
              { label: 'Insights' },
              { label: 'Contact' },
            ].map((item) => (
              <a
                key={item.label}
                href="#"
                className={`text-xs font-medium transition-colors ${
                  item.active
                    ? 'text-[#115cb9] border-b-2 border-[#115cb9] pb-0.5'
                    : 'text-[#44474e] hover:text-[#001e40]'
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* CTA */}
            <div className="flex items-center gap-3">
                <Link
                    to="/register"
                    className="text-xs font-medium text-[#44474e] hover:text-[#001e40] transition-colors"
                >
                    Sign Up
                </Link>
                <Link
                    to="/login"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#001e40] text-white text-xs font-semibold hover:bg-[#1a3a5c] transition-all"
                    style={{ fontFamily: 'Manrope, sans-serif' }}
                >
                    Login
                </Link>
            </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section
        className="relative min-h-[90vh] flex items-end pb-20 pt-32 overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #001228 0%, #001e40 45%, #0a2d5a 100%)' }}
      >
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Glow orbs */}
        <div className="absolute top-20 right-20 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(17,92,185,0.2) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(17,92,185,0.1) 0%, transparent 70%)' }} />

        {/* Lab image overlay */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1400&auto=format&fit=crop&q=60')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center right',
            opacity: 0.08,
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-6 w-full">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1.5 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-[#4d8ef0] animate-pulse" />
            <span className="text-white/70 text-[0.65rem] font-semibold tracking-widest uppercase">
              Official STAR - Pholaris Portal
            </span>
          </div>

          {/* Headline */}
          <h1
            className="text-white mb-6 leading-[1.05]"
            style={{
              fontFamily: 'Manrope, sans-serif',
              fontWeight: 800,
              fontSize: 'clamp(2.4rem, 5vw, 4rem)',
              maxWidth: '600px',
            }}
          >
            Empowering {' '}
            <span style={{ color: '#4d8ef0' }}>STEM Educators </span>
            Across the Philippines
          </h1>

          {/* Description */}
          <p
            className="text-white/55 mb-10 leading-relaxed"
            style={{ maxWidth: '440px', fontSize: '0.9rem' }}
          >
            PHolaris is an integrated intelligence platform designed to map, analyze, and uplift
            Filipino STEM educators. We ingest localized onboarding data to pinpoint proficiency
            gaps and instructional risks, transforming siloed records into a dynamic interactive
            map.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3">
            <Link
              to="/login"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#115cb9] text-white text-sm font-semibold hover:bg-[#0d4a99] hover:shadow-[0_4px_24px_rgba(17,92,185,0.4)] active:scale-[0.99] transition-all"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              Portal Access
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── MISSION ── */}
      <section id="mission" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Image block */}
            <div className="relative">
              <div className="rounded-2xl overflow-hidden aspect-[4/3] bg-[#f3f3f7]">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=80"
                  alt="Teachers collaborating"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Stat badge */}
              <div className="absolute bottom-4 right-4 bg-[#001e40] text-white rounded-xl px-4 py-3 shadow-[0_8px_32px_rgba(0,30,64,0.3)]">
                <p className="text-2xl font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>17</p>
                <p className="text-white/60 text-[0.6rem] tracking-widest uppercase">Regions Covered</p>
              </div>
            </div>

            {/* Text block */}
            <div>
              <p className="text-[#115cb9] text-xs font-bold tracking-widest uppercase mb-3">
                The Mission
              </p>
              <h2
                className="text-[#001e40] mb-5 leading-tight"
                style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)' }}
              >
                Strategic Capacity Building through the PHolaris analytical engine
              </h2>
              <p className="text-[#44474e]/70 text-sm leading-relaxed mb-6">
                Our program operates as a catalyst for excellence. By targeting the unique
                geographical challenges of the Philippines, we provide tailored pedagogical
                frameworks that empower teachers to transcend traditional teaching boundaries.
              </p>
              <div className="space-y-3">
                {[
                  'Regional-specific training modules',
                  'Collaborative teacher network nodes',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#115cb9] flex-shrink-0" />
                    <span className="text-sm text-[#44474e]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DATA-DRIVEN INSIGHTS ── */}
      <section className="py-24 bg-[#f9f9fd]">
        <div className="max-w-6xl mx-auto px-6">

          {/* Section header */}
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2
                className="text-[#001e40] mb-2"
                style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 'clamp(1.6rem, 2.5vw, 2rem)' }}
              >
                Data-Driven Insights
              </h2>
              <p className="text-[#44474e]/60 text-sm max-w-sm">
                Harnessing the power of information to map the future of Philippine STEM
                education through precision analytics.
              </p>
            </div>
            <Link
              to="/login"
              className="hidden md:flex items-center gap-1.5 text-sm text-[#115cb9] font-medium hover:gap-2.5 transition-all"
            >
              Explore Data Portal
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Card 1 — Integrated Regional Profiles */}
            <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-[0_2px_16px_rgba(0,30,64,0.05)]">
              <div className="flex items-center justify-between mb-6">
                <div className="w-9 h-9 rounded-xl bg-[#f3f3f7] flex items-center justify-center">
                  <BarChart3 className="w-4.5 h-4.5 text-[#001e40]" />
                </div>
                <span className="text-[0.6rem] font-bold tracking-widest text-[#115cb9] uppercase bg-[#115cb9]/8 px-2.5 py-1 rounded-full">
                  Live Updates
                </span>
              </div>
              <h3
                className="text-lg font-bold text-[#001e40] mb-1"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                Integrated Regional Profiles
              </h3>
              <p className="text-xs text-[#44474e]/60 mb-6 leading-relaxed">
                Real-time data visualization of teacher competencies and resource allocation across all 17 regions.
              </p>
              <div className="flex gap-8">
                <div>
                  <p className="text-2xl font-bold text-[#001e40]" style={{ fontFamily: 'Manrope, sans-serif' }}>---</p>
                  <p className="text-[0.6rem] text-[#44474e]/40 uppercase tracking-widest mt-0.5">Data Accuracy</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#001e40]" style={{ fontFamily: 'Manrope, sans-serif' }}>---</p>
                  <p className="text-[0.6rem] text-[#44474e]/40 uppercase tracking-widest mt-0.5">Active Profiles</p>
                </div>
              </div>
            </div>

            {/* Card 2 — Metric Accuracy */}
            <div
              className="rounded-2xl p-6 flex flex-col justify-between"
              style={{ background: 'linear-gradient(145deg, #001228 0%, #001e40 100%)' }}
            >
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                <TrendingUp className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <p className="text-white/40 text-[0.6rem] font-bold tracking-widest uppercase mb-1">
                  Regional Precision
                </p>
                <p
                  className="text-white text-xl font-bold"
                  style={{ fontFamily: 'Manrope, sans-serif' }}
                >
                  Metric Accuracy
                </p>
                {/* Progress bar */}
                <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-[#115cb9] to-[#4d8ef0]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CORE EXPERIENCE ── */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[#115cb9] text-xs font-bold tracking-widest uppercase mb-3">
              Core Experience
            </p>
            <h2
              className="text-[#001e40]"
              style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)' }}
            >
              Empowering Teachers
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <GraduationCap className="w-5 h-5 text-[#001e40]" />,
                title: 'Professional Development',
                desc: 'Advanced pedagogical strategies designed by the nation\'s leading scientists and educators.',
              },
              {
                icon: <Users className="w-5 h-5 text-[#001e40]" />,
                title: 'Training Workshops',
                desc: 'Immersive, hands-on sessions focusing on laboratory precision and modern classroom tech.',
              },
              {
                icon: <TrendingUp className="w-5 h-5 text-[#001e40]" />,
                title: 'Career Advancement',
                desc: 'Certified pathways recognized by the Department of Education for teacher promotion.',
              },
            ].map((item) => (
              <div key={item.title} className="group">
                <div className="w-10 h-10 rounded-xl bg-[#f3f3f7] flex items-center justify-center mb-4 group-hover:bg-[#001e40]/8 transition-colors">
                  {item.icon}
                </div>
                <h3
                  className="text-[#001e40] font-bold mb-2 text-sm"
                  style={{ fontFamily: 'Manrope, sans-serif' }}
                >
                  {item.title}
                </h3>
                <p className="text-[#44474e]/60 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-16 px-6">
        <div
          className="max-w-6xl mx-auto rounded-2xl px-10 py-14 text-center"
          style={{ background: 'linear-gradient(145deg, #001228 0%, #001e40 100%)' }}
        >
          {/* Subtle grid */}
          <div
            className="absolute inset-0 rounded-2xl opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
          <h2
            className="text-white font-bold mb-3 relative z-10"
            style={{ fontFamily: 'Manrope, sans-serif', fontSize: 'clamp(1.4rem, 2.5vw, 2rem)' }}
          >
            Ready to Advance Your Science Teaching?
          </h2>
          <p className="text-white/50 text-sm mb-8 max-w-md mx-auto relative z-10">
            Access the PHolaris portal today to explore upcoming workshops, download modules,
            and track your development.
          </p>
          <div className="flex flex-wrap gap-3 justify-center relative z-10">
            <Link
              to="/login"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#115cb9] text-white text-sm font-semibold hover:bg-[#0d4a99] transition-all"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              Portal Access
            </Link>
            <a
              href="#"
              className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-white text-sm font-medium hover:bg-white/10 transition-all"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              Contact Your Regional Office
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t border-[#44474e]/8 mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src="/src/assets/logo.png" alt="PHolaris Logo" className="w-10 h-10 object-contain" />
              <span className="font-bold text-[#001e40] text-sm" style={{ fontFamily: 'Manrope, sans-serif' }}>
                PHOLARIS
              </span>
            </div>
            <p className="text-xs text-[#44474e]/50 leading-relaxed max-w-xs">
              © 2026 PHolaris · DOST-SEI STAR Program.
              All rights reserved.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <p className="text-xs font-bold text-[#001e40] uppercase tracking-widest mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Quick Links
            </p>
            <div className="space-y-2">
              {['Privacy Policy', 'Terms of Service', 'Support'].map((item) => (
                <a key={item} href="#" className="block text-xs text-[#44474e]/50 hover:text-[#001e40] transition-colors">
                  {item}
                </a>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div>
            <p className="text-xs font-bold text-[#001e40] uppercase tracking-widest mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Resources
            </p>
            <div className="space-y-2">
              {['Regional Offices', 'DOST Main', 'Data Portal'].map((item) => (
                <a key={item} href="#" className="block text-xs text-[#44474e]/50 hover:text-[#001e40] transition-colors">
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}