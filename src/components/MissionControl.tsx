import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BrainCircuit,
  DollarSign,
  Zap,
  Search,
  ShieldCheck,
  Activity,
  Terminal
} from 'lucide-react';
import NightShiftToggle from './NightShiftToggle';

// --- TYPES ---
interface AgentLog {
  id: string;
  agent_role: 'Planner' | 'Researcher' | 'Creative' | 'Auditor' | 'Receptionist';
  action_type: string;
  thought_vector: string;
  created_at: string;
  cost_saved_est?: number; // Simulated metric for the demo
}

export default function MissionControl() {
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [metrics, setMetrics] = useState({
    totalSavings: 4250.00,
    apiCallsSaved: 1240,
    activeCampaigns: 4
  });

  // 1. REAL-TIME SUBSCRIPTION TO AGENT LOGS
  useEffect(() => {
    // Initial Fetch
    const fetchLogs = async () => {
      const { data } = await supabase
        .from('agent_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (data) setLogs(data);
    };
    fetchLogs();

    // Live Subscription
    const channel = supabase
      .channel('mission-control')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_logs' }, (payload) => {
        const newLog = payload.new as AgentLog;
        setLogs((prev) => [newLog, ...prev].slice(0, 10));

        // Simulate updating cost metrics live when agents work
        if (newLog.action_type === 'CACHE_HIT') {
           setMetrics(m => ({ ...m, totalSavings: m.totalSavings + 0.45, apiCallsSaved: m.apiCallsSaved + 1 }));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-amber-50 p-8 font-sans">

      {/* --- HEADER --- */}
      <header className="flex justify-between items-center mb-12 border-b border-amber-900/30 pb-6">
        <div>
          <h1 className="text-4xl font-light tracking-widest text-[#d4af37] uppercase">
            Adgen<span className="font-bold">XAI</span>
          </h1>
          <p className="text-stone-500 text-sm tracking-widest mt-1">AUTONOMOUS CREATIVE ORCHESTRATOR // V5.0</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-green-500 font-mono text-xs">SYSTEM ONLINE</span>
        </div>
      </header>

      {/* --- SECTION 1: ECONOMIC ENGINE (The "Kill Shot") --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <MetricCard
          label="Est. Monthly Savings"
          value={`$${metrics.totalSavings.toFixed(2)}`}
          icon={<DollarSign className="w-5 h-5 text-green-400" />}
          subtext="vs. Traditional Agency"
        />
        <MetricCard
          label="Context Cache Hit Rate"
          value="87%"
          icon={<Zap className="w-5 h-5 text-amber-400" />}
          subtext="Recycled Brand DNA"
        />
        <MetricCard
          label="Cost Per Campaign"
          value="$0.01"
          icon={<Activity className="w-5 h-5 text-blue-400" />}
          subtext="Flash-Lite Optimized"
        />
        <MetricCard
          label="Receptionist Actions"
          value="Auto-Pilot"
          icon={<BrainCircuit className="w-5 h-5 text-purple-400" />}
          subtext="Zero Human Intervention"
        />
      </div>

      {/* --- SECTION 2: LIVE NEURAL FEED (The "Thinking") --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">

        {/* LEFT: Live Log Stream */}
        <div className="lg:col-span-2 bg-[#120c08] border border-amber-900/20 rounded-xl p-6 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent opacity-20" />
          <h3 className="text-lg font-light text-[#d4af37] mb-6 flex items-center gap-2">
            <Terminal className="w-4 h-4" /> LIVE THOUGHT VECTORS
          </h3>

          <div className="space-y-4 overflow-y-auto h-full pb-20 scrollbar-hide">
            <AnimatePresence>
              {logs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 border-l-2 border-[#d4af37]/30 bg-white/5 rounded-r-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider ${getRoleColor(log.agent_role)}`}>
                      {log.agent_role}
                    </span>
                    <span className="text-xs text-stone-500 font-mono">{new Date(log.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-stone-300 font-light text-sm leading-relaxed">
                    {log.thought_vector}
                  </p>
                  {log.action_type === 'CACHE_HIT' && (
                    <div className="mt-2 text-xs text-green-400 font-mono flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Cost Optimized: Context Loaded from Memory
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT: System Status / Visualizer Placeholder */}
        <div className="bg-[#1c1410] rounded-xl p-6 flex flex-col justify-center items-center text-center border border-amber-900/20">
            <div className="w-32 h-32 rounded-full border border-amber-500/30 flex items-center justify-center relative mb-6">
                <div className="absolute w-full h-full rounded-full border border-amber-500/10 animate-ping" />
                <BrainCircuit className="w-12 h-12 text-[#d4af37]" />
            </div>
            <h4 className="text-xl text-white font-light">Orchestrator Active</h4>
            <p className="text-sm text-stone-400 mt-2 max-w-xs">
                VL-JEPA Prediction Models are scanning Canadian Market Trends...
            </p>

            <div className="mt-8 w-full space-y-3">
                <StatusRow label="Planner Agent" status="Idle" />
                <StatusRow label="Research Agent" status="Processing" active />
                <StatusRow label="Creative Agent" status="Idle" />
                <StatusRow label="Compliance Auditor" status="Standby" />
            </div>
        </div>

      </div>

      {/* NIGHT SHIFT TOGGLE */}
      <div className="mt-8">
        <NightShiftToggle />
      </div>

      {/* Ralph Wiggum Signature */}
      <div className="mt-6 text-center">
        <p className="text-xs text-stone-500 font-mono">
          "I'm helping!" - Ralph Wiggum Autonomous Protocol v1.0
        </p>
        <p className="text-xs text-stone-600 mt-1">
          🇨🇦 Made with Canadian persistence and Quebec computing power 🇨🇦
        </p>
      </div>
    </div>
  );
}

// --- SUBCOMPONENTS ---

function MetricCard({ label, value, icon, subtext }: any) {
    return (
        <div className="bg-[#120c08] border border-amber-900/20 p-6 rounded-xl hover:border-[#d4af37]/40 transition-colors">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-white/5 rounded-lg">{icon}</div>
                <span className="text-xs text-stone-500 font-mono">LIVE</span>
            </div>
            <h3 className="text-3xl font-light text-white mb-1">{value}</h3>
            <p className="text-xs text-[#d4af37] uppercase tracking-wider font-bold">{label}</p>
            <p className="text-xs text-stone-600 mt-2">{subtext}</p>
        </div>
    )
}

function StatusRow({ label, status, active }: any) {
    return (
        <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
            <span className="text-stone-400">{label}</span>
            <span className={`font-mono ${active ? 'text-green-400 animate-pulse' : 'text-stone-600'}`}>
                {status}
            </span>
        </div>
    )
}

function getRoleColor(role: string) {
    switch(role) {
        case 'Planner': return 'bg-blue-900/30 text-blue-200';
        case 'Researcher': return 'bg-purple-900/30 text-purple-200';
        case 'Creative': return 'bg-amber-900/30 text-amber-200'; // The signature color
        case 'Auditor': return 'bg-red-900/30 text-red-200';
        case 'Receptionist': return 'bg-emerald-900/30 text-emerald-200';
        default: return 'bg-stone-800 text-stone-400';
    }
}