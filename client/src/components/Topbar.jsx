import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth';
import { analyticsAPI } from '../services/api';
import { FiAlertTriangle, FiBell, FiMic, FiSearch } from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';
import InitialAvatar from './InitialAvatar';

const fallbackAlerts = [
  { id: 'offline-a1', title: 'API Integration', daysLeft: 2, progress: 38, message: 'Task is near deadline with low progress.', severity: 'warning' },
];

const Topbar = ({ onVoiceTrigger }) => {
  const { user, authError } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const isTeamMember = user?.role === 'Crew' || user?.role === 'Team Member' || user?.role === 'TeamMember';

  useEffect(() => {
    let mounted = true;
    const fetchAlerts = async () => {
      try {
        const { data } = await analyticsAPI.getCometAlerts();
        if (mounted) setAlerts(Array.isArray(data) ? data : []);
      } catch {
        if (mounted) setAlerts(fallbackAlerts);
      }
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-white/10 bg-space-950/78 px-4 backdrop-blur-2xl sm:px-5 lg:min-h-[72px] lg:px-7">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="hidden sm:block">
          <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-neon-blue">System Status</p>
          <div className="mt-1 flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${authError ? 'bg-neon-amber' : 'bg-neon-cyan'} animate-pulse`} />
            <span className="text-sm font-bold text-white">{authError ? 'Demo Fallback Online' : 'Online'}</span>
          </div>
        </div>

        <label className="relative hidden min-w-[240px] max-w-lg flex-1 md:block">
          <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="search"
            placeholder="Search projects, tasks, team..."
            className="w-full rounded-2xl border border-white/10 bg-white/[0.055] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-neon-blue/45 focus:bg-neon-blue/10"
          />
        </label>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {!isTeamMember && (
          <button
            type="button"
            onClick={onVoiceTrigger}
            className="group relative flex items-center gap-2 overflow-hidden rounded-2xl border border-neon-blue/30 bg-gradient-to-r from-neon-blue/20 to-neon-violet/20 px-3 py-2.5 text-neon-blue shadow-glow-blue/20 transition hover:border-neon-cyan/50 hover:text-white sm:px-4"
          >
            <span className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/15 to-transparent transition duration-700 group-hover:translate-x-[120%]" />
            <span className="relative flex items-center justify-center">
              <span className="absolute inline-flex h-3 w-3 rounded-full bg-neon-blue opacity-75 animate-ping" />
              <FiMic className="relative text-base" />
            </span>
            <span className="relative hidden text-xs font-mono uppercase tracking-[0.22em] md:inline">Voice Control</span>
          </button>
        )}

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAlertsDropdown((value) => !value)}
            className="relative rounded-2xl border border-white/10 bg-white/5 p-3 text-gray-400 transition hover:border-neon-amber/30 hover:text-white"
            aria-label="Open deadline risk alerts"
          >
            <FiBell className="text-lg" />
            {alerts.length > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-neon-red shadow-glow-red" />}
          </button>

          <AnimatePresence>
            {showAlertsDropdown && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowAlertsDropdown(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 14, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  className="glass-card absolute right-0 z-40 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden p-4 shadow-2xl"
                >
                  <img src="/images/comet_stage2.webp" alt="" aria-hidden="true" className="pointer-events-none absolute -right-6 -top-5 h-20 w-32 object-contain opacity-25 mix-blend-screen" />
                  <div className="relative mb-3 flex items-center justify-between border-b border-white/5 pb-3">
                    <span className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-neon-amber">
                      <FiAlertTriangle /> Deadline Risk ({alerts.length})
                    </span>
                    <span className="text-[10px] font-mono text-gray-500">Comet alert</span>
                  </div>

                  <div className="relative max-h-72 space-y-3 overflow-y-auto pr-1">
                    {alerts.length === 0 ? (
                      <p className="py-4 text-center text-xs text-gray-500">No deadline risk detected.</p>
                    ) : (
                      alerts.map((alert, idx) => (
                        <div
                          key={alert.id || alert._id || alert.title || idx}
                          className={`relative overflow-hidden rounded-2xl border p-3 text-xs ${
                            alert.severity === 'critical'
                              ? 'border-red-500/25 bg-red-500/10 text-red-200'
                              : 'border-amber-500/25 bg-amber-500/10 text-amber-100'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 font-semibold">
                            <span className="line-clamp-1 text-white">{alert.title}</span>
                            <span className="font-mono text-[10px]">{alert.daysLeft}d</span>
                          </div>
                          <p className="mt-1 line-clamp-2 text-[11px] opacity-80">{alert.message}</p>
                          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                            <div className="h-full rounded-full bg-gradient-to-r from-neon-amber to-neon-red" style={{ width: `${Math.min(100, alert.progress || 0)}%` }} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-3 border-l border-white/10 pl-3">
          <InitialAvatar name={user?.name || 'Commander Nova'} size="sm" />
          <div className="hidden lg:block">
            <p className="text-xs font-semibold tracking-wide text-white">{user?.name || 'Commander Nova'}</p>
            <p className="text-[10px] font-mono uppercase tracking-widest text-neon-blue">
              {isTeamMember ? 'Team Member' : 'Project Manager'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
