import React from 'react';
import { Link } from 'react-router-dom';

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition-all duration-300 active:scale-95';

const variants = {
  primary:
    'bg-gradient-to-r from-neon-blue via-neon-violet to-neon-pink text-white shadow-glow-blue hover:shadow-glow-violet',
  secondary:
    'border border-neon-blue/25 bg-white/5 text-white backdrop-blur-xl hover:border-neon-cyan/50 hover:bg-neon-blue/10 hover:shadow-glow-blue',
};

const GlowButton = ({ to, children, variant = 'primary', className = '', ...props }) => {
  const classes = `${base} ${variants[variant] || variants.primary} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  );
};

export default GlowButton;
