import React from 'react';

export const Loader = ({ label = 'Synchronizing telemetry', full = false }) => (
  <div className={`flex flex-col items-center justify-center text-white ${full ? 'min-h-screen' : 'min-h-[280px]'}`}>
    <div className="relative h-20 w-20">
      <div className="absolute inset-0 rounded-full border border-neon-blue/20" />
      <div className="absolute inset-1 rounded-full border-2 border-t-neon-blue border-r-transparent border-b-transparent border-l-transparent animate-spin" />
      <div className="absolute inset-4 rounded-full border-2 border-t-transparent border-r-neon-violet border-b-transparent border-l-transparent animate-spin-slow" />
      <div className="absolute inset-8 rounded-full bg-neon-cyan shadow-glow-cyan animate-pulse" />
    </div>
    <p className="mt-5 text-xs font-mono uppercase tracking-[0.28em] text-neon-blue animate-pulse">
      {label}
    </p>
  </div>
);

export const Skeleton = ({ className = '' }) => (
  <div className={`skeleton ${className}`} aria-hidden="true" />
);

export const DashboardSkeleton = () => (
  <div className="page-container">
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-32" />
      ))}
    </div>
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <Skeleton className="h-[520px] xl:col-span-2" />
      <Skeleton className="h-[520px]" />
    </div>
  </div>
);

export default Loader;
