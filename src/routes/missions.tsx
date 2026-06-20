import { useState, useEffect } from 'react';
import { storage } from '../engines/storage';
import { MISSIONS } from '../data/missions';
import type { InvestigatorProfile, Mission, MissionLevel, MissionResult } from '../types';

export default function Missions() {
  const [profile, setProfile] = useState<InvestigatorProfile | null>(null);
  const [activeTier, setActiveTier] = useState<MissionLevel>('beginner');
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);

  useEffect(() => {
    const sync = () => {
      setProfile(storage.getActiveProfile());
    };
    sync();
    window.addEventListener('profile-updated', sync);
    return () => window.removeEventListener('profile-updated', sync);
  }, []);

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-dim font-mono text-sm animate-pulse">Loading mission database...</p>
      </div>
    );
  }

  // Calculate unique completed missions
  const completedMissionIds = new Set(profile.completedMissions.map(m => m.missionId));
  const completedCount = completedMissionIds.size;

  // Determine tier locks based on completed count
  const isTierLocked = (tier: MissionLevel): boolean => {
    if (tier === 'beginner') return false;
    if (tier === 'intermediate') return completedCount < 3;
    if (tier === 'advanced') return completedCount < 6;
    if (tier === 'expert') return completedCount < 9;
    return true;
  };

  const getTierUnlockRequirement = (tier: MissionLevel): number => {
    if (tier === 'intermediate') return 3;
    if (tier === 'advanced') return 6;
    if (tier === 'expert') return 9;
    return 0;
  };

  // Simulate complete mission
  const handleSimulateComplete = (mission: Mission) => {
    if (!profile) return;

    // 1. Create completed result
    const newResult: MissionResult = {
      missionId: mission.id,
      correct: true,
      submittedVerdict: mission.correctVerdict,
      timeTakenSeconds: Math.floor(Math.random() * 60) + 30, // 30-90s
      hintsUsed: 0,
      stepsLog: mission.requiredChecks.map(check => ({
        step: check,
        action: `Simulated forensic audit of ${check}`,
        result: 'pass',
        timestamp: new Date().toISOString()
      })),
      completedAt: new Date().toISOString()
    };

    // Prevent duplicate entries for the same mission
    const updatedCompletedMissions = [...profile.completedMissions];
    const existingIndex = updatedCompletedMissions.findIndex(m => m.missionId === mission.id);
    
    let xpGranted = 0;
    if (existingIndex === -1) {
      updatedCompletedMissions.push(newResult);
      xpGranted = mission.xpReward;
    } else {
      updatedCompletedMissions[existingIndex] = newResult;
    }

    // 2. Add badge if it exists and is not already unlocked
    const updatedBadges = [...profile.badges];
    if (mission.recommendedBadge && !updatedBadges.includes(mission.recommendedBadge)) {
      updatedBadges.push(mission.recommendedBadge);
    }

    // 3. Update competencies
    const updatedCompetency = { ...profile.competency };
    mission.requiredChecks.forEach(check => {
      updatedCompetency[check] = Math.min(100, (updatedCompetency[check] || 0) + 8);
    });

    // 4. Save and broadcast
    storage.updateActiveProfile({
      completedMissions: updatedCompletedMissions,
      reputationScore: profile.reputationScore + xpGranted,
      badges: updatedBadges,
      competency: updatedCompetency
    });

    window.dispatchEvent(new Event('profile-updated'));
    setSelectedMission(null);
  };

  // Re-open/reset completion for single mission
  const handleResetSingleMission = (mission: Mission) => {
    if (!profile) return;

    const updatedCompletedMissions = profile.completedMissions.filter(m => m.missionId !== mission.id);
    const updatedBadges = profile.badges.filter(b => b !== mission.recommendedBadge);

    storage.updateActiveProfile({
      completedMissions: updatedCompletedMissions,
      badges: updatedBadges,
      // Keep reputation same or deduct to be accurate
      reputationScore: Math.max(0, profile.reputationScore - mission.xpReward)
    });

    window.dispatchEvent(new Event('profile-updated'));
    setSelectedMission(null);
  };

  // Reset ALL mission progress
  const handleResetAllProgress = () => {
    if (!window.confirm('Are you sure you want to reset your forensic training record? This will clear all completed missions and badges.')) {
      return;
    }
    
    storage.updateActiveProfile({
      completedMissions: [],
      badges: [],
      reputationScore: 0,
      competency: { hash: 10, chain: 10, signature: 10 }
    });

    window.dispatchEvent(new Event('profile-updated'));
    setActiveTier('beginner');
    setSelectedMission(null);
  };

  const getDifficultyColor = (level: MissionLevel) => {
    switch (level) {
      case 'beginner': return 'text-verified border-verified/20 bg-verified/5';
      case 'intermediate': return 'text-blue-400 border-blue-400/20 bg-blue-400/5';
      case 'advanced': return 'text-purple-400 border-purple-400/20 bg-purple-400/5';
      case 'expert': return 'text-tampered border-tampered/20 bg-tampered/5';
      default: return 'text-dim border-hairline bg-void';
    }
  };

  return (
    <div className="space-y-6" role="main" aria-label="Mission Library">
      
      {/* Header and simulation panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-primary">
            Mission Library
          </h1>
          <p className="text-xs text-dim font-mono mt-1">
            Analyze mock forensic ledger archives and sign content to practice cryptographic authentication.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-panel border border-hairline rounded-lg px-4 py-3 w-full md:w-auto font-mono text-xs">
          <div className="flex-1">
            <p className="text-[10px] text-dim uppercase">Training Progress</p>
            <p className="text-gold font-bold">{completedCount} / 12 cases closed</p>
          </div>
          <button
            onClick={handleResetAllProgress}
            className="text-[9px] border border-hairline hover:border-tampered/50 text-dim hover:text-tampered px-2 py-1.5 rounded transition-all bg-void"
          >
            Reset Progress
          </button>
        </div>
      </div>

      {/* Tier Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        {(['beginner', 'intermediate', 'advanced', 'expert'] as MissionLevel[]).map((tier) => {
          const locked = isTierLocked(tier);
          const active = activeTier === tier;
          const count = MISSIONS.filter(m => m.level === tier).length;
          const completedInTier = MISSIONS.filter(m => m.level === tier && completedMissionIds.has(m.id)).length;

          return (
            <button
              key={tier}
              onClick={() => setActiveTier(tier)}
              className={`p-3 rounded-lg border text-left transition-all focus:outline-none relative overflow-hidden flex flex-col justify-between min-h-[70px] ${
                active
                  ? 'border-gold bg-panel text-gold shadow-md'
                  : locked
                    ? 'border-hairline bg-panel/30 text-dim/60 cursor-not-allowed'
                    : 'border-hairline bg-panel hover:bg-panel-raised text-primary'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider">
                  {tier}
                </span>
                {locked && <span className="text-[10px] text-tampered font-mono">🔒 Locked</span>}
                {!locked && completedInTier === count && (
                  <span className="text-[9px] text-verified font-mono">✓ Done</span>
                )}
              </div>
              <div className="text-[10px] font-mono text-dim mt-2 flex justify-between">
                <span>{count} Cases</span>
                <span>{completedInTier} / {count} Solved</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Grid Content */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
        {isTierLocked(activeTier) ? (
          
          /* Tier Locked View */
          <div className="bg-panel border border-hairline rounded-lg p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-16 h-16 rounded-full bg-void border border-hairline flex items-center justify-center text-2xl text-tampered mb-4 animate-pulse">
              🔒
            </div>
            <h3 className="text-sm font-mono font-bold text-primary uppercase tracking-wider">
              Classified Case Files
            </h3>
            <p className="text-xs text-dim max-w-sm mt-2 leading-relaxed">
              Security clearance required. To unlock the <span className="text-gold font-bold uppercase">{activeTier}</span> tier, you must solve at least <span className="text-gold font-bold">{getTierUnlockRequirement(activeTier)}</span> cases.
            </p>
            <div className="mt-4 bg-void border border-hairline px-4 py-2 rounded-full text-[10px] font-mono text-dim">
              Current progress: <span className="text-tampered font-bold">{completedCount}</span> / {getTierUnlockRequirement(activeTier)} Completed
            </div>
          </div>
        ) : (
          
          /* Unlocked Grid View */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {MISSIONS.filter(m => m.level === activeTier).map((mission) => {
              const completed = completedMissionIds.has(mission.id);
              return (
                <div
                  key={mission.id}
                  className={`bg-panel border border-hairline rounded-lg p-5 flex flex-col justify-between hover:border-gold/30 hover:bg-panel-raised transition-all relative overflow-hidden group ${
                    completed ? 'border-verified/20' : ''
                  }`}
                >
                  {/* Subtle completed glow */}
                  {completed && (
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-verified/5 to-transparent pointer-events-none" />
                  )}

                  <div className="space-y-3">
                    {/* Badge and Level header */}
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${getDifficultyColor(mission.level)}`}>
                        {mission.level}
                      </span>
                      {completed ? (
                        <span className="text-[10px] font-mono text-verified font-bold flex items-center gap-1">
                          ✓ Completed
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono text-dim">
                          ⚡ {mission.xpReward} XP
                        </span>
                      )}
                    </div>

                    {/* Title & description */}
                    <div>
                      <h4 className="text-xs font-display font-semibold text-primary group-hover:text-gold transition-colors">
                        {mission.title}
                      </h4>
                      <p className="text-[11px] text-dim/90 mt-1.5 leading-relaxed line-clamp-3">
                        {mission.briefing}
                      </p>
                    </div>

                    {/* Meta info */}
                    <div className="pt-2 flex flex-col gap-1.5 text-[10px] font-mono border-t border-hairline/40">
                      {mission.recommendedBadge && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">🏆</span>
                          <span className="text-dim">Badge: <span className="text-gold">{mission.recommendedBadge}</span></span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">🛠️</span>
                        <span className="text-dim">
                          Tools: {mission.requiredChecks.map(c => c === 'hash' ? 'Hash Lab' : c === 'chain' ? 'Chain Explorer' : 'Signature Panel').join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedMission(mission)}
                    className={`w-full mt-4 text-[10px] font-mono font-bold uppercase py-2 px-3 rounded transition-colors ${
                      completed
                        ? 'border border-verified/30 text-verified hover:bg-verified/5 hover:border-verified/50'
                        : 'bg-gold text-void hover:bg-gold/90'
                    }`}
                  >
                    {completed ? 'Review Case Details' : 'Open Case File'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Case Briefing Modal */}
      {selectedMission && (
        <div className="fixed inset-0 bg-void/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-panel border border-hairline rounded-lg p-6 max-w-lg w-full relative animate-fade-in-up max-h-[90vh] overflow-y-auto">
            
            {/* Close Button */}
            <button
              onClick={() => setSelectedMission(null)}
              className="absolute top-4 right-4 text-dim hover:text-primary text-sm font-mono focus:outline-none"
            >
              ✕ Close
            </button>

            {/* Modal Header */}
            <div className="mb-4">
              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${getDifficultyColor(selectedMission.level)}`}>
                {selectedMission.level}
              </span>
              <h3 className="text-base font-display font-bold text-primary mt-2">
                {selectedMission.title}
              </h3>
            </div>

            {/* Briefing Narrative */}
            <div className="bg-void border border-hairline/60 rounded-lg p-4 mb-4">
              <p className="text-[10px] font-mono text-gold uppercase mb-1">Case Briefing</p>
              <p className="text-xs text-primary leading-relaxed font-body">
                {selectedMission.briefing}
              </p>
            </div>

            {/* Requirements & Rewards */}
            <div className="grid grid-cols-2 gap-4 mb-5 font-mono text-xs border-b border-hairline pb-4">
              <div>
                <p className="text-[9px] text-dim uppercase">Expected Reward</p>
                <p className="text-gold font-bold mt-0.5">⚡ {selectedMission.xpReward} XP</p>
                {selectedMission.recommendedBadge && (
                  <p className="text-gold text-[10px] mt-0.5">🏆 {selectedMission.recommendedBadge}</p>
                )}
              </div>
              <div>
                <p className="text-[9px] text-dim uppercase">Forensics Required</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedMission.requiredChecks.map(check => (
                    <span key={check} className="bg-panel-raised border border-hairline text-dim px-1.5 py-0.5 rounded text-[9px] uppercase">
                      {check === 'hash' ? 'Hash Lab' : check === 'chain' ? 'Chain Explorer' : 'Signature Panel'}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Dev Simulation Control */}
            <div className="bg-void/50 border border-hairline rounded-lg p-4 text-center font-mono">
              <p className="text-[10px] text-dim font-bold uppercase mb-2">Simulate Forensic Analysis</p>
              <p className="text-[10px] text-dim/80 mb-3 leading-relaxed">
                As direct mission investigation is undergoing development, you can simulate performing the cryptographic audit to record the findings.
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => handleSimulateComplete(selectedMission)}
                  className="flex-1 bg-gold hover:bg-gold/90 text-void font-bold py-2 px-4 rounded text-xs uppercase tracking-wider transition-colors"
                >
                  {completedMissionIds.has(selectedMission.id) ? 'Re-verify & Save' : 'Complete Verification'}
                </button>
                
                {completedMissionIds.has(selectedMission.id) && (
                  <button
                    onClick={() => handleResetSingleMission(selectedMission)}
                    className="flex-1 border border-hairline hover:border-tampered/40 text-tampered py-2 px-4 rounded text-xs uppercase transition-colors"
                  >
                    Reset Case Status
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
