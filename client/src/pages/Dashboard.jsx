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

const demoStats = {
  totalMissions: 4,
  activeMissions: 3,
  completedMissions: 1,
  totalObjectives: 24,
  completedObjectives: 9,
  inProgressObjectives: 8,
  blockedObjectives: 2,
  overdueObjectives: 1,
  completionRate: 57,
  avgCoreStability: 76,
  missions: [
    { _id: 'demo-m1', title: 'Operation Nebula Frontend', progress: 68, coreStability: 78, status: 'Active', priority: 'High', deadline: new Date(Date.now() + 5 * 86400000).toISOString() },
    { _id: 'demo-m2', title: 'Quantum API Infrastructure', progress: 42, coreStability: 61, status: 'Active', priority: 'Critical', deadline: new Date(Date.now() + 9 * 86400000).toISOString() },
    { _id: 'demo-m3', title: 'Galaxy Brand Redesign', progress: 86, coreStability: 92, status: 'Active', priority: 'Medium', deadline: new Date(Date.now() + 18 * 86400000).toISOString() },
  ],
  recentObjectives: [
    { _id: 'demo-o1', title: 'Build orbit analytics cards', status: 'In Progress', progress: 72, priority: 'High', deadline: new Date(Date.now() + 4 * 86400000).toISOString(), assignedTo: { name: 'Aria Chen' } },
    { _id: 'demo-o2', title: 'Review command center motion pass', status: 'Review', progress: 86, priority: 'Medium', deadline: new Date(Date.now() + 7 * 86400000).toISOString(), assignedTo: { name: 'Luna Park' } },
    { _id: 'demo-o3', title: 'Clear Redis provision blocker', status: 'To Do', progress: 8, priority: 'Critical', deadline: new Date(Date.now() + 2 * 86400000).toISOString(), isBlocked: true, blockerReason: 'Infrastructure approval pending', assignedTo: { name: 'Rex Dalton' } },
    { _id: 'demo-o4', title: 'Ship login token validation', status: 'Completed', progress: 100, priority: 'High', assignedTo: { name: 'Commander Nova' } },
    { _id: 'demo-o5', title: 'Intercept deadline comet', status: 'In Progress', progress: 33, priority: 'Critical', deadline: new Date(Date.now() + 1 * 86400000).toISOString() },
  ],
};

const demoAlerts = [
  {
    type: 'mission',
    stage: 3,
    id: 'demo-alert-1',
    title: 'Quantum API Infrastructure',
    daysLeft: 3,
    progress: 42,
    message: 'Critical comet trajectory: API mission needs acceleration.',
    severity: 'critical',
  },
  {
    type: 'objective',
    stage: 2,
    id: 'demo-alert-2',
    title: 'Clear Redis provision blocker',
    daysLeft: 2,
    progress: 8,
    message: 'Asteroid block is slowing objective progress.',
    severity: 'warning',
  },
];

const demoWorkload = [
  { user: { name: 'Aria Chen', role: 'Crew' }, activeCount: 6, blockedCount: 1, overdueCount: 0 },
  { user: { name: 'Rex Dalton', role: 'Crew' }, activeCount: 5, blockedCount: 1, overdueCount: 1 },
  { user: { name: 'Luna Park', role: 'Crew' }, activeCount: 3, blockedCount: 0, overdueCount: 0 },
  { user: { name: 'Commander Nova', role: 'Captain' }, activeCount: 2, blockedCount: 0, overdueCount: 0 },
];

const asArray = (value) => (Array.isArray(value) ? value : []);

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

const demoCrewObjectives = demoStats.recentObjectives.map((objective, index) => ({
  ...objective,
  _id: `demo-crew-${index + 1}`,
  missionId: { title: index % 2 === 0 ? 'Operation Nebula Frontend' : 'Quantum API Infrastructure', status: 'Active' },
}));

const objectiveStatuses = ['Backlog', 'To Do', 'In Progress', 'Review', 'Completed'];

