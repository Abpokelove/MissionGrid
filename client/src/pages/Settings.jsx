import React, { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { FiSliders, FiCpu } from 'react-icons/fi';
import toast from 'react-hot-toast';
import InviteCrewCard from '../components/InviteCrewCard';

const Settings = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const email = user?.email || '';
  const [avatar, setAvatar] = useState(user?.avatar || '');

  const handleSave = (e) => {
    e.preventDefault();
    toast.success('Control room configurations saved successfully');
  };

  return (
    <div className="page-container max-w-5xl mx-auto">
      {/* Title Header */}
      <div>
        <h1 className="page-title text-white font-display">SETTINGS</h1>
        <p className="text-xs font-mono text-gray-400 mt-1">Profile, workspace, and system preferences.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <form onSubmit={handleSave} className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/5 mb-2">
            <FiSliders className="text-neon-blue text-base" />
            <h3 className="font-display font-semibold text-sm text-white">Account Profile</h3>
          </div>

          <div className="flex items-center gap-4 py-2">
            <img
              src={avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${name || 'User'}`}
              alt="Avatar Preview"
              className="w-16 h-16 rounded-xl border border-white/10"
            />
            <div>
              <p className="text-xs font-mono text-gray-400 uppercase">Avatar URL</p>
              <input
                type="text"
                className="input-field text-xs mt-1.5 px-3 py-2 w-96 max-w-full"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="Image URL..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div className="flex justify-end pt-4 border-t border-white/5">
            <button type="submit" className="btn-primary text-sm">
              Save Settings
            </button>
          </div>
        </form>

        <div className="space-y-6">
          <InviteCrewCard />

          <div className="glass-card p-6">
            <div className="flex items-center gap-2 pb-3 border-b border-white/5 mb-3">
              <FiCpu className="text-neon-cyan text-base" />
              <h3 className="font-display font-semibold text-sm text-white">System Diagnostics</h3>
            </div>

            <div className="space-y-2 font-mono text-xs text-gray-400">
              <div className="flex justify-between gap-3"><span className="uppercase">System Status:</span> <span className="text-neon-cyan">Online</span></div>
              <div className="flex justify-between gap-3"><span className="uppercase">Role:</span> <span>{user?.role === 'Crew' ? 'Team Member' : 'Project Manager'}</span></div>
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
