import React, { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { FiActivity, FiCpu, FiShield, FiSliders, FiUsers } from 'react-icons/fi';
import toast from 'react-hot-toast';
import InviteCrewCard from '../components/InviteCrewCard';
import TeamMembersCard from '../components/TeamMembersCard';

const Settings = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const email = user?.email || '';
  const avatar = user?.avatar || '';
  const isTeamMember = user?.role === 'Crew' || user?.role === 'Team Member' || user?.role === 'TeamMember';

  const handleSave = (e) => {
    e.preventDefault();
    toast.success('Settings saved');
  };

  return (
    <div className="page-container">
      {/* Title Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="page-title text-white font-display">Settings</h1>
          <p className="text-xs font-mono text-gray-400 mt-1">Profile, workspace, team visibility, and system preferences.</p>
        </div>
        <div className="hidden rounded-2xl border border-neon-cyan/20 bg-neon-cyan/10 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.24em] text-neon-cyan lg:block">
          System Status: Online
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.9fr)]">
        <div className="space-y-6">
          <form onSubmit={handleSave} className="glass-card h-fit p-5 lg:p-6">
            <div className="flex items-center gap-2 pb-3 border-b border-white/5 mb-4">
              <FiSliders className="text-neon-blue text-base" />
              <h3 className="font-display font-semibold text-sm text-white">Account Profile</h3>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <img
                src={avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${name || 'User'}`}
                alt="Avatar Preview"
                className="h-16 w-16 rounded-2xl border border-white/10 object-cover"
              />
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-semibold text-white">{name || user?.name || 'MissionGrid User'}</p>
                <p className="mt-1 truncate text-xs text-gray-400">{email}</p>
                <p className="mt-2 text-[10px] font-mono uppercase tracking-wider text-neon-cyan">
                  {isTeamMember ? 'Team Member' : 'Project Manager'}
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label-text">Display Name</label>
                <input
                  type="text"
                  className="input-field text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="label-text">Email</label>
                <input
                  type="email"
                  className="input-field text-sm"
                  value={email}
                  disabled
                  required
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end border-t border-white/5 pt-4">
              <button type="submit" className="btn-primary text-sm">
                Save Settings
              </button>
            </div>
          </form>

          <div className="glass-card relative overflow-hidden p-5 lg:p-6">
            <img
              src="/images/crew_spaceship.webp"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -right-10 -top-8 h-52 w-72 object-contain opacity-[0.42] mix-blend-screen drop-shadow-[0_0_54px_rgba(14,165,233,0.62)]"
            />
            <div className="relative grid grid-cols-1 gap-5 lg:grid-cols-[1fr_0.9fr] lg:items-end">
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-white/5 mb-3">
                  <FiCpu className="text-neon-cyan text-base" />
                  <h3 className="font-display font-semibold text-sm text-white">System Diagnostics</h3>
                </div>

                <div className="space-y-2 font-mono text-xs text-gray-400">
                  <div className="flex justify-between gap-3"><span className="uppercase">System Status:</span> <span className="text-neon-cyan">Online</span></div>
                  <div className="flex justify-between gap-3"><span className="uppercase">Role:</span> <span>{isTeamMember ? 'Team Member' : 'Project Manager'}</span></div>
                  <div className="flex justify-between gap-3"><span className="uppercase">Workspace:</span> <span>{user?.workspaceName || 'MissionGrid'}</span></div>
                  <div className="flex justify-between gap-3"><span className="uppercase">Control Version:</span> <span>v1.0.0</span></div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  ['Auth', 'Stable', FiShield],
                  ['Team', 'Synced', FiUsers],
                  ['API', 'Live', FiActivity],
                ].map(([label, value, Icon]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-space-950/55 p-3">
                    <Icon className="mb-3 text-neon-cyan" />
                    <p className="font-mono text-[9px] uppercase tracking-wider text-gray-500">{label}</p>
                    <p className="mt-1 truncate text-xs font-semibold text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <TeamMembersCard />
          <InviteCrewCard />
        </div>
      </div>
    </div>
  );
};

export default Settings;
