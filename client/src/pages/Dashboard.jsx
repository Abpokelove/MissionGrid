import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FiActivity,
  FiAlertTriangle,
  FiArrowRight,
  FiCheckCircle,
  FiCompass,
  FiRefreshCw,
  FiShield,
  FiTarget,
  FiZap,
} from 'react-icons/fi';
import { analyticsAPI, getAPIErrorMessage, objectiveAPI } from '../services/api';
import { useAuth } from '../context/useAuth';
import { DashboardSkeleton } from '../components/Loader';
import EmptyState from '../components/EmptyState';
import GlassCard from '../components/command/GlassCard';
import StatCard from '../components/command/StatCard';
import ProgressRing from '../components/command/ProgressRing';
import OrbitView from '../components/command/OrbitView';
import CometAlertCard from '../components/command/CometAlertCard';
import CrewWorkloadCard from '../components/command/CrewWorkloadCard';
import InviteCrewCard from '../components/InviteCrewCard';
import TeamMembersCard from '../components/TeamMembersCard';

const emptyStats = {
  totalMissions: 0,
  activeMissions: 0,
  completedMissions: 0,
  totalObjectives: 0,
  completedObjectives: 0,
  inProgressObjectives: 0,
  blockedObjectives: 0,
  overdueObjectives: 0,
  completionRate: 0,
  avgCoreStability: 100,
  missions: [],
  recentObjectives: [],
};

const asArray = (value) => (Array.isArray(value) ? value : []);

const clampValue = (value, min = 0, max = 100) => Math.min(max, Math.max(min, Number(value) || 0));

const getPriorityTone = (priority) => {
  switch (priority) {
    case 'Critical':
      return 'text-neon-red border-neon-red/25 bg-neon-red/10';
    case 'High':
      return 'text-neon-amber border-neon-amber/25 bg-neon-amber/10';
    case 'Medium':
      return 'text-neon-blue border-neon-blue/25 bg-neon-blue/10';
    default:
      return 'text-neon-cyan border-neon-cyan/25 bg-neon-cyan/10';
  }
};

const coreColor = (score) => {
  if (score >= 78) return '#06d6a0';
  if (score >= 55) return '#0ea5e9';
  if (score >= 35) return '#f59e0b';
  return '#ef4444';
};

const objectiveStatuses = ['Backlog', 'To Do', 'In Progress', 'Review', 'Completed'];

