import type { InvestigatorProfile } from '../../types';

interface ActiveMissionCardProps {
  profile: InvestigatorProfile;
}

export function ActiveMissionCard({ profile }: ActiveMissionCardProps) {
  const completedCount = profile.completedMissions.length;
  const lastMission = profile.completedMissions[completedCount - 1];

  return (
    <div
      className="bg-panel border border-hairline rounded-lg p-5 relative overflow-hidden group hover:border-gold/40 transition-all duration-300"
      style={{ animationDelay: '0.1s' }}
      role="region"
      aria-label="Active mission status"
    >
      {/* Background pulse */}
      <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-verified/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-unverified animate-status-blink" aria-hidden="true" />
            <h3 className="text-xs font-mono font-bold text-gold uppercase tracking-wider">Mission Status</h3>
          </div>
          <span className="text-[10px] font-mono text-dim px-2 py-0.5 rounded bg-panel-raised border border-hairline">
            {completedCount} COMPLETED
          </span>
        </div>

        {lastMission ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded flex items-center justify-center text-sm ${
                lastMission.correct
                  ? 'bg-verified/10 border border-verified/30 text-verified'
                  : 'bg-tampered/10 border border-tampered/30 text-tampered'
              }`}>
                {lastMission.correct ? '✓' : '✗'}
              </div>
              <div>
                <p className="text-xs font-mono text-primary">Case #{lastMission.missionId.slice(0, 8)}</p>
                <p className="text-[10px] text-dim font-mono">
                  Verdict: <span className={lastMission.correct ? 'text-verified' : 'text-tampered'}>
                    {lastMission.submittedVerdict.toUpperCase()}
                  </span>
                  {' · '}{lastMission.timeTakenSeconds}s · {lastMission.hintsUsed} hints
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              {lastMission.stepsLog.slice(0, 4).map((step, i) => (
                <span
                  key={i}
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                    step.result === 'pass'
                      ? 'bg-verified/10 border-verified/20 text-verified'
                      : 'bg-tampered/10 border-tampered/20 text-tampered'
                  }`}
                >
                  {step.step}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="text-2xl mb-2">🔍</div>
            <p className="text-xs text-dim font-mono">No missions completed yet</p>
            <p className="text-[10px] text-dim/70 font-mono mt-1">Use the tools below to practice, then take on cases</p>
          </div>
        )}
      </div>
    </div>
  );
}
