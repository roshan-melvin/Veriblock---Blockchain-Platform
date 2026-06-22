import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { storage } from '../engines/storage';
import {
  generatePublisherKeyPair,
  exportKeyToJwk,
  importPublicKeyFromJwk,
  importPrivateKeyFromJwk,
  signContent,
  verifySignature,
  sha256Hex
} from '../engines/crypto';
import type { Publisher } from '../types';
import { MISSIONS } from '../data/missions';

const TRUSTED_PUBLISHERS_INFO = [
  { id: 'pub-gnn', name: 'Global News Network', icon: '🗞️', desc: 'International broadcasting & news wire' },
  { id: 'pub-sci', name: 'Science Institute', icon: '🔬', desc: 'Peer-reviewed research and datasets' },
  { id: 'pub-edu', name: 'Educational Consortium', icon: '🎓', desc: 'Academic records and public textbooks' },
  { id: 'pub-cma', name: 'Civic Media Alliance', icon: '🏛️', desc: 'Independent citizen journalism reports' }
];

export default function SignaturePanel() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const missionId = searchParams.get('missionId');
  const activeMission = missionId ? MISSIONS.find(m => m.id === missionId) : null;

  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'verify' | 'sign'>('verify');
  const [expandedPublisher, setExpandedPublisher] = useState<string | null>(null);

  // Signing Playground State
  const [signPublisherId, setSignPublisherId] = useState('');
  const [signContentText, setSignContentText] = useState('OFFICIAL BRIEF: An inspection of the nuclear reactor core shows zero containment leaks. Signed under protocol Delta-4.');
  const [signResult, setSignResult] = useState<{
    hash: string;
    signature: string;
  } | null>(null);
  const [isSigning, setIsSigning] = useState(false);

  // Verification Desk State
  const [verifyPublisherId, setVerifyPublisherId] = useState('');
  const [verifyCustomJwkText, setVerifyCustomJwkText] = useState('');
  const [verifyContentText, setVerifyContentText] = useState('');
  const [verifySignatureBase64, setVerifySignatureBase64] = useState('');
  
  const [verificationState, setVerificationState] = useState<'idle' | 'verifying' | 'success' | 'failure'>('idle');
  const [verificationResult, setVerificationResult] = useState<{
    computedHash: string;
    resolvedKeyJwk: JsonWebKey | null;
    errorMessage?: string;
  } | null>(null);

  // Setup active mission parameters automatically
  useEffect(() => {
    async function setupActiveMissionVerification() {
      if (!activeMission || publishers.length === 0) return;

      const content = activeMission.signedAssetContent || '';
      const claimedPubId = activeMission.signedAssetPublisherId || '';
      const isTampered = activeMission.signedAssetTampered;

      // Find the publisher in our loaded keys
      let publisher = publishers.find(p => p.id === claimedPubId);

      // Default to first publisher if not found, or use custom
      if (!publisher && claimedPubId) {
        try {
          const tempPair = await generatePublisherKeyPair();
          const tempPrivate = tempPair.privateKey;
          const sig = await signContent(tempPrivate, content);
          
          setVerifyPublisherId('custom');
          setVerifyContentText(content);
          
          // Export public key to show in custom JWK field
          const tempPubJwk = await exportKeyToJwk(tempPair.publicKey);
          setVerifyCustomJwkText(JSON.stringify(tempPubJwk, null, 2));
          setVerifySignatureBase64(sig);
          return;
        } catch (e) {
          console.error(e);
        }
      }

      if (publisher && publisher.privateKeyJwk) {
        try {
          const privateKey = await importPrivateKeyFromJwk(publisher.privateKeyJwk);
          
          if (isTampered) {
            // For a tampered asset, sign the content, but modify it in the verification box
            const signature = await signContent(privateKey, content);
            setVerifyContentText(content + " "); // Add trailing space to break signature verification
            setVerifyPublisherId(claimedPubId);
            setVerifySignatureBase64(signature);
          } else {
            const signature = await signContent(privateKey, content);
            setVerifyContentText(content);
            setVerifyPublisherId(claimedPubId);
            setVerifySignatureBase64(signature);
          }
        } catch (err) {
          console.error('Error signing active mission asset:', err);
        }
      }
    }

    if (!loading && publishers.length > 0) {
      setupActiveMissionVerification();
    }
  }, [activeMission, publishers, loading]);

  const handleLogStep = () => {
    if (!missionId) return;
    try {
      const existingStepsStr = localStorage.getItem('veriblock:v1:activeMissionSteps') || '[]';
      const existingSteps = JSON.parse(existingStepsStr);
      
      const updatedSteps = existingSteps.filter((s: any) => s.step !== 'signature');
      
      const stateText = verificationState === 'success' ? 'VALID' : 'INVALID/UNTRUSTED';
      
      updatedSteps.push({
        step: 'signature',
        action: `Verified digital signature of claimed publisher ${verifyPublisherId === 'custom' ? 'Custom/Untrusted' : verifyPublisherId}. Signature was found to be ${stateText}.`,
        result: 'pass',
        timestamp: new Date().toISOString()
      });
      
      localStorage.setItem('veriblock:v1:activeMissionSteps', JSON.stringify(updatedSteps));
      navigate(`/missions/${missionId}`);
    } catch (e) {
      console.error('Failed to log step', e);
    }
  };

  // Load or generate publisher keys
  useEffect(() => {
    async function initPublishers() {
      try {
        const existing = storage.getPublisherKeys();
        if (existing && existing.length > 0) {
          setPublishers(existing);
          if (existing.length > 0) {
            setSignPublisherId(existing[0].id);
            setVerifyPublisherId(existing[0].id);
          }
          setLoading(false);
          return;
        }

        await handleResetKeys();
      } catch (err) {
        console.error('Failed to initialize publishers', err);
      }
    }
    initPublishers();
  }, []);

  const handleResetKeys = async () => {
    setLoading(true);
    try {
      const generated: Publisher[] = [];
      for (const info of TRUSTED_PUBLISHERS_INFO) {
        const pair = await generatePublisherKeyPair();
        const pubJwk = await exportKeyToJwk(pair.publicKey);
        const privJwk = await exportKeyToJwk(pair.privateKey);
        generated.push({
          id: info.id,
          name: info.name,
          publicKeyJwk: pubJwk,
          privateKeyJwk: privJwk,
          trusted: true
        });
      }
      storage.savePublisherKeys(generated);
      setPublishers(generated);
      if (generated.length > 0) {
        setSignPublisherId(generated[0].id);
        setVerifyPublisherId(generated[0].id);
      }
    } catch (err) {
      console.error('Error generating publisher keys', err);
    } finally {
      setLoading(false);
    }
  };

  // Sign Content
  const handleGenerateSignature = async () => {
    if (!signPublisherId) return;
    setIsSigning(true);
    try {
      const publisher = publishers.find(p => p.id === signPublisherId);
      if (!publisher || !publisher.privateKeyJwk) {
        throw new Error('Private key not found for selected publisher.');
      }

      const privateKey = await importPrivateKeyFromJwk(publisher.privateKeyJwk);
      const signature = await signContent(privateKey, signContentText);
      const hash = await sha256Hex(signContentText);

      setSignResult({ hash, signature });
    } catch (err: any) {
      console.error('Signing failed', err);
      alert(`Signing failed: ${err.message}`);
    } finally {
      setIsSigning(false);
    }
  };

  // Transmit to Verifier
  const handleTransmitToVerifier = () => {
    if (!signResult) return;
    setVerifyPublisherId(signPublisherId);
    setVerifyContentText(signContentText);
    setVerifySignatureBase64(signResult.signature);
    setVerificationState('idle');
    setVerificationResult(null);
    setActiveTab('verify');
  };

  // Verify Signature
  const handleVerifySignature = async () => {
    setVerificationState('verifying');
    setVerificationResult(null);
    
    // Artificial small delay to make the lock check animation feel premium
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      let resolvedKey: CryptoKey;
      let jwkToRecord: JsonWebKey;

      if (verifyPublisherId === 'custom') {
        if (!verifyCustomJwkText.trim()) {
          throw new Error('Please enter a public key in JWK format.');
        }
        let parsedJwk: JsonWebKey;
        try {
          parsedJwk = JSON.parse(verifyCustomJwkText.trim());
        } catch {
          throw new Error('Public Key is not valid JSON. Ensure it is paste exactly as exported.');
        }
        resolvedKey = await importPublicKeyFromJwk(parsedJwk);
        jwkToRecord = parsedJwk;
      } else {
        const publisher = publishers.find(p => p.id === verifyPublisherId);
        if (!publisher) {
          throw new Error('Selected publisher keys not found.');
        }
        resolvedKey = await importPublicKeyFromJwk(publisher.publicKeyJwk);
        jwkToRecord = publisher.publicKeyJwk;
      }

      if (!verifyContentText) {
        throw new Error('Verification content is empty.');
      }
      if (!verifySignatureBase64.trim()) {
        throw new Error('Signature is empty.');
      }

      const computedHash = await sha256Hex(verifyContentText);

      let isValid = false;
      try {
        isValid = await verifySignature(resolvedKey, verifyContentText, verifySignatureBase64.trim());
      } catch (cryptoErr) {
        throw new Error('Web Crypto API rejected signature format. Check if the signature string is valid Base64.');
      }

      setVerificationResult({
        computedHash,
        resolvedKeyJwk: jwkToRecord
      });
      setVerificationState(isValid ? 'success' : 'failure');

    } catch (err: any) {
      setVerificationResult({
        computedHash: '',
        resolvedKeyJwk: null,
        errorMessage: err.message || 'An unknown error occurred during verification.'
      });
      setVerificationState('failure');
    }
  };

  return (
    <div className="space-y-6" role="main" aria-label="Signature Verification Panel">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-primary">
          Signature Verification Panel
        </h1>
        <p className="text-xs text-dim font-mono mt-1">
          Cryptographically sign articles and verify publisher provenance using ECDSA (P-256) keypairs.
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
              Verify the publisher&apos;s digital signature against the trusted registry to authenticate the sender and content integrity. Log this check when finished.
            </p>
          </div>
          <button
            onClick={handleLogStep}
            disabled={verificationState === 'idle' || verificationState === 'verifying'}
            className="bg-gold text-void hover:bg-gold/90 disabled:opacity-50 disabled:cursor-not-allowed font-mono font-bold py-1.5 px-3 rounded text-[10px] uppercase tracking-wider transition-colors shrink-0"
          >
            ✓ Log Signature Check to Case File
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-panel border border-hairline rounded-lg">
          <span className="text-sm font-mono text-dim animate-pulse">Initializing Web Crypto Keypairs...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Column 1: Trusted Publisher Directory */}
          <div className="lg:col-span-1 space-y-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="bg-panel border border-hairline rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-mono font-bold text-gold uppercase tracking-wider">Trusted Publisher Registry</h3>
                <button
                  onClick={handleResetKeys}
                  className="text-[9px] font-mono text-dim hover:text-gold border border-hairline hover:border-gold/40 px-2 py-0.5 rounded transition-all bg-void"
                  title="Generate new ECDSA keys for all default publishers"
                >
                  Reset Keys
                </button>
              </div>

              <div className="space-y-3">
                {publishers.map((pub) => {
                  const info = TRUSTED_PUBLISHERS_INFO.find(i => i.id === pub.id);
                  const isExpanded = expandedPublisher === pub.id;
                  return (
                    <div
                      key={pub.id}
                      className="bg-void/50 border border-hairline rounded-lg p-3 hover:border-hairline/80 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base" role="img" aria-label={pub.name}>
                            {info?.icon || '🏢'}
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-primary">{pub.name}</p>
                            <p className="text-[9px] text-dim font-mono">{pub.id}</p>
                          </div>
                        </div>
                        <span className="text-[8px] font-mono text-verified bg-verified/10 border border-verified/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                          Trusted
                        </span>
                      </div>
                      
                      <p className="text-[10px] text-dim/80 mt-2 font-body leading-snug">
                        {info?.desc}
                      </p>

                      <div className="mt-2 pt-2 border-t border-hairline/50">
                        <button
                          onClick={() => setExpandedPublisher(isExpanded ? null : pub.id)}
                          className="w-full text-left text-[9px] font-mono text-dim hover:text-primary flex justify-between items-center"
                        >
                          <span>{isExpanded ? 'Hide' : 'Show'} Cryptographic Public Key</span>
                          <span>{isExpanded ? '▲' : '▼'}</span>
                        </button>

                        {isExpanded && (
                          <div className="mt-2 p-2 bg-void border border-hairline rounded font-mono text-[9px] text-verified leading-normal overflow-x-auto select-all max-h-[140px] overflow-y-auto">
                            <pre>{JSON.stringify(pub.publicKeyJwk, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Column 2 & 3: Forensics Workstation */}
          <div className="lg:col-span-2 space-y-4 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <div className="bg-panel border border-hairline rounded-lg overflow-hidden">
              
              {/* Workstation Tabs */}
              <div className="flex border-b border-hairline bg-void/30">
                <button
                  onClick={() => setActiveTab('verify')}
                  className={`flex-1 py-3 px-4 text-xs font-mono font-bold tracking-wider uppercase border-b-2 transition-all ${
                    activeTab === 'verify'
                      ? 'border-gold text-gold bg-panel'
                      : 'border-transparent text-dim hover:text-primary hover:bg-void/10'
                  }`}
                >
                  🔒 Verification Desk (The Lock)
                </button>
                <button
                  onClick={() => setActiveTab('sign')}
                  className={`flex-1 py-3 px-4 text-xs font-mono font-bold tracking-wider uppercase border-b-2 transition-all ${
                    activeTab === 'sign'
                      ? 'border-gold text-gold bg-panel'
                      : 'border-transparent text-dim hover:text-primary hover:bg-void/10'
                  }`}
                >
                  🔑 Signing Playground (The Key)
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-5">
                {activeTab === 'verify' ? (
                  
                  /* VERIFY TAB */
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Left: Input parameters */}
                      <div className="md:col-span-2 space-y-4">
                        <div>
                          <label htmlFor="verify-publisher" className="block text-[10px] font-mono font-bold text-gold uppercase tracking-wider mb-1.5">
                            Claimed Publisher
                          </label>
                          <select
                            id="verify-publisher"
                            className="w-full bg-void border border-hairline rounded px-3 py-2 text-primary font-mono text-xs focus:outline-none focus:ring-1 focus:ring-gold transition-all"
                            value={verifyPublisherId}
                            onChange={(e) => setVerifyPublisherId(e.target.value)}
                          >
                            {publishers.map((pub) => (
                              <option key={pub.id} value={pub.id}>
                                {pub.name} ({pub.id})
                              </option>
                            ))}
                            <option value="custom">-- Custom Public Key (Paste JWK) --</option>
                          </select>
                        </div>

                        {verifyPublisherId === 'custom' && (
                          <div>
                            <label htmlFor="verify-custom-jwk" className="block text-[10px] font-mono font-bold text-gold uppercase tracking-wider mb-1.5">
                              Custom Public Key (JSON Web Key)
                            </label>
                            <textarea
                              id="verify-custom-jwk"
                              rows={4}
                              className="w-full bg-void border border-hairline rounded px-3 py-2 text-verified font-mono text-[10px] focus:outline-none focus:ring-1 focus:ring-gold transition-all"
                              value={verifyCustomJwkText}
                              onChange={(e) => setVerifyCustomJwkText(e.target.value)}
                              placeholder='{"kty": "EC", "crv": "P-256", "x": "...", "y": "..."}'
                            />
                          </div>
                        )}

                        <div>
                          <label htmlFor="verify-content" className="block text-[10px] font-mono font-bold text-gold uppercase tracking-wider mb-1.5">
                            Signed Text Content
                          </label>
                          <textarea
                            id="verify-content"
                            rows={4}
                            className="w-full bg-void border border-hairline rounded px-3 py-2 text-primary font-body text-xs focus:outline-none focus:ring-1 focus:ring-gold transition-all"
                            value={verifyContentText}
                            onChange={(e) => {
                              setVerifyContentText(e.target.value);
                              setVerificationState('idle');
                            }}
                            placeholder="Paste the raw text content here..."
                          />
                        </div>

                        <div>
                          <label htmlFor="verify-sig" className="block text-[10px] font-mono font-bold text-gold uppercase tracking-wider mb-1.5">
                            ECDSA Signature (Base64)
                          </label>
                          <textarea
                            id="verify-sig"
                            rows={2}
                            className="w-full bg-void border border-hairline rounded px-3 py-2 text-primary font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-gold transition-all"
                            value={verifySignatureBase64}
                            onChange={(e) => {
                              setVerifySignatureBase64(e.target.value);
                              setVerificationState('idle');
                            }}
                            placeholder="Paste the Base64 signature string here..."
                          />
                        </div>

                        <button
                          onClick={handleVerifySignature}
                          disabled={!verifyContentText || !verifySignatureBase64}
                          className="w-full bg-gold hover:bg-gold/90 text-void font-bold py-2.5 px-4 rounded text-xs uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Execute Signature Verification
                        </button>
                      </div>

                      {/* Right: Lock and Key UI */}
                      <div className="md:col-span-1 flex flex-col items-center justify-center border border-hairline rounded-lg p-4 bg-void/20">
                        <p className="text-[9px] font-mono text-dim uppercase tracking-wider mb-3">Verification Lock</p>
                        
                        <div className="relative w-24 h-24 mb-4">
                          {/* Animated Lock SVG */}
                          <svg
                            className={`w-full h-full transition-all duration-500 ${
                              verificationState === 'verifying' ? 'animate-pulse scale-95' : ''
                            } ${
                              verificationState === 'success' ? 'animate-pulse-glow text-verified' : ''
                            } ${
                              verificationState === 'failure' ? 'animate-shatter text-tampered' : 'text-dim'
                            }`}
                            viewBox="0 0 100 100"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            {/* Shackle */}
                            <path
                              d="M30 45V30C30 19 39 10 50 10C61 10 70 19 70 30V45"
                              stroke="currentColor"
                              strokeWidth="6"
                              strokeLinecap="round"
                              className={`transition-all duration-500 origin-bottom ${
                                verificationState === 'success' ? 'translate-y-2' : ''
                              } ${
                                verificationState === 'failure' ? '-translate-y-1 rotate-[6deg]' : ''
                              }`}
                            />
                            {/* Body */}
                            <rect
                              x="20"
                              y="40"
                              width="60"
                              height="50"
                              rx="8"
                              fill="var(--bg-panel-raised)"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            {/* Center Status Icon */}
                            {verificationState === 'success' && (
                              <path
                                d="M42 68L48 74L58 60"
                                stroke="currentColor"
                                strokeWidth="5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            )}
                            {verificationState === 'failure' && (
                              <>
                                <path d="M42 58L58 74" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
                                <path d="M58 58L42 74" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
                              </>
                            )}
                            {verificationState === 'verifying' && (
                              <circle
                                cx="50"
                                cy="65"
                                r="8"
                                stroke="var(--accent-gold)"
                                strokeWidth="3"
                                strokeDasharray="30 10"
                                className="animate-spin origin-center"
                                style={{ transformOrigin: '50px 65px' }}
                              />
                            )}
                            {verificationState === 'idle' && (
                              <circle cx="50" cy="65" r="4" fill="currentColor" />
                            )}
                          </svg>
                        </div>

                        {/* Status Label */}
                        <div className="text-center w-full font-mono">
                          {verificationState === 'idle' && (
                            <div>
                              <p className="text-[10px] text-dim uppercase">Awaiting Input</p>
                              <p className="text-[8px] text-dim/60 mt-1">Provide content & signature</p>
                            </div>
                          )}
                          {verificationState === 'verifying' && (
                            <div>
                              <p className="text-[10px] text-gold uppercase animate-pulse">Running ECDSA...</p>
                              <p className="text-[8px] text-dim/60 mt-1">Verifying curves on P-256</p>
                            </div>
                          )}
                          {verificationState === 'success' && (
                            <div>
                              <p className="text-[10px] text-verified font-bold uppercase tracking-wider">✓ Verified Authentic</p>
                              <p className="text-[8px] text-verified/80 mt-1">Integrity: Intact</p>
                            </div>
                          )}
                          {verificationState === 'failure' && (
                            <div>
                              <p className="text-[10px] text-tampered font-bold uppercase tracking-wider">✗ Verification Failed</p>
                              <p className="text-[8px] text-tampered/80 mt-1">Integrity: Compromised</p>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>

                    {/* Verification Audit Log & Explanation */}
                    {verificationState !== 'idle' && verificationState !== 'verifying' && (
                      <div className="pt-4 border-t border-hairline animate-fade-in-up">
                        <h4 className="text-[10px] font-mono font-bold text-gold uppercase tracking-wider mb-3">
                          Forensic Audit Trail
                        </h4>

                        <div className="space-y-3 font-mono text-xs">
                          {verificationState === 'success' && verificationResult ? (
                            <>
                              <div className="bg-verified/5 border border-verified/20 rounded p-3 text-verified/90 flex gap-2">
                                <span className="text-sm shrink-0">🟢</span>
                                <div>
                                  <span className="font-bold text-primary">Verdict: Authentic</span>
                                  <p className="text-[10px] text-dim mt-1 leading-relaxed">
                                    The elliptic curve signature matches the public key coordinates exactly. There is 0.00% probability of tampering or identity spoofing.
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-2 border-l-2 border-hairline pl-3 ml-2">
                                <div>
                                  <span className="text-[10px] text-dim">Step 1: Compute Text Digest</span>
                                  <p className="text-[10px] text-primary break-all">
                                    SHA-256(Content) = <span className="text-gold">{verificationResult.computedHash}</span>
                                  </p>
                                </div>
                                <div>
                                  <span className="text-[10px] text-dim">Step 2: Load Public Coordinates</span>
                                  <p className="text-[10px] text-primary">
                                    Curve: <span className="text-gold">{verificationResult.resolvedKeyJwk?.crv || 'P-256'}</span> | 
                                    X-coord: <span className="text-gold">{verificationResult.resolvedKeyJwk?.x?.slice(0, 8)}...</span> | 
                                    Y-coord: <span className="text-gold">{verificationResult.resolvedKeyJwk?.y?.slice(0, 8)}...</span>
                                  </p>
                                </div>
                                <div>
                                  <span className="text-[10px] text-dim">Step 3: Elliptic Curve Cryptography Check</span>
                                  <p className="text-[10px] text-primary leading-relaxed">
                                    The Web Crypto engine computed the verification equation: 
                                    <span className="text-verified font-bold"> R, S signature values map to public key point G matching hash digest.</span>
                                  </p>
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="bg-tampered/5 border border-tampered/20 rounded p-3 text-tampered/90 flex gap-2">
                                <span className="text-sm shrink-0">🔴</span>
                                <div>
                                  <span className="font-bold text-primary">Verdict: Tampered or Invalid Signature</span>
                                  <p className="text-[10px] text-dim mt-1 leading-relaxed">
                                    {verificationResult?.errorMessage || 'The computed hash of this text does not map to the provided signature and public key. The text has been modified, the signature is corrupted, or a different key was used.'}
                                  </p>
                                </div>
                              </div>
                              
                              {verificationResult && verificationResult.computedHash && (
                                <div className="space-y-2 border-l-2 border-hairline pl-3 ml-2">
                                  <div>
                                    <span className="text-[10px] text-dim">Step 1: Compute Text Digest</span>
                                    <p className="text-[10px] text-primary break-all">
                                      SHA-256(Content) = <span className="text-gold">{verificationResult.computedHash}</span>
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-dim">Step 2: Elliptic Curve Cryptography Check</span>
                                    <p className="text-[10px] text-tampered">
                                      Equation Check: FAILED. Mathematical points did not converge.
                                    </p>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  
                  /* SIGN TAB */
                  <div className="space-y-5">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="sign-publisher" className="block text-[10px] font-mono font-bold text-gold uppercase tracking-wider mb-1.5">
                          Acting Publisher Identity
                        </label>
                        <select
                          id="sign-publisher"
                          className="w-full bg-void border border-hairline rounded px-3 py-2 text-primary font-mono text-xs focus:outline-none focus:ring-1 focus:ring-gold transition-all"
                          value={signPublisherId}
                          onChange={(e) => {
                            setSignPublisherId(e.target.value);
                            setSignResult(null);
                          }}
                        >
                          {publishers.map((pub) => (
                            <option key={pub.id} value={pub.id}>
                              {pub.name} ({pub.id})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="sign-content" className="block text-[10px] font-mono font-bold text-gold uppercase tracking-wider mb-1.5">
                          Text Content to Sign
                        </label>
                        <textarea
                          id="sign-content"
                          rows={4}
                          className="w-full bg-void border border-hairline rounded px-3 py-2 text-primary font-body text-xs focus:outline-none focus:ring-1 focus:ring-gold transition-all"
                          value={signContentText}
                          onChange={(e) => {
                            setSignContentText(e.target.value);
                            setSignResult(null);
                          }}
                          placeholder="Type content that you want to securely sign..."
                        />
                      </div>

                      <button
                        onClick={handleGenerateSignature}
                        disabled={isSigning || !signContentText}
                        className="w-full bg-gold hover:bg-gold/90 text-void font-bold py-2.5 px-4 rounded text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                      >
                        {isSigning ? 'Signing in progress...' : 'Generate ECDSA Signature'}
                      </button>
                    </div>

                    {/* Signing Output */}
                    {signResult && (
                      <div className="pt-4 border-t border-hairline space-y-4 animate-fade-in-up">
                        <div className="bg-void p-4 border border-hairline rounded space-y-3 font-mono text-xs">
                          <div>
                            <span className="text-[10px] text-dim uppercase">SHA-256 Hash Digest (Pre-image)</span>
                            <div className="text-verified break-all bg-void/50 p-2 border border-hairline/30 rounded mt-1 font-mono text-[10px]">
                              {signResult.hash}
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] text-dim uppercase">Generated Digital Signature (Base64)</span>
                            <div className="text-gold break-all bg-void/50 p-2 border border-hairline/30 rounded mt-1 font-mono text-[10px] select-all">
                              {signResult.signature}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(signResult.signature);
                              alert('Signature copied to clipboard!');
                            }}
                            className="flex-1 border border-hairline hover:border-gold/40 text-primary py-2 px-4 rounded text-xs uppercase font-mono transition-colors"
                          >
                            Copy Signature
                          </button>
                          <button
                            onClick={handleTransmitToVerifier}
                            className="flex-1 bg-verified hover:bg-verified/90 text-void font-bold py-2 px-4 rounded text-xs uppercase transition-colors"
                          >
                            Send to Verification Desk →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>
      )}
    </div>
  );
}
