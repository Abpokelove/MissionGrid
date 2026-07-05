import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import StarBackground from '../components/StarBackground';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Email and password are required');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Signed in successfully');
      navigate(redirectPath, { replace: true });
    } catch (error) {
      toast.error(error.missionGridMessage || error.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-space-950 flex items-center justify-center p-4 relative overflow-hidden font-body">
      <StarBackground />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_22%,rgba(14,165,233,0.16),transparent_30%),linear-gradient(135deg,rgba(2,6,23,0.96),rgba(10,14,39,0.72),rgba(2,6,23,0.96))] pointer-events-none z-0"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-space-900/60 border border-white/10 backdrop-blur-xl rounded-2xl p-6 lg:p-8 shadow-2xl relative z-10"
      >
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-neon-blue to-neon-violet flex items-center justify-center shadow-glow-blue mb-4">
            <span className="font-display font-black text-2xl tracking-widest text-white">MG</span>
          </div>
          <h2 className="font-display font-bold text-2xl text-white tracking-wider">
            Mission<span className="text-neon-cyan">Grid</span>
          </h2>
          <p className="text-xs font-mono text-gray-400 mt-1 uppercase tracking-widest">
            Sign in to your workspace
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label-text">Email</label>
            <input
              type="email"
              className="input-field text-sm"
              placeholder="e.g. captain@missiongrid.io"
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
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary py-3 font-semibold mt-4 relative overflow-hidden"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-8 text-center text-xs font-mono text-gray-500">
          <p className="mb-2">
            New Project Manager?{' '}
            <Link to="/register?role=ProjectManager" className="text-neon-cyan hover:underline font-semibold">
              Create a workspace
            </Link>
          </p>
          <p className="mb-2">
            Joining a team?{' '}
            <Link to="/join" className="text-neon-violet hover:underline font-semibold">
              Use invite code
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
