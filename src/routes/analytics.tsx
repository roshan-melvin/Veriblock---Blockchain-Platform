import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../engines/storage';
import { MISSIONS } from '../data/missions';
import type { InvestigatorProfile, CheckType } from '../types';

const COMPETENCY_LABELS: Record<CheckType, { label: string; icon: string; desc: string }> = {
  hash: {
    label: 'Hash Lab',
    icon: '#',
    desc: 'SHA-256 verification and content fingerprinting',
  },
  chain: {
    label: 'Chain Explorer',
    icon: '⛓',
    desc: 'Blockchain integrity audits and fork detection',
  },
  signature: {
    label: 'Signature Panel',
    icon: '🔏',
    desc: 'ECDSA digital signature verification',
  },
};

const TIER_COLORS: Record<string, string> = {
  beginner: 'bg-verified',
  intermediate: 'bg-blue-400',
  advanced: 'bg-purple-400',
  expert: 'bg-tampered',
};

function CompetencyGauge({
  tool,
  value,
}: {
  tool: CheckType;
  value: number;
}) {
  const pct = Math.min(100, Math.max(0, value));
  const { label, icon, desc } = COMPETENCY_LABELS[tool];
  const color =
    pct >= 75 ? 'text-verified' : pct >= 45 ? 'text-unverified' : 'text-tampered';
  const barColor =
    pct >= 75 ? 'bg-verified' : pct >= 45 ? 'bg-unverified' : 'bg-tampered';
  const grade =
    pct >= 90 ? 'S' : pct >= 75 ? 'A' : pct >= 60 ? 'B' : pct >= 45 ? 'C' : pct >= 30 ? 'D' : 'F';

  return (
    <article
      className="bg-panel border border-hairline rounded-xl p-5 hover:bg-panel-raised transition-colors"
      aria-label={`${label} competency: ${pct}% — Grade ${grade}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-void border border-hairline flex items-center justify-center text-base font-mono" aria-hidden="true">
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-display font-semibold text-primary">{label}</h3>
            <p className="text-[9px] font-mono text-dim mt-0.5">{desc}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-display font-bold ${color}`}>{pct}</p>
          <p className="text-[9px] font-mono text-dim">/ 100</p>
        </div>
      </div>
      {/* Grade Badge */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[9px] font-mono text-dim uppercase tracking-wider">Proficiency</span>
        <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border ${
          pct >= 75 ? 'text-verified border-verified/30 bg-verified/10' :
          pct >= 45 ? 'text-unverified border-unverified/30 bg-unverified/10' :
          'text-tampered border-tampered/30 bg-tampered/10'
        }`}>
          Grade {grade}
        </span>
      </div>
      {/* Progress Bar */}
      <div
        className="w-full bg-void rounded-full h-2 overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} skill progress`}
      >
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </article>
  );
}

