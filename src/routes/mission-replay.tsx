import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { storage } from '../engines/storage';
import { MISSIONS } from '../data/missions';
import type { InvestigatorProfile, MissionResult, DecisionStep } from '../types';

const STEP_LABELS: Record<string, string> = {
  hash: 'Hash Lab',
  chain: 'Chain Explorer',
  signature: 'Signature Panel',
  verdict: 'Final Verdict',
};

const STEP_ICONS: Record<string, string> = {
  hash: '#',
  chain: '⛓',
  signature: '🔏',
  verdict: '⚖',
};

function StepCard({ step, index, total }: { step: DecisionStep; index: number; total: number }) {
  const isLast = index === total - 1;
  return (
    <li className="relative flex gap-4" aria-label={`Step ${index + 1}: ${step.action}`}>
      {/* Timeline connector */}
      {!isLast && (
        <div className="absolute left-5 top-10 bottom-0 w-px bg-hairline" aria-hidden="true" />
      )}
      {/* Icon */}
      <div
        className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border font-mono text-sm ${
          step.result === 'pass'
            ? 'bg-verified/10 border-verified/30 text-verified'
            : 'bg-tampered/10 border-tampered/30 text-tampered'
        }`}
        aria-hidden="true"
      >
        {STEP_ICONS[step.step] ?? '🔎'}
      </div>
      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="text-xs font-mono font-bold text-primary">
            {STEP_LABELS[step.step] ?? step.step}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                step.result === 'pass'
                  ? 'text-verified border-verified/30 bg-verified/10'
                  : 'text-tampered border-tampered/30 bg-tampered/10'
              }`}
            >
              {step.result === 'pass' ? '✓ Pass' : '✗ Fail'}
            </span>
            <time
              dateTime={step.timestamp}
              className="text-[9px] font-mono text-dim"
              title={new Date(step.timestamp).toLocaleString()}
            >
              {new Date(step.timestamp).toLocaleTimeString()}
            </time>
          </div>
        </div>
        <p className="text-[11px] text-dim font-mono leading-relaxed">{step.action}</p>
      </div>
    </li>
  );
}

export default function MissionReplay() {
  const { missionId } = useParams<{ missionId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<InvestigatorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const active = storage.getActiveProfile();
    setProfile(active);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-live="polite">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto" aria-hidden="true" />
          <p className="text-dim font-mono text-sm">Loading decision replay…</p>
        </div>
      </div>
    );
  }

  const mission = MISSIONS.find(m => m.id === missionId);
  const result: MissionResult | undefined = profile?.completedMissions.find(
    m => m.missionId === missionId
  );

  // Not found
  if (!mission || !result) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] space-y-4"
        role="alert"
        aria-label="Replay not available"
      >
        <div className="w-16 h-16 rounded-full bg-panel border border-hairline flex items-center justify-center text-3xl">
          📼
        </div>
        <h1 className="text-xl font-display font-bold text-primary">No Replay Available</h1>
        <p className="text-xs text-dim font-mono text-center max-w-xs">
          {!mission
            ? `Mission "${missionId}" does not exist.`
            : 'This mission has not been completed yet. Complete it first to replay your decisions.'}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/missions')}
            className="text-xs font-mono border border-hairline hover:border-gold/50 text-dim hover:text-gold px-4 py-2 rounded transition-all focus:outline-none focus:ring-1 focus:ring-gold"
            aria-label="Return to mission library"
          >
            ← Mission Library
          </button>
          {mission && (
            <button
              onClick={() => navigate(`/missions/${missionId}`)}
              className="text-xs font-mono border border-gold/30 text-gold hover:bg-gold/5 px-4 py-2 rounded transition-all focus:outline-none focus:ring-1 focus:ring-gold"
              aria-label="Open case file"
            >
              Open Case File →
            </button>
          )}
        </div>
      </div>
    );
  }

  const levelColors: Record<string, string> = {
    beginner: 'text-verified border-verified/30 bg-verified/10',
    intermediate: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
    advanced: 'text-purple-400 border-purple-400/30 bg-purple-400/10',
    expert: 'text-tampered border-tampered/30 bg-tampered/10',
  };

  return (
    <div className="space-y-6 max-w-2xl" role="main" aria-label={`Decision replay: ${mission.title}`}>

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-[10px] font-mono text-dim">
          <li>
            <button
              onClick={() => navigate('/missions')}
              className="hover:text-gold transition-colors focus:outline-none focus:underline"
            >
              Mission Library
            </button>
          </li>
          <li aria-hidden="true">›</li>
          <li>
            <button
              onClick={() => navigate(`/missions/${missionId}`)}
              className="hover:text-gold transition-colors focus:outline-none focus:underline"
            >
              {mission.title}
            </button>
          </li>
          <li aria-hidden="true">›</li>
          <li className="text-primary">Decision Replay</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="animate-fade-in-up">
        <div className="flex items-center gap-3 mb-2">
          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${levelColors[mission.level]}`}>
            {mission.level}
          </span>
          <span className="text-[10px] font-mono text-dim">📼 Replay</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-primary">{mission.title}</h1>
        <p className="text-xs text-dim font-mono mt-1">
          Completed {new Date(result.completedAt).toLocaleString()}
        </p>
      </div>

      {/* Summary Card */}
      <div
        className={`rounded-lg border p-5 animate-fade-in-up ${
          result.correct
            ? 'bg-verified/5 border-verified/20'
            : 'bg-tampered/5 border-tampered/20'
        }`}
        style={{ animationDelay: '0.05s' }}
        aria-label="Investigation outcome summary"
      >
        <p className={`text-[10px] font-mono uppercase tracking-wider mb-3 ${result.correct ? 'text-verified' : 'text-tampered'}`}>
          {result.correct ? '✓ Correct Verdict' : '✗ Incorrect Verdict'} — Investigation Summary
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          {[
            { label: 'Your Verdict', value: result.submittedVerdict.toUpperCase(), color: result.correct ? 'text-verified' : 'text-tampered' },
            { label: 'Time Taken', value: `${result.timeTakenSeconds}s`, color: 'text-primary' },
            { label: 'Hints Used', value: result.hintsUsed, color: result.hintsUsed === 0 ? 'text-verified' : 'text-unverified' },
            { label: 'Total Steps', value: result.stepsLog.length, color: 'text-primary' },
          ].map(s => (
            <div key={s.label} className="bg-void border border-hairline rounded-lg p-3">
              <p className={`text-sm font-bold font-mono ${s.color}`}>{s.value}</p>
              <p className="text-[9px] font-mono text-dim uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Decision Timeline */}
      <div
        className="bg-panel border border-hairline rounded-lg p-5 animate-fade-in-up"
        style={{ animationDelay: '0.1s' }}
        aria-label="Decision timeline"
      >
        <p className="text-[10px] font-mono text-dim uppercase tracking-wider mb-5">
          Decision Timeline — {result.stepsLog.length} Steps
        </p>
        {result.stepsLog.length === 0 ? (
          <p className="text-xs text-dim font-mono text-center py-4">No decision steps were recorded.</p>
        ) : (
          <ol className="space-y-0" aria-label="Forensic investigation steps">
            {result.stepsLog.map((step, i) => (
              <StepCard key={i} step={step} index={i} total={result.stepsLog.length} />
            ))}
          </ol>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <button
          onClick={() => navigate(`/missions/${missionId}`)}
          aria-label="Back to case file"
          className="text-xs font-mono border border-hairline hover:border-gold/50 text-dim hover:text-gold px-4 py-2 rounded transition-all focus:outline-none focus:ring-1 focus:ring-gold"
        >
          ← Case File
        </button>
        <button
          onClick={() => navigate('/missions')}
          aria-label="Return to mission library"
          className="text-xs font-mono border border-hairline hover:border-gold/50 text-dim hover:text-gold px-4 py-2 rounded transition-all focus:outline-none focus:ring-1 focus:ring-gold"
        >
          Mission Library →
        </button>
      </div>
    </div>
  );
}
