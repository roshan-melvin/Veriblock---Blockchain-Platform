import { useState, useEffect, useCallback } from 'react';
import { storage } from '../engines/storage';
import { MISSIONS } from '../data/missions';
import type { InvestigatorProfile, MissionResult, CheckType } from '../types';

// ─── helpers ─────────────────────────────────────────────────────────────────

function levelFromRep(score: number): number {
  return Math.floor(score / 100) + 1;
}

function accuracyRate(missions: MissionResult[]): number {
  if (!missions.length) return 0;
  return Math.round((missions.filter(m => m.correct).length / missions.length) * 100);
}

function avgTime(missions: MissionResult[]): string {
  if (!missions.length) return '—';
  const avg = missions.reduce((s, m) => s + m.timeTakenSeconds, 0) / missions.length;
  return avg < 60 ? `${Math.round(avg)}s` : `${Math.floor(avg / 60)}m ${Math.round(avg % 60)}s`;
}

function hintsPerMission(missions: MissionResult[]): string {
  if (!missions.length) return '—';
  return (missions.reduce((s, m) => s + m.hintsUsed, 0) / missions.length).toFixed(1);
}

const COMPETENCY_LABELS: Record<CheckType, string> = {
  hash: 'Hash Lab',
  chain: 'Chain Explorer',
  signature: 'Signature Panel',
};

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'text-verified border-verified/30 bg-verified/10',
  intermediate: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
  advanced: 'text-purple-400 border-purple-400/30 bg-purple-400/10',
  expert: 'text-tampered border-tampered/30 bg-tampered/10',
};

