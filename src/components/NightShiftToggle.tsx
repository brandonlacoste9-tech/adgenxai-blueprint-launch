import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Terminal, Zap, Brain, Coffee } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface NightShiftLog {
  timestamp: Date;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  ralphAction?: string;
}

export default function NightShiftToggle() {
  const [isActive, setIsActive] = useState(false);
  const [logs, setLogs] = useState<NightShiftLog[]>([]);
  const [ralphStatus, setRalphStatus] = useState<'idle' | 'working' | 'success' | 'error'>('idle');
  const [currentTask, setCurrentTask] = useState<string>('');

  // Simulated Ralph Wiggum autonomous work
  useEffect(() => {
    if (!isActive) return;

    const ralphActivities = [
      { delay: 2000, message: "🤖 RALPH: Reading PRD...", action: "analyze_requirements" },
      { delay: 5000, message: "🎨 RALPH: Planning Modern Voyageur design...", action: "design_planning" },
      { delay: 8000, message: "⚡ RALPH: Generating landing page code...", action: "code_generation" },
      { delay: 12000, message: "🧪 RALPH: Running tests...", action: "testing" },
      { delay: 15000, message: "❌ RALPH: Test failed - fixing layout issues...", action: "error_correction" },
      { delay: 18000, message: "🔧 RALPH: 'I'm helping!' - Improving responsive design...", action: "iteration" },
      { delay: 22000, message: "✅ RALPH: Tests passing! Deploying to Vercel...", action: "deployment" },
      { delay: 25000, message: "🚀 RALPH: Success! maple-energy-drink.vercel.app deployed", action: "completion" }
    ];

    const timeouts: NodeJS.Timeout[] = [];

    ralphActivities.forEach((activity, index) => {
      const timeout = setTimeout(() => {
        addLog(activity.message, 'info', activity.action);

        if (activity.action === 'completion') {
          setRalphStatus('success');
          setCurrentTask('Task completed successfully! 🎉');
        } else if (activity.action === 'error_correction') {
          setRalphStatus('error');
          setCurrentTask('Ralph is fixing issues...');
        } else {
          setRalphStatus('working');
          setCurrentTask(activity.message);
        }
      }, activity.delay);

      timeouts.push(timeout);
    });

    // Auto-deactivate after completion
    const completionTimeout = setTimeout(() => {
      setIsActive(false);
      setRalphStatus('idle');
      setCurrentTask('');
      addLog("🌙 NIGHT SHIFT: Task completed. Ralph signing off.", 'success');
    }, 28000);

    timeouts.push(completionTimeout);

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [isActive]);

  const addLog = (message: string, level: NightShiftLog['level'] = 'info', ralphAction?: string) => {
    const log: NightShiftLog = {
      timestamp: new Date(),
      level,
      message,
      ralphAction
    };
    setLogs(prev => [log, ...prev].slice(0, 15)); // Keep last 15 logs
  };

  const toggleNightShift = async () => {
    const newState = !isActive;
    setIsActive(newState);

    if (newState) {
      // ACTIVATE NIGHT SHIFT PROTOCOL
      setRalphStatus('working');
      setCurrentTask('Initializing Ralph Wiggum Protocol...');

      addLog("🌙 NIGHT SHIFT PROTOCOL: ACTIVATED", 'info');
      addLog("🤖 RALPH WIGGUM: 'I'm helping!'", 'info');
      addLog("📋 LOADING TASK: Maple Syrup Energy Drink Landing Page", 'info');

      // Simulate hardware activation (lighting)
      try {
        await fetch('/api/lighting', {
          method: 'POST',
          body: JSON.stringify({ mode: 'NIGHT_SHIFT' })
        });
        addLog("💡 Lighting: Night Shift mode activated", 'success');
      } catch (error) {
        addLog("💡 Lighting: Hardware integration offline", 'warning');
      }

      // Trigger autonomous task processing
      try {
        const { data, error } = await supabase.functions.invoke('night-shift-worker', {
          body: { taskId: 'maple-energy-drink-landing' }
        });

        if (error) throw error;

        addLog("⚙️ Autonomous worker activated", 'success');
      } catch (error) {
        addLog("⚙️ Worker activation failed - running in demo mode", 'warning');
      }

    } else {
      // DEACTIVATE NIGHT SHIFT
      setRalphStatus('idle');
      setCurrentTask('');

      addLog("☀️ NIGHT SHIFT PROTOCOL: DEACTIVATED", 'info');
      addLog("😴 Ralph has signed off for the night", 'info');
    }
  };

  const getRalphIcon = () => {
    switch (ralphStatus) {
      case 'working':
        return <Brain className="w-4 h-4 animate-pulse text-blue-400" />;
      case 'success':
        return <Coffee className="w-4 h-4 text-green-400" />;
      case 'error':
        return <Terminal className="w-4 h-4 text-red-400 animate-pulse" />;
      default:
        return <Moon className="w-4 h-4 text-indigo-400" />;
    }
  };

  const getStatusColor = () => {
    switch (ralphStatus) {
      case 'working':
        return 'text-blue-400';
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-indigo-400';
    }
  };

  return (
    <div className="border border-indigo-900/30 bg-[#050510] rounded-xl p-6 relative overflow-hidden group">
      {/* Animated Background */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-blue-500/5"
          >
            <div className="absolute inset-0 bg-indigo-500/5 animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center mb-4 relative z-10">
        <div>
          <h3 className="text-indigo-400 font-bold flex items-center gap-2">
            {getRalphIcon()}
            NIGHT SHIFT PROTOCOL
          </h3>
          <p className="text-xs text-indigo-200/50 mt-1">
            Autonomous Coding Daemon (Ralph Wiggum v1.0)
          </p>
          {currentTask && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-xs mt-2 ${getStatusColor()}`}
            >
              {currentTask}
            </motion.p>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleNightShift}
          className={`relative w-16 h-8 rounded-full transition-all duration-500 ${
            isActive ? 'bg-indigo-600 shadow-lg shadow-indigo-500/25' : 'bg-stone-700'
          }`}
        >
          <motion.div
            layout
            className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center"
            animate={{ x: isActive ? 32 : 0 }}
          >
            {isActive ? (
              <Moon className="w-3 h-3 text-indigo-600" />
            ) : (
              <Sun className="w-3 h-3 text-stone-700" />
            )}
          </motion.div>
        </motion.button>
      </div>

      {/* THE RALPH CONSOLE */}
      <div className="bg-black/50 rounded-lg p-3 font-mono text-[10px] h-32 overflow-hidden border border-white/5 relative z-10">
        {logs.length === 0 ? (
          <div className="text-stone-600 flex items-center gap-2">
            <Terminal className="w-3 h-3" />
            Waiting for Ralph activation...
          </div>
        ) : (
          <div className="space-y-1">
            <AnimatePresence>
              {logs.slice(0, 8).map((log, i) => (
                <motion.div
                  key={`${log.timestamp.getTime()}-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className={`flex items-center gap-2 ${
                    log.level === 'success' ? 'text-green-400' :
                    log.level === 'warning' ? 'text-yellow-400' :
                    log.level === 'error' ? 'text-red-400' :
                    'text-indigo-300'
                  }`}
                >
                  <span className="opacity-50">
                    {log.timestamp.toLocaleTimeString('en-US', {
                      hour12: false,
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </span>
                  <span className="flex-1">{log.message}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {isActive && ralphStatus === 'working' && (
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="text-green-400 mt-2 flex items-center gap-2"
          >
            <Zap className="w-3 h-3" />
            _ RALPH IS CODING...
          </motion.div>
        )}

        {isActive && ralphStatus === 'success' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-green-400 mt-2 flex items-center gap-2 font-bold"
          >
            <Coffee className="w-3 h-3" />
            🎉 TASK COMPLETED! Check your inbox for the deployed URL.
          </motion.div>
        )}
      </div>

      {/* Status Indicator */}
      <div className="flex items-center justify-between mt-4 text-xs text-indigo-200/50 relative z-10">
        <span>Status: {ralphStatus.toUpperCase()}</span>
        <span>Ralph Protocol: {isActive ? 'ACTIVE' : 'STANDBY'}</span>
      </div>
    </div>
  );
}