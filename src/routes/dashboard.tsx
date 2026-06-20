import { useState, useEffect } from 'react';
import { storage } from '../engines/storage';
import { ProfileStrip } from '../components/dashboard/ProfileStrip';
import { ActiveMissionCard } from '../components/dashboard/ActiveMissionCard';
import { ToolkitLauncher } from '../components/dashboard/ToolkitLauncher';
import { AlertFeed } from '../components/dashboard/AlertFeed';
import type { InvestigatorProfile } from '../types';

export default function Dashboard() {
  const [profile, setProfile] = useState<InvestigatorProfile | null>(null);

  useEffect(() => {
    const active = storage.getActiveProfile();
    setProfile(active);
  }, []);

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-dim font-mono text-sm animate-pulse">Loading investigator profile...</p>
      </div>
    );
  }

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6" role="main" aria-label="Mission Control Dashboard">
      {/* Header */}
      <div className="animate-fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-primary">
              Mission Control
            </h1>
            <p className="text-xs text-dim font-mono mt-1">
              {greeting}, <span className="text-gold">{profile.name}</span>. Your digital forensics HQ awaits.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-verified animate-pulse" aria-hidden="true" />
            <span className="text-[10px] font-mono text-dim uppercase tracking-wider">
              Systems Online · {now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Profile Strip */}
      <ProfileStrip profile={profile} />

      {/* Grid: Mission Card + Alert Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <ActiveMissionCard profile={profile} />
        </div>
        <div className="lg:col-span-3 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <AlertFeed />
        </div>
      </div>

      {/* Toolkit Launcher */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
        <ToolkitLauncher />
      </div>

      {/* Network stats footer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
        {[
          { label: 'Chain Blocks', value: '—', icon: '⛓' },
          { label: 'Hashes Computed', value: '—', icon: '#' },
          { label: 'Signatures Verified', value: '—', icon: '🔏' },
          { label: 'Threat Level', value: 'MODERATE', icon: '⚡', color: 'text-unverified' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-panel border border-hairline rounded-lg px-4 py-3 flex items-center gap-3 hover:bg-panel-raised transition-colors"
          >
            <span className="text-lg" aria-hidden="true">{stat.icon}</span>
            <div>
              <p className={`text-sm font-mono font-bold ${stat.color || 'text-primary'}`}>{stat.value}</p>
              <p className="text-[9px] font-mono text-dim uppercase tracking-wider">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
