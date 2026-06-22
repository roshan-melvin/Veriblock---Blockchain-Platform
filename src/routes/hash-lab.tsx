import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { sha256Hex } from '../engines/crypto';
import { MISSIONS } from '../data/missions';

// Compare two hex strings and return indices of differing characters
function diffIndices(a: string, b: string): Set<number> {
  const diffs = new Set<number>();
  const maxLen = Math.max(a.length, b.length);
  for (let i = 0; i < maxLen; i++) {
    if (a[i] !== b[i]) diffs.add(i);
  }
  return diffs;
}

// Count bit differences between two hex strings
function bitDifference(a: string, b: string): number {
  let diffBits = 0;
  const maxLen = Math.max(a.length, b.length);
  for (let i = 0; i < maxLen; i++) {
    const va = parseInt(a[i] || '0', 16);
    const vb = parseInt(b[i] || '0', 16);
    let xor = va ^ vb;
    while (xor) {
      diffBits += xor & 1;
      xor >>= 1;
    }
  }
  return diffBits;
}

export default function HashLab() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const missionId = searchParams.get('missionId');
  const activeMission = missionId ? MISSIONS.find(m => m.id === missionId) : null;

  const [input, setInput] = useState(() => activeMission?.signedAssetContent || 'hello');
  const [hash, setHash] = useState('');
  const [prevHash, setPrevHash] = useState('');
  const [changedIndices, setChangedIndices] = useState<Set<number>>(new Set());
  const [animationKey, setAnimationKey] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [bitDiff, setBitDiff] = useState(0);
  const [showEducation, setShowEducation] = useState(true);
  const prevInputRef = useRef(input);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Live hash computation with debounce
  const computeHash = useCallback(async (text: string) => {
    const newHash = await sha256Hex(text);

    if (hash && newHash !== hash) {
      setPrevHash(hash);
      const diffs = diffIndices(hash, newHash);
      setChangedIndices(diffs);
      const bDiff = bitDifference(hash, newHash);
      setBitDiff(bDiff);

      // Trigger shatter animation
      setIsShaking(true);
      setAnimationKey((k) => k + 1);
      setTimeout(() => setIsShaking(false), 600);
    }

    setHash(newHash);
  }, [hash]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      computeHash(input);
      prevInputRef.current = input;
    }, 80);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [input, computeHash]);

  // Total bits in a SHA-256 hash: 256
  const sensitivityPct = prevHash ? ((bitDiff / 256) * 100).toFixed(1) : null;
  const charDiffCount = changedIndices.size;
  const charDiffPct = prevHash ? ((charDiffCount / 64) * 100).toFixed(1) : null;

  const handleLogStep = () => {
    if (!missionId) return;
    try {
      const existingStepsStr = localStorage.getItem('veriblock:v1:activeMissionSteps') || '[]';
      const existingSteps = JSON.parse(existingStepsStr);
      
      const updatedSteps = existingSteps.filter((s: any) => s.step !== 'hash');
      updatedSteps.push({
        step: 'hash',
        action: `Computed and analyzed SHA-256 hash: ${hash.slice(0, 16)}...`,
        result: 'pass',
        timestamp: new Date().toISOString()
      });
      
      localStorage.setItem('veriblock:v1:activeMissionSteps', JSON.stringify(updatedSteps));
      navigate(`/missions/${missionId}`);
    } catch (e) {
      console.error('Failed to log step', e);
    }
  };

  return (
    <div className="space-y-6" role="main" aria-label="Hash Computation Lab">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-primary">
          Hash Computation Lab
        </h1>
        <p className="text-xs text-dim font-mono mt-1">
          Real SHA-256 hashing via Web Crypto API · Every character change shatters the output
        </p>
      </div>

      {/* Active Mission Banner */}
      {activeMission && (
        <div className="bg-gold/10 border border-gold/30 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in-up">
          <div>
            <p className="text-xs font-mono font-bold text-gold uppercase tracking-wider">
              Investigation Mode Active · Case #{activeMission.id.slice(0, 8)}
            </p>
            <p className="text-[11px] text-dim leading-snug mt-1">
              Verify the integrity of the whistleblower document. Once calculated, log this check into your case file.
            </p>
          </div>
          <button
            onClick={handleLogStep}
            className="bg-gold text-void hover:bg-gold/90 font-mono font-bold py-1.5 px-3 rounded text-[10px] uppercase tracking-wider transition-colors shrink-0"
          >
            ✓ Log Hash Check to Case File
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Lab Panel */}
        <div className="lg:col-span-2 space-y-5">
          {/* Input Section */}
          <div className="bg-panel border border-hairline rounded-lg p-5 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <label htmlFor="hash-input" className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-mono font-bold text-gold uppercase tracking-wider">Input Text</span>
              <span className="text-[9px] font-mono text-dim">{input.length} chars · {new TextEncoder().encode(input).length} bytes</span>
            </label>
            <textarea
              id="hash-input"
              className="w-full bg-void border border-hairline rounded px-4 py-3 text-primary font-mono text-sm resize-y min-h-[80px] focus:outline-none focus:ring-1 focus:ring-gold transition-all"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type anything here..."
              aria-describedby="hash-input-desc"
              rows={3}
            />
            <p id="hash-input-desc" className="text-[10px] text-dim font-mono mt-2">
              Try changing a single character and observe how the entire hash output changes.
            </p>
          </div>

          {/* Hash Output Section */}
          <div
            className={`bg-panel border rounded-lg p-5 transition-all duration-300 animate-fade-in-up ${
              isShaking ? 'border-gold animate-shatter' : 'border-hairline'
            }`}
            style={{ animationDelay: '0.15s' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono font-bold text-gold uppercase tracking-wider">SHA-256 Output</span>
              <span className="text-[9px] font-mono text-dim">64 hex characters · 256 bits</span>
            </div>

            {/* Animated hash display */}
            <div
              key={animationKey}
              className="bg-void rounded p-4 border border-hairline font-mono text-sm leading-relaxed break-all"
              role="status"
              aria-live="polite"
              aria-label={`SHA-256 hash: ${hash}`}
            >
              {hash ? (
                hash.split('').map((char, i) => {
                  const isChanged = changedIndices.has(i);
                  return (
                    <span
                      key={`${animationKey}-${i}`}
                      className={`inline-block transition-all duration-300 ${
                        isChanged
                          ? 'text-gold animate-hash-char'
                          : 'text-verified'
                      }`}
                      style={isChanged ? { animationDelay: `${i * 8}ms` } : undefined}
                    >
                      {char}
                    </span>
                  );
                })
              ) : (
                <span className="text-dim animate-pulse">Computing...</span>
              )}
            </div>

            {/* Previous hash comparison */}
            {prevHash && (
              <div className="mt-3 pt-3 border-t border-hairline/50">
                <span className="text-[9px] font-mono text-dim uppercase tracking-wider">Previous Hash</span>
                <div className="bg-void/50 rounded p-2 mt-1 font-mono text-[11px] text-dim break-all">
                  {prevHash.split('').map((char, i) => (
                    <span
                      key={i}
                      className={changedIndices.has(i) ? 'text-tampered/60 line-through' : 'text-dim/40'}
                    >
                      {char}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Avalanche Metrics */}
          {sensitivityPct && (
            <div
              className="bg-panel border border-hairline rounded-lg p-5 animate-fade-in-up"
              style={{ animationDelay: '0.2s' }}
              role="region"
              aria-label="Avalanche effect metrics"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-mono font-bold text-gold uppercase tracking-wider">Avalanche Metrics</span>
                <div className="flex-1 h-px bg-hairline" aria-hidden="true" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Bit sensitivity */}
                <div>
                  <p className="text-[9px] font-mono text-dim uppercase mb-1">Bit Sensitivity</p>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-display font-bold text-gold">{sensitivityPct}%</span>
                    <span className="text-[10px] font-mono text-dim mb-1">{bitDiff}/256 bits</span>
                  </div>
                  <div className="mt-2 w-full h-2 bg-void rounded-full overflow-hidden" role="progressbar" aria-valuenow={Number(sensitivityPct)} aria-valuemin={0} aria-valuemax={100}>
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-verified via-gold to-tampered"
                      style={{ width: `${sensitivityPct}%` }}
                    />
                  </div>
                  <p className="text-[9px] font-mono text-dim mt-1">
                    Ideal avalanche: ~50% (128 bits)
                  </p>
                </div>

                {/* Char sensitivity */}
                <div>
                  <p className="text-[9px] font-mono text-dim uppercase mb-1">Hex Character Change</p>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-display font-bold text-unverified">{charDiffPct}%</span>
                    <span className="text-[10px] font-mono text-dim mb-1">{charDiffCount}/64 chars</span>
                  </div>
                  <div className="mt-2 w-full h-2 bg-void rounded-full overflow-hidden" role="progressbar" aria-valuenow={Number(charDiffPct)} aria-valuemin={0} aria-valuemax={100}>
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-verified to-unverified"
                      style={{ width: `${charDiffPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Shatter visualization */}
              <div className="mt-4 pt-3 border-t border-hairline/50">
                <p className="text-[9px] font-mono text-dim uppercase mb-2">Bit Shatter Map</p>
                <div className="flex flex-wrap gap-px" aria-hidden="true">
                  {hash.split('').map((_, i) => {
                    const isChanged = changedIndices.has(i);
                    return (
                      <div
                        key={i}
                        className={`w-2.5 h-2.5 rounded-sm transition-all duration-300 ${
                          isChanged ? 'bg-gold' : 'bg-void'
                        }`}
                        title={`Position ${i}: ${isChanged ? 'Changed' : 'Unchanged'}`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Verification check */}
          {input === 'hello' && hash === '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824' && (
            <div className="flex items-center gap-2 p-3 bg-verified/10 border border-verified/30 text-verified text-xs rounded font-mono animate-fade-in-up">
              <span className="text-base">✓</span>
              <span>Verified: SHA-256 of &apos;hello&apos; matches known standard output exactly.</span>
            </div>
          )}
        </div>

        {/* Educational Side Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            <button
              onClick={() => setShowEducation(!showEducation)}
              className="w-full flex items-center justify-between bg-panel border border-hairline rounded-lg px-4 py-3 text-left hover:bg-panel-raised transition-colors focus:outline-none focus:ring-1 focus:ring-gold"
              aria-expanded={showEducation}
              aria-controls="education-panel"
            >
              <span className="text-[10px] font-mono font-bold text-gold uppercase tracking-wider">📚 Learn: Hashing</span>
              <span className="text-dim text-sm">{showEducation ? '−' : '+'}</span>
            </button>

            {showEducation && (
              <div id="education-panel" className="space-y-4 animate-fade-in-up">
                {/* What is a Hash? */}
                <div className="bg-panel border border-hairline rounded-lg p-4">
                  <h3 className="text-xs font-display font-semibold text-primary mb-2">What is a Cryptographic Hash?</h3>
                  <p className="text-[11px] text-dim leading-relaxed">
                    A hash function takes any input and produces a fixed-size, unique &ldquo;fingerprint&rdquo;. SHA-256 always outputs 256 bits (64 hex characters), regardless of input size.
                  </p>
                </div>

                {/* Properties */}
                <div className="bg-panel border border-hairline rounded-lg p-4">
                  <h3 className="text-xs font-display font-semibold text-primary mb-2">Key Properties</h3>
                  <ul className="space-y-2">
                    {[
                      { title: 'Deterministic', desc: 'Same input always produces the same hash.' },
                      { title: 'Fixed Length', desc: 'Output is always 256 bits, whether input is 1 byte or 1GB.' },
                      { title: 'Avalanche Effect', desc: 'Changing 1 bit of input changes ~50% of output bits.' },
                      { title: 'One-Way', desc: 'You cannot reverse a hash back to the original input.' },
                      { title: 'Collision Resistant', desc: 'Virtually impossible to find two inputs with the same hash.' },
                    ].map((prop) => (
                      <li key={prop.title} className="flex gap-2">
                        <span className="text-verified text-[10px] mt-0.5 shrink-0">▸</span>
                        <div>
                          <span className="text-[11px] font-mono font-semibold text-primary">{prop.title}</span>
                          <p className="text-[10px] text-dim leading-relaxed">{prop.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Avalanche Effect */}
                <div className="bg-panel border border-hairline rounded-lg p-4">
                  <h3 className="text-xs font-display font-semibold text-primary mb-2">The Avalanche Effect</h3>
                  <p className="text-[11px] text-dim leading-relaxed mb-2">
                    A well-designed hash function exhibits the <span className="text-gold font-semibold">avalanche effect</span>: flipping a single input bit changes roughly 50% of the output bits.
                  </p>
                  <p className="text-[11px] text-dim leading-relaxed">
                    Try changing just one letter above and watch the shatter map light up — that&apos;s the avalanche in action!
                  </p>
                </div>

                {/* Real-world use */}
                <div className="bg-panel border border-hairline rounded-lg p-4">
                  <h3 className="text-xs font-display font-semibold text-primary mb-2">Real-World Applications</h3>
                  <ul className="space-y-1.5">
                    {[
                      'Password storage (hashed, never stored raw)',
                      'File integrity verification (checksums)',
                      'Blockchain block linking',
                      'Digital signatures',
                      'Data deduplication',
                    ].map((use, i) => (
                      <li key={i} className="text-[11px] text-dim flex items-start gap-2">
                        <span className="text-gold text-[9px] mt-0.5">●</span>
                        <span>{use}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