export default function Analytics() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<InvestigatorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sync = () => {
      setProfile(storage.getActiveProfile());
      setLoading(false);
    };
    sync();
    window.addEventListener('profile-updated', sync);
    return () => window.removeEventListener('profile-updated', sync);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-live="polite">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto" aria-hidden="true" />
          <p className="text-dim font-mono text-sm">Loading analytics…</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] space-y-4"
        role="alert"
        aria-label="No profile found"
      >
        <div className="w-16 h-16 rounded-full bg-panel border border-hairline flex items-center justify-center text-3xl">
          🔐
        </div>
        <h1 className="text-xl font-display font-bold text-primary">No Active Profile</h1>
        <p className="text-xs text-dim font-mono">Please complete onboarding to view your analytics.</p>
        <button
          onClick={() => navigate('/')}
          className="text-xs font-mono bg-gold text-void hover:bg-gold/90 px-4 py-2 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-gold"
        >
          Go to Onboarding
        </button>
      </div>
    );
  }

  const level = Math.floor(profile.reputationScore / 100) + 1;
  const totalMissions = MISSIONS.length;
  const completedIds = new Set(profile.completedMissions.map(m => m.missionId));
  const completedCount = completedIds.size;
  const correctCount = profile.completedMissions.filter(m => m.correct).length;
  const accuracy = completedCount === 0 ? 0 : Math.round((correctCount / completedCount) * 100);
  const avgTime = completedCount === 0
    ? null
    : Math.round(profile.completedMissions.reduce((s, m) => s + m.timeTakenSeconds, 0) / completedCount);
  const totalHints = profile.completedMissions.reduce((s, m) => s + m.hintsUsed, 0);
  const xpToNext = (level * 100) - profile.reputationScore;

  // Missions by level
  const tierProgress = (['beginner', 'intermediate', 'advanced', 'expert'] as const).map(lvl => ({
    level: lvl,
    total: MISSIONS.filter(m => m.level === lvl).length,
    done: MISSIONS.filter(m => m.level === lvl && completedIds.has(m.id)).length,
  }));

  return (
    <div className="space-y-6" role="main" aria-label="Investigator Analytics">

      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-primary">
          Investigator Analytics
        </h1>
        <p className="text-xs text-dim font-mono mt-1">
          Your personal competency metrics, forensic history, and badge showcase.
        </p>
      </div>

      {/* Level + XP strip */}
      <div
        className="bg-panel border border-hairline rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5 animate-fade-in-up"
        style={{ animationDelay: '0.05s' }}
        aria-label="Investigator rank and XP"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gold/10 border-2 border-gold/30 flex items-center justify-center">
            <span className="text-xl font-display font-bold text-gold">{level}</span>
          </div>
          <div>
            <p className="text-xs font-mono text-dim uppercase tracking-wider">Rank</p>
            <p className="text-lg font-display font-bold text-primary">Level {level} Investigator</p>
            <p className="text-[10px] font-mono text-dim">{profile.reputationScore} REP · {xpToNext} XP to next level</p>
          </div>
        </div>
        <div className="flex-1 w-full sm:w-auto">
          <div className="flex justify-between text-[9px] font-mono text-dim mb-1">
            <span>XP Progress</span>
            <span>{profile.reputationScore % 100} / 100</span>
          </div>
          <div
            className="w-full bg-void border border-hairline rounded-full h-2.5 overflow-hidden"
            role="progressbar"
            aria-valuenow={profile.reputationScore % 100}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="XP progress to next level"
          >
            <div
              className="h-full bg-gold rounded-full transition-all duration-700"
              style={{ width: `${profile.reputationScore % 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Core stats */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in-up"
        style={{ animationDelay: '0.1s' }}
        aria-label="Core performance statistics"
      >
        {[
          {
            label: 'Missions Solved',
            value: `${completedCount} / ${totalMissions}`,
            icon: '📋',
            color: 'text-primary',
          },
          {
            label: 'Accuracy Rate',
            value: completedCount > 0 ? `${accuracy}%` : '—',
            icon: '🎯',
            color: accuracy >= 75 ? 'text-verified' : accuracy >= 50 ? 'text-unverified' : 'text-tampered',
          },
          {
            label: 'Avg Time / Mission',
            value: avgTime ? (avgTime < 60 ? `${avgTime}s` : `${Math.floor(avgTime / 60)}m ${avgTime % 60}s`) : '—',
            icon: '⏱',
            color: 'text-primary',
          },
          {
            label: 'Total Hints Used',
            value: totalHints,
            icon: '💡',
            color: totalHints === 0 ? 'text-verified' : 'text-unverified',
          },
        ].map(stat => (
          <div
            key={stat.label}
            className="bg-panel border border-hairline rounded-lg px-4 py-4 flex items-center gap-3 hover:bg-panel-raised transition-colors"
          >
            <span className="text-xl" aria-hidden="true">{stat.icon}</span>
            <div>
              <p className={`text-lg font-display font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-[9px] font-mono text-dim uppercase tracking-wider mt-0.5">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Competency Cards */}
      <section aria-labelledby="competency-heading" className="animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
        <h2 id="competency-heading" className="text-xs font-mono text-dim uppercase tracking-wider mb-3">
          Tool Competency
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(Object.keys(COMPETENCY_LABELS) as CheckType[]).map(tool => (
            <CompetencyGauge key={tool} tool={tool} value={profile.competency[tool] ?? 0} />
          ))}
        </div>
      </section>

      {/* Tier Progress */}
      <section aria-labelledby="tier-heading" className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <h2 id="tier-heading" className="text-xs font-mono text-dim uppercase tracking-wider mb-3">
          Mission Tier Progress
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {tierProgress.map(t => {
            const pct = Math.round((t.done / t.total) * 100);
            return (
              <div
                key={t.level}
                className="bg-panel border border-hairline rounded-lg p-4"
                aria-label={`${t.level}: ${t.done} of ${t.total} missions completed`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-mono text-dim uppercase tracking-wider capitalize">
                    {t.level}
                  </span>
                  {t.done === t.total && (
                    <span className="text-[9px] font-mono text-verified">✓ Done</span>
                  )}
                </div>
                <p className="text-xl font-display font-bold text-primary mb-1">
                  {t.done} <span className="text-sm text-dim">/ {t.total}</span>
                </p>
                <div
                  className="w-full bg-void rounded-full h-1.5 overflow-hidden"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${t.level} tier progress`}
                >
                  <div
                    className={`h-full ${TIER_COLORS[t.level]} rounded-full transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Badges */}
      <section
        aria-labelledby="badges-heading"
        className="bg-panel border border-hairline rounded-xl p-5 animate-fade-in-up"
        style={{ animationDelay: '0.25s' }}
      >
        <h2 id="badges-heading" className="text-xs font-mono text-dim uppercase tracking-wider mb-4">
          Badge Showcase — {profile.badges.length} earned
        </h2>
        {profile.badges.length === 0 ? (
          <div
            className="text-center py-8 border border-dashed border-hairline rounded-lg"
            role="status"
            aria-label="No badges earned"
          >
            <p className="text-3xl mb-2" aria-hidden="true">🏅</p>
            <p className="text-xs text-dim font-mono">No badges earned yet.</p>
            <p className="text-[10px] text-dim/60 font-mono mt-1">
              Complete missions to unlock achievement badges.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3" role="list" aria-label="Earned badges">
            {profile.badges.map(badge => (
              <div
                key={badge}
                className="bg-void border border-gold/20 rounded-lg p-3 flex items-center gap-2 hover:bg-panel-raised transition-colors"
                role="listitem"
                aria-label={`Badge: ${badge}`}
              >
                <span className="text-lg shrink-0" aria-hidden="true">🏆</span>
                <span className="text-[10px] font-mono text-gold leading-tight">{badge}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent activity */}
      {profile.completedMissions.length > 0 && (
        <section
          aria-labelledby="history-heading"
          className="bg-panel border border-hairline rounded-xl p-5 animate-fade-in-up"
          style={{ animationDelay: '0.3s' }}
        >
          <h2 id="history-heading" className="text-xs font-mono text-dim uppercase tracking-wider mb-4">
            Recent Mission History
          </h2>
          <div className="space-y-2">
            {[...profile.completedMissions]
              .reverse()
              .slice(0, 8)
              .map((r, i) => {
                const mission = MISSIONS.find(m => m.id === r.missionId);
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 border-b border-hairline/40 last:border-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[9px] font-bold ${
                          r.correct
                            ? 'bg-verified/10 text-verified'
                            : 'bg-tampered/10 text-tampered'
                        }`}
                        aria-hidden="true"
                      >
                        {r.correct ? '✓' : '✗'}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-mono text-primary truncate">
                          {mission?.title ?? r.missionId}
                        </p>
                        <p className="text-[9px] font-mono text-dim">
                          {new Date(r.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-[10px] font-mono">
                      <span className="text-dim">{r.timeTakenSeconds}s</span>
                      {r.hintsUsed > 0 && (
                        <span className="text-unverified">{r.hintsUsed} hints</span>
                      )}
                      <button
                        onClick={() => navigate(`/missions/${r.missionId}/replay`)}
                        aria-label={`Replay ${mission?.title ?? r.missionId}`}
                        className="text-dim hover:text-gold border border-hairline hover:border-gold/40 px-2 py-0.5 rounded transition-all focus:outline-none focus:ring-1 focus:ring-gold"
                      >
                        📼
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      )}
    </div>
  );
}
