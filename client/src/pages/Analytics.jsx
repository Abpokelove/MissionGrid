import React, { useEffect, useMemo, useState } from 'react';
import { analyticsAPI } from '../services/api';
import { FiActivity, FiAlertTriangle, FiCompass, FiShield, FiTrendingUp } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, Number(value) || 0));

const getHealthColor = (score) => {
  if (score >= 75) return '#06d6a0';
  if (score >= 50) return '#0ea5e9';
  if (score >= 30) return '#f59e0b';
  return '#ef4444';
};

const makeLinePoints = (values, width, height, padding) => {
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;
  return values.map((item, index) => {
    const x = padding + (index * usableWidth) / Math.max(values.length - 1, 1);
    const y = height - padding - (clamp(item.value) * usableHeight) / 100;
    return { ...item, x, y };
  });
};

const makePath = (points) => points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const { data } = await analyticsAPI.getDashboard();
      setStats(data);
    } catch (error) {
      console.error('Failed to sync analytics:', error);
      toast.error('Unable to load analytics data');
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const analytics = useMemo(() => {
    const missionRows = Array.isArray(stats?.missions) ? stats.missions : [];
    const totalTasks = Number(stats?.totalObjectives) || 0;
    const completedTasks = Number(stats?.completedObjectives) || 0;
    const movingTasks = Number(stats?.inProgressObjectives) || 0;
    const blockedTasks = Number(stats?.blockedObjectives) || 0;
    const overdueTasks = Number(stats?.overdueObjectives) || 0;
    const openTasks = Math.max(0, totalTasks - completedTasks - movingTasks);
    const avgHealth = Number(stats?.avgCoreStability) || 100;
    const completionRate = Number(stats?.completionRate) || 0;
    const riskTasks = blockedTasks + overdueTasks;

    const chartMissions = missionRows.slice(0, 8);
    const lineValues = chartMissions.map((mission) => ({
      id: mission._id || mission.title,
      label: mission.title,
      value: clamp(mission.progress),
    }));
    const linePoints = makeLinePoints(lineValues, 680, 250, 34);
    const linePath = makePath(linePoints);
    const areaPath = linePoints.length
      ? `${linePath} L ${linePoints[linePoints.length - 1].x} 216 L ${linePoints[0].x} 216 Z`
      : '';

    const scatterPoints = missionRows.slice(0, 12).map((mission) => ({
      id: mission._id || mission.title,
      label: mission.title,
      progress: clamp(mission.progress),
      health: clamp(mission.coreStability ?? 100),
      status: mission.status,
      color: getHealthColor(mission.coreStability ?? 100),
      x: 42 + (clamp(mission.progress) * 456) / 100,
      y: 242 - (clamp(mission.coreStability ?? 100) * 190) / 100,
    }));

    const flowSegments = [
      { label: 'Open', value: openTasks, color: '#8b5cf6' },
      { label: 'In Progress', value: movingTasks, color: '#0ea5e9' },
      { label: 'Completed', value: completedTasks, color: '#06d6a0' },
      { label: 'Risk', value: riskTasks, color: '#f59e0b' },
    ];
    const flowTotal = Math.max(flowSegments.reduce((sum, segment) => sum + segment.value, 0), 1);

    const radarMetrics = [
      { label: 'Deadline', value: totalTasks ? clamp((overdueTasks / totalTasks) * 100) : 0 },
      { label: 'Blocked', value: totalTasks ? clamp((blockedTasks / totalTasks) * 100) : 0 },
      { label: 'Incomplete', value: totalTasks ? clamp(((totalTasks - completedTasks) / totalTasks) * 100) : 0 },
      { label: 'Health Gap', value: clamp(100 - avgHealth) },
      { label: 'Active Load', value: totalTasks ? clamp((movingTasks / totalTasks) * 100) : 0 },
    ];
    const radarCenter = 118;
    const radarRadius = 82;
    const radarPoint = (metricIndex, value) => {
      const angle = -Math.PI / 2 + (metricIndex * 2 * Math.PI) / radarMetrics.length;
      const radius = (clamp(value) / 100) * radarRadius;
      return {
        x: radarCenter + Math.cos(angle) * radius,
        y: radarCenter + Math.sin(angle) * radius,
      };
    };
    const radarPolygon = radarMetrics
      .map((metric, index) => {
        const point = radarPoint(index, metric.value);
        return `${point.x},${point.y}`;
      })
      .join(' ');
    const radarRings = [25, 50, 75, 100].map((ringValue) => (
      radarMetrics.map((_, index) => {
        const point = radarPoint(index, ringValue);
        return `${point.x},${point.y}`;
      }).join(' ')
    ));

    return {
      avgHealth,
      blockedTasks,
      chartMissions,
      completedTasks,
      completionRate,
      flowSegments,
      flowTotal,
      linePath,
      areaPath,
      linePoints,
      missionRows,
      movingTasks,
      overdueTasks,
      radarMetrics,
      radarPolygon,
      radarRings,
      scatterPoints,
      totalTasks,
    };
  }, [stats]);

  if (loading) {
    return (
      <div className="page-container flex min-h-[60vh] flex-col items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-b-transparent border-l-transparent border-r-transparent border-t-neon-blue"></div>
        <p className="mt-4 animate-pulse font-mono text-sm text-neon-blue">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="page-title text-white">Analytics</h1>
          <p className="mt-1 text-xs font-mono text-gray-400">
            Graphs for progress trend, delivery risk, task flow, and project health.
          </p>
        </div>
        <button type="button" onClick={fetchAnalyticsData} className="btn-secondary inline-flex items-center gap-2 self-start text-xs">
          <FiActivity /> Refresh Graphs
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-gray-500">Completed Tasks</p>
              <h3 className="mt-1.5 font-display text-3xl font-bold text-white">{analytics.completedTasks}</h3>
            </div>
            <div className="rounded-lg border border-neon-cyan/20 bg-neon-cyan/10 p-2 text-neon-cyan">
              <FiTrendingUp className="text-lg" />
            </div>
          </div>
          <p className="mt-3 text-[10px] font-mono uppercase text-gray-400">{analytics.completionRate}% completion rate</p>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-gray-500">Deadline Risk</p>
              <h3 className="mt-1.5 font-display text-3xl font-bold text-neon-amber">{analytics.overdueTasks}</h3>
            </div>
            <div className="rounded-lg border border-neon-amber/20 bg-neon-amber/10 p-2 text-neon-amber">
              <FiAlertTriangle className="text-lg" />
            </div>
          </div>
          <p className="mt-3 text-[10px] font-mono uppercase text-gray-400">{analytics.blockedTasks} blocked tasks</p>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-gray-500">Project Health</p>
              <h3 className="mt-1.5 font-display text-3xl font-bold" style={{ color: getHealthColor(analytics.avgHealth) }}>
                {analytics.avgHealth}%
              </h3>
            </div>
            <div className="rounded-lg border border-neon-violet/20 bg-neon-violet/10 p-2 text-neon-violet">
              <FiShield className="text-lg" />
            </div>
          </div>
          <p className="mt-3 text-[10px] font-mono uppercase text-gray-400">Average project health</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
        <div className="glass-card p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="flex items-center gap-2 font-display text-base font-semibold text-white">
              <FiCompass className="text-neon-blue" /> Project Performance Trend
            </h3>
            <span className="font-mono text-[10px] uppercase text-gray-500">{analytics.chartMissions.length} projects</span>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-space-950/35 p-3">
            <svg viewBox="0 0 680 250" className="h-[260px] w-full">
              <defs>
                <linearGradient id="progressArea" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.34" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id="progressLine" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#0ea5e9" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              {[0, 25, 50, 75, 100].map((tick) => {
                const y = 216 - (tick * 182) / 100;
                return (
                  <g key={tick}>
                    <line x1="34" x2="646" y1={y} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 8" />
                    <text x="8" y={y + 4} fill="rgba(255,255,255,0.36)" fontSize="10">{tick}</text>
                  </g>
                );
              })}
              {analytics.areaPath && <path d={analytics.areaPath} fill="url(#progressArea)" />}
              {analytics.linePath && (
                <motion.path
                  d={analytics.linePath}
                  fill="none"
                  stroke="url(#progressLine)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1 }}
                />
              )}
              {analytics.linePoints.map((point) => (
                <g key={point.id}>
                  <circle cx={point.x} cy={point.y} r="6" fill="#0ea5e9" stroke="#ffffff" strokeOpacity="0.65" />
                  <text x={point.x} y="238" textAnchor="middle" fill="rgba(255,255,255,0.42)" fontSize="9">
                    {String(point.label || '').slice(0, 10)}
                  </text>
                </g>
              ))}
              {analytics.linePoints.length === 0 && (
                <text x="340" y="128" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="14">
                  Create projects to plot progress over time
                </text>
              )}
            </svg>
          </div>
        </div>

        <div className="glass-card p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="font-display text-base font-semibold text-white">Risk Radar</h3>
            <span className="font-mono text-[10px] uppercase text-gray-500">delivery signals</span>
          </div>
          <div className="flex flex-col items-center gap-4 sm:flex-row xl:flex-col">
            <svg viewBox="0 0 236 236" className="h-56 w-56 shrink-0">
              {analytics.radarRings.map((ring) => (
                <polygon key={ring} points={ring} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              ))}
              {analytics.radarMetrics.map((metric, index) => {
                const angle = -Math.PI / 2 + (index * 2 * Math.PI) / analytics.radarMetrics.length;
                const labelX = 118 + Math.cos(angle) * 104;
                const labelY = 118 + Math.sin(angle) * 104;
                return (
                  <g key={metric.label}>
                    <line x1="118" y1="118" x2={labelX} y2={labelY} stroke="rgba(255,255,255,0.08)" />
                    <text x={labelX} y={labelY} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.5)" fontSize="9">
                      {metric.label}
                    </text>
                  </g>
                );
              })}
              <motion.polygon
                points={analytics.radarPolygon}
                fill="rgba(245,158,11,0.22)"
                stroke="#f59e0b"
                strokeWidth="3"
                initial={{ opacity: 0, scale: 0.9, originX: '118px', originY: '118px' }}
                animate={{ opacity: 1, scale: 1 }}
              />
              <circle cx="118" cy="118" r="4" fill="#f59e0b" />
            </svg>
            <div className="w-full space-y-2">
              {analytics.radarMetrics.map((metric) => (
                <div key={metric.label} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-gray-300">{metric.label}</span>
                    <span className="font-mono text-neon-amber">{Math.round(metric.value)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${metric.value}%` }}
                      transition={{ duration: 0.7 }}
                      className="h-full rounded-full bg-neon-amber"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="glass-card p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="font-display text-base font-semibold text-white">Health vs Progress Matrix</h3>
            <span className="font-mono text-[10px] uppercase text-gray-500">project position</span>
          </div>
          <div className="rounded-2xl border border-white/10 bg-space-950/35 p-3">
            <svg viewBox="0 0 540 280" className="h-[280px] w-full">
              {[0, 25, 50, 75, 100].map((tick) => {
                const x = 42 + (tick * 456) / 100;
                const y = 242 - (tick * 190) / 100;
                return (
                  <g key={tick}>
                    <line x1={x} x2={x} y1="42" y2="242" stroke="rgba(255,255,255,0.06)" />
                    <line x1="42" x2="498" y1={y} y2={y} stroke="rgba(255,255,255,0.06)" />
                  </g>
                );
              })}
              <line x1="42" x2="498" y1="242" y2="242" stroke="rgba(255,255,255,0.25)" />
              <line x1="42" x2="42" y1="42" y2="242" stroke="rgba(255,255,255,0.25)" />
              <text x="270" y="270" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="11">Progress</text>
              <text x="16" y="142" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="11" transform="rotate(-90 16 142)">Health</text>
              {analytics.scatterPoints.map((point) => (
                <g key={point.id}>
                  <motion.circle
                    cx={point.x}
                    cy={point.y}
                    r="9"
                    fill={point.color}
                    fillOpacity="0.85"
                    stroke="#ffffff"
                    strokeOpacity="0.55"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.4 }}
                  />
                  <title>{`${point.label}: ${point.progress}% progress, ${point.health}% health`}</title>
                </g>
              ))}
              {analytics.scatterPoints.length === 0 && (
                <text x="270" y="146" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="14">
                  No project records yet
                </text>
              )}
            </svg>
          </div>
        </div>

        <div className="glass-card p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="font-display text-base font-semibold text-white">Task Flow Graph</h3>
            <span className="font-mono text-[10px] uppercase text-gray-500">{analytics.totalTasks} tasks</span>
          </div>
          <div className="space-y-5">
            <div className="flex h-16 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
              {analytics.flowSegments.map((segment) => (
                <motion.div
                  key={segment.label}
                  initial={{ width: 0 }}
                  animate={{ width: `${(segment.value / analytics.flowTotal) * 100}%` }}
                  transition={{ duration: 0.8 }}
                  className="relative h-full min-w-[2px]"
                  style={{ backgroundColor: segment.color }}
                />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {analytics.flowSegments.map((segment) => (
                <div key={segment.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-semibold text-white">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
                      {segment.label}
                    </span>
                    <span className="font-mono text-sm text-white">{segment.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(segment.value / analytics.flowTotal) * 100}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: segment.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {analytics.totalTasks === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center text-sm text-gray-400">
                Create tasks to populate the flow graph.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
