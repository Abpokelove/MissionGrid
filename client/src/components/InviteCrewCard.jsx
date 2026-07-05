import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiCopy, FiRefreshCw, FiUsers } from 'react-icons/fi';
import { getAPIErrorMessage, inviteAPI, workspaceAPI } from '../services/api';
import { useAuth } from '../context/useAuth';
import GlassCard from './command/GlassCard';

const InviteCrewCard = ({ compact = false }) => {
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.role !== 'Captain') {
      setLoading(false);
      return;
    }

    let mounted = true;
    const loadWorkspace = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await workspaceAPI.getMe();
        if (mounted) setWorkspace(data);
      } catch (err) {
        if (mounted) setError(getAPIErrorMessage(err, 'Could not load invite link'));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadWorkspace();
    return () => {
      mounted = false;
    };
  }, [user?.role]);

  const inviteCode = useMemo(() => {
    return workspace?.inviteCode || user?.inviteCode || 'DEMO123';
  }, [workspace?.inviteCode, user?.inviteCode]);

  const inviteLink = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    return `${origin}/join/${inviteCode}`;
  }, [inviteCode]);

  if (user?.role !== 'Captain') return null;

  const copyValue = async (value, kind) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      toast.success(kind === 'code' ? 'Invite code copied' : 'Invite link copied');
      setTimeout(() => setCopied(null), 1600);
    } catch {
      toast.error('Clipboard permission was blocked');
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    setError(null);
    try {
      const { data } = await inviteAPI.regenerate();
      setWorkspace((current) => ({
        ...(current || {}),
        inviteCode: data.inviteCode,
        name: data.teamName || current?.name,
      }));
      toast.success('Invite code regenerated');
    } catch (err) {
      setError(getAPIErrorMessage(err, 'Could not regenerate invite code'));
      toast.error(getAPIErrorMessage(err, 'Could not regenerate invite code'));
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <GlassCard className={`relative p-4 lg:p-5 ${compact ? '' : 'min-h-[220px]'}`} hover={false}>
      <img
        src="/images/crew_spaceship.webp"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 bottom-0 h-36 w-48 object-contain opacity-[0.22] mix-blend-screen drop-shadow-[0_0_34px_rgba(14,165,233,0.35)]"
      />

      <div className="relative">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-neon-cyan">Invite Team</p>
            <h2 className="mt-1 font-display text-lg font-bold text-white">Team Invite Link</h2>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-neon-cyan/25 bg-neon-cyan/10 text-neon-cyan shadow-glow-cyan">
            <FiUsers />
          </div>
        </div>

        <p className="mb-4 text-sm leading-6 text-gray-400">
          Share this code or link with team members so they can join {workspace?.name || user?.workspaceName || 'your workspace'} with Team Member permissions.
        </p>

        <div className="space-y-3 rounded-2xl border border-white/10 bg-space-950/55 p-3">
          <div>
            <p className="mb-2 text-[10px] font-mono uppercase tracking-wider text-gray-500">Invite Code</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={loading ? 'Loading...' : inviteCode}
                readOnly
                className="input-field min-w-0 flex-1 text-xs font-mono tracking-[0.18em]"
              />
              <motion.button
                type="button"
                onClick={() => copyValue(inviteCode, 'code')}
                animate={copied === 'code' ? { scale: [1, 1.04, 1] } : undefined}
                className="btn-secondary inline-flex items-center justify-center gap-2 text-xs"
              >
                <FiCopy /> {copied === 'code' ? 'Copied' : 'Copy Code'}
              </motion.button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-mono uppercase tracking-wider text-gray-500">Invite Link</p>
            <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={loading ? `Loading ${inviteLink}` : inviteLink}
              readOnly
              className="input-field min-w-0 flex-1 text-xs"
            />
            <motion.button
              type="button"
              onClick={() => copyValue(inviteLink, 'link')}
              animate={copied === 'link' ? { scale: [1, 1.04, 1] } : undefined}
              className="btn-secondary inline-flex items-center justify-center gap-2 text-xs"
            >
              <FiCopy /> {copied === 'link' ? 'Copied' : 'Copy Link'}
            </motion.button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-3 rounded-xl border border-neon-amber/25 bg-neon-amber/10 p-3 text-xs text-amber-100">
            {error}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={regenerating || loading}
            className="btn-secondary inline-flex items-center gap-2 text-xs"
          >
            <FiRefreshCw className={regenerating ? 'animate-spin' : ''} />
            Regenerate Code
          </button>
        </div>
      </div>
    </GlassCard>
  );
};

export default InviteCrewCard;
