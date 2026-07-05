import React, { useEffect, useMemo, useState } from 'react';
import { analyticsAPI } from '../services/api';
import { FiAlertCircle, FiArrowRight, FiCpu, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import InitialAvatar from '../components/InitialAvatar';
import GlassCard from '../components/command/GlassCard';

const emptyWorkloadData = { workload: [], suggestions: [] };

const getLoadTone = (count) => {
  if (count >= 5) return { label: 'Overload', color: 'from-neon-red to-neon-amber', border: 'border-neon-red/25', text: 'text-neon-red', width: Math.min(100, (count / 7) * 100) };
  if (count >= 3) return { label: 'Heavy', color: 'from-neon-amber to-yellow-300', border: 'border-neon-amber/25', text: 'text-neon-amber', width: Math.min(100, (count / 6) * 100) };
  return { label: 'Stable', color: 'from-neon-cyan to-neon-blue', border: 'border-neon-cyan/25', text: 'text-neon-cyan', width: Math.min(100, (count / 5) * 100) };
};

const Workload = () => {
  const [data, setData] = useState(emptyWorkloadData);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('live');
  const [error, setError] = useState(null);

  const fetchWorkloadData = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const { data } = await analyticsAPI.getWorkload();
      setData({
        workload: Array.isArray(data?.workload) ? data.workload : [],
        suggestions: Array.isArray(data?.suggestions) ? data.suggestions : [],
      });
      setSource('live');
    } catch (error) {
      console.error('Failed to sync workload:', error);
      setData(emptyWorkloadData);
      setSource('offline');
      setError('Workload API is unavailable. Retry when the backend is online.');
      toast.error('Workload API is unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkloadData();
  }, []);

  const totalLoad = useMemo(() => data.workload.reduce((sum, crew) => sum + (crew.activeCount || 0), 0), [data.workload]);

  if (loading) {
    return (
      <div className="page-container flex min-h-[60vh] flex-col items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-neon-blue border-r-transparent border-b-transparent border-l-transparent" />
        <p className="mt-4 text-sm font-mono text-neon-blue animate-pulse">Calculating team workload...</p>
      </div>
    );
  }

  return (
    <div className="page-container relative overflow-hidden">
      <div className="pointer-events-none absolute -right-20 top-20 h-72 w-72 rounded-full bg-neon-blue/10 blur-3xl" />
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-neon-cyan">{source === 'live' ? 'Live Team Telemetry' : 'API Offline'}</p>
          <h1 className="mt-1 font-display text-3xl font-black text-white lg:text-4xl">Team Workload Balancer</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
            Detect overloaded team members, rebalance assignments, and keep project delivery healthy.
          </p>
        </div>
        <button type="button" onClick={() => fetchWorkloadData()} className="btn-secondary inline-flex items-center gap-2 text-sm">
          <FiRefreshCw /> Refresh Workload
        </button>
      </motion.div>

      {error && (
        <div className="rounded-lg border border-neon-amber/30 bg-neon-amber/10 p-4 text-sm text-amber-100">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <button type="button" onClick={() => fetchWorkloadData()} className="rounded-lg border border-neon-amber/30 px-3 py-2 text-xs font-semibold text-white hover:bg-neon-amber/15">
              Retry
            </button>
          </div>
        </div>
      )}

      <GlassCard className="relative overflow-hidden p-5 lg:p-6" hover={false}>
        <img
          src="/images/crew_spaceship.webp"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -top-5 h-32 w-48 object-contain opacity-[0.24] mix-blend-screen drop-shadow-[0_0_34px_rgba(14,165,233,0.38)]"
        />
        <div className="relative grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-neon-blue">Workload Summary</p>
            <h2 className="mt-1 font-display text-xl font-bold text-white">Team capacity at a glance</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
              Review active tasks, blocked work, and deadline pressure before assignments become unhealthy.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-3 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
              <p className="font-display text-2xl font-bold text-white">{totalLoad}</p>
              <p className="text-[10px] font-mono uppercase tracking-wider text-gray-500">Active Tasks</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
              <p className="font-display text-2xl font-bold text-neon-cyan">{data.workload.length}</p>
              <p className="text-[10px] font-mono uppercase tracking-wider text-gray-500">Team Members</p>
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.65fr)_420px]">
        <div className="space-y-4">
          {data.workload.length === 0 ? (
            <GlassCard className="p-8 text-center text-sm text-gray-400" hover={false}>No active team allocations detected. Assign team members to tasks first.</GlassCard>
          ) : (
            data.workload.map((crew, index) => {
              const tone = getLoadTone(crew.activeCount || 0);
              return (
                <motion.div
                  key={crew.user?._id || crew.user?.name || index}
                  initial={{ opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.06 }}
                  whileHover={{ y: -4 }}
                  className="glass-card relative overflow-hidden p-5 transition hover:border-neon-blue/30"
                >
                  <img
                    src="/images/crew_spaceship.webp"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-6 bottom-0 h-28 w-40 object-contain opacity-10 mix-blend-screen transition duration-500 group-hover:opacity-20"
                  />
                  <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <InitialAvatar name={crew.user?.name || 'Crew Member'} size="lg" />
                      <div>
                        <h4 className="font-display text-lg font-bold text-white">{crew.user?.name || 'Team Member'}</h4>
                        <p className="mt-1 text-[10px] font-mono uppercase tracking-wider text-gray-500">{crew.user?.email || 'team@missiongrid.io'} // {crew.user?.role === 'Captain' ? 'Project Manager' : 'Team Member'}</p>
                        <div className="mt-2 flex gap-2 text-[10px] font-mono uppercase">
                          {crew.blockedCount > 0 && <span className="rounded-full bg-neon-red/10 px-2 py-1 text-neon-red">{crew.blockedCount} blocks</span>}
                          {crew.overdueCount > 0 && <span className="rounded-full bg-neon-amber/10 px-2 py-1 text-neon-amber">{crew.overdueCount} overdue</span>}
                        </div>
                      </div>
                    </div>

                    <div className="w-full sm:w-72">
                      <div className="mb-2 flex justify-between text-[10px] font-mono uppercase tracking-wider text-gray-400">
                        <span>Active Load</span>
                        <span>{crew.activeCount || 0} Tasks</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full border border-white/10 bg-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${tone.width}%` }}
                          transition={{ duration: 0.9, delay: 0.1 }}
                          className={`h-full rounded-full bg-gradient-to-r ${tone.color}`}
                        />
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className={`rounded-full border ${tone.border} bg-white/5 px-3 py-1 text-[10px] font-mono uppercase tracking-wider ${tone.text}`}>{tone.label}</span>
                        <span className="text-[10px] font-mono text-gray-500">{Math.round(((crew.activeCount || 0) / Math.max(totalLoad, 1)) * 100)}% of team load</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        <div className="space-y-5">
          <GlassCard className="relative overflow-hidden p-5" hover={false}>
            <img src="/images/dashboard_grid.webp" alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-10" />
            <div className="relative flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="rounded-2xl border border-neon-cyan/30 bg-neon-cyan/10 p-3 text-neon-cyan shadow-glow-cyan"><FiCpu /></div>
              <div>
                <h3 className="font-display text-lg font-bold text-white">Rebalance Suggestions</h3>
                <p className="text-xs text-gray-500">Automatic workload imbalance detection</p>
              </div>
            </div>
            <div className="relative mt-4 space-y-4">
              {data.suggestions.length === 0 ? (
                <div className="rounded-2xl border border-neon-cyan/15 bg-neon-cyan/5 p-4 text-sm text-gray-300">
                  Team distribution is stable. No reassignment required right now.
                </div>
              ) : (
                data.suggestions.map((sug, idx) => (
                  <div key={idx} className="rounded-2xl border border-neon-cyan/20 bg-neon-cyan/5 p-4 text-xs">
                    <div className="mb-3 flex gap-2 font-display text-sm font-semibold text-white">
                      <FiAlertCircle className="mt-0.5 shrink-0 text-neon-cyan" /> Workload Rebalance Flag
                    </div>
                    <p className="leading-6 text-gray-400">{sug.message}</p>
                    <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-space-950/55 p-3">
                      <div className="flex items-center gap-2 text-neon-red"><InitialAvatar name={sug.from?.name || 'Overloaded Team Member'} size="sm" /><span>{sug.from?.name || 'Member A'}</span></div>
                      <FiArrowRight className="text-gray-500" />
                      <div className="flex items-center gap-2 text-neon-cyan"><InitialAvatar name={sug.to?.name || 'Available Team Member'} size="sm" /><span>{sug.to?.name || 'Member B'}</span></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>

          <GlassCard className="relative overflow-hidden p-5" hover={false}>
            <img src="/images/crew_spaceship.webp" alt="" aria-hidden="true" className="absolute -right-10 -top-6 h-32 w-48 object-contain opacity-15 mix-blend-screen" />
            <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-neon-blue">Team Capacity</p>
            <h3 className="mt-2 font-display text-3xl font-black text-white">{totalLoad}</h3>
            <p className="mt-2 text-sm text-gray-400">Active tasks distributed across {data.workload.length} team members.</p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default Workload;
