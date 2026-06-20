import { Avatar } from '../common/Avatar';
import type { InvestigatorProfile } from '../../types';

interface ProfileStripProps {
  profile: InvestigatorProfile;
}

export function ProfileStrip({ profile }: ProfileStripProps) {
  const level = Math.floor(profile.reputationScore / 100) + 1;
  const repProgress = (profile.reputationScore % 100);

  const getLevelTitle = (lvl: number) => {
    if (lvl >= 8) return 'Elite Forensics Agent';
    if (lvl >= 6) return 'Senior Investigator';
    if (lvl >= 4) return 'Field Analyst';
    if (lvl >= 2) return 'Junior Investigator';
    return 'Recruit';
  };

  return (
    <div
      className="bg-panel border border-hairline rounded-lg p-4 flex flex-col sm:flex-row items-center gap-4 animate-fade-in-up relative overflow-hidden"
      role="region"
      aria-label="Investigator profile summary"
    >
      {/* Scan line effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="w-full h-8 bg-gradient-to-b from-verified/5 via-verified/3 to-transparent animate-scan-line" />
      </div>

      {/* Avatar + identity */}
      <div className="flex items-center gap-3 z-10">
        <div className="relative">
          <Avatar seed={profile.avatarSeed} size={56} className="ring-2 ring-gold/30" />
          <span className="absolute -bottom-1 -right-1 bg-gold text-void text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full leading-none">
            {level}
          </span>
        </div>
        <div>
          <h2 className="text-sm font-display font-bold text-primary">{profile.name}</h2>
          <p className="text-[10px] font-mono text-gold uppercase tracking-wider">{getLevelTitle(level)}</p>
          {/* Rep bar */}
          <div className="mt-1.5 flex items-center gap-2">
            <div className="w-24 h-1.5 bg-void rounded-full overflow-hidden" role="progressbar" aria-valuenow={repProgress} aria-valuemin={0} aria-valuemax={100} aria-label={`Reputation progress: ${repProgress}%`}>
              <div
                className="h-full bg-gradient-to-r from-gold/70 to-gold rounded-full transition-all duration-500"
                style={{ width: `${repProgress}%` }}
              />
            </div>
            <span className="text-[9px] font-mono text-dim">{profile.reputationScore} REP</span>
          </div>
        </div>
      </div>

      {/* Competency gauges */}
      <div className="flex gap-4 sm:ml-auto z-10">
        {(Object.entries(profile.competency) as [string, number][]).map(([key, value]) => (
          <div key={key} className="flex flex-col items-center gap-1">
            <div className="relative w-10 h-10">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
                <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" className="text-void" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15" fill="none"
                  className="text-verified"
                  strokeWidth="3"
                  strokeDasharray={`${(value / 100) * 94.2} 94.2`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold text-primary">
                {value}
              </span>
            </div>
            <span className="text-[8px] font-mono text-dim uppercase tracking-wider">{key}</span>
          </div>
        ))}
      </div>

      {/* Badges */}
      {profile.badges.length > 0 && (
        <div className="flex gap-1.5 z-10" role="list" aria-label="Earned badges">
          {profile.badges.slice(0, 5).map((badge) => (
            <span
              key={badge}
              role="listitem"
              className="w-7 h-7 rounded bg-gold/10 border border-gold/30 flex items-center justify-center text-[10px]"
              title={badge}
            >
              🏆
            </span>
          ))}
          {profile.badges.length > 5 && (
            <span className="text-[10px] font-mono text-dim self-center">+{profile.badges.length - 5}</span>
          )}
        </div>
      )}
    </div>
  );
}
