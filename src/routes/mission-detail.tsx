import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { storage } from '../engines/storage';
import { MISSIONS } from '../data/missions';
import type { InvestigatorProfile, MissionResult } from '../types';

export default function MissionDetail() {
  const { missionId } = useParams<{ missionId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<InvestigatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<{ step: string; action: string; timestamp: string }[]>([]);
  const [selectedVerdict, setSelectedVerdict] = useState<'authentic' | 'tampered' | null>(null);
  const [startTime] = useState(() => Date.now());

  useEffect(() => {
    const active = storage.getActiveProfile();
    setProfile(active);
    
    if (missionId) {
      const activeId = localStorage.getItem('veriblock:v1:activeMissionId');
      if (activeId !== missionId) {
        localStorage.setItem('veriblock:v1:activeMissionId', missionId);
        localStorage.setItem('veriblock:v1:activeMissionSteps', '[]');
        setCompletedSteps([]);
      } else {
        const stepsStr = localStorage.getItem('veriblock:v1:activeMissionSteps');
        if (stepsStr) {
          try {
            setCompletedSteps(JSON.parse(stepsStr));
          } catch (e) {
            console.error(e);
          }
        }
      }
    }
    
    setLoading(false);
  }, [missionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-live="polite">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto" aria-hidden="true" />
          <p className="text-dim font-mono text-sm">Loading case file…</p>
        </div>
      </div>
    );
  }

  const mission = MISSIONS.find(m => m.id === missionId);

  // Not found state
  if (!mission) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] space-y-4"
        role="alert"
        aria-label="Mission not found"
      >
        <div className="w-16 h-16 rounded-full bg-panel border border-hairline flex items-center justify-center text-3xl">
          🔍
        </div>
        <h1 className="text-xl font-display font-bold text-primary">Case File Not Found</h1>
        <p className="text-xs text-dim font-mono">
          No mission with ID <span className="text-tampered font-bold">{missionId}</span> exists.
        </p>
        <button
          onClick={() => navigate('/missions')}
          className="text-xs font-mono border border-hairline hover:border-gold/50 text-dim hover:text-gold px-4 py-2 rounded transition-all focus:outline-none focus:ring-1 focus:ring-gold"
          aria-label="Return to mission library"
        >
          ← Back to Mission Library
        </button>
      </div>
    );
  }

  const completedResult: MissionResult | undefined = profile?.completedMissions.find(
    m => m.missionId === missionId
  );
  const isCompleted = !!completedResult;

  const levelColors: Record<string, string> = {
    beginner: 'text-verified border-verified/30 bg-verified/10',
    intermediate: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
    advanced: 'text-purple-400 border-purple-400/30 bg-purple-400/10',
    expert: 'text-tampered border-tampered/30 bg-tampered/10',
  };

  const handleSubmitVerdict = () => {
    if (!profile || !mission || !selectedVerdict) return;

    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const correct = selectedVerdict === mission.correctVerdict;

    const newResult: MissionResult = {
      missionId: mission.id,
      correct,
      submittedVerdict: selectedVerdict,
      timeTakenSeconds: Math.max(5, timeTaken), // minimum 5 seconds
      hintsUsed: 0,
      stepsLog: completedSteps.map(s => ({
        step: s.step as any,
        action: s.action,
        result: correct ? 'pass' : 'fail',
        timestamp: s.timestamp
      })),
      completedAt: new Date().toISOString()
    };

    // Update completed missions
    const updatedCompletedMissions = [...profile.completedMissions];
    const existingIndex = updatedCompletedMissions.findIndex(m => m.missionId === mission.id);
    
    let xpGranted = 0;
    if (existingIndex === -1) {
      updatedCompletedMissions.push(newResult);
      if (correct) {
        xpGranted = mission.xpReward;
      }
    } else {
      updatedCompletedMissions[existingIndex] = newResult;
      const previouslyCorrect = profile.completedMissions[existingIndex]?.correct;
      if (correct && !previouslyCorrect) {
        xpGranted = mission.xpReward;
      }
    }

    // Add badge if correct and not already present
    const updatedBadges = [...profile.badges];
    if (correct && mission.recommendedBadge && !updatedBadges.includes(mission.recommendedBadge)) {
      updatedBadges.push(mission.recommendedBadge);
    }

    // Update competency
    const updatedCompetency = { ...profile.competency };
    mission.requiredChecks.forEach(check => {
      const prev = updatedCompetency[check] || 10;
      const delta = correct ? 12 : -10;
      updatedCompetency[check] = Math.max(0, Math.min(100, prev + delta));
    });

    // Save
    storage.updateActiveProfile({
      completedMissions: updatedCompletedMissions,
      reputationScore: profile.reputationScore + xpGranted,
      badges: updatedBadges,
      competency: updatedCompetency
    });

    // Dispatch event to sync Layout header
    window.dispatchEvent(new Event('profile-updated'));

    // Clear active steps
    localStorage.removeItem('veriblock:v1:activeMissionSteps');
    localStorage.removeItem('veriblock:v1:activeMissionId');

    // Navigate to replay
    navigate(`/missions/${mission.id}/replay`);
  };

  return (
    <div className="space-y-6 max-w-3xl" role="main" aria-label={`Mission detail: ${mission.title}`}>

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
          <li className="text-primary truncate max-w-[200px]">{mission.title}</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="animate-fade-in-up">
        <div className="flex items-center gap-3 mb-2">
          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${levelColors[mission.level]}`}>
            {mission.level}
          </span>
          {isCompleted && (
            <span className="text-[10px] font-mono text-verified font-bold">✓ Case Closed</span>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-primary">{mission.title}</h1>
      </div>

      {/* Case Briefing */}
      <div
        className="bg-panel border border-hairline rounded-lg p-5 animate-fade-in-up"
        style={{ animationDelay: '0.05s' }}
        aria-label="Case briefing"
      >
        <p className="text-[10px] font-mono text-gold uppercase mb-2">📋 Case Briefing</p>
        <p className="text-sm text-primary leading-relaxed">{mission.briefing}</p>
      </div>

      {/* Stats */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in-up"
        style={{ animationDelay: '0.1s' }}
        aria-label="Mission stats"
      >
        {[
          { label: 'XP Reward', value: `⚡ ${mission.xpReward}`, color: 'text-gold' },
          { label: 'Difficulty', value: mission.level.toUpperCase(), color: levelColors[mission.level].split(' ')[0] },
          { label: 'Required Tools', value: `${mission.requiredChecks.length} tool${mission.requiredChecks.length > 1 ? 's' : ''}`, color: 'text-primary' },
          {
            label: 'Status',
            value: isCompleted ? 'Solved' : 'Open',
            color: isCompleted ? 'text-verified' : 'text-unverified',
          },
        ].map(s => (
          <div key={s.label} className="bg-panel border border-hairline rounded-lg px-4 py-3">
            <p className={`text-sm font-bold font-mono ${s.color}`}>{s.value}</p>
            <p className="text-[9px] font-mono text-dim uppercase tracking-wider mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Forensic Checklist */}
      <div
        className="bg-panel border border-hairline rounded-lg p-5 animate-fade-in-up"
        style={{ animationDelay: '0.15s' }}
        aria-label="Required checks status"
      >
        <p className="text-[10px] font-mono text-dim uppercase tracking-wider mb-3">Forensic Checklist</p>
        <div className="space-y-3">
          {mission.requiredChecks.map(check => {
            const labels: Record<string, { name: string; path: string; icon: string }> = {
              hash: { name: 'Hash Lab Check', path: '/tools/hash-lab', icon: '#' },
              chain: { name: 'Chain Integrity Audit', path: '/tools/chain-explorer', icon: '⛓' },
              signature: { name: 'Signature Verification', path: '/tools/signature-panel', icon: '🔏' },
            };
            const tool = labels[check];
            const isLogged = completedSteps.some(s => s.step === check);

            return (
              <div key={check} className="flex items-center justify-between bg-void/50 border border-hairline/60 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-mono font-bold border ${
                    isLogged ? 'bg-verified/20 border-verified text-verified' : 'bg-void border-hairline text-dim'
                  }`}>
                    {isLogged ? '✓' : tool.icon}
                  </span>
                  <div>
                    <span className={`text-xs font-mono font-bold ${isLogged ? 'text-verified' : 'text-primary'}`}>
                      {tool.name}
                    </span>
                    <p className="text-[10px] text-dim font-mono">
                      {isLogged ? 'Step logged successfully' : 'Requires dynamic diagnostic scan'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`${tool.path}?missionId=${mission.id}`)}
                  className={`text-[10px] font-mono border px-3 py-1.5 rounded transition-all focus:outline-none focus:ring-1 focus:ring-gold ${
                    isLogged
                      ? 'border-verified/30 text-verified hover:bg-verified/5'
                      : 'border-hairline hover:border-gold/40 text-dim hover:text-gold'
                  }`}
                >
                  {isLogged ? 'Re-run Scan' : 'Launch Tool →'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Verdict Submission Form */}
      {!isCompleted && (
        <div
          className="bg-panel border border-gold/30 rounded-lg p-5 animate-fade-in-up"
          style={{ animationDelay: '0.2s' }}
        >
          <p className="text-[10px] font-mono text-gold uppercase tracking-wider mb-3">⚖ Render Verdict</p>
          {completedSteps.length < mission.requiredChecks.length ? (
            <p className="text-xs text-dim font-mono leading-relaxed bg-void/50 border border-hairline rounded p-3">
              🔒 Verdict submission locked. Please launch the forensic tools and log all required analysis checks above.
            </p>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-primary leading-relaxed">
                Based on your cryptographic investigation, is this intelligence asset authentic or has it been tampered with?
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setSelectedVerdict('authentic')}
                  className={`p-3 rounded-lg border font-mono text-xs font-bold uppercase transition-all flex flex-col items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-verified ${
                    selectedVerdict === 'authentic'
                      ? 'border-verified bg-verified/10 text-verified'
                      : 'border-hairline hover:border-verified/30 text-dim hover:text-verified bg-void/30'
                  }`}
                >
                  <span className="text-lg">🟢</span>
                  Authentic
                </button>
                
                <button
                  onClick={() => setSelectedVerdict('tampered')}
                  className={`p-3 rounded-lg border font-mono text-xs font-bold uppercase transition-all flex flex-col items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-tampered ${
                    selectedVerdict === 'tampered'
                      ? 'border-tampered bg-tampered/10 text-tampered'
                      : 'border-hairline hover:border-tampered/30 text-dim hover:text-tampered bg-void/30'
                  }`}
                >
                  <span className="text-lg">🔴</span>
                  Tampered
                </button>
              </div>

              <button
                onClick={handleSubmitVerdict}
                disabled={!selectedVerdict}
                className="w-full bg-gold hover:bg-gold/90 text-void font-mono font-bold py-2.5 px-4 rounded text-xs uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Verdict to HQ →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Hints */}
      {mission.hints.length > 0 && (
        <details
          className="bg-panel border border-hairline rounded-lg p-5 animate-fade-in-up"
          style={{ animationDelay: '0.2s' }}
        >
          <summary
            className="text-[10px] font-mono text-unverified uppercase tracking-wider cursor-pointer hover:text-gold transition-colors focus:outline-none focus:underline list-none flex items-center gap-2"
            aria-label="Toggle hints"
          >
            <span aria-hidden="true">💡</span> Show Hints ({mission.hints.length})
          </summary>
          <ol className="mt-4 space-y-2 list-decimal list-inside">
            {mission.hints.map((hint, i) => (
              <li key={i} className="text-xs text-dim font-mono leading-relaxed">{hint}</li>
            ))}
          </ol>
        </details>
      )}

      {/* Badge */}
      {mission.recommendedBadge && (
        <div
          className="bg-panel border border-gold/20 rounded-lg p-4 flex items-center gap-3 animate-fade-in-up"
          style={{ animationDelay: '0.25s' }}
          aria-label={`Badge reward: ${mission.recommendedBadge}`}
        >
          <span className="text-2xl" aria-hidden="true">🏆</span>
          <div>
            <p className="text-[9px] font-mono text-dim uppercase tracking-wider">Badge Reward</p>
            <p className="text-sm font-bold text-gold">{mission.recommendedBadge}</p>
          </div>
          {isCompleted && profile?.badges.includes(mission.recommendedBadge) && (
            <span className="ml-auto text-[10px] font-mono text-verified">✓ Earned</span>
          )}
        </div>
      )}

      {/* Completed result summary */}
      {isCompleted && completedResult && (
        <div
          className="bg-verified/5 border border-verified/20 rounded-lg p-5 animate-fade-in-up"
          style={{ animationDelay: '0.3s' }}
          aria-label="Completed mission summary"
        >
          <p className="text-[10px] font-mono text-verified uppercase tracking-wider mb-3">✓ Case Closed — Your Results</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {[
              { label: 'Verdict', value: completedResult.submittedVerdict.toUpperCase(), color: completedResult.correct ? 'text-verified' : 'text-tampered' },
              { label: 'Time Taken', value: `${completedResult.timeTakenSeconds}s`, color: 'text-primary' },
              { label: 'Hints Used', value: completedResult.hintsUsed, color: 'text-dim' },
              { label: 'Steps Taken', value: completedResult.stepsLog.length, color: 'text-dim' },
            ].map(s => (
              <div key={s.label} className="bg-void border border-hairline rounded-lg p-3">
                <p className={`text-sm font-bold font-mono ${s.color}`}>{s.value}</p>
                <p className="text-[9px] font-mono text-dim uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          {completedResult.stepsLog.length > 0 && (
            <button
              onClick={() => navigate(`/missions/${missionId}/replay`)}
              aria-label="Replay decision log"
              className="mt-4 text-[10px] font-mono border border-verified/30 text-verified hover:bg-verified/5 px-4 py-2 rounded transition-all focus:outline-none focus:ring-1 focus:ring-verified"
            >
              📼 Replay Decision Log
            </button>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2 animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
        <button
          onClick={() => navigate('/missions')}
          aria-label="Back to mission library"
          className="text-xs font-mono border border-hairline hover:border-gold/50 text-dim hover:text-gold px-4 py-2 rounded transition-all focus:outline-none focus:ring-1 focus:ring-gold"
        >
          ← Mission Library
        </button>
      </div>
    </div>
  );
}
