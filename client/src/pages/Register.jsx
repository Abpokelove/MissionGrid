import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import StarBackground from '../components/StarBackground';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiArrowRight, FiBriefcase, FiUsers } from 'react-icons/fi';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { registerCaptain } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !workspaceName) {
      toast.error('Name, email, password, and team name are required');
      return;
    }

    setIsLoading(true);
    try {
      await registerCaptain({ name, email, password, workspaceName });
      toast.success('Project Manager workspace created');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.missionGridMessage || error.response?.data?.message || 'Failed to create workspace');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-space-950 flex items-center justify-center p-4 relative overflow-hidden font-body text-white">
      <StarBackground />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(14,165,233,0.18),transparent_28%),linear-gradient(135deg,rgba(2,6,23,0.96),rgba(10,14,39,0.72),rgba(2,6,23,0.96))] pointer-events-none z-0"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl grid gap-5 lg:grid-cols-[0.85fr_1.15fr] relative z-10"
      >
        <section className="glass-card p-6 lg:p-8">
          <Link to="/" className="mb-8 inline-flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-neon-blue to-neon-violet flex items-center justify-center shadow-glow-blue">
              <span className="font-display font-black text-2xl tracking-widest text-white">MG</span>
            </div>
            <div>
              <p className="font-display text-lg font-black">Mission<span className="text-neon-cyan">Grid</span></p>
              <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-neon-blue">Workspace Setup</p>
            </div>
          </Link>

          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-neon-blue/30 bg-neon-blue/10 text-neon-cyan shadow-glow-blue">
            <FiBriefcase className="text-2xl" />
          </div>
          <h1 className="font-display text-3xl font-black leading-tight lg:text-4xl">
            Create Your Project Manager Workspace
          </h1>
          <p className="mt-4 text-sm leading-6 text-gray-400">
            Start a MissionGrid workspace, invite Team Members, create projects, and manage tasks from the command center.
          </p>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neon-cyan">
              <FiUsers /> Includes Invite Flow
            </div>
            <p className="mt-2 text-xs leading-5 text-gray-400">
              After registration, MissionGrid creates a workspace and a default invite code that Team Members can use at /join.
            </p>
          </div>
        </section>

        <section className="glass-card p-6 lg:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label-text">Full Name</label>
              <input
                type="text"
                className="input-field text-sm"
                placeholder="e.g. Maya Rao"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label-text">Work Email</label>
              <input
                type="email"
                className="input-field text-sm"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label-text">Password</label>
              <input
                type="password"
                className="input-field text-sm"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label-text">Workspace / Team Name</label>
              <input
                type="text"
                className="input-field text-sm"
                placeholder="e.g. OrbitWorks Studio"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 font-semibold mt-4 relative overflow-hidden flex items-center justify-center gap-2"
            >
              {isLoading ? 'Creating Workspace...' : <>Create Workspace <FiArrowRight /></>}
            </button>
          </form>

          <div className="mt-8 space-y-3 text-center text-xs text-gray-500">
            <p>
              Joining an existing team?{' '}
              <Link to="/join" className="text-neon-cyan hover:underline font-semibold">
                Use an invite code
              </Link>
            </p>
            <p>
              Already registered?{' '}
              <Link to="/login" className="text-neon-cyan hover:underline font-semibold">
                Log in
              </Link>
            </p>
          </div>
        </section>
      </motion.div>
    </div>
  );
};

export default Register;
