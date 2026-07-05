import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import StarBackground from '../components/StarBackground';
import VoiceCommandModal from '../components/VoiceCommandModal';

const AppLayout = () => {
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const location = useLocation();

  React.useEffect(() => {
    setIsVoiceOpen(false);
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-space-950 text-white font-body">
      <StarBackground />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.14),transparent_34%),radial-gradient(circle_at_78%_18%,rgba(139,92,246,0.10),transparent_30%),linear-gradient(180deg,rgba(2,6,23,0.86),rgba(2,6,23,0.98))] pointer-events-none z-0"></div>
      <img
        src="/images/earth.webp"
        alt=""
        aria-hidden="true"
        className="pointer-events-none fixed -right-44 bottom-[-18rem] z-0 hidden h-[42rem] w-[42rem] rounded-full object-cover opacity-[0.075] mix-blend-screen lg:block"
        style={{
          WebkitMaskImage: 'radial-gradient(circle, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.34) 58%, transparent 76%)',
          maskImage: 'radial-gradient(circle, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.34) 58%, transparent 76%)',
        }}
      />
      <img
        src="/images/sun.webp"
        alt=""
        aria-hidden="true"
        className="pointer-events-none fixed -left-20 top-28 z-0 hidden h-44 w-44 object-contain opacity-[0.07] mix-blend-screen drop-shadow-[0_0_56px_rgba(245,158,11,0.42)] xl:block"
      />

      <div className="relative z-10">
        <Sidebar />

        <div className="ml-[76px] flex h-dvh min-w-0 flex-col overflow-hidden lg:ml-[270px]">
          <Topbar onVoiceTrigger={() => setIsVoiceOpen(true)} />

          <main className="relative min-h-0 flex-1 overflow-y-auto scroll-smooth">
            <Outlet />
          </main>
        </div>
      </div>

      <VoiceCommandModal isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} />
    </div>
  );
};

export default AppLayout;
