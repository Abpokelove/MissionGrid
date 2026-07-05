import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { FiBarChart2, FiCheckSquare, FiGrid, FiLogOut, FiSettings, FiTarget, FiUsers } from 'react-icons/fi';
import InitialAvatar from './InitialAvatar';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isTeamMember = user?.role === 'Crew' || user?.role === 'Team Member' || user?.role === 'TeamMember';
  const isCaptain = !isTeamMember;
  const menuItems = isCaptain
    ? [
        { name: 'Dashboard', path: '/dashboard', icon: FiGrid },
        { name: 'Projects', path: '/missions', icon: FiTarget },
        { name: 'Analytics', path: '/analytics', icon: FiBarChart2 },
        { name: 'Team Workload', path: '/workload', icon: FiUsers },
        { name: 'Settings', path: '/settings', icon: FiSettings },
      ]
    : [
        { name: 'Dashboard', path: '/dashboard', icon: FiGrid },
        { name: 'My Tasks', path: '/my-objectives', icon: FiCheckSquare },
        { name: 'Projects', path: '/missions', icon: FiTarget },
        { name: 'Settings', path: '/settings', icon: FiSettings },
      ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex h-dvh w-[76px] flex-col justify-between overflow-hidden border-r border-white/10 bg-space-950/88 backdrop-blur-2xl transition-[width] duration-300 lg:w-[270px]">
      <div>
        <div className="flex items-center justify-center gap-3 border-b border-white/5 p-4 lg:justify-start lg:p-5">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-neon-blue/25 bg-white/8 shadow-glow-blue">
            <img
              src="/images/MissionGrid_logo.ico"
              alt="MissionGrid"
              className="h-11 w-11 object-contain"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
                event.currentTarget.nextElementSibling.style.display = 'block';
              }}
            />
            <span className="hidden font-display text-sm font-black text-neon-cyan">MG</span>
          </div>
          <div className="hidden lg:block">
            <h1 className="font-display text-lg font-black leading-tight tracking-wider text-white">
              MISSION<span className="text-neon-cyan">GRID</span>
            </h1>
            <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-neon-blue">v1.0 // active</p>
          </div>
        </div>

        <nav className="mt-5 space-y-2 p-3 lg:p-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `group relative flex items-center justify-center gap-4 overflow-hidden rounded-2xl border px-3 py-3.5 text-sm font-semibold transition-all duration-300 lg:justify-start lg:px-4 ${
                    isActive
                      ? 'border-neon-blue/35 bg-gradient-to-r from-neon-blue/18 to-neon-violet/10 text-white shadow-glow-blue'
                      : 'border-transparent text-gray-400 hover:border-white/10 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-neon-cyan opacity-0 transition group-[.active]:opacity-100" />
                <Icon className="shrink-0 text-lg" />
                <span className="hidden font-display tracking-wide lg:inline">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-white/5 p-3 lg:p-4">
        <div className="mb-4 flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-2 lg:justify-start">
          <InitialAvatar name={user?.name || 'Project Manager'} size="sm" />
          <div className="hidden min-w-0 flex-1 lg:block">
            <p className="truncate text-sm font-semibold text-white">{user?.name || 'Project Manager'}</p>
            <p className="truncate text-[10px] font-mono uppercase tracking-wider text-neon-cyan">
              {isTeamMember ? 'Team Member' : 'Project Manager'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-transparent px-3 py-3 text-sm font-semibold text-red-300 transition-all duration-300 hover:border-red-500/20 hover:bg-red-500/10 lg:justify-start lg:px-4"
        >
          <FiLogOut className="shrink-0 text-lg" />
          <span className="hidden font-display tracking-wide lg:inline">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
