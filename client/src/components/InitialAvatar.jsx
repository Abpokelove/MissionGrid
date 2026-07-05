import React from 'react';

const toneMap = ['from-neon-blue to-neon-cyan', 'from-neon-violet to-neon-pink', 'from-neon-amber to-neon-red', 'from-emerald-400 to-neon-cyan'];

const InitialAvatar = ({ name = 'Project Manager', size = 'md', className = '' }) => {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'MG';
  const tone = toneMap[Math.abs(name.length) % toneMap.length];
  const sizes = {
    sm: 'h-8 w-8 text-xs rounded-xl',
    md: 'h-11 w-11 text-sm rounded-2xl',
    lg: 'h-16 w-16 text-lg rounded-2xl',
    xl: 'h-16 w-16 text-xl rounded-3xl',
  };

  return (
    <div className={`${sizes[size] || sizes.md} flex shrink-0 items-center justify-center border border-white/15 bg-gradient-to-br ${tone} font-display font-black text-white shadow-glow-blue ${className}`}>
      {initials}
    </div>
  );
};

export default InitialAvatar;
