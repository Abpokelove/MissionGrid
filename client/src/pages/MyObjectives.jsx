import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiAlertTriangle, FiCheckCircle, FiRefreshCw, FiTarget } from 'react-icons/fi';
import { objectiveAPI, getAPIErrorMessage } from '../services/api';
import { useAuth } from '../context/useAuth';
import EmptyState from '../components/EmptyState';
import GlassCard from '../components/command/GlassCard';

const demoObjectives = [
  {
    _id: 'demo-assigned-1',
    title: 'Blend comet and orbit assets into cinematic overlays',
    status: 'In Progress',
    priority: 'High',
    progress: 55,
    deadline: new Date(Date.now() + 2 * 86400000).toISOString(),
    missionId: { title: 'Operation Nebula Frontend', status: 'Active' },
  },
  {
    _id: 'demo-assigned-2',
    title: 'Add assigned objectives endpoint',
    status: 'To Do',
    priority: 'High',
    progress: 10,
    deadline: new Date(Date.now() + 6 * 86400000).toISOString(),
    missionId: { title: 'Quantum API Infrastructure', status: 'Active' },
  },
];

const statuses = ['Backlog', 'To Do', 'In Progress', 'Review', 'Completed'];

const MyObjectives = () => {
  const { user } = useAuth();
  const [objectives, setObjectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [source, setSource] = useState('live');

  const loadObjectives = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await objectiveAPI.getMine();
      setObjectives(Array.isArray(data) ? data : []);
      setSource('live');
    } catch (err) {
      setObjectives(demoObjectives);
      setSource('demo');
      setError(getAPIErrorMessage(err, 'Could not load assigned tasks'));
      toast.error('Assigned tasks API offline. Demo tasks loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadObjectives();
  }, [loadObjectives]);

  const updateObjective = async (objective, payload) => {
    if (objective._id?.startsWith?.('demo-')) {
      setObjectives((current) =>
        current.map((item) => (item._id === objective._id ? { ...item, ...payload } : item))
      );
      toast.success('Demo task updated locally');
      return;
    }

    try {
      const { data } = await objectiveAPI.update(objective._id, payload);
      setObjectives((current) => current.map((item) => (item._id === objective._id ? data : item)));
      toast.success('Task progress updated');
    } catch (err) {
      toast.error(getAPIErrorMessage(err, 'Could not update task'));
    }
  };

  const upcoming = useMemo(() => {
    const now = new Date();
    return objectives.filter((objective) => objective.deadline && new Date(objective.deadline) >= now && objective.status !== 'Completed');
  }, [objectives]);

  if (loading) {
    return (
      <div className="page-container flex min-h-[420px] flex-col items-center justify-center">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-neon-blue border-r-transparent border-b-transparent" />
        <p className="mt-4 text-sm font-mono text-neon-blue">Loading assigned tasks...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-neon-blue">
            {source === 'live' ? 'Live Workspace' : 'Demo Fallback'}
          </p>
          <h1 className="page-title text-white">My Tasks</h1>
          <p className="mt-1 text-sm text-gray-400">
            Focused view for {user?.name || 'your'} assigned tasks and upcoming deadlines.
          </p>
        </div>
        <button type="button" onClick={loadObjectives} className="btn-secondary inline-flex items-center gap-2 text-sm">
          <FiRefreshCw /> Retry
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-neon-amber/30 bg-neon-amber/10 p-4 text-sm text-amber-100">
          <div className="flex items-start gap-3">
            <FiAlertTriangle className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <GlassCard className="p-4 lg:p-5" hover={false}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-neon-cyan">Assigned Work</p>
              <h2 className="mt-1 font-display text-lg font-bold text-white">Task Queue</h2>
            </div>
            <FiTarget className="text-neon-cyan" />
          </div>

          {objectives.length === 0 ? (
            <EmptyState icon={FiCheckCircle} title="No Assigned Tasks" message="Nothing is assigned to you yet." action={<Link to="/missions" className="btn-secondary text-xs">View Projects</Link>} />
          ) : (
            <div className="space-y-3">
              {objectives.map((objective, index) => (
                <motion.div
                  key={objective._id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-display text-base font-semibold text-white">{objective.title}</p>
                      <p className="mt-1 text-xs text-gray-500">{objective.missionId?.title || 'Project context unavailable'}</p>
                    </div>
                    <span className="w-fit rounded-lg border border-neon-blue/25 bg-neon-blue/10 px-2.5 py-1 text-[10px] font-mono uppercase text-neon-blue">
                      {objective.priority || 'Medium'}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_160px]">
                    <div>
                      <div className="mb-1 flex justify-between text-[10px] font-mono uppercase text-gray-500">
                        <span>Progress</span>
                        <span>{objective.progress || 0}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={objective.progress || 0}
                        onChange={(event) => updateObjective(objective, { progress: Number(event.target.value) })}
                        className="w-full accent-cyan-400"
                      />
                    </div>
                    <select
                      value={objective.status || 'Backlog'}
                      onChange={(event) => updateObjective(objective, { status: event.target.value })}
                      className="select-field text-sm"
                    >
                      {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-3 text-[10px] font-mono uppercase text-gray-500">
                    <span>Status: {objective.status}</span>
                    <span>{objective.deadline ? `Deadline: ${new Date(objective.deadline).toLocaleDateString()}` : 'No deadline'}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-4 lg:p-5" hover={false}>
          <img src="/images/comet_stage2.webp" alt="" aria-hidden="true" className="pointer-events-none absolute -right-5 -top-6 h-24 w-24 object-contain opacity-25 mix-blend-screen drop-shadow-[0_0_24px_rgba(245,158,11,0.45)]" />
          <div className="relative">
            <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-neon-amber">Upcoming</p>
            <h2 className="mt-1 font-display text-lg font-bold text-white">Deadline Risk</h2>
            <div className="mt-5 space-y-3">
              {upcoming.slice(0, 5).map((objective) => (
                <div key={objective._id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <p className="line-clamp-2 text-sm font-semibold text-white">{objective.title}</p>
                  <div className="mt-2 flex justify-between text-[10px] font-mono uppercase text-gray-500">
                    <span>{objective.status}</span>
                    <span>{new Date(objective.deadline).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {upcoming.length === 0 && (
                <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center text-xs text-gray-500">
                  No upcoming deadline risk.
                </p>
              )}
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default MyObjectives;
