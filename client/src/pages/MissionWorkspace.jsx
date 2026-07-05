import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { missionAPI, objectiveAPI } from '../services/api';
import { FiArrowLeft, FiEdit3, FiCompass, FiLayers, FiRadio, FiPlus, FiAlertTriangle, FiAlertOctagon } from 'react-icons/fi';
import ObjectiveDetailModal from '../components/ObjectiveDetailModal';
import OrbitView from '../components/command/OrbitView';
import InitialAvatar from '../components/InitialAvatar';
import toast from 'react-hot-toast';
import { useAuth } from '../context/useAuth';

const MissionWorkspace = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [mission, setMission] = useState(null);
  const [objectives, setObjectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, kanban, orbit

  // Objective details modal controls
  const [selectedObjective, setSelectedObjective] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isTeamMember = user?.role === 'Crew' || user?.role === 'Team Member' || user?.role === 'TeamMember';
  const isCaptain = !isTeamMember;

  const fetchWorkspaceTelemetry = useCallback(async () => {
    try {
      const { data } = await missionAPI.getOne(id);
      setMission(data.mission);
      setObjectives(data.objectives);
    } catch (error) {
      console.error('Failed to load project workspace:', error);
      toast.error('Unable to load project workspace');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchWorkspaceTelemetry();
  }, [fetchWorkspaceTelemetry]);

  const handleCreateObjectiveOpen = () => {
    if (!isCaptain) return;
    setSelectedObjective(null);
    setIsModalOpen(true);
  };

  const handleEditObjectiveOpen = (obj) => {
    if (!isCaptain) return;
    setSelectedObjective(obj);
    setIsModalOpen(true);
  };

  const handleStatusChange = async (obj, newStatus) => {
    try {
      await objectiveAPI.update(obj._id, { status: newStatus });
      toast.success(`Task moved to ${newStatus}`);
      fetchWorkspaceTelemetry();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Could not update task status');
    }
  };

  const getCoreStabilityColor = (score) => {
    if (score >= 75) return 'text-neon-cyan drop-shadow-[0_0_10px_rgba(6,214,160,0.4)]';
    if (score >= 50) return 'text-neon-blue drop-shadow-[0_0_10px_rgba(14,165,233,0.4)]';
    if (score >= 30) return 'text-neon-amber drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]';
    return 'text-neon-red drop-shadow-[0_0_10px_rgba(239,68,68,0.4)]';
  };

  if (loading) {
    return (
      <div className="page-container flex flex-col justify-center items-center h-[calc(100vh-5rem)]">
        <div className="w-16 h-16 border-4 border-t-neon-blue border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-mono text-neon-blue animate-pulse text-sm">Loading project workspace...</p>
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="page-container text-center py-12">
        <h3 className="text-xl font-bold text-white">Project Workspace Unavailable</h3>
        <Link to="/missions" className="btn-primary text-xs mt-4 inline-block">Return to Projects</Link>
      </div>
    );
  }

  // Count blocked / overdue
  const blockedObjectivesCount = objectives.filter(o => o.isBlocked).length;
  const now = new Date();
  const overdueObjectivesCount = objectives.filter(o => o.deadline && new Date(o.deadline) < now && o.status !== 'Completed').length;

  return (
    <div className="page-container">
      {/* Top Breadcrumb Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="min-w-0">
          <Link to="/missions" className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors mb-2">
            <FiArrowLeft /> Back to Projects
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="page-title text-white truncate">{mission.title}</h1>
            <span className={`badge ${
              mission.status === 'Completed' ? 'status-completed' : 'status-inprogress'
            }`}>
              {mission.status}
            </span>
          </div>
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-1">
            Category: {mission.category} / Start: {new Date(mission.startDate).toLocaleDateString()}
          </p>
        </div>
        {isCaptain && (
          <div className="flex gap-2">
            <Link to={`/missions/${mission._id}/edit`} className="btn-secondary text-xs flex items-center gap-1.5 py-2">
              <FiEdit3 /> Edit Project
            </Link>
            <button
              onClick={handleCreateObjectiveOpen}
              className="btn-primary text-xs flex items-center gap-1.5 py-2"
            >
              <FiPlus /> Create Task
            </button>
          </div>
        )}
      </div>

      {/* Tabs Switcher Navigation */}
      <div className="flex border-b border-white/5 gap-6">
        {[
          { id: 'overview', label: 'Project Overview', icon: FiRadio },
          { id: 'kanban', label: 'Task Board', icon: FiLayers },
          { id: 'orbit', label: 'Orbit View', icon: FiCompass }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3.5 text-sm font-semibold tracking-wide border-b-2 transition-all relative font-display ${
                activeTab === tab.id
                  ? 'border-neon-blue text-white neon-text'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon className="text-base" />
              {tab.label}
              {tab.id === 'kanban' && objectives.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-white/5 border border-white/10 text-[9px] font-mono font-medium text-gray-400">
                  {objectives.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tabs Content */}
      <div className="pt-2">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: General Stats & Progress indicators */}
            <div className="lg:col-span-2 space-y-6">
              {/* Project progress */}
              <div className="glass-card p-6">
                <h3 className="font-display font-semibold text-sm text-white mb-4">Project Progress</h3>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex justify-between font-mono text-xs text-gray-400 mb-2">
                      <span>Progress</span>
                      <span className="text-neon-blue">{mission.progress}%</span>
                    </div>
                    <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-neon-blue to-neon-violet" style={{ width: `${mission.progress}%` }}></div>
                    </div>
                    <p className="text-[11px] text-gray-500 font-mono mt-3 leading-normal">
                      Calculated automatically from the progress of all assigned tasks.
                    </p>
                  </div>
                  
                  {/* Circle progress indicator */}
                  <div className="w-24 h-24 rounded-full border border-white/5 flex items-center justify-center relative bg-space-950/40">
                    <svg className="w-20 h-20 -rotate-90">
                      <circle cx="40" cy="40" r="34" className="stroke-white/5 fill-none" strokeWidth="6" />
                      <circle
                        cx="40"
                        cy="40"
                        r="34"
                        className="stroke-neon-blue fill-none"
                        strokeWidth="6"
                        strokeDasharray="213.6"
                        strokeDashoffset={213.6 - (213.6 * mission.progress) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute font-display font-bold text-base text-white">{mission.progress}%</span>
                  </div>
                </div>
              </div>

              {/* Project description */}
              <div className="glass-card p-6">
                <h3 className="font-display font-semibold text-sm text-white mb-3">Project Description</h3>
                <p className="text-xs text-gray-400 leading-relaxed font-body whitespace-pre-line">
                  {mission.description || 'No project description has been added yet.'}
                </p>
              </div>

              {/* Team list */}
              <div className="glass-card p-6">
                <h3 className="font-display font-semibold text-sm text-white mb-4">Assigned Team</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {mission.crew?.map((c) => (
                    <div key={c._id} className="p-3 rounded-xl bg-space-950/30 border border-white/5 flex items-center gap-3.5">
                      <img src={c.avatar} alt={c.name} className="w-10 h-10 rounded-lg border border-white/10" />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-white leading-snug">{c.name}</p>
                        <span className="text-[10px] font-mono text-neon-blue uppercase tracking-wider">
                          {c.role === 'Crew' ? 'Team Member' : 'Project Manager'}
                        </span>
                      </div>
                    </div>
                  ))}
                  {mission.crew?.length === 0 && (
                    <p className="text-xs text-gray-500 font-mono">No team members assigned yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right: project health and risk warnings */}
            <div className="space-y-6">
              {/* Project health widget */}
              <div className="glass-card p-6 flex flex-col items-center text-center relative overflow-hidden">
                {/* Glow Backdrop */}
                <div className={`absolute -top-24 w-48 h-48 rounded-full filter blur-[50px] opacity-15 ${
                  mission.coreStability >= 75 ? 'bg-neon-cyan' :
                  mission.coreStability >= 50 ? 'bg-neon-blue' : 'bg-neon-red'
                }`}></div>

                <h3 className="font-display font-semibold text-sm text-white mb-4 self-stretch text-left">Project Health</h3>
                
                <div className="relative w-40 h-40 flex items-center justify-center mb-4">
                  {/* Planet core rotating graphic fallback */}
                  <img
                    src="/images/planet_core.webp"
                    alt="Project health core"
                    className="absolute w-28 h-28 object-contain animate-spin-slow opacity-85 drop-shadow-[0_0_34px_rgba(6,214,160,0.55)]"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div className={`absolute w-30 h-30 rounded-full border-2 border-dashed animate-spin ${
                    mission.coreStability >= 75 ? 'border-neon-cyan/20' : 'border-neon-red/20'
                  }`}></div>
                  
                  <span className={`absolute font-display font-black text-3xl ${getCoreStabilityColor(mission.coreStability)}`}>
                    {mission.coreStability}%
                  </span>
                </div>

                <div className="text-[10px] font-mono text-gray-500 mt-2">
                  Health rating: {mission.coreStability >= 75 ? 'Optimal' : mission.coreStability >= 50 ? 'Stable' : 'Needs attention'}
                </div>
              </div>

              {/* Warning Alert panels */}
              {(blockedObjectivesCount > 0 || overdueObjectivesCount > 0) && (
                <div className="space-y-3.5">
                  {blockedObjectivesCount > 0 && (
                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 space-y-2">
                      <span className="text-xs font-semibold font-display flex items-center gap-1.5 uppercase tracking-wide">
                        <FiAlertOctagon className="text-neon-red animate-pulse text-base" /> Blocked Tasks ({blockedObjectivesCount})
                      </span>
                      <p className="text-[11px] leading-relaxed opacity-85">
                        One or more tasks are blocked. Clear the blocker notes to restore delivery health.
                      </p>
                    </div>
                  )}

                  {overdueObjectivesCount > 0 && (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 space-y-2">
                      <span className="text-xs font-semibold font-display flex items-center gap-1.5 uppercase tracking-wide">
                        <FiAlertTriangle className="text-neon-amber animate-bounce text-base" /> Deadline Risk ({overdueObjectivesCount})
                      </span>
                      <p className="text-[11px] leading-relaxed opacity-85">
                        Some tasks have passed their deadline without being completed.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* KANBAN BOARD */}
        {activeTab === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4 pt-2">
            {[
              { id: 'Backlog', label: 'Backlog' },
              { id: 'To Do', label: 'To Do' },
              { id: 'In Progress', label: 'In Progress' },
              { id: 'Review', label: 'Review' },
              { id: 'Completed', label: 'Completed' }
            ].map((col) => {
              const colObjectives = objectives.filter(o => o.status === col.id);
              return (
                <div key={col.id} className="flex-1 min-w-[220px] flex flex-col rounded-xl bg-space-900/40 border border-white/5 p-3.5 min-h-[500px]">
                  {/* Column Header */}
                  <div className="flex justify-between items-center pb-3.5 border-b border-white/5 mb-4">
                    <span className="font-display font-bold text-xs uppercase tracking-widest text-white">
                      {col.label}
                    </span>
                    <span className="px-2 py-0.2 rounded bg-white/5 text-[9px] font-mono text-gray-500">
                      {colObjectives.length}
                    </span>
                  </div>

                  {/* Cards container */}
                  <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[520px] pr-1">
                    {colObjectives.map((o) => (
                      <div
                        key={o._id}
                        onClick={() => isCaptain && handleEditObjectiveOpen(o)}
                        className={`glass-card relative flex min-h-[168px] flex-col justify-between p-3.5 transition-all hover:border-white/20 ${isCaptain ? 'cursor-pointer' : ''} ${
                          o.isBlocked ? 'border-red-500/20' : ''
                        }`}
                      >
                        {o.isBlocked && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-950/80 border border-neon-red flex items-center justify-center animate-shake z-10 shadow-glow-red text-transparent" title={`Asteroid blocked: ${o.blockerReason}`}>
                            <img src="/images/asteroid_blocker.webp" alt="" aria-hidden="true" className="absolute h-5 w-5 object-contain" />
                          </div>
                        )}

                        <div className="flex items-start justify-between gap-2">
                          <span className={`text-[8px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded border ${
                            o.priority === 'Critical' ? 'bg-red-500/10 border-red-500/20 text-neon-red' :
                            o.priority === 'High' ? 'bg-amber-500/10 border-amber-500/20 text-neon-amber' :
                            o.priority === 'Medium' ? 'bg-blue-500/10 border-blue-500/20 text-neon-blue' :
                            'bg-green-500/10 border-green-500/20 text-neon-cyan'
                          }`}>
                            {o.priority}
                          </span>
                          <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 font-mono text-[10px] text-neon-cyan">{o.progress}%</span>
                        </div>

                        <h4 className="mt-3 line-clamp-2 font-semibold text-sm leading-snug text-white transition-colors hover:text-neon-cyan">
                          {o.title}
                        </h4>

                        <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.03] p-2">
                          {o.assignedTo?.avatar ? (
                            <img
                              src={o.assignedTo.avatar}
                              alt={o.assignedTo.name}
                              className="h-9 w-9 max-h-9 max-w-9 shrink-0 rounded-xl border border-white/10 object-cover"
                              title={o.assignedTo.name}
                            />
                          ) : (
                            <InitialAvatar name={o.assignedTo?.name || 'Unassigned'} size="sm" />
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-white">{o.assignedTo?.name || 'Unassigned'}</p>
                            <p className="mt-0.5 text-[9px] font-mono uppercase tracking-wider text-gray-500">Assignee</p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/5 pt-2.5 text-[10px]">
                          <div className="min-w-0">
                            <p className="font-mono uppercase text-gray-500">
                              {o.deadline ? new Date(o.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No date'}
                            </p>
                            <p className="mt-1 truncate font-mono text-gray-600">{o.status || col.id}</p>
                          </div>
                          <div className="flex gap-1">
                            {col.id !== 'Backlog' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const statuses = ['Backlog', 'To Do', 'In Progress', 'Review', 'Completed'];
                                  const idx = statuses.indexOf(col.id);
                                  handleStatusChange(o, statuses[idx - 1]);
                                }}
                                className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-gray-400 transition-colors hover:bg-neon-blue/15 hover:text-white"
                              >
                                &larr;
                              </button>
                            )}
                            {col.id !== 'Completed' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const statuses = ['Backlog', 'To Do', 'In Progress', 'Review', 'Completed'];
                                  const idx = statuses.indexOf(col.id);
                                  handleStatusChange(o, statuses[idx + 1]);
                                }}
                                className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-gray-400 transition-colors hover:bg-neon-blue/15 hover:text-white"
                              >
                                &rarr;
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {colObjectives.length === 0 && (
                      <p className="text-[10px] text-center text-gray-600 font-mono py-8 border border-dashed border-white/5 rounded-xl">
                        Column empty
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'orbit' && (
          <div className="glass-card relative overflow-hidden p-5">
            <div className="mb-4 flex flex-col gap-1">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-neon-cyan">Orbit View</span>
              <span className="text-xs text-gray-400">Click a task node to open its detail panel.</span>
            </div>
            <OrbitView objectives={objectives} compact onSelectObjective={isCaptain ? handleEditObjectiveOpen : undefined} />
          </div>
        )}
      </div>

      {isCaptain && (
        <ObjectiveDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          objective={selectedObjective}
          mission={mission}
          onSave={fetchWorkspaceTelemetry}
        />
      )}
    </div>
  );
};

export default MissionWorkspace;
