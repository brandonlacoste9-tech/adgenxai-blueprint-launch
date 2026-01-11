import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Terminal, Activity, Shield } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-[#d4af37] selection:text-black font-sans overflow-x-hidden">

      {/* BACKGROUND GRAIN */}
      <div className="fixed inset-0 opacity-[0.04] pointer-events-none"
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />

      {/* NAV */}
      <nav className="fixed top-0 w-full p-6 flex justify-between items-center z-50 mix-blend-difference">
        <div className="text-xl font-bold tracking-widest flex items-center gap-2">
          <div className="w-3 h-3 bg-[#d4af37] rounded-full shadow-[0_0_10px_#d4af37]" />
          ADGEN XAI
        </div>
        <div className="hidden md:flex gap-6 text-xs font-mono text-stone-400">
          <span className="hover:text-white cursor-pointer">INTELLIGENCE</span>
          <span className="hover:text-white cursor-pointer">PRICING</span>
          <span className="text-[#d4af37] cursor-pointer">ENTERPRISE</span>
        </div>
      </nav>

      {/* HERO SECTION */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-4">

        {/* BADGE */}
        <div className="mb-8 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] tracking-widest text-[#d4af37] uppercase flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          System V5.0 Online
        </div>

        {/* HEADLINE */}
        <h1 className="text-5xl md:text-8xl font-light tracking-tighter mb-6 bg-gradient-to-b from-white to-stone-600 bg-clip-text text-transparent">
          Autonomous <br />
          Creative Infrastructure.
        </h1>

        <p className="max-w-2xl text-stone-500 text-lg md:text-xl font-light mb-12 leading-relaxed">
          The first AI agency powered by a Neural Council. <br />
          Strategy, Design, and Compliance—automated.
        </p>

        {/* THE IRON MAN BUTTONS */}
        <div className="flex flex-col md:flex-row gap-6 w-full max-w-md">

          {/* 1. LAUNCH STUDIO */}
          <Link to="/studio" className="flex-1 group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#d4af37] to-[#8B5E3C] rounded-lg blur opacity-30 group-hover:opacity-75 transition duration-200"></div>
            <button className="relative w-full bg-[#0a0a0a] border border-[#d4af37]/30 text-white h-14 rounded-lg font-bold tracking-widest uppercase flex items-center justify-center gap-3 hover:bg-[#d4af37] hover:text-black transition-all">
              <Terminal className="w-4 h-4" />
              Launch Studio
            </button>
          </Link>

          {/* 2. MISSION CONTROL */}
          <Link to="/mission-control" className="flex-1">
            <button className="w-full bg-white/5 border border-white/10 text-stone-300 h-14 rounded-lg font-mono text-xs uppercase flex items-center justify-center gap-3 hover:bg-white/10 hover:border-white/30 transition-all">
              <Activity className="w-4 h-4 text-blue-400" />
              Mission Control
            </button>
          </Link>
        </div>

        {/* FOOTER VERIFICATION */}
        <div className="absolute bottom-10 flex items-center gap-6 text-[10px] text-stone-600 font-mono uppercase tracking-widest">
           <span className="flex items-center gap-2"><Shield className="w-3 h-3" /> SOC2 COMPLIANT</span>
           <span className="hidden md:inline">|</span>
           <span>POWERED BY NORTHERN VENTURES</span>
        </div>

      </main>
    </div>
  );
}