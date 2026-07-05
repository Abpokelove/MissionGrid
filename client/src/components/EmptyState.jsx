import React from 'react';

const EmptyState = ({ icon: Icon, title, message, action }) => (
  <div className="glass-card mx-auto flex max-w-xl flex-col items-center justify-center p-8 text-center">
    {Icon && (
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-2xl text-neon-blue">
        <Icon />
      </div>
    )}
    <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
    {message && <p className="mt-2 max-w-sm text-sm leading-6 text-gray-400">{message}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default EmptyState;