const CrewDashboard = ({ authError }) => {
  const { user } = useAuth();
  const [objectives, setObjectives] = useState(demoCrewObjectives);
  const [alerts, setAlerts] = useState(demoAlerts);
  const [stats, setStats] = useState(demoStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [source, setSource] = useState('demo');

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
      setObjectives(demoCrewObjectives);
    }

    if (alertsResult.status === 'fulfilled') {
      setAlerts(asArray(alertsResult.value.data));
    } else {
      setAlerts(demoAlerts);
    }

    if (statsResult.status === 'fulfilled') {
      setStats({ ...demoStats, ...statsResult.value.data });
    } else {
      setStats(demoStats);
    }

    const hasLiveData = objectivesResult.status === 'fulfilled' || alertsResult.status === 'fulfilled' || statsResult.status === 'fulfilled';
    if (!hasLiveData) {
      setSource('demo');
      setError(getAPIErrorMessage(objectivesResult.reason || alertsResult.reason || statsResult.reason));
      toast.error('Live team dashboard offline. Demo tasks loaded.');
    } else {
      setSource('live');
      if (objectivesResult.status !== 'fulfilled' || alertsResult.status !== 'fulfilled' || statsResult.status !== 'fulfilled') {
        setError('Partial live crew dashboard loaded. Some panels are using fallback data.');
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadCrewDashboard();
  }, [loadCrewDashboard]);

  const updateObjective = async (objective, payload) => {
    if (objective._id?.startsWith?.('demo-')) {
      setObjectives((current) => current.map((item) => (
        item._id === objective._id ? { ...item, ...payload } : item
      )));
      toast.success('Demo task updated locally');
      return;
    }

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
            {source === 'live' ? 'Live Team Workspace' : 'Demo Fallback Data'}
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
            <Link key={mission._id || mission.title} to={mission._id?.startsWith?.('demo-') ? '/missions' : `/missions/${mission._id}`} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-neon-blue/30 hover:bg-neon-blue/10">
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
  const [stats, setStats] = useState(demoStats);
  const [cometAlerts, setCometAlerts] = useState(demoAlerts);
  const [workload, setWorkload] = useState(demoWorkload);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [source, setSource] = useState('demo');

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
      setStats({ ...demoStats, ...dashboardResult.value.data });
    } else {
      setStats(demoStats);
    }

    if (alertsOk) {
      setCometAlerts(asArray(alertsResult.value.data));
    } else {
      setCometAlerts(demoAlerts);
    }

    if (workloadOk) {
      setWorkload(asArray(workloadResult.value.data?.workload));
    } else {
      setWorkload(demoWorkload);
    }

    if (!hasLiveData) {
      const message = getAPIErrorMessage(dashboardResult.reason || alertsResult.reason || workloadResult.reason);
      setError(message);
      setSource('demo');
      toast.error('Live telemetry offline. Demo command feed loaded.');
    } else {
      setSource('live');
      if (!dashboardOk || !alertsOk || !workloadOk) {
        setError('Partial live telemetry loaded. Some panels are using fallback data.');
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (user?.role === 'Crew') {
      setLoading(false);
      return;
    }

    loadDashboard();
  }, [loadDashboard, user?.role]);

  const missions = asArray(stats?.missions);
  const recentObjectives = asArray(stats?.recentObjectives);
  const alerts = asArray(cometAlerts);
  const avgMissionEnergy = stats?.completionRate || Math.round(
    missions.reduce((sum, mission) => sum + (Number(mission.progress) || 0), 0) / Math.max(missions.length, 1)
  );

  const orbitObjectives = useMemo(() => recentObjectives.slice(0, 10), [recentObjectives]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (user?.role === 'Crew') {
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
            {source === 'live' ? 'Live Data' : 'Demo Fallback Data'}
          </p>
          <h1 className="mt-1 font-display text-3xl font-black text-white lg:text-4xl">
            Command Center
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

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.75fr)_380px]">
        <GlassCard className="p-4 lg:p-5" hover={false}>
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
          <InviteCrewCard compact />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
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
                      <Link to={mission._id?.startsWith?.('demo-') ? '/missions' : `/missions/${mission._id}`} className="truncate font-display text-sm font-semibold text-white hover:text-neon-cyan">
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
      </div>

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
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-mono uppercase tracking-wider text-gray-500">
                <th className="pb-3 font-medium">Task</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Team</th>
                <th className="pb-3 font-medium">Priority</th>
                <th className="pb-3 font-medium">Energy</th>
                <th className="pb-3 text-right font-medium">Deadline</th>
              </tr>
            </thead>
            <tbody>
              {recentObjectives.map((objective) => (
                <tr key={objective._id || objective.title} className="border-b border-white/5 last:border-0">
                  <td className="py-4 font-semibold text-white">{objective.title}</td>
                  <td className="py-4">
                    <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 font-mono text-[10px] text-gray-300">
                      {objective.status || 'Backlog'}
                    </span>
                    {objective.isBlocked && <span className="ml-2 rounded-md bg-neon-red/10 px-2 py-1 font-mono text-[10px] text-neon-red">BLOCKED</span>}
                  </td>
                  <td className="py-4 text-gray-300">{objective.assignedTo?.name || 'Unassigned'}</td>
                  <td className="py-4">
                    <span className={`rounded-md border px-2 py-1 font-mono text-[10px] uppercase ${getPriorityTone(objective.priority)}`}>
                      {objective.priority || 'Medium'}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-28 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-neon-cyan" style={{ width: `${objective.progress || 0}%` }} />
                      </div>
                      <span className="font-mono text-gray-400">{objective.progress || 0}%</span>
                    </div>
                  </td>
                  <td className="py-4 text-right font-mono text-gray-500">
                    {objective.deadline ? new Date(objective.deadline).toLocaleDateString() : 'Open'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};

export default Dashboard;
