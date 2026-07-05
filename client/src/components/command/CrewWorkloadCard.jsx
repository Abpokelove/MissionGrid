import React from 'react';
import { FiNavigation, FiUsers } from 'react-icons/fi';
import GlassCard from './GlassCard';

const CrewWorkloadCard = ({ workload = [] }) => {
  const crew = workload;
  const max = Math.max(...crew.map((item) => item.activeCount), 1);

  return (
    <GlassCard className="p-4 lg:p-5">
      <img
        src="/images/crew_spaceship.webp"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-3 h-16 w-24 object-contain opacity-[0.22] mix-blend-screen drop-shadow-[0_0_26px_rgba(14,165,233,0.34)]"
      />
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-neon-cyan">Team Capacity</p>
          <h3 className="mt-1 font-display text-lg font-semibold text-white">Team Workload</h3>
        </div>
      </div>

      <div className="space-y-4">
        {crew.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center">
            <FiUsers className="mx-auto text-2xl text-gray-500" />
            <p className="mt-3 font-display text-sm font-semibold text-white">No Team Workload Yet</p>
            <p className="mt-2 text-xs leading-5 text-gray-500">
              Assign tasks to team members and live capacity will appear here.
            </p>
          </div>
        )}
        {crew.slice(0, 5).map((item) => {
          const load = Math.round((item.activeCount / max) * 100);
          const danger = item.blockedCount > 0 || item.overdueCount > 0;
          return (
            <div key={item.user?._id || item.user?.name} className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{item.user?.name || 'Unassigned Team Member'}</p>
                  <p className="font-mono text-[9px] uppercase tracking-wider text-gray-500">
                    {item.activeCount} tasks
                    {danger ? ` / ${item.blockedCount + item.overdueCount} alerts` : ''}
                  </p>
                </div>
                <span className={`inline-flex items-center gap-1 font-mono ${danger ? 'text-neon-red' : 'text-neon-cyan'}`}>
                  <FiNavigation className="text-[11px]" /> {load}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full ${danger ? 'bg-gradient-to-r from-neon-amber to-neon-red' : 'bg-gradient-to-r from-neon-cyan to-neon-blue'}`}
                  style={{ width: `${load}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
};

export default CrewWorkloadCard;
