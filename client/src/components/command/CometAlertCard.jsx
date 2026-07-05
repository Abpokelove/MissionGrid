import React from 'react';
import { motion } from 'framer-motion';
import { FiAlertTriangle } from 'react-icons/fi';

const stageImage = (alert) => {
  if (alert?.stage === 3 || alert?.severity === 'critical') return '/images/comet_stage3.webp';
  if (alert?.stage === 2 || alert?.severity === 'warning') return '/images/comet_stage2.webp';
  return '/images/comet_stage1.webp';
};

const CometAlertCard = ({ alert, index = 0 }) => (
  <motion.div
    initial={{ opacity: 0, x: 28 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.08 }}
    whileHover={{ x: -4 }}
    className={`relative overflow-hidden rounded-lg border p-3 ${
      alert?.severity === 'critical'
        ? 'border-neon-red/30 bg-neon-red/10'
        : alert?.severity === 'warning'
        ? 'border-neon-amber/30 bg-neon-amber/10'
        : 'border-neon-blue/25 bg-neon-blue/10'
    }`}
  >
    <motion.img
      src={stageImage(alert)}
      alt=""
      aria-hidden="true"
      className="pointer-events-none absolute -right-3 -top-4 h-16 w-16 object-contain opacity-40 mix-blend-screen drop-shadow-[0_0_24px_rgba(245,158,11,0.55)]"
      animate={{ x: [6, -2, 6], y: [5, -3, 5], opacity: [0.28, 0.58, 0.28] }}
      transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
    />
    <div className="relative z-10 flex items-start gap-3">
      <div className="mt-0.5 rounded-lg border border-white/10 bg-black/20 p-2 text-neon-amber">
        <FiAlertTriangle />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <h4 className="truncate font-display text-sm font-semibold text-white">{alert?.title || 'Trajectory Clear'}</h4>
          <span className="shrink-0 font-mono text-[10px] text-gray-300">
            {Number.isFinite(alert?.daysLeft) ? `${alert.daysLeft}d` : 'scan'}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-300">{alert?.message || 'No active deadline risks.'}</p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(8, Math.min(100, alert?.progress || 18))}%` }}
            transition={{ duration: 0.9 }}
            className={alert?.severity === 'critical' ? 'h-full bg-neon-red shadow-glow-red' : 'h-full bg-neon-amber shadow-glow-amber'}
          />
        </div>
      </div>
    </div>
  </motion.div>
);

export default CometAlertCard;
