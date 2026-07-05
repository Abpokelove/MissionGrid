import React, { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { FiSliders, FiCpu } from 'react-icons/fi';
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
    <div className="page-container mx-auto max-w-6xl">
      {/* Title Header */}
      <div>
        <h1 className="page-title text-white font-display">Settings</h1>
        <p className="text-xs font-mono text-gray-400 mt-1">Profile, workspace, and system preferences.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
        <form onSubmit={handleSave} className="glass-card h-fit p-5 lg:p-6">
          <div className="flex items-center gap-2 pb-3 border-b border-white/5 mb-2">
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

        <div className="space-y-6">
          <TeamMembersCard />
          <InviteCrewCard />

          <div className="glass-card p-6">
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
        </div>
      </div>
    </div>
  );
};

export default Settings;
