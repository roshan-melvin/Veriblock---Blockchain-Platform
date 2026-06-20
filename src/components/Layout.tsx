import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { storage } from '../engines/storage';
import { Avatar } from './common/Avatar';
import type { InvestigatorProfile } from '../types';

export function Layout() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<InvestigatorProfile | null>(null);

  useEffect(() => {
    const syncProfile = () => {
      const activeProfile = storage.getActiveProfile();
      if (!activeProfile) {
        navigate('/', { replace: true });
      } else {
        setProfile(activeProfile);
      }
    };

    syncProfile();
    window.addEventListener('profile-updated', syncProfile);

    return () => {
      window.removeEventListener('profile-updated', syncProfile);
    };
  }, [navigate]);

  if (!profile) {
    return null;
  }

  const level = Math.floor(profile.reputationScore / 100) + 1;

  return (
    <div className="min-h-screen bg-void text-primary font-body flex flex-col">
      {/* Persistent Top Nav */}
      <nav className="border-b border-hairline bg-panel px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xl font-display font-bold text-gold tracking-wide">VeriBlock</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-panel-raised border border-hairline font-mono text-dim uppercase tracking-wider">
              Investigator HQ
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 lg:gap-3 font-mono text-xs">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded transition-all focus:outline-none focus:ring-1 focus:ring-gold ${
                  isActive
                    ? 'bg-panel-raised text-gold border border-hairline'
                    : 'text-dim hover:text-primary hover:bg-panel-raised/50 border border-transparent'
                }`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/missions"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded transition-all focus:outline-none focus:ring-1 focus:ring-gold ${
                  isActive
                    ? 'bg-panel-raised text-gold border border-hairline'
                    : 'text-dim hover:text-primary hover:bg-panel-raised/50 border border-transparent'
                }`
              }
            >
              Missions
            </NavLink>
            <NavLink
              to="/tools/hash-lab"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded transition-all focus:outline-none focus:ring-1 focus:ring-gold ${
                  isActive
                    ? 'bg-panel-raised text-gold border border-hairline'
                    : 'text-dim hover:text-primary hover:bg-panel-raised/50 border border-transparent'
                }`
              }
            >
              Hash Lab
            </NavLink>
            <NavLink
              to="/tools/chain-explorer"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded transition-all focus:outline-none focus:ring-1 focus:ring-gold ${
                  isActive
                    ? 'bg-panel-raised text-gold border border-hairline'
                    : 'text-dim hover:text-primary hover:bg-panel-raised/50 border border-transparent'
                }`
              }
            >
              Chain Explorer
            </NavLink>
            <NavLink
              to="/tools/signature-panel"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded transition-all focus:outline-none focus:ring-1 focus:ring-gold ${
                  isActive
                    ? 'bg-panel-raised text-gold border border-hairline'
                    : 'text-dim hover:text-primary hover:bg-panel-raised/50 border border-transparent'
                }`
              }
            >
              Signature Panel
            </NavLink>
            <NavLink
              to="/analytics"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded transition-all focus:outline-none focus:ring-1 focus:ring-gold ${
                  isActive
                    ? 'bg-panel-raised text-gold border border-hairline'
                    : 'text-dim hover:text-primary hover:bg-panel-raised/50 border border-transparent'
                }`
              }
            >
              Analytics
            </NavLink>
            <NavLink
              to="/educator"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded transition-all focus:outline-none focus:ring-1 focus:ring-gold ${
                  isActive
                    ? 'bg-panel-raised text-gold border border-hairline'
                    : 'text-dim hover:text-primary hover:bg-panel-raised/50 border border-transparent'
                }`
              }
            >
              Educator
            </NavLink>
          </div>

          {/* Profile Quick Details */}
          <div className="flex items-center gap-3 bg-panel-raised border border-hairline px-3 py-1.5 rounded-lg">
            <Avatar seed={profile.avatarSeed} size={32} />
            <div className="text-left font-mono">
              <div className="text-xs font-semibold text-primary max-w-[120px] truncate">{profile.name}</div>
              <div className="text-[10px] text-dim">
                LVL {level} | REP {profile.reputationScore}
              </div>
            </div>
            <button
              onClick={() => navigate('/?switch=true')}
              className="text-dim hover:text-gold transition-colors ml-2 focus:outline-none focus:ring-1 focus:ring-gold rounded p-1"
              title="Switch Profile"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
