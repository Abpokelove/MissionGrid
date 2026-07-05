import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiActivity, FiBriefcase, FiCrosshair, FiRadio, FiShield, FiUsers } from 'react-icons/fi';
import StarBackground from '../components/StarBackground';

const features = [
  { title: 'Project Orbit View', detail: 'See tasks arranged around each project core.', icon: FiCrosshair },
  { title: 'Deadline Risk Detection', detail: 'Surface risky timelines before they derail delivery.', icon: FiRadio },
  { title: 'Team Workload Balance', detail: 'Keep assignment pressure visible and manageable.', icon: FiActivity },
  { title: 'Project Health Score', detail: 'Track progress, blockers, and risk in one signal.', icon: FiShield },
];

const roleCards = [
  {
    title: 'I am a Project Manager',
    detail: 'Create a workspace, manage projects, assign tasks, and invite your team.',
    to: '/register?role=ProjectManager',
    icon: FiBriefcase,
  },
  {
    title: 'I am a Team Member',
    detail: 'Join with an invite code and focus on your assigned tasks.',
    to: '/join',
    icon: FiUsers,
  },
];

const Landing = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-space-950 text-white font-body">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_24%,rgba(14,165,233,0.22),transparent_28%),radial-gradient(circle_at_78%_76%,rgba(139,92,246,0.18),transparent_34%),linear-gradient(115deg,rgba(2,6,23,0.98)_0%,rgba(8,16,39,0.86)_52%,rgba(2,6,23,0.98)_100%)]" />
      <StarBackground />

      <motion.img
        src="/images/the_comet.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-4 z-0 w-[520px] max-w-none rotate-[32deg] object-contain opacity-[0.58] mix-blend-screen blur-[0.2px] drop-shadow-[0_0_70px_rgba(245,158,11,0.58)] sm:w-[680px] lg:right-[5%] lg:top-[-20%] lg:w-[800px]"
        initial={{ opacity: 0, x: 180, y: -90, scale: 0.9 }}
        animate={{ opacity: [0.48, 0.66, 0.54], x: [58, 2, 58], y: [-30, 16, -30], scale: [0.98, 1.03, 0.98] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.img
        src="/images/earth.webp"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-50 -left-10 z-0 h-[30rem] w-[30rem] rounded-full object-cover opacity-[0.58] mix-blend-screen drop-shadow-[0_0_90px_rgba(14,165,233,0.38)] sm:-left-48 sm:h-[38rem] sm:w-[38rem] lg:-bottom-90 lg:-left-10 lg:h-[52rem] lg:w-[52rem]"
        style={{
          WebkitMaskImage: 'radial-gradient(circle, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.78) 48%, rgba(0,0,0,0.22) 72%, transparent 82%)',
          maskImage: 'radial-gradient(circle, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.78) 48%, rgba(0,0,0,0.22) 72%, transparent 82%)',
        }}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: [0.5, 0.64, 0.56], scale: [0.98, 1.01, 0.98] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />

      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg border border-neon-blue/40 bg-neon-blue/15 shadow-glow-blue">
            <img src="/images/MissionGrid_logo.ico" alt="MissionGrid" className="h-10 w-10 object-contain" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-lg font-bold tracking-wider">
              Mission<span className="text-neon-cyan">Grid</span>
            </p>
            <p className="hidden text-[9px] font-mono uppercase tracking-[0.24em] text-neon-blue sm:block">
              Dashboard
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link to="/login" className="hidden rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white backdrop-blur-xl transition hover:border-neon-cyan/40 hover:bg-neon-blue/10 sm:inline-flex">
            Login
          </Link>
          <Link to="/register?role=ProjectManager" className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-space-950 transition hover:bg-neon-cyan">
            Register
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex min-h-[calc(100vh-84px)] flex-col justify-between px-5 pb-6 sm:px-8 lg:px-12">
        <section className="flex flex-1 items-center py-10">
          <div className="max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="mb-6 inline-flex items-center gap-3 rounded-lg border border-neon-blue/25 bg-space-950/45 px-3 py-2 backdrop-blur-xl"
            >
              <span className="h-2 w-2 rounded-full bg-neon-cyan shadow-glow-cyan" />
              <span className="text-[10px] font-mono uppercase tracking-[0.28em] text-neon-blue">
                Live Project Telemetry
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 34 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.08 }}
              className="max-w-4xl font-display text-5xl font-black leading-[0.95] text-white sm:text-7xl lg:text-8xl"
            >
              Turn Projects into Space Missions
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.16 }}
              className="mt-6 max-w-2xl text-base leading-7 text-gray-300 sm:text-lg"
            >
              Create projects, assign tasks, track progress, detect deadline risks, and manage your team through an interactive mission-control dashboard.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.24 }}
              className="mt-8 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2"
            >
              {roleCards.map((card) => {
                const Icon = card.icon;
                return (
                  <Link
                    key={card.title}
                    to={card.to}
                    className="group relative min-h-[150px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.065] p-6 backdrop-blur-xl transition hover:-translate-y-1.5 hover:border-neon-cyan/45 hover:bg-neon-blue/10 hover:shadow-glow-blue"
                  >
                    <span className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-neon-blue/10 blur-2xl transition group-hover:bg-neon-cyan/20" />
                    <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/70 to-transparent opacity-0 transition group-hover:opacity-100" />
                    <div className="relative flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-neon-blue/25 bg-neon-blue/10 text-2xl text-neon-cyan shadow-glow-blue">
                        <Icon />
                      </div>
                      <div>
                        <p className="font-display text-lg font-bold text-white">{card.title}</p>
                        <p className="mt-2 text-sm leading-6 text-gray-400">{card.detail}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </motion.div>
          </div>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.34 }}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                whileHover={{ y: -6, borderColor: 'rgba(6,214,160,0.36)' }}
                className="glass-card group min-h-[132px] p-5"
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-neon-blue/25 bg-neon-blue/10 text-neon-cyan shadow-glow-blue">
                    <Icon />
                  </div>
                  <span className="font-mono text-[10px] text-gray-500">0{index + 1}</span>
                </div>
                <h3 className="font-display text-base font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-5 text-gray-400">{feature.detail}</p>
              </motion.div>
            );
          })}
        </motion.section>
      </main>
    </div>
  );
};

export default Landing;
