import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { storage } from '../engines/storage';
import { Avatar } from './common/Avatar';
import type { InvestigatorProfile } from '../types';

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<InvestigatorProfile | null>(null);
  const [navOpen, setNavOpen] = useState(false);

  // Close mobile nav on route change
  useEffect(() => { setNavOpen(false); }, [location.pathname]);

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
      {/* Skip-to-main accessibility link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-gold focus:text-void focus:px-4 focus:py-2 focus:rounded focus:text-xs focus:font-mono focus:font-bold"
      >
        Skip to main content
      </a>
      {/* Persistent Top Nav */}
      <nav
        className="border-b border-hairline bg-panel px-6 py-4"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xl font-display font-bold text-gold tracking-wide">VeriBlock</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-panel-raised border border-hairline font-mono text-dim uppercase tracking-wider">
              Investigator HQ
            </span>
          </div>

          {/* Mobile hamburger */}
          <div className="flex items-center gap-3 ml-auto lg:hidden">
            <button
              onClick={() => setNavOpen(v => !v)}
              aria-expanded={navOpen}
              aria-controls="main-nav-links"
              aria-label={navOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="text-dim hover:text-gold transition-colors p-1 focus:outline-none focus:ring-1 focus:ring-gold rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                {navOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>

          {/* Nav links */}
          <div
            id="main-nav-links"
            className={`${
              navOpen ? 'flex' : 'hidden'
            } lg:flex flex-col lg:flex-row items-stretch lg:items-center gap-1 lg:gap-2 xl:gap-3 font-mono text-xs w-full lg:w-auto bg-panel lg:bg-transparent border-t lg:border-none border-hairline lg:border-0 pt-4 lg:pt-0`}
          >
            {[
              { to: '/dashboard', label: 'Dashboard' },
              { to: '/missions', label: 'Missions' },
              { to: '/tools/hash-lab', label: 'Hash Lab' },
              { to: '/tools/chain-explorer', label: 'Chain Explorer' },
              { to: '/tools/signature-panel', label: 'Signature Panel' },
              { to: '/analytics', label: 'Analytics' },
              { to: '/educator', label: 'Educator' },
            ].map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded transition-all focus:outline-none focus:ring-1 focus:ring-gold text-center lg:text-left ${
                    isActive
                      ? 'bg-panel-raised text-gold border border-hairline'
                      : 'text-dim hover:text-primary hover:bg-panel-raised/50 border border-transparent'
                  }`
                }
                aria-current={undefined}
              >
                {label}
              </NavLink>
            ))}
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
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6" role="main" aria-label="Application content">
        <Outlet />
      </main>
    </div>
  );
}
