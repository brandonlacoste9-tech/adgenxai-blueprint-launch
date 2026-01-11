'use client';

import React, { useState } from 'react';
import { Settings, CreditCard, Terminal, Sparkles, Layout, Globe, Users, Zap, MapPin } from 'lucide-react';

export default function StudioPage() {
  const [prompt, setPrompt] = useState('');

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#d4af37] selection:text-black">

      {/* 1. TOP COMMAND BAR (Settings & Payments) */}
      <nav className="border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">

          {/* LOGO */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-[#d4af37] to-[#8B5E3C] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.3)]">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold tracking-wide text-sm">ADGEN XAI</h1>
              <p className="text-[10px] text-[#d4af37] font-mono tracking-widest uppercase">Autonomous Studio</p>
            </div>
          </div>

          {/* CONTROLS */}
          <div className="flex items-center gap-4">
            {/* Payment / Upgrade Button */}
            <button className="flex items-center gap-2 px-4 py-1.5 bg-[#d4af37] hover:bg-[#b5952f] text-black text-xs font-bold rounded uppercase tracking-wider transition-all shadow-lg shadow-[#d4af37]/20">
              <Zap className="w-3 h-3 fill-black" />
              Upgrade to Citadel
            </button>

            {/* Settings / Engine Room */}
            <button className="p-2 text-stone-400 hover:text-white hover:bg-white/5 rounded-full transition-colors">
              <Settings className="w-5 h-5" />
            </button>

            {/* User Profile */}
            <div className="w-8 h-8 rounded-full bg-stone-800 border border-white/10 flex items-center justify-center text-xs font-bold text-stone-400">
              BL
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-64px)]">

        {/* LEFT COLUMN: CREATIVE INPUT (2/3 Width) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Project Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-light text-white flex items-center gap-2">
              <Layout className="w-6 h-6 text-[#d4af37]" />
              New Project
            </h2>
            <div className="flex gap-2">
               <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-stone-400">DRAFT</span>
            </div>
          </div>

          {/* The "Main Input" Card */}
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-1 shadow-2xl">
            <div className="bg-[#0f0f0f] rounded-lg p-6 space-y-6 border border-white/5">

              <div className="space-y-2">
                <label className="text-xs font-mono text-[#d4af37] uppercase tracking-widest">Mission Objective</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your vision... (e.g., 'A luxury landing page for a coffee brand in Quebec')"
                  className="w-full h-32 bg-black border border-white/10 rounded-lg p-4 text-white placeholder-stone-600 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all resize-none text-sm leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputGroup icon={<Globe className="w-4 h-4" />} label="Platform" placeholder="Website" />
                <InputGroup icon={<MapPin className="w-4 h-4" />} label="Target Region" placeholder="Quebec, Canada" />
                <InputGroup icon={<Users className="w-4 h-4" />} label="Audience" placeholder="Professionals" />
              </div>

              <div className="pt-4 flex justify-end">
                <button className="flex items-center gap-2 px-6 py-3 bg-white text-black font-bold text-sm rounded hover:bg-stone-200 transition-colors">
                  <Sparkles className="w-4 h-4" />
                  Generate Campaign
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AGENT TERMINAL (1/3 Width) */}
        <div className="lg:col-span-1 space-y-4">

           {/* The "Live Feed" Panel */}
           <div className="h-full bg-black border border-white/10 rounded-xl overflow-hidden flex flex-col">
              <div className="p-3 border-b border-white/10 bg-[#0f0f0f] flex justify-between items-center">
                 <span className="text-xs font-mono text-stone-400 flex items-center gap-2">
                   <Terminal className="w-3 h-3 text-[#d4af37]" />
                   NEURAL_COUNCIL_V5
                 </span>
                 <div className="flex gap-1">
                   <div className="w-2 h-2 rounded-full bg-red-500/20" />
                   <div className="w-2 h-2 rounded-full bg-yellow-500/20" />
                   <div className="w-2 h-2 rounded-full bg-green-500" />
                 </div>
              </div>

              <div className="flex-1 p-4 font-mono text-xs space-y-4 text-stone-400">
                <p className="text-[#d4af37]">&gt; System Initialized...</p>
                <p>&gt; Waiting for mission parameters.</p>
                <div className="pl-2 border-l border-white/10 space-y-2 mt-4">
                   <AgentStatus name="PLANNER" status="READY" />
                   <AgentStatus name="RESEARCHER" status="READY" />
                   <AgentStatus name="CREATIVE" status="READY" />
                   <AgentStatus name="AUDITOR" status="READY" />
                </div>
              </div>
           </div>

        </div>

      </main>
    </div>
  );
}

// Helper Components for Cleaner Code
function InputGroup({ icon, label, placeholder }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-mono text-stone-500 uppercase tracking-widest flex items-center gap-2">
        {icon} {label}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        className="w-full bg-black border border-white/10 rounded p-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37] transition-all placeholder-stone-700"
      />
    </div>
  );
}

function AgentStatus({ name, status }: any) {
  return (
    <div className="flex justify-between items-center group">
       <span className="group-hover:text-white transition-colors">{name}</span>
       <span className="text-[10px] bg-green-900/30 text-green-400 px-1.5 py-0.5 rounded border border-green-500/20">{status}</span>
    </div>
  );
}