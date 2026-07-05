import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiCalendar, FiFlag, FiX, FiZap } from 'react-icons/fi';

const now = () => new Date();

const daysUntil = (date) => {
  if (!date) return null;
  return Math.ceil((new Date(date) - now()) / 86400000);
};

const statusTone = (task) => {
  const days = daysUntil(task.deadline);
  if (task.isBlocked || (days !== null && days < 0)) {
    return {
      dot: 'bg-neon-red shadow-glow-red',
      ring: 'ring-neon-red/35',
      text: 'text-neon-red',
      label: 'Blocked',
      glow: 'rgba(239,68,68,0.78)',
    };
  }
  if (days !== null && days <= 3 && task.status !== 'Completed') {
    return {
      dot: 'bg-neon-amber shadow-glow-amber',
      ring: 'ring-neon-amber/35',
      text: 'text-neon-amber',
      label: 'Risk',
      glow: 'rgba(245,158,11,0.82)',
    };
  }
  switch (task.status) {
    case 'Completed':
      return { dot: 'bg-emerald-400 shadow-glow-cyan', ring: 'ring-emerald-400/35', text: 'text-emerald-300', label: 'Completed', glow: 'rgba(52,211,153,0.78)' };
    case 'In Progress':
      return { dot: 'bg-neon-cyan shadow-glow-cyan', ring: 'ring-neon-cyan/35', text: 'text-neon-cyan', label: 'In Progress', glow: 'rgba(6,214,160,0.78)' };
    case 'Review':
      return { dot: 'bg-neon-violet shadow-glow-violet', ring: 'ring-neon-violet/35', text: 'text-neon-violet', label: 'Review', glow: 'rgba(139,92,246,0.78)' };
    default:
      return { dot: 'bg-slate-300 shadow-[0_0_16px_rgba(148,163,184,0.5)]', ring: 'ring-slate-300/25', text: 'text-slate-300', label: task.status || 'Planned', glow: 'rgba(148,163,184,0.52)' };
  }
};

