import React from 'react';
import { motion } from 'framer-motion';

const GlassCard = ({ children, className = '', hover = true, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, delay }}
    whileHover={hover ? { y: -4, borderColor: 'rgba(14,165,233,0.34)' } : undefined}
    className={`glass-card relative overflow-hidden ${className}`}
  >
    <img
      src="/images/dashboard_grid.webp"
      alt=""
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.10] mix-blend-screen"
    />
    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-blue/70 to-transparent" />
    <div className="relative z-10">{children}</div>
  </motion.div>
);

export default GlassCard;
