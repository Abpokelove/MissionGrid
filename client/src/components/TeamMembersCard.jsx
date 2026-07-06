import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiRefreshCw, FiShield, FiUserCheck, FiUsers } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getAPIErrorMessage, workspaceAPI } from '../services/api';
import { useAuth } from '../context/useAuth';
import GlassCard from './command/GlassCard';
import EmptyState from './EmptyState';
import InitialAvatar from './InitialAvatar';

const isTeamMemberRole = (role) => role === 'Crew' || role === 'Team Member' || role === 'TeamMember';
const getId = (value) => {
  if (!value) return '';
  if (typeof value === 'object') return String(value._id || value.id || '');
  return String(value);
};

const TeamMembersCard = ({ compact = false, limit = compact ? 5 : 8 }) => {
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTeam = useCallback(async ({ silent = false } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await workspaceAPI.getMe();
      const workspaceData = data?.workspace || data || {};
      const roster = Array.isArray(workspaceData.members)
        ? workspaceData.members
        : Array.isArray(data?.members)
          ? data.members
          : [];

      setWorkspace(workspaceData);
      setMembers(roster);
    } catch (err) {
      const message = getAPIErrorMessage(err, 'Could not load team members');
      setError(message);
      setMembers([]);
      if (!silent) toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeam({ silent: true });
  }, [loadTeam]);

  const sortedMembers = useMemo(() => {
    const currentUserId = getId(user);
    const ownerId = getId(workspace?.owner);
    return [...members].sort((a, b) => {
      const aIsCurrent = getId(a) === currentUserId ? 1 : 0;
      const bIsCurrent = getId(b) === currentUserId ? 1 : 0;
      if (aIsCurrent !== bIsCurrent) return bIsCurrent - aIsCurrent;

      const aIsOwner = getId(a) === ownerId || !isTeamMemberRole(a.role);
      const bIsOwner = getId(b) === ownerId || !isTeamMemberRole(b.role);
      if (aIsOwner !== bIsOwner) return Number(bIsOwner) - Number(aIsOwner);

      return (a.name || '').localeCompare(b.name || '');
    });
  }, [members, user, workspace?.owner]);

  const visibleMembers = sortedMembers.slice(0, limit);
  const hiddenCount = Math.max(0, sortedMembers.length - visibleMembers.length);
  const currentUserId = getId(user);

  return (
    <GlassCard className="relative overflow-hidden p-4 lg:p-5" hover={false}>
      <img
        src="/images/crew_spaceship.webp"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 top-1 h-36 w-56 object-contain opacity-[0.34] mix-blend-screen drop-shadow-[0_0_46px_rgba(14,165,233,0.58)]"
      />

      <div className="relative">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-neon-blue">Workspace Team</p>
            <h2 className="mt-1 font-display text-lg font-bold text-white">Team Members</h2>
            <p className="mt-1 truncate text-xs text-gray-500">
              {workspace?.name || user?.workspaceName || 'MissionGrid workspace'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadTeam()}
            disabled={loading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neon-blue/25 bg-neon-blue/10 text-neon-blue transition hover:border-neon-cyan/40 hover:text-neon-cyan disabled:cursor-not-allowed disabled:opacity-60"
            title="Refresh team members"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-14 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-neon-amber/25 bg-neon-amber/10 p-4 text-sm text-amber-100">
            <div className="flex items-start gap-3">
              <FiShield className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        ) : visibleMembers.length === 0 ? (
          <EmptyState
            icon={FiUsers}
            title="No Team Members Yet"
            message="Invite team members to build your workspace roster."
          />
        ) : (
          <div className="space-y-3">
            {visibleMembers.map((member, index) => {
              const isCurrentUser = getId(member) === currentUserId;
              const isProjectManager = !isTeamMemberRole(member.role);
              return (
                <motion.div
                  key={member._id || member.email || member.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.035 }}
                  className={`rounded-2xl border p-3 transition ${
                    isCurrentUser
                      ? 'border-neon-cyan/35 bg-neon-cyan/10'
                      : 'border-white/10 bg-white/[0.04] hover:border-neon-blue/30 hover:bg-neon-blue/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name || 'Team member'}
                        className="h-10 w-10 shrink-0 rounded-xl border border-white/10 object-cover"
                      />
                    ) : (
                      <InitialAvatar name={member.name || member.email || 'Team Member'} size="md" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-display text-sm font-semibold text-white">
                          {member.name || 'Team Member'}
                        </p>
                        {isCurrentUser && <FiUserCheck className="shrink-0 text-neon-cyan" title="You" />}
                      </div>
                      <p className="mt-1 flex min-w-0 items-center gap-1.5 truncate text-xs text-gray-500">
                        <FiMail className="shrink-0" />
                        <span className="truncate">{member.email || 'No email available'}</span>
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-lg border px-2 py-1 text-[9px] font-mono uppercase tracking-wider ${
                      isProjectManager
                        ? 'border-neon-violet/30 bg-neon-violet/10 text-neon-violet'
                        : 'border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan'
                    }`}>
                      {isProjectManager ? 'Manager' : 'Member'}
                    </span>
                  </div>
                </motion.div>
              );
            })}

            {hiddenCount > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2 text-center text-xs text-gray-400">
                +{hiddenCount} more team member{hiddenCount === 1 ? '' : 's'}
              </div>
            )}
          </div>
        )}
      </div>
    </GlassCard>
  );
};

export default TeamMembersCard;