function CompetencyBar({ label, value }: { label: string; value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const color =
    pct >= 75 ? 'bg-verified' : pct >= 45 ? 'bg-unverified' : 'bg-tampered';
  return (
    <div>
      <div className="flex justify-between text-[10px] font-mono mb-1">
        <span className="text-dim">{label}</span>
        <span className={pct >= 75 ? 'text-verified' : pct >= 45 ? 'text-unverified' : 'text-tampered'}>
          {pct}%
        </span>
      </div>
      <div
        className="w-full bg-void rounded-full h-1.5 overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} competency ${pct}%`}
      >
        <div
          className={`h-full ${color} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── student detail modal ────────────────────────────────────────────────────

interface StudentDetailProps {
  profile: InvestigatorProfile;
  onClose: () => void;
}

function StudentDetailModal({ profile, onClose }: StudentDetailProps) {
  const level = levelFromRep(profile.reputationScore);
  const acc = accuracyRate(profile.completedMissions);
  const totalMissions = MISSIONS.length;
  const completedIds = new Set(profile.completedMissions.map(m => m.missionId));

  // Group completed missions by level
  const byLevel = (['beginner', 'intermediate', 'advanced', 'expert'] as const).map(lvl => ({
    level: lvl,
    total: MISSIONS.filter(m => m.level === lvl).length,
    completed: MISSIONS.filter(m => m.level === lvl && completedIds.has(m.id)).length,
  }));

  // Handle Esc key to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-void/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-student-name"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-panel border border-hairline rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in-up shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 id="modal-student-name" className="text-xl font-display font-bold text-primary">
              {profile.name}
            </h2>
            <p className="text-[11px] font-mono text-dim mt-0.5">
              ID: <span className="text-gold font-bold">{profile.id}</span> ·
              Joined {new Date(profile.createdAt).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close student detail"
            className="text-dim hover:text-primary transition-colors text-sm font-mono focus:outline-none focus:ring-1 focus:ring-gold rounded px-2 py-1"
          >
            ✕ Close
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Level', value: `LVL ${level}`, color: 'text-gold' },
            { label: 'Reputation', value: profile.reputationScore, color: 'text-primary' },
            { label: 'Accuracy', value: `${acc}%`, color: acc >= 75 ? 'text-verified' : acc >= 50 ? 'text-unverified' : 'text-tampered' },
            { label: 'Missions Done', value: `${completedIds.size} / ${totalMissions}`, color: 'text-primary' },
          ].map(s => (
            <div key={s.label} className="bg-void border border-hairline rounded-lg p-3 text-center">
              <p className={`text-lg font-display font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[9px] font-mono text-dim uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Competency bars */}
        <div className="bg-void border border-hairline rounded-lg p-4 mb-5 space-y-3">
          <p className="text-[10px] font-mono text-dim uppercase tracking-wider mb-2">Tool Competency</p>
          {(Object.entries(profile.competency) as [CheckType, number][]).map(([key, val]) => (
            <CompetencyBar key={key} label={COMPETENCY_LABELS[key]} value={val} />
          ))}
        </div>

        {/* Progress by tier */}
        <div className="bg-void border border-hairline rounded-lg p-4 mb-5">
          <p className="text-[10px] font-mono text-dim uppercase tracking-wider mb-3">Tier Progress</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {byLevel.map(t => (
              <div key={t.level} className={`rounded-lg border p-3 text-center ${LEVEL_COLORS[t.level]}`}>
                <p className="text-lg font-bold font-mono">{t.completed}/{t.total}</p>
                <p className="text-[9px] uppercase tracking-wider mt-0.5 capitalize">{t.level}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Badges */}
        <div className="bg-void border border-hairline rounded-lg p-4 mb-5">
          <p className="text-[10px] font-mono text-dim uppercase tracking-wider mb-3">
            Badges Earned ({profile.badges.length})
          </p>
          {profile.badges.length === 0 ? (
            <p className="text-xs text-dim/60 font-mono text-center py-2">No badges earned yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {profile.badges.map(b => (
                <span
                  key={b}
                  className="bg-panel-raised border border-gold/20 text-gold text-[10px] font-mono px-2 py-1 rounded-full"
                >
                  🏆 {b}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Mission log */}
        <div className="bg-void border border-hairline rounded-lg p-4">
          <p className="text-[10px] font-mono text-dim uppercase tracking-wider mb-3">
            Recent Mission Log ({profile.completedMissions.length} entries)
          </p>
          {profile.completedMissions.length === 0 ? (
            <p className="text-xs text-dim/60 font-mono text-center py-2">No missions completed yet.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {[...profile.completedMissions].reverse().map((r, i) => {
                const mission = MISSIONS.find(m => m.id === r.missionId);
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between text-[10px] font-mono py-1.5 border-b border-hairline/40 last:border-none"
                  >
                    <span className="text-primary truncate max-w-[55%]">
                      {mission?.title ?? r.missionId}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={r.correct ? 'text-verified' : 'text-tampered'}>
                        {r.correct ? '✓ Correct' : '✗ Wrong'}
                      </span>
                      <span className="text-dim">{r.timeTakenSeconds}s</span>
                      {r.hintsUsed > 0 && (
                        <span className="text-unverified">{r.hintsUsed}h</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── student roster row ───────────────────────────────────────────────────────

interface StudentRowProps {
  profile: InvestigatorProfile;
  rank: number;
  onSelect: (p: InvestigatorProfile) => void;
}

function StudentRow({ profile, rank, onSelect }: StudentRowProps) {
  const level = levelFromRep(profile.reputationScore);
  const acc = accuracyRate(profile.completedMissions);
  const completedCount = new Set(profile.completedMissions.map(m => m.missionId)).size;
  const totalMissions = MISSIONS.length;
  const pct = Math.round((completedCount / totalMissions) * 100);

  return (
    <tr
      className="border-b border-hairline/40 hover:bg-panel-raised/60 transition-colors cursor-pointer group"
      onClick={() => onSelect(profile)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(profile); } }}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${profile.name}`}
    >
      <td className="py-3 px-4 text-[10px] font-mono text-dim">{rank}</td>
      <td className="py-3 px-4">
        <div>
          <p className="text-xs font-semibold text-primary group-hover:text-gold transition-colors">{profile.name}</p>
          <p className="text-[9px] font-mono text-dim truncate max-w-[120px]">{profile.id}</p>
        </div>
      </td>
      <td className="py-3 px-4 font-mono text-xs text-gold">LVL {level}</td>
      <td className="py-3 px-4 font-mono text-xs text-primary">{profile.reputationScore}</td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div
            className="w-20 bg-void rounded-full h-1.5 overflow-hidden"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${profile.name} completion ${pct}%`}
          >
            <div
              className="h-full bg-gold rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-dim">{completedCount}/{totalMissions}</span>
        </div>
      </td>
      <td className="py-3 px-4 font-mono text-xs">
        <span className={acc >= 75 ? 'text-verified' : acc >= 50 ? 'text-unverified' : 'text-tampered'}>
          {completedCount > 0 ? `${acc}%` : '—'}
        </span>
      </td>
      <td className="py-3 px-4 font-mono text-xs text-dim">{avgTime(profile.completedMissions)}</td>
      <td className="py-3 px-4 font-mono text-xs text-dim">{hintsPerMission(profile.completedMissions)}</td>
      <td className="py-3 px-4 font-mono text-xs text-gold">{profile.badges.length}</td>
      <td className="py-3 px-4">
        <button
          onClick={e => { e.stopPropagation(); onSelect(profile); }}
          aria-label={`Open ${profile.name} analytics`}
          className="text-[9px] font-mono border border-hairline hover:border-gold/50 text-dim hover:text-gold px-2 py-1 rounded transition-all focus:outline-none focus:ring-1 focus:ring-gold"
        >
          Details →
        </button>
      </td>
    </tr>
  );
}

// ─── main component ────────────────────────────────────────────────────────────

export default function Educator() {
  const [profiles, setProfiles] = useState<InvestigatorProfile[] | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<InvestigatorProfile | null>(null);
  const [sortBy, setSortBy] = useState<'rep' | 'acc' | 'completion' | 'name'>('rep');
  const [filterTerm, setFilterTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadProfiles = useCallback(() => {
    try {
      const all = storage.getProfiles();
      setProfiles(all);
      setError(null);
    } catch (e) {
      setError('Failed to read profiles from localStorage.');
      setProfiles([]);
    }
  }, []);

  useEffect(() => {
    loadProfiles();
    window.addEventListener('profile-updated', loadProfiles);
    return () => window.removeEventListener('profile-updated', loadProfiles);
  }, [loadProfiles]);

  // ── derived statistics ──────────────────────────────────────────────────────
  const totalMissions = MISSIONS.length;

  const classStats = profiles
    ? {
        totalStudents: profiles.length,
        avgCompletion:
          profiles.length === 0
            ? 0
            : Math.round(
                profiles.reduce((s, p) => {
                  const done = new Set(p.completedMissions.map(m => m.missionId)).size;
                  return s + done / totalMissions;
                }, 0) /
                  profiles.length *
                  100
              ),
        avgAccuracy:
          profiles.length === 0
            ? 0
            : Math.round(
                profiles.reduce((s, p) => s + accuracyRate(p.completedMissions), 0) /
                  profiles.length
              ),
        avgRep:
          profiles.length === 0
            ? 0
            : Math.round(
                profiles.reduce((s, p) => s + p.reputationScore, 0) / profiles.length
              ),
      }
    : null;

  // ── sorted + filtered roster ────────────────────────────────────────────────
  const roster = (profiles ?? [])
    .filter(p => p.name.toLowerCase().includes(filterTerm.toLowerCase()) || p.id.includes(filterTerm))
    .sort((a, b) => {
      switch (sortBy) {
        case 'acc': return accuracyRate(b.completedMissions) - accuracyRate(a.completedMissions);
        case 'completion': {
          const aC = new Set(a.completedMissions.map(m => m.missionId)).size;
          const bC = new Set(b.completedMissions.map(m => m.missionId)).size;
          return bC - aC;
        }
        case 'name': return a.name.localeCompare(b.name);
        default: return b.reputationScore - a.reputationScore;
      }
    });

  // ── loading state ───────────────────────────────────────────────────────────
  if (profiles === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-live="polite">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto" aria-hidden="true" />
          <p className="text-dim font-mono text-sm">Loading investigator profiles…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" role="main" aria-label="Educator Dashboard">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="animate-fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-primary">
              Educator Dashboard
            </h1>
            <p className="text-xs text-dim font-mono mt-1">
              Monitor student progress, completion rates, accuracy, and forensic competencies.
            </p>
          </div>
          <div
            className="flex items-center gap-2 bg-panel border border-hairline/60 rounded-lg px-3 py-2 text-[10px] font-mono text-dim"
            role="note"
            aria-label="Data scope notice"
          >
            <span className="text-unverified">⚠</span>
            <span>Only investigators stored on this device are shown.</span>
          </div>
        </div>
      </div>

      {/* ── Error state ──────────────────────────────────────────────────────── */}
      {error && (
        <div
          className="bg-tampered/10 border border-tampered/30 rounded-lg p-4 flex items-center gap-3"
          role="alert"
          aria-live="assertive"
        >
          <span className="text-tampered text-lg" aria-hidden="true">⚠</span>
          <div>
            <p className="text-tampered text-xs font-mono font-bold">Storage Error</p>
            <p className="text-tampered/80 text-[11px] font-mono mt-0.5">{error}</p>
          </div>
          <button
            onClick={loadProfiles}
            className="ml-auto text-[10px] font-mono border border-tampered/40 text-tampered hover:bg-tampered/10 px-2 py-1 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-tampered"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Class Summary Stats ──────────────────────────────────────────────── */}
      {classStats && (
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in-up"
          style={{ animationDelay: '0.05s' }}
          aria-label="Class summary statistics"
        >
          {[
            {
              label: 'Students Enrolled',
              value: classStats.totalStudents,
              icon: '👤',
              color: 'text-primary',
            },
            {
              label: 'Avg. Completion',
              value: `${classStats.avgCompletion}%`,
              icon: '📋',
              color: classStats.avgCompletion >= 60 ? 'text-verified' : 'text-unverified',
            },
            {
              label: 'Avg. Accuracy',
              value: classStats.totalStudents > 0 ? `${classStats.avgAccuracy}%` : '—',
              icon: '🎯',
              color:
                classStats.avgAccuracy >= 75
                  ? 'text-verified'
                  : classStats.avgAccuracy >= 50
                  ? 'text-unverified'
                  : 'text-tampered',
            },
            {
              label: 'Avg. Reputation',
              value: classStats.avgRep,
              icon: '⭐',
              color: 'text-gold',
            },
          ].map(stat => (
            <div
              key={stat.label}
              className="bg-panel border border-hairline rounded-lg px-4 py-4 flex items-center gap-3 hover:bg-panel-raised transition-colors"
            >
              <span className="text-xl" aria-hidden="true">{stat.icon}</span>
              <div>
                <p className={`text-xl font-display font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-[9px] font-mono text-dim uppercase tracking-wider mt-0.5">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Competency Overview Bars ─────────────────────────────────────────── */}
      {profiles.length > 0 && (
        <div
          className="bg-panel border border-hairline rounded-lg p-5 animate-fade-in-up"
          style={{ animationDelay: '0.1s' }}
          aria-label="Class competency overview"
        >
          <p className="text-xs font-mono text-dim uppercase tracking-wider mb-4">
            Class-Wide Tool Competency (Average)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {(['hash', 'chain', 'signature'] as CheckType[]).map(tool => {
              const avg =
                profiles.length === 0
                  ? 0
                  : Math.round(
                      profiles.reduce((s, p) => s + (p.competency[tool] ?? 0), 0) /
                        profiles.length
                    );
              return (
                <CompetencyBar key={tool} label={COMPETENCY_LABELS[tool]} value={avg} />
              );
            })}
          </div>
        </div>
      )}

      {/* ── Empty State ──────────────────────────────────────────────────────── */}
      {profiles.length === 0 && !error && (
        <div
          className="bg-panel border border-hairline rounded-xl p-16 text-center flex flex-col items-center justify-center min-h-[300px] animate-fade-in-up"
          style={{ animationDelay: '0.1s' }}
          role="status"
          aria-label="No student profiles found"
        >
          <div className="w-16 h-16 rounded-full bg-void border border-hairline flex items-center justify-center text-3xl mb-5">
            👥
          </div>
          <h2 className="text-sm font-mono font-bold text-primary uppercase tracking-wider">
            No Investigators Found
          </h2>
          <p className="text-xs text-dim max-w-sm mt-2 leading-relaxed">
            No investigator profiles are stored on this device yet. Students must complete the
            onboarding flow to appear here.
          </p>
          <div className="mt-5 bg-void border border-hairline px-5 py-2.5 rounded-full text-[10px] font-mono text-dim">
            ⚠ Only investigators stored on this device are shown.
          </div>
        </div>
      )}

      {/* ── Student Roster ───────────────────────────────────────────────────── */}
      {profiles.length > 0 && (
        <div
          className="bg-panel border border-hairline rounded-lg overflow-hidden animate-fade-in-up"
          style={{ animationDelay: '0.15s' }}
        >
          {/* Roster toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-hairline">
            <p className="text-xs font-mono text-dim uppercase tracking-wider">
              Student Roster — {roster.length} of {profiles.length}
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Search */}
              <label className="sr-only" htmlFor="educator-search">Search students</label>
              <input
                id="educator-search"
                type="search"
                value={filterTerm}
                onChange={e => setFilterTerm(e.target.value)}
                placeholder="Search by name or ID…"
                className="bg-void border border-hairline text-primary text-xs font-mono px-3 py-1.5 rounded-lg placeholder:text-dim/40 focus:outline-none focus:ring-1 focus:ring-gold w-44"
                aria-label="Search students by name or ID"
              />
              {/* Sort */}
              <label className="sr-only" htmlFor="educator-sort">Sort by</label>
              <select
                id="educator-sort"
                value={sortBy}
                onChange={e => setSortBy(e.target.value as typeof sortBy)}
                className="bg-void border border-hairline text-dim text-[10px] font-mono px-2 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
                aria-label="Sort students by"
              >
                <option value="rep">Sort: Reputation</option>
                <option value="acc">Sort: Accuracy</option>
                <option value="completion">Sort: Completion</option>
                <option value="name">Sort: Name</option>
              </select>
            </div>
          </div>

          {/* No filter results */}
          {roster.length === 0 && (
            <div className="text-center py-10">
              <p className="text-xs text-dim font-mono">No students match "{filterTerm}".</p>
            </div>
          )}

          {/* Table */}
          {roster.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left" role="grid" aria-label="Student roster">
                <thead>
                  <tr className="text-[9px] font-mono text-dim uppercase tracking-wider border-b border-hairline bg-void/50">
                    <th className="py-2 px-4" scope="col">#</th>
                    <th className="py-2 px-4" scope="col">Investigator</th>
                    <th className="py-2 px-4" scope="col">Level</th>
                    <th className="py-2 px-4" scope="col">Rep</th>
                    <th className="py-2 px-4" scope="col">Completion</th>
                    <th className="py-2 px-4" scope="col">Accuracy</th>
                    <th className="py-2 px-4" scope="col">Avg Time</th>
                    <th className="py-2 px-4" scope="col">Hints/M</th>
                    <th className="py-2 px-4" scope="col">Badges</th>
                    <th className="py-2 px-4" scope="col"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((p, i) => (
                    <StudentRow
                      key={p.id}
                      profile={p}
                      rank={i + 1}
                      onSelect={setSelectedProfile}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Student Detail Modal ─────────────────────────────────────────────── */}
      {selectedProfile && (
        <StudentDetailModal
          profile={selectedProfile}
          onClose={() => setSelectedProfile(null)}
        />
      )}
    </div>
  );
}
