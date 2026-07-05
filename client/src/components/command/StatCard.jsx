import React, { useEffect, useState } from 'react';
import GlassCard from './GlassCard';

const useCountUp = (value) => {
  const target = Number(value) || 0;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame;
    const start = performance.now();
    const duration = 850;

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return display;
};

const StatCard = ({ label, value, suffix = '', icon: Icon, tone = 'blue', detail, delay = 0 }) => {
  const count = useCountUp(value);
  const tones = {
    blue: 'text-neon-blue bg-neon-blue/10 border-neon-blue/25 shadow-glow-blue',
    cyan: 'text-neon-cyan bg-neon-cyan/10 border-neon-cyan/25 shadow-glow-cyan',
    violet: 'text-neon-violet bg-neon-violet/10 border-neon-violet/25 shadow-glow-violet',
    amber: 'text-neon-amber bg-neon-amber/10 border-neon-amber/25 shadow-glow-amber',
    red: 'text-neon-red bg-neon-red/10 border-neon-red/25 shadow-glow-red',
  };

  return (
    <GlassCard delay={delay} className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-500">{label}</p>
          <div className="mt-2 font-display text-3xl font-bold text-white">
            {count}
            <span className="text-xl text-gray-400">{suffix}</span>
          </div>
        </div>
        {Icon && (
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${tones[tone]}`}>
            <Icon className="text-lg" />
          </div>
        )}
      </div>
      {detail && <p className="mt-3 text-xs leading-5 text-gray-400">{detail}</p>}
    </GlassCard>
  );
};

export default StatCard;
