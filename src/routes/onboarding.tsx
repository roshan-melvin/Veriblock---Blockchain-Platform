import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { storage } from '../engines/storage';
import { Avatar } from '../components/common/Avatar';
import type { InvestigatorProfile } from '../types';

const AVATAR_SEEDS = ['cipher', 'matrix', 'nexus', 'orbit', 'prism', 'quantum'];

export default function Onboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isSwitching = searchParams.get('switch') === 'true';
  const isCreatingNew = searchParams.get('new') === 'true';

  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_SEEDS[0]);
  const [existingProfiles, setExistingProfiles] = useState<InvestigatorProfile[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    const profiles = storage.getProfiles();
    setExistingProfiles(profiles);

    const activeId = storage.getActiveProfileId();

    // If an active profile exists and we're not explicitly switching or creating new,
    // redirect straight to dashboard
    if (activeId && !isSwitching && !isCreatingNew) {
      navigate('/dashboard', { replace: true });
    } else if (profiles.length === 0 || isCreatingNew) {
      setShowCreateForm(true);
    }
  }, [isSwitching, isCreatingNew, navigate]);

  const handleSelectProfile = (profileId: string) => {
    storage.setActiveProfileId(profileId);
    navigate('/dashboard');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) return;

    const newProfile: InvestigatorProfile = {
      id: window.crypto?.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
      name: trimmedName,
      avatarSeed: selectedAvatar,
      reputationScore: 0,
      badges: [],
      completedMissions: [],
      competency: {
        hash: 0,
        chain: 0,
        signature: 0,
      },
      createdAt: new Date().toISOString(),
    };

    const updatedProfiles = [...existingProfiles, newProfile];
    storage.saveProfiles(updatedProfiles);
    storage.setActiveProfileId(newProfile.id);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-void text-primary font-body flex items-center justify-center p-6 selection:bg-panel-raised">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Left Side: Pitch / Context */}
        <div className="md:col-span-5 flex flex-col justify-center space-y-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-display font-bold text-gold tracking-wide">VeriBlock</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-panel-raised border border-hairline font-mono text-dim uppercase">HQ</span>
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl font-display font-bold leading-tight text-primary">
              Become a <span className="text-gold">Digital Investigator</span>
            </h1>
            <p className="text-dim text-sm leading-relaxed">
              Misinformation and deepfakes are spreading. Learn how to verify facts, analyze digital evidence, and restore trust using real cryptography.
            </p>
          </div>
          <div className="border-l-2 border-gold pl-4 py-1">
            <p className="text-xs font-mono text-dim uppercase tracking-wider">Mission Rules</p>
            <p className="text-xs text-primary mt-1 font-mono">Provenance over pixel-analysis. Trust the math, not the looks.</p>
          </div>
        </div>

        {/* Right Side: Flow */}
        <div className="md:col-span-7 bg-panel border border-hairline rounded-lg p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle decoration */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full blur-2xl pointer-events-none"></div>

          {!showCreateForm && existingProfiles.length > 0 ? (
            <div>
              <h2 className="text-2xl font-display font-semibold text-primary mb-2">Select Profile</h2>
              <p className="text-dim text-xs mb-6">Choose an investigator profile to resume duty or create a new one.</p>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {existingProfiles.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => handleSelectProfile(profile.id)}
                    className="w-full flex items-center justify-between p-3 rounded bg-void border border-hairline hover:border-gold hover:bg-panel-raised transition-all text-left group focus:outline-none focus:ring-1 focus:ring-gold"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar seed={profile.avatarSeed} size={40} />
                      <div>
                        <div className="font-semibold text-sm text-primary group-hover:text-gold transition-colors">{profile.name}</div>
                        <div className="text-xs text-dim font-mono">REP: {profile.reputationScore} | LVL {Math.floor(profile.reputationScore / 100) + 1}</div>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-dim group-hover:text-gold">LAUNCH →</span>
                  </button>
                ))}
              </div>

              <div className="border-t border-hairline mt-6 pt-4 flex justify-between items-center">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-4 py-2 bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 rounded text-xs font-mono transition-colors focus:outline-none focus:ring-1 focus:ring-gold"
                >
                  + CREATE NEW INVESTIGATOR
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <h2 className="text-2xl font-display font-semibold text-primary mb-1">Create Investigator</h2>
                <p className="text-dim text-xs">Enter your codename and choose a cryptographic avatar signature.</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="codename-input" className="block text-xs font-mono text-gold uppercase tracking-wider">
                  Investigator Codename
                </label>
                <input
                  id="codename-input"
                  type="text"
                  required
                  placeholder="e.g. Neo, Alice, Cipher"
                  className="w-full bg-void border border-hairline rounded px-4 py-3 text-primary text-sm focus:outline-none focus:ring-1 focus:ring-gold font-mono"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <span className="block text-xs font-mono text-gold uppercase tracking-wider">Select Cryptographic Avatar</span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {AVATAR_SEEDS.map((seed) => (
                    <button
                      key={seed}
                      type="button"
                      onClick={() => setSelectedAvatar(seed)}
                      className={`relative p-1.5 rounded bg-void border transition-all focus:outline-none flex items-center justify-center ${
                        selectedAvatar === seed
                          ? 'border-gold bg-panel-raised scale-105'
                          : 'border-hairline hover:border-dim'
                      }`}
                    >
                      <Avatar seed={seed} size={48} className="border-none" />
                      <span className="absolute bottom-1 text-[8px] font-mono text-dim tracking-tighter uppercase px-1 rounded bg-void/80 pointer-events-none">
                        {seed}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-hairline pt-4 flex flex-col sm:flex-row gap-3 justify-end items-center">
                {existingProfiles.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setName('');
                    }}
                    className="w-full sm:w-auto px-4 py-2 border border-hairline text-dim hover:text-primary rounded text-xs font-mono transition-colors focus:outline-none focus:ring-1 focus:ring-gold"
                  >
                    ← CANCEL
                  </button>
                )}
                <button
                  type="submit"
                  disabled={name.trim().length < 2}
                  className="w-full sm:w-auto px-5 py-2.5 bg-gold text-void font-mono font-bold rounded text-xs transition-colors hover:bg-gold/90 disabled:opacity-40 disabled:pointer-events-none focus:outline-none focus:ring-1 focus:ring-gold"
                >
                  INITIALIZE PROFILE →
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
