import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { missionAPI } from '../services/api';
import { FiPlus, FiTrash2, FiEdit2, FiCompass, FiCalendar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useAuth } from '../context/useAuth';

const Missions = () => {
  const { user } = useAuth();
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMissions();
  }, []);

  const fetchMissions = async () => {
    setError(null);
    try {
      const { data } = await missionAPI.getAll();
      setMissions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load missions:', error);
      setMissions([]);
      setError('Project API is unavailable. Retry when the backend is online.');
      toast.error('Project API is unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title, e) => {
    e.preventDefault(); // Prevent navigating to workspace
    if (!window.confirm(`Delete "${title}"? This will also delete its tasks.`)) {
      return;
    }

    try {
      await missionAPI.delete(id);
      toast.success(`Project "${title}" deleted`);
      setMissions(missions.filter(m => m._id !== id));
    } catch (error) {
      console.error('Delete mission failed:', error);
      toast.error('Could not delete project');
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Critical': return 'badge-critical';
      case 'High': return 'badge-high';
      case 'Medium': return 'badge-medium';
      default: return 'badge-low';
    }
  };

  const getCoreStabilityColor = (score) => {
    if (score >= 75) return 'text-neon-cyan';
    if (score >= 50) return 'text-neon-blue';
    if (score >= 30) return 'text-neon-amber';
    return 'text-neon-red';
  };

  const isTeamMember = user?.role === 'Crew' || user?.role === 'Team Member' || user?.role === 'TeamMember';
  const isCaptain = !isTeamMember;

  if (loading) {
    return (
      <div className="page-container flex flex-col justify-center items-center h-[calc(100vh-5rem)]">
        <div className="w-16 h-16 border-4 border-t-neon-blue border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-mono text-neon-blue animate-pulse text-sm">Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title text-white">Projects</h1>
          <p className="text-xs font-mono text-gray-400 mt-1">Create, review, and open active project workspaces.</p>
        </div>
        {isCaptain && (
          <Link to="/missions/create" className="btn-primary text-sm flex items-center gap-2">
            <FiPlus /> Create Project
          </Link>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-neon-amber/30 bg-neon-amber/10 p-4 text-sm text-amber-100">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <button type="button" onClick={fetchMissions} className="rounded-lg border border-neon-amber/30 px-3 py-2 text-xs font-semibold text-white hover:bg-neon-amber/15">
              Retry
            </button>
          </div>
        </div>
      )}

      {missions.length === 0 ? (
        <div className="glass-card p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto mt-12">
          <FiCompass className="text-5xl text-gray-600 animate-spin-slow mb-4" />
          <h3 className="font-display font-semibold text-lg text-white">No Projects Found</h3>
          <p className="text-xs text-gray-400 mt-2 max-w-xs leading-normal">
            Create your first project to start tracking tasks, team workload, and project health.
          </p>
          {isCaptain && (
            <Link to="/missions/create" className="btn-primary text-xs mt-6">
              Create Project
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {missions.map((m, index) => (
            <motion.div
              key={m._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4 }}
              className="glass-card flex flex-col justify-between overflow-hidden transition-all duration-300 hover:border-neon-blue/30 hover:shadow-glow-blue"
            >
              {/* Top gradient glow line */}
              <div className="h-1 w-full bg-gradient-to-r from-neon-blue via-neon-violet to-neon-pink"></div>

              {/* Card Body */}
              <div className="space-y-4 p-5">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[10px] font-mono text-neon-blue uppercase tracking-widest">
                    {m.category || 'Other'}
                  </span>
                  <div className="flex gap-2">
                    <span className={`badge ${getPriorityBadge(m.priority)}`}>
                      {m.priority}
                    </span>
                    <span className={`badge text-[10px] uppercase ${
                      m.status === 'Completed' ? 'status-completed' :
                      m.status === 'Active' ? 'status-inprogress' :
                      m.status === 'Paused' ? 'status-todo' : 'status-backlog'
                    }`}>
                      {m.status}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <h3 className="font-display font-bold text-lg text-white group-hover:text-neon-cyan transition-colors">
                    <Link to={`/missions/${m._id}`}>{m.title}</Link>
                  </h3>
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-gray-400">
                      {m.description || 'No project description yet.'}
                  </p>
                </div>

                {/* Progress Indicators */}
                <div className="space-y-2 pt-2">
                  <div>
                    <div className="flex justify-between font-mono text-[10px] text-gray-400 mb-1">
                      <span>PROGRESS</span>
                      <span>{m.progress}%</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-neon-blue to-neon-violet" style={{ width: `${m.progress}%` }}></div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 font-mono text-[10px]">PROJECT HEALTH</span>
                    <span className={`font-mono font-bold ${getCoreStabilityColor(m.coreStability)}`}>
                      {m.coreStability}%
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-white/5">
                  <div className="flex -space-x-2 overflow-hidden">
                    {m.crew?.slice(0, 4).map((c) => (
                      <img
                        key={c._id}
                        src={c.avatar}
                        alt={c.name}
                        title={`${c.name} (${c.role === 'Crew' ? 'Team Member' : 'Project Manager'})`}
                        className="inline-block h-7 w-7 rounded-full ring-2 ring-space-950 border border-white/10"
                      />
                    ))}
                    {m.crew?.length > 4 && (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-space-800 text-[9px] font-mono font-semibold text-neon-blue ring-2 ring-space-950">
                        +{m.crew.length - 4}
                      </span>
                    )}
                    {m.crew?.length === 0 && (
                      <span className="text-[10px] text-gray-500 font-mono uppercase">No team</span>
                    )}
                  </div>

                  {m.deadline ? (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-mono">
                      <FiCalendar />
                      <span>{new Date(m.deadline).toLocaleDateString()}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500 font-mono">No deadline</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-white/5 bg-white/[0.025] px-5 py-3">
                <Link
                  to={`/missions/${m._id}`}
                  className="btn-secondary px-3 py-2 text-xs"
                >
                  Open Project
                </Link>
                {isCaptain && (
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/missions/${m._id}/edit`}
                      className="rounded-lg border border-white/10 bg-white/5 p-2 text-gray-400 transition-colors hover:text-white"
                      title="Edit project"
                      aria-label={`Edit ${m.title}`}
                    >
                      <FiEdit2 className="text-sm" />
                    </Link>
                    <button
                      onClick={(e) => handleDelete(m._id, m.title, e)}
                      className="rounded-lg border border-white/10 bg-white/5 p-2 text-gray-400 transition-colors hover:text-neon-red"
                      title="Delete project"
                      aria-label={`Delete ${m.title}`}
                    >
                      <FiTrash2 className="text-sm" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Missions;