const TaskModal = ({ task, onClose }) => {
  const days = daysUntil(task?.deadline);
  return (
    <AnimatePresence>
      {task && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-space-950/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            className="glass-card relative z-10 w-full max-w-lg overflow-hidden p-6 shadow-glow-blue"
          >
            <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-neon-blue/10 blur-3xl" />
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-xl border border-white/10 bg-white/5 p-2 text-gray-400 hover:text-white"
              aria-label="Close task details"
            >
              <FiX />
            </button>
            <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-neon-blue">Task Details</p>
            <h3 className="mt-2 pr-10 font-display text-2xl font-bold text-white">{task.title}</h3>
            <p className="mt-3 text-sm leading-6 text-gray-300">{task.description || 'No task note attached.'}</p>
            <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-gray-500">Status</p>
                <p className="mt-1 font-semibold text-white">{task.status || 'Planned'}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-gray-500">Progress</p>
                <p className="mt-1 font-semibold text-neon-cyan">{task.progress || 0}%</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="flex items-center gap-1 text-gray-500"><FiFlag /> Priority</p>
                <p className="mt-1 font-semibold text-white">{task.priority || 'Medium'}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="flex items-center gap-1 text-gray-500"><FiCalendar /> Deadline</p>
                <p className="mt-1 font-semibold text-white">
                  {days === null ? 'Unscheduled' : days < 0 ? `${Math.abs(days)}d overdue` : `${days}d remaining`}
                </p>
              </div>
            </div>
            {task.isBlocked && (
              <div className="mt-4 rounded-xl border border-neon-red/25 bg-neon-red/10 p-3 text-xs text-red-200">
                {task.blockerReason || 'Asteroid block logged on this task.'}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const OrbitView = ({ objectives = [], compact = false, onSelectObjective }) => {
  const [selected, setSelected] = useState(null);
  const maxNodes = compact ? 7 : 10;
  const nodes = useMemo(() => objectives.slice(0, maxNodes), [objectives, maxNodes]);
  const size = compact ? 320 : 430;
  const center = size / 2;
  const ringRadii = compact ? [56, 92, 124, 152] : [78, 116, 158, 204];
  const orbitScale = compact ? 'scale-[0.78] sm:scale-90 md:scale-100' : 'scale-[0.6] sm:scale-[0.8] md:scale-90 lg:scale-100';

  return (
    <div className={`relative flex items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-space-950/35 ${compact ? 'h-[300px] sm:h-[320px]' : 'h-[420px] sm:h-[450px]'}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.18),transparent_40%),radial-gradient(circle_at_72%_24%,rgba(139,92,246,0.13),transparent_28%)]" />
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.07) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />

      <div className={`relative max-w-full origin-center ${orbitScale}`} style={{ width: size, height: size }}>
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.18)_0%,rgba(14,165,233,0.08)_36%,transparent_68%)] blur-sm" />

        {ringRadii.map((radius, index) => (
          <motion.div
            key={radius}
            className="absolute rounded-full border border-cyan-300/18"
            style={{
              left: center - radius,
              top: center - radius,
              width: radius * 2,
              height: radius * 2,
              boxShadow: index === ringRadii.length - 1 ? '0 0 34px rgba(14,165,233,.14), inset 0 0 24px rgba(14,165,233,.07)' : 'inset 0 0 14px rgba(14,165,233,.05)',
            }}
            animate={{ opacity: [0.32, 0.62, 0.32] }}
            transition={{ duration: 5.5 + index, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}

        <div className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
          <div className="absolute h-40 w-40 rounded-full bg-amber-400/12 blur-3xl" />
          <div className="absolute h-28 w-28 rounded-full border border-amber-200/25 shadow-glow-amber" />
          <img
            src="/images/sun.webp"
            alt="Project core"
            className={`${compact ? 'h-24 w-24' : 'h-32 w-32'} relative object-contain drop-shadow-[0_0_46px_rgba(245,158,11,0.72)]`}
          />
        </div>

        {nodes.length === 0 && (
          <div className="absolute inset-x-8 top-1/2 z-20 -translate-y-1/2 rounded-2xl border border-white/10 bg-black/30 p-4 text-center backdrop-blur-md">
            <p className="font-display text-sm font-semibold text-white">Create your first project to activate the orbit map.</p>
            <p className="mt-1 text-xs text-gray-400">Tasks will appear as status-coded nodes around the project core.</p>
          </div>
        )}

        {nodes.map((task, index) => {
          const angle = -90 + (360 / Math.max(nodes.length, 1)) * index;
          const radius = ringRadii[index % 3] + (index % 2 === 0 ? 0 : 6);
          const orbitSize = radius * 2;
          const orbitDuration = compact ? 18 + index * 2 : 24 + index * 2.5;
          const tone = statusTone(task);
          const days = daysUntil(task.deadline);
          const isRisk = task.isBlocked || (days !== null && days <= 3 && task.status !== 'Completed');
          const stage = days !== null && days <= 0 ? '/images/comet_stage3.webp' : '/images/comet_stage2.webp';

          return (
            <motion.div
              key={task._id || task.title}
              className="pointer-events-none absolute z-20"
              style={{
                left: center - radius,
                top: center - radius,
                width: orbitSize,
                height: orbitSize,
                transformOrigin: '50% 50%',
              }}
              initial={{ rotate: angle }}
              animate={{ rotate: angle + 360 }}
              transition={{ duration: orbitDuration, repeat: Infinity, ease: 'linear' }}
            >
              <div
                className="pointer-events-auto absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2"
              >
                <button
                  type="button"
                  onClick={() => (onSelectObjective ? onSelectObjective(task) : setSelected(task))}
                  className={`group relative h-5 w-5 rounded-full border border-white/45 ${tone.dot} ring-4 ${tone.ring} transition-transform hover:scale-150 focus:outline-none focus:ring-2 focus:ring-neon-blue`}
                  aria-label={`Open ${task.title}`}
                  title={`${task.title} / ${tone.label}`}
                  style={{ boxShadow: `0 0 24px ${tone.glow}` }}
                >
                  <motion.span
                    className="absolute inset-0 rounded-full border border-white/30"
                    animate={{ scale: [1, 1.85, 1], opacity: [0.45, 0, 0.45] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  {task.isBlocked && (
                    <motion.img
                      src="/images/asteroid_blocker.webp"
                      alt=""
                      aria-hidden="true"
                      className="absolute -left-5 -top-5 h-7 w-7 object-contain drop-shadow-[0_0_16px_rgba(239,68,68,0.7)]"
                      animate={{ rotate: [-4, 5, -4], scale: [0.96, 1.08, 0.96] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                  {isRisk && !task.isBlocked && (
                    <motion.img
                      src={stage}
                      alt=""
                      aria-hidden="true"
                      className="absolute -right-7 -top-7 h-8 w-12 object-contain mix-blend-screen drop-shadow-[0_0_18px_rgba(245,158,11,0.72)]"
                      animate={{ x: [5, -1, 5], y: [2, -3, 2], opacity: [0.55, 0.9, 0.55] }}
                      transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="absolute bottom-3 left-3 right-3 grid grid-cols-2 gap-2 text-[9px] font-mono uppercase tracking-wider text-gray-400 sm:grid-cols-5">
        {[
          ['Completed', 'bg-emerald-400'],
          ['In Progress', 'bg-neon-cyan'],
          ['Review', 'bg-neon-violet'],
          ['Risk', 'bg-neon-amber'],
          ['Blocked', 'bg-neon-red'],
        ].map(([label, color]) => (
          <div key={label} className="flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1.5 backdrop-blur-md">
            <span className={`h-2 w-2 rounded-full ${color}`} />
            {label}
          </div>
        ))}
      </div>

      <div className="absolute left-4 top-4 hidden items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 backdrop-blur-md sm:flex">
        <FiZap className="text-neon-cyan" /> Orbit View
      </div>

      <TaskModal task={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default OrbitView;