const CrewDashboard = ({ authError }) => {
  const { user } = useAuth();
  const [objectives, setObjectives] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [source, setSource] = useState('live');

  const loadCrewDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [objectivesResult, alertsResult, statsResult] = await Promise.allSettled([
      objectiveAPI.getMine(),
      analyticsAPI.getCometAlerts(),
      analyticsAPI.getDashboard(),
    ]);

    if (objectivesResult.status === 'fulfilled') {
      setObjectives(asArray(objectivesResult.value.data));
    } else {
      setObjectives([]);
    }

    if (alertsResult.status === 'fulfilled') {
      setAlerts(asArray(alertsResult.value.data));
    } else {
      setAlerts([]);
    }

    if (statsResult.status === 'fulfilled') {
      setStats({ ...emptyStats, ...statsResult.value.data });
    } else {
      setStats(emptyStats);
    }

    const hasLiveData = objectivesResult.status === 'fulfilled' || alertsResult.status === 'fulfilled' || statsResult.status === 'fulfilled';
    if (!hasLiveData) {
      setSource('offline');
      setError(getAPIErrorMessage(objectivesResult.reason || alertsResult.reason || statsResult.reason));
      toast.error('Live team dashboard is unavailable.');
    } else {
      setSource('live');
      if (objectivesResult.status !== 'fulfilled' || alertsResult.status !== 'fulfilled' || statsResult.status !== 'fulfilled') {
        setError('Some live panels could not load. Retry to refresh missing data.');
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadCrewDashboard();
  }, [loadCrewDashboard]);

  const updateObjective = async (objective, payload) => {
    try {
      const { data } = await objectiveAPI.update(objective._id, payload);
      setObjectives((current) => current.map((item) => (
        item._id === objective._id ? data : item
      )));
      toast.success('Task progress updated');
    } catch (err) {
      toast.error(getAPIErrorMessage(err, 'Could not update task'));
    }
  };

  const activeObjectives = objectives.filter((objective) => objective.status !== 'Completed');
  const completedObjectives = objectives.filter((objective) => objective.status === 'Completed');
  const inProgressObjectives = objectives.filter((objective) => objective.status === 'In Progress' || objective.status === 'Review');
  const avgEnergy = Math.round(
    objectives.reduce((sum, objective) => sum + (Number(objective.progress) || 0), 0) / Math.max(objectives.length, 1)
  );

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="page-container relative overflow-hidden">
      <div className="pointer-events-none absolute -right-32 top-24 h-72 w-72 rounded-full bg-neon-blue/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
      >
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-neon-blue">
            {source === 'live' ? 'Live Team Workspace' : 'API Offline'}
          </p>
          <h1 className="mt-1 font-display text-3xl font-black text-white lg:text-4xl">
            Team Member Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
            Welcome back, {user?.name || 'Team Member'}. Track your assigned tasks, progress, and upcoming deadline risk.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={loadCrewDashboard} className="btn-secondary inline-flex items-center gap-2 text-sm">
            <FiRefreshCw /> Retry
          </button>
          <Link to="/my-objectives" className="btn-primary inline-flex items-center gap-2 text-sm">
            My Tasks <FiArrowRight />
          </Link>
        </div>
      </motion.div>

      {(error || authError) && (
        <div className="rounded-lg border border-neon-amber/30 bg-neon-amber/10 p-4 text-sm text-amber-100">
          <div className="flex items-start gap-3">
            <FiAlertTriangle className="mt-0.5 shrink-0" />
            <p>{error || authError}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="My Tasks" value={objectives.length} icon={FiTarget} tone="cyan" detail={`${activeObjectives.length} active`} delay={0.02} />
        <StatCard label="In Progress" value={inProgressObjectives.length} icon={FiActivity} tone="blue" detail="Tasks moving now" delay={0.05} />
        <StatCard label="Completed" value={completedObjectives.length} icon={FiCheckCircle} tone="cyan" detail="Closed tasks" delay={0.08} />
        <StatCard label="Deadline Risk" value={alerts.length} icon={FiAlertTriangle} tone={alerts.length ? 'amber' : 'blue'} detail="Assigned risk alerts" delay={0.11} />
        <StatCard label="Progress" value={avgEnergy} suffix="%" icon={FiZap} tone="violet" detail="Your task average" delay={0.14} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.45fr)_380px]">
        <GlassCard className="p-4 lg:p-5" hover={false}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-neon-cyan">Assigned Tasks</p>
              <h2 className="mt-1 font-display text-lg font-bold text-white">My Tasks</h2>
            </div>
            <Link to="/missions" className="text-sm font-semibold text-neon-blue transition hover:text-neon-cyan">Open Projects</Link>
          </div>

          {objectives.length === 0 ? (
            <EmptyState icon={FiCheckCircle} title="No Assigned Tasks" message="Your Project Manager has not assigned tasks yet." />
          ) : (
            <div className="space-y-3">
              {objectives.slice(0, 6).map((objective, index) => (
                <motion.div
                  key={objective._id || objective.title}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-neon-blue/30 hover:bg-neon-blue/10"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <p className="font-display text-sm font-semibold text-white">{objective.title}</p>
                      <p className="mt-1 text-xs text-gray-500">{objective.missionId?.title || 'Project context unavailable'}</p>
                    </div>
                    <select
                      value={objective.status || 'Backlog'}
                      onChange={(event) => updateObjective(objective, { status: event.target.value })}
                      className="select-field w-full text-xs md:w-40"
                    >
                      {objectiveStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </div>
                  <div className="mt-4">
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
                </motion.div>
              ))}
            </div>
          )}
        </GlassCard>

        <div className="space-y-5">
          <GlassCard className="p-4 lg:p-5" hover={false}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-neon-amber">Comet Alert</p>
                <h2 className="mt-1 font-display text-lg font-bold text-white">Your Deadline Risk</h2>
              </div>
              <img src="/images/comet_stage2.webp" alt="" aria-hidden="true" className="h-10 w-10 object-contain opacity-65 mix-blend-screen drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]" />
            </div>
            <div className="space-y-3">
              {alerts.length > 0 ? (
                alerts.slice(0, 4).map((alert, index) => (
                  <CometAlertCard key={alert.id || alert._id || alert.title || index} alert={alert} index={index} />
                ))
              ) : (
                <EmptyState icon={FiShield} title="No Deadline Risk" message="No assigned deadline risk is active right now." />
              )}
            </div>
          </GlassCard>

          <GlassCard className="p-4 lg:p-5" hover={false}>
            <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-neon-blue">Progress</p>
            <div className="mt-4 flex items-center justify-center gap-6">
              <ProgressRing value={avgEnergy} label="Progress" color="#0ea5e9" size={96} />
              <div className="max-w-[180px] text-sm leading-6 text-gray-400">
                Your average progress across assigned tasks.
              </div>
            </div>
          </GlassCard>

          <TeamMembersCard compact limit={4} />
        </div>
      </div>

      <GlassCard className="p-4 lg:p-5" hover={false}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-neon-violet">Project Overview</p>
            <h2 className="mt-1 font-display text-lg font-bold text-white">Project Overview</h2>
          </div>
          <FiCompass className="text-neon-violet" />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {asArray(stats?.missions).slice(0, 3).map((mission) => (
            <Link key={mission._id || mission.title} to={`/missions/${mission._id}`} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-neon-blue/30 hover:bg-neon-blue/10">
              <p className="line-clamp-1 font-display text-sm font-semibold text-white">{mission.title}</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-neon-blue to-neon-violet" style={{ width: `${mission.progress || 0}%` }} />
              </div>
              <div className="mt-2 flex justify-between text-[10px] font-mono uppercase text-gray-500">
                <span>{mission.status || 'Active'}</span>
                <span>{mission.progress || 0}%</span>
              </div>
            </Link>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

const Dashboard = () => {
  const { user, authError } = useAuth();
  const [stats, setStats] = useState(emptyStats);
  const [cometAlerts, setCometAlerts] = useState([]);
  const [workload, setWorkload] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [source, setSource] = useState('live');
  const isTeamMember = user?.role === 'Crew' || user?.role === 'Team Member' || user?.role === 'TeamMember';

  const loadDashboard = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError(null);

    const [dashboardResult, alertsResult, workloadResult] = await Promise.allSettled([
      analyticsAPI.getDashboard(),
      analyticsAPI.getCometAlerts(),
      analyticsAPI.getWorkload(),
    ]);

    const dashboardOk = dashboardResult.status === 'fulfilled';
    const alertsOk = alertsResult.status === 'fulfilled';
    const workloadOk = workloadResult.status === 'fulfilled';
    const hasLiveData = dashboardOk || alertsOk || workloadOk;

    if (dashboardOk) {
      setStats({ ...emptyStats, ...dashboardResult.value.data });
    } else {
      setStats(emptyStats);
    }

    if (alertsOk) {
      setCometAlerts(asArray(alertsResult.value.data));
    } else {
      setCometAlerts([]);
    }

    if (workloadOk) {
      setWorkload(asArray(workloadResult.value.data?.workload));
    } else {
      setWorkload([]);
    }

    if (!hasLiveData) {
      const message = getAPIErrorMessage(dashboardResult.reason || alertsResult.reason || workloadResult.reason);
      setError(message);
      setSource('offline');
      toast.error('Live telemetry is unavailable.');
    } else {
      setSource('live');
      if (!dashboardOk || !alertsOk || !workloadOk) {
        setError('Some live panels could not load. Retry to refresh missing data.');
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (isTeamMember) {
      setLoading(false);
      return;
    }

    loadDashboard();
  }, [loadDashboard, isTeamMember]);

  const missions = asArray(stats?.missions);
  const recentObjectives = asArray(stats?.recentObjectives);
  const alerts = asArray(cometAlerts);
  const avgMissionEnergy = stats?.completionRate || Math.round(
    missions.reduce((sum, mission) => sum + (Number(mission.progress) || 0), 0) / Math.max(missions.length, 1)
  );

  const orbitObjectives = useMemo(() => recentObjectives.slice(0, 10), [recentObjectives]);
  const activeTaskRows = recentObjectives.filter((objective) => objective.status !== 'Completed');
  const getObjectiveAssignees = (objective) => {
    const assignees = Array.isArray(objective.assignees)
      ? objective.assignees
      : objective.assignedTo
        ? [objective.assignedTo]
        : [];
    return assignees.filter(Boolean);
  };
  const getAssigneeLabel = (objective) => {
    const assignees = getObjectiveAssignees(objective);
    if (assignees.length === 0) return 'Unassigned';
    if (assignees.length === 1) return assignees[0]?.name || 'Unassigned';
    return `${assignees[0]?.name || 'Team'} +${assignees.length - 1}`;
  };
  const completedTaskCount = Number(stats?.completedObjectives) || 0;
  const inProgressTaskCount = Number(stats?.inProgressObjectives) || 0;
  const blockedTaskCount = Number(stats?.blockedObjectives) || 0;
  const deadlineRiskCount = Number(stats?.overdueObjectives) || 0;
  const openTaskCount = Math.max(0, (Number(stats?.totalObjectives) || 0) - completedTaskCount - inProgressTaskCount);
  const taskMixSegments = [
    { label: 'Completed', value: completedTaskCount, color: 'bg-neon-cyan' },
    { label: 'In Progress', value: inProgressTaskCount, color: 'bg-neon-blue' },
    { label: 'Open', value: openTaskCount, color: 'bg-neon-violet' },
    { label: 'Risk', value: deadlineRiskCount + blockedTaskCount, color: 'bg-neon-amber' },
  ];
  const taskMixTotal = Math.max(taskMixSegments.reduce((sum, item) => sum + item.value, 0), 1);
  const assignedActiveTasks = activeTaskRows.filter((objective) => getObjectiveAssignees(objective).length > 0).length;
  const assignmentCoverage = activeTaskRows.length
    ? Math.round((assignedActiveTasks / activeTaskRows.length) * 100)
    : 0;
  const activeProjectRatio = missions.length
    ? Math.round(((Number(stats?.activeMissions) || 0) / missions.length) * 100)
    : 0;

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (isTeamMember) {
    return <CrewDashboard authError={authError} />;
  }

  return (
    <div className="page-container relative overflow-hidden">
      <div className="pointer-events-none absolute -right-32 top-24 h-72 w-72 rounded-full bg-neon-violet/10 blur-3xl" />
      <div className="pointer-events-none absolute left-1/3 top-0 h-64 w-64 rounded-full bg-neon-blue/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
      >
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-neon-blue">
            {source === 'live' ? 'Live Data' : 'API Offline'}
          </p>
          <h1 className="mt-1 font-display text-3xl font-black text-white lg:text-4xl">
            Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
            Welcome back, {user?.name || 'Project Manager'}. Monitor project progress, deadline risk, team workload, and project health from one view.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => loadDashboard()}
            className="btn-secondary inline-flex items-center gap-2 text-sm"
          >
            <FiRefreshCw /> Retry Data
          </button>
          <Link to="/missions/create" className="btn-primary inline-flex items-center gap-2 text-sm">
            New Project <FiArrowRight />
          </Link>
        </div>
      </motion.div>

      {(error || authError) && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-lg border border-neon-amber/30 bg-neon-amber/10 p-4 text-sm text-amber-100"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <FiAlertTriangle className="mt-0.5 shrink-0 text-neon-amber" />
              <p>{error || authError}</p>
            </div>
            <button
              type="button"
              onClick={() => loadDashboard()}
              className="rounded-lg border border-neon-amber/30 px-3 py-2 text-xs font-semibold text-white transition hover:bg-neon-amber/15"
            >
              Retry
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Active Projects"
          value={stats?.activeMissions || 0}
          icon={FiCompass}
          tone="blue"
          detail={`${stats?.totalMissions || 0} total projects`}
          delay={0.02}
        />
        <StatCard
          label="Total Tasks"
          value={stats?.totalObjectives || 0}
          icon={FiTarget}
          tone="cyan"
          detail={`${stats?.completedObjectives || 0} completed tasks`}
          delay={0.05}
        />
        <StatCard
          label="In Progress"
          value={stats?.inProgressObjectives || 0}
          icon={FiActivity}
          tone="violet"
          detail="Active tasks in progress"
          delay={0.08}
        />
        <StatCard
          label="Deadline Risk"
          value={alerts.length || stats?.overdueObjectives || 0}
          icon={FiAlertTriangle}
          tone={alerts.length ? 'amber' : 'blue'}
          detail={`${stats?.blockedObjectives || 0} blocked tasks`}
          delay={0.11}
        />
        <StatCard
          label="Project Health"
          value={stats?.avgCoreStability || 100}
          suffix="%"
          icon={FiShield}
          tone="cyan"
          detail="Overall delivery health"
          delay={0.14}
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.75fr)_380px]">
        <div className="space-y-5">
          <GlassCard className="self-start p-4 lg:p-5" hover={false}>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-neon-cyan">Orbit View</p>
                <h2 className="mt-1 font-display text-lg font-bold text-white">Project Orbit View</h2>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-gray-400">
                Click nodes for details
              </div>
            </div>
            <OrbitView objectives={orbitObjectives} compact />
          </GlassCard>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <GlassCard className="p-4" hover={false}>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-neon-blue">Task Flow</p>
                  <h3 className="mt-1 font-display text-base font-bold text-white">Task Distribution</h3>
                </div>
                <FiActivity className="text-neon-blue" />
              </div>
              <div className="mb-4 flex h-3 overflow-hidden rounded-full border border-white/10 bg-white/5">
                {taskMixSegments.map((segment) => (
                  <span
                    key={segment.label}
                    className={`${segment.color} h-full`}
                    style={{ width: `${(segment.value / taskMixTotal) * 100}%` }}
                  />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono uppercase text-gray-400">
                {taskMixSegments.map((segment) => (
                  <div key={segment.label} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${segment.color}`} />
                      <span className="truncate">{segment.label}</span>
                    </span>
                    <span className="text-white">{segment.value}</span>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-4" hover={false}>
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-neon-cyan">Team Coverage</p>
                  <h3 className="mt-1 font-display text-base font-bold text-white">Assignment Coverage</h3>
                </div>
                <FiTarget className="text-neon-cyan" />
              </div>
              <div className="flex items-center justify-center gap-4">
                <ProgressRing value={assignmentCoverage} label="Assigned" color="#06d6a0" size={82} />
                <div className="text-sm leading-6 text-gray-400">
                  <span className="block font-mono text-xs text-white">{assignedActiveTasks}/{activeTaskRows.length}</span>
                  active tasks have at least one assigned team member.
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-4" hover={false}>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-neon-violet">Project Pulse</p>
                  <h3 className="mt-1 font-display text-base font-bold text-white">Active Projects</h3>
                </div>
                <FiCompass className="text-neon-violet" />
              </div>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="font-display text-3xl font-black text-white">{stats?.activeMissions || 0}</p>
                  <p className="mt-1 text-xs text-gray-400">of {missions.length} total projects are active.</p>
                </div>
                <span className="rounded-xl border border-neon-violet/25 bg-neon-violet/10 px-3 py-2 font-mono text-sm text-neon-violet">
                  {clampValue(activeProjectRatio)}%
                </span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${clampValue(activeProjectRatio)}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full rounded-full bg-gradient-to-r from-neon-blue to-neon-violet"
                />
              </div>
            </GlassCard>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <GlassCard className="p-4 lg:p-5" hover={false}>
              <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-neon-blue">Project Progress</p>
              <div className="mt-4 flex items-center justify-center gap-6">
                <ProgressRing value={avgMissionEnergy} label="Progress" color="#0ea5e9" size={96} />
                <div className="max-w-[180px] text-sm leading-6 text-gray-400">
                  Average progress across active tasks and recent projects.
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-4 lg:p-5" hover={false}>
              <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-neon-cyan">Project Health</p>
              <div className="mt-4 flex items-center justify-center gap-6">
                <ProgressRing value={stats?.avgCoreStability || 100} label="Health" color={coreColor(stats?.avgCoreStability || 100)} size={96} />
                <div className="max-w-[180px] text-sm leading-6 text-gray-400">
                  Health score based on progress, deadline risk, and blocked tasks.
                </div>
              </div>
            </GlassCard>
          </div>

          <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[0.85fr_1.15fr]">
            <GlassCard className="p-4 lg:p-5" hover={false}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-neon-violet">Recent Projects</p>
                  <h2 className="mt-1 font-display text-lg font-bold text-white">Recent Projects</h2>
                </div>
                <FiZap className="text-neon-violet" />
              </div>
              <div className="space-y-3">
                {missions.length > 0 ? (
                  missions.slice(0, 4).map((mission, index) => (
                    <motion.div
                      key={mission._id || mission.title}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.06 }}
                      className="rounded-lg border border-white/10 bg-white/[0.04] p-3 transition hover:border-neon-blue/30 hover:bg-neon-blue/10"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link to={`/missions/${mission._id}`} className="truncate font-display text-sm font-semibold text-white hover:text-neon-cyan">
                            {mission.title}
                          </Link>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className={`rounded-md border px-2 py-1 text-[9px] font-mono uppercase ${getPriorityTone(mission.priority)}`}>
                              {mission.priority || 'Medium'}
                            </span>
                            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-mono uppercase text-gray-400">
                              {mission.status || 'Active'}
                            </span>
                          </div>
                        </div>
                        <span className="font-mono text-xs text-neon-cyan">{mission.progress || 0}%</span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, mission.progress || 0)}%` }}
                          transition={{ duration: 0.8, delay: 0.1 }}
                          className="h-full rounded-full bg-gradient-to-r from-neon-blue to-neon-violet"
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-gray-500">
                        <span>Project Health {mission.coreStability || 100}%</span>
                        <span>{mission.deadline ? new Date(mission.deadline).toLocaleDateString() : 'No deadline'}</span>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <EmptyState
                    icon={FiCompass}
                    title="No Projects Yet"
                    message="Create your first project to activate the orbit map."
                    action={<Link to="/missions/create" className="btn-primary text-xs">Create Project</Link>}
                  />
                )}
              </div>
            </GlassCard>

            <GlassCard className="p-4 lg:p-5" hover={false}>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-neon-cyan">Active Tasks</p>
                  <h2 className="mt-1 font-display text-lg font-bold text-white">Active Tasks</h2>
                </div>
                <Link to="/missions" className="text-sm font-semibold text-neon-blue transition hover:text-neon-cyan">
                  Open Projects
                </Link>
              </div>
              <div className="space-y-3">
                {activeTaskRows.slice(0, 5).map((objective) => (
                  <div key={objective._id || objective.title} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{objective.title}</p>
                        <p className="mt-1 text-[10px] font-mono uppercase text-gray-500">
                          {getAssigneeLabel(objective)} / {objective.status || 'Backlog'}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-md border px-2 py-1 font-mono text-[10px] uppercase ${getPriorityTone(objective.priority)}`}>
                        {objective.priority || 'Medium'}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-neon-cyan" style={{ width: `${objective.progress || 0}%` }} />
                      </div>
                      <span className="font-mono text-[10px] text-gray-400">{objective.progress || 0}%</span>
                    </div>
                  </div>
                ))}
                {activeTaskRows.length === 0 && (
                  <EmptyState
                    icon={FiTarget}
                    title="No Active Tasks"
                    message="Create or assign tasks to populate this board."
                  />
                )}
              </div>
            </GlassCard>
          </div>
        </div>

        <div className="space-y-5">
          <GlassCard className="p-4 lg:p-5" hover={false}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-neon-amber">Comet Alert</p>
                <h2 className="mt-1 font-display text-lg font-bold text-white">Deadline Risk</h2>
              </div>
              <img src="/images/comet_stage2.webp" alt="" aria-hidden="true" className="h-10 w-10 object-contain opacity-65 mix-blend-screen drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]" />
            </div>
            <div className="space-y-3">
              {alerts.length > 0 ? (
                alerts.slice(0, 4).map((alert, index) => (
                  <CometAlertCard key={alert.id || alert._id || alert.title || index} alert={alert} index={index} />
                ))
              ) : (
                <EmptyState
                  icon={FiShield}
                  title="No Deadline Risk"
                  message="No deadline risks are active right now."
                />
              )}
            </div>
          </GlassCard>

          <CrewWorkloadCard workload={workload} />
          <TeamMembersCard compact limit={4} />
          <InviteCrewCard compact />
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
