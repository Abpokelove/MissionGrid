import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiArrowRight, FiCheckCircle, FiRefreshCw, FiUsers } from 'react-icons/fi';
import StarBackground from '../components/StarBackground';
import { useAuth } from '../context/useAuth';
import { getAPIErrorMessage, inviteAPI } from '../services/api';

const JoinTeam = () => {
  const { inviteCode: routeInviteCode } = useParams();
  const navigate = useNavigate();
  const { joinTeam } = useAuth();
  const [inviteCode, setInviteCode] = useState(routeInviteCode || '');
  const [teamInfo, setTeamInfo] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(Boolean(routeInviteCode));
  const [lookupError, setLookupError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const lookupInvite = useCallback(async (code = inviteCode) => {
    const cleanCode = String(code || '').trim().toUpperCase();
    if (!cleanCode) {
      setTeamInfo(null);
      setLookupError('Enter an invite code to continue.');
      return;
    }

    setLookupLoading(true);
    setLookupError(null);
    try {
      const { data } = await inviteAPI.getInvite(cleanCode);
      setTeamInfo(data);
      setInviteCode(cleanCode);
    } catch (error) {
      setTeamInfo(null);
      setLookupError(getAPIErrorMessage(error, 'Invite lookup failed'));
    } finally {
      setLookupLoading(false);
    }
  }, [inviteCode]);

  useEffect(() => {
    if (routeInviteCode) {
      lookupInvite(routeInviteCode);
    }
  }, [routeInviteCode, lookupInvite]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name || !form.email || !form.password || !inviteCode) {
      toast.error('Name, email, password, and invite code are required');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await joinTeam({
        inviteCode: inviteCode.trim().toUpperCase(),
        name: form.name,
        email: form.email,
        password: form.password,
      });
      toast.success('Joined team successfully');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.missionGridMessage || error.response?.data?.message || 'Could not join team');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-space-950 text-white font-body">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_22%,rgba(6,214,160,0.16),transparent_26%),linear-gradient(135deg,rgba(2,6,23,0.95),rgba(10,14,39,0.72),rgba(2,6,23,0.96))]" />
      <StarBackground />
      <motion.img
        src="/images/crew_spaceship.webp"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 bottom-6 hidden w-[380px] object-contain opacity-18 mix-blend-screen drop-shadow-[0_0_50px_rgba(14,165,233,0.35)] md:block"
        animate={{ y: [0, -18, 0], x: [0, 10, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid w-full max-w-5xl gap-5 lg:grid-cols-[0.85fr_1.15fr]"
        >
          <section className="glass-card flex flex-col justify-between overflow-hidden p-6 lg:p-8">
            <div>
              <Link to="/" className="mb-8 inline-flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-neon-blue to-neon-violet shadow-glow-blue">
                  <span className="font-display text-xl font-black tracking-widest">MG</span>
                </div>
                <div>
                  <p className="font-display text-lg font-black">Mission<span className="text-neon-cyan">Grid</span></p>
                  <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-neon-blue">Team Invite</p>
                </div>
              </Link>

              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan shadow-glow-cyan">
                <FiUsers className="text-2xl" />
              </div>
              <h1 className="font-display text-3xl font-black leading-tight lg:text-4xl">
                {teamInfo ? `Join ${teamInfo.teamName} on MissionGrid` : 'Join Your MissionGrid Team'}
              </h1>
              <p className="mt-4 text-sm leading-6 text-gray-400">
                Use your Project Manager invite code to create a Team Member account and access assigned objectives, mission context, and deadline alerts.
              </p>
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neon-cyan">
                <FiCheckCircle /> Role Access
              </div>
              <p className="mt-2 text-xs leading-5 text-gray-400">
                Team Members can view workspace projects and update their own task progress. Project creation, deletion, assignment, and invite management stay with Project Managers.
              </p>
            </div>
          </section>

          <section className="glass-card p-6 lg:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label-text">Invite Code</label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    className="input-field text-sm uppercase"
                    placeholder="e.g. ORBIT123"
                    value={inviteCode}
                    onChange={(event) => {
                      setInviteCode(event.target.value.toUpperCase());
                      setLookupError(null);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => lookupInvite(inviteCode)}
                    disabled={lookupLoading}
                    className="btn-secondary inline-flex items-center justify-center gap-2 text-sm sm:min-w-32"
                  >
                    <FiRefreshCw className={lookupLoading ? 'animate-spin' : ''} />
                    Lookup
                  </button>
                </div>
              </div>

              {(lookupLoading || teamInfo || lookupError) && (
                <div className={`rounded-2xl border p-4 text-sm ${
                  lookupError
                    ? 'border-neon-amber/30 bg-neon-amber/10 text-amber-100'
                    : 'border-neon-cyan/30 bg-neon-cyan/10 text-cyan-100'
                }`}>
                  {lookupLoading && 'Looking up invite details...'}
                  {!lookupLoading && teamInfo && (
                    <span>
                      Invite confirmed for <strong>{teamInfo.teamName}</strong>, managed by {teamInfo.ownerName}.
                    </span>
                  )}
                  {!lookupLoading && lookupError && lookupError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="label-text">Full Name</label>
                  <input name="name" type="text" className="input-field text-sm" value={form.name} onChange={handleChange} placeholder="e.g. Maya Rao" required />
                </div>
                <div className="sm:col-span-2">
                  <label className="label-text">Work Email</label>
                  <input name="email" type="email" className="input-field text-sm" value={form.email} onChange={handleChange} placeholder="you@company.com" required />
                </div>
                <div>
                  <label className="label-text">Password</label>
                  <input name="password" type="password" className="input-field text-sm" value={form.password} onChange={handleChange} placeholder="Min 6 characters" required />
                </div>
                <div>
                  <label className="label-text">Confirm Password</label>
                  <input name="confirmPassword" type="password" className="input-field text-sm" value={form.confirmPassword} onChange={handleChange} placeholder="Repeat password" required />
                </div>
              </div>

              <button type="submit" disabled={submitting || lookupLoading} className="btn-primary flex w-full items-center justify-center gap-2 py-3 text-sm">
                {submitting ? 'Joining Team...' : <>Join Team <FiArrowRight /></>}
              </button>

              <p className="text-center text-xs text-gray-500">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-neon-cyan hover:underline">Log in</Link>
              </p>
            </form>
          </section>
        </motion.div>
      </main>
    </div>
  );
};

export default JoinTeam;
