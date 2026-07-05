import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import { FiTrendingUp, FiShield, FiAlertTriangle, FiCompass } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

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
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container flex flex-col justify-center items-center h-[calc(100vh-5rem)]">
        <div className="w-16 h-16 border-4 border-t-neon-blue border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-mono text-neon-blue animate-pulse text-sm">Loading analytics...</p>
      </div>
    );
  }

  // Stability coloring helper
  const getCoreStabilityColor = (score) => {
    if (score >= 75) return 'text-neon-cyan';
    if (score >= 50) return 'text-neon-blue';
    if (score >= 30) return 'text-neon-amber';
    return 'text-neon-red';
  };

  const getCoreStabilityBg = (score) => {
    if (score >= 75) return 'bg-neon-cyan';
    if (score >= 50) return 'bg-neon-blue';
    if (score >= 30) return 'bg-neon-amber';
    return 'bg-neon-red';
  };

  return (
    <div className="page-container">
      {/* Title Header */}
      <div>
        <h1 className="page-title text-white">Analytics</h1>
        <p className="text-xs font-mono text-gray-400 mt-1">Project progress, task completion, deadline risk, and health trends.</p>
      </div>

      {/* Stats Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="stat-card">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Completed Tasks</p>
              <h3 className="text-3xl font-bold font-display text-white mt-1.5">{stats?.completedObjectives || 0}</h3>
            </div>
            <div className="p-2 rounded-lg bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20">
              <FiTrendingUp className="text-lg" />
            </div>
          </div>
          <p className="text-[10px] font-mono text-gray-400 mt-3 uppercase">Closed work across projects</p>
        </div>

        <div className="stat-card">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Deadline Risk</p>
              <h3 className="text-3xl font-bold font-display text-neon-amber mt-1.5">{stats?.overdueObjectives || 0}</h3>
            </div>
            <div className="p-2 rounded-lg bg-neon-amber/10 text-neon-amber border border-neon-amber/20">
              <FiAlertTriangle className="text-lg" />
            </div>
          </div>
          <p className="text-[10px] font-mono text-gray-400 mt-3 uppercase">Overdue or high-risk tasks</p>
        </div>

        <div className="stat-card">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Project Health</p>
              <h3 className={`text-3xl font-bold font-display mt-1.5 ${getCoreStabilityColor(stats?.avgCoreStability || 100)}`}>
                {stats?.avgCoreStability || 100}%
              </h3>
            </div>
            <div className="p-2 rounded-lg bg-neon-violet/10 text-neon-violet border border-neon-violet/20">
              <FiShield className="text-lg" />
            </div>
          </div>
          <p className="text-[10px] font-mono text-gray-400 mt-3 uppercase">Average delivery health</p>
        </div>
      </div>

      {/* Pure SVG Custom Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Project progress */}
        <div className="glass-card p-6">
          <div className="flex justify-between items-center pb-4 border-b border-white/5 mb-6">
            <h3 className="font-display font-semibold text-sm text-white flex items-center gap-2">
              <FiCompass className="text-neon-blue" /> Project Progress
            </h3>
            <span className="text-[10px] text-gray-500 font-mono">Progress</span>
          </div>

          {stats?.missions?.length === 0 ? (
            <p className="text-xs text-gray-500 font-mono text-center py-12">No project data to plot.</p>
          ) : (
            <div className="space-y-4">
              {stats?.missions?.map((m) => (
                <div key={m._id} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-white truncate max-w-md">{m.title}</span>
                    <span className="font-mono text-neon-blue">{m.progress}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-4.5 rounded-lg overflow-hidden flex border border-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${m.progress}%` }}
                      transition={{ duration: 1 }}
                      className="h-full bg-gradient-to-r from-neon-blue to-neon-violet flex items-center justify-end px-2"
                    >
                      {m.progress > 10 && (
                        <span className="text-[8px] font-mono font-bold text-white leading-none">PROGRESS</span>
                      )}
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chart 2: Project health scores */}
        <div className="glass-card p-6">
          <div className="flex justify-between items-center pb-4 border-b border-white/5 mb-6">
            <h3 className="font-display font-semibold text-sm text-white flex items-center gap-2">
              <FiShield className="text-neon-violet" /> Project Health Analysis
            </h3>
            <span className="text-[10px] text-gray-500 font-mono">Health</span>
          </div>

          {stats?.missions?.length === 0 ? (
            <p className="text-xs text-gray-500 font-mono text-center py-12">No project health records.</p>
          ) : (
            <div className="space-y-4">
              {stats?.missions?.map((m) => (
                <div key={m._id} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-white truncate max-w-md">{m.title}</span>
                    <span className={`font-mono ${getCoreStabilityColor(m.coreStability)}`}>{m.coreStability}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-4.5 rounded-lg overflow-hidden flex border border-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${m.coreStability}%` }}
                      transition={{ duration: 1 }}
                      className={`h-full flex items-center justify-end px-2 ${getCoreStabilityBg(m.coreStability)}`}
                    >
                      {m.coreStability > 10 && (
                        <span className="text-[8px] font-mono font-bold text-space-950 leading-none">STABILITY</span>
                      )}
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
