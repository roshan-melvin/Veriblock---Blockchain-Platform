import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { buildChain, validateChain, tamperBlock } from '../engines/chain';
import type { Block } from '../types';
import { MISSIONS } from '../data/missions';

const DEFAULT_CONTENTS = [
  'Genesis: VeriBlock network initialized',
  'Report: City council budget approved $2.4M for infrastructure',
  'Alert: Breaking news verified by 3 independent sources',
  'Record: Election results certified by registrar office',
  'Update: Environmental sensor data from Station Alpha',
];

export default function ChainExplorer() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const missionId = searchParams.get('missionId');
  const activeMission = missionId ? MISSIONS.find(m => m.id === missionId) : null;

  const [chain, setChain] = useState<Block[]>([]);
  const [expandedBlock, setExpandedBlock] = useState<number | null>(null);
  const [cascadingIndices, setCascadingIndices] = useState<Set<number>>(new Set());
  const [newBlockContent, setNewBlockContent] = useState('');
  const [tamperInput, setTamperInput] = useState<{ index: number; content: string } | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Initialize chain
  useEffect(() => {
    async function initChain() {
      if (activeMission && activeMission.chainContents) {
        let freshChain = await buildChain(activeMission.chainContents);
        if (
          activeMission.tamperBlockIndex !== undefined &&
          activeMission.tamperBlockContent !== undefined
        ) {
          freshChain = tamperBlock(
            freshChain,
            activeMission.tamperBlockIndex,
            activeMission.tamperBlockContent
          );
        }
        const validated = await validateChain(freshChain);
        setChain(validated);
      } else {
        const fresh = await buildChain(DEFAULT_CONTENTS);
        setChain(fresh);
      }
    }
    initChain();
  }, [activeMission]);

  // Validate chain whenever it changes
  const revalidate = useCallback(async (currentChain: Block[]) => {
    setIsValidating(true);
    const validated = await validateChain(currentChain);

    // Find newly tampered blocks for cascade animation
    const newlyTampered = new Set<number>();
    validated.forEach((block, i) => {
      if (block.tampered && !currentChain[i].tampered) {
        newlyTampered.add(i);
      }
    });

    if (newlyTampered.size > 0) {
      // Animate cascade sequentially
      setCascadingIndices(new Set());
      const indices = Array.from(newlyTampered).sort((a, b) => a - b);
      for (let j = 0; j < indices.length; j++) {
        await new Promise<void>((resolve) => {
          setTimeout(() => {
            setCascadingIndices((prev) => new Set([...prev, indices[j]]));
            resolve();
          }, j * 300);
        });
      }
      // Clear cascade after animation completes
      setTimeout(() => setCascadingIndices(new Set()), indices.length * 300 + 800);
    }

    setChain(validated);
    setIsValidating(false);
  }, []);

  const handleTamper = useCallback(async (index: number, newContent: string) => {
    const tampered = tamperBlock(chain, index, newContent);
    setTamperInput(null);
    await revalidate(tampered);
  }, [chain, revalidate]);

  const handleAddBlock = useCallback(async () => {
    if (!newBlockContent.trim()) return;
    const contents = [...chain.map((b) => b.content), newBlockContent.trim()];
    const newChain = await buildChain(contents);
    setChain(newChain);
    setNewBlockContent('');
    // Scroll to new block
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
      }
    }, 100);
  }, [chain, newBlockContent]);

  const handleReset = useCallback(async () => {
    if (activeMission && activeMission.chainContents) {
      let freshChain = await buildChain(activeMission.chainContents);
      if (
        activeMission.tamperBlockIndex !== undefined &&
        activeMission.tamperBlockContent !== undefined
      ) {
        freshChain = tamperBlock(
          freshChain,
          activeMission.tamperBlockIndex,
          activeMission.tamperBlockContent
        );
      }
      const validated = await validateChain(freshChain);
      setChain(validated);
    } else {
      const fresh = await buildChain(DEFAULT_CONTENTS);
      setChain(fresh);
    }
    setExpandedBlock(null);
    setTamperInput(null);
    setCascadingIndices(new Set());
  }, [activeMission]);

  const handleLogStep = () => {
    if (!missionId) return;
    try {
      const existingStepsStr = localStorage.getItem('veriblock:v1:activeMissionSteps') || '[]';
      const existingSteps = JSON.parse(existingStepsStr);
      
      const updatedSteps = existingSteps.filter((s: any) => s.step !== 'chain');
      
      const hasTampered = chain.some(b => b.tampered);
      const tamperedIndices = chain.filter(b => b.tampered).map(b => `#${b.index}`).join(', ');
      
      updatedSteps.push({
        step: 'chain',
        action: `Audited blockchain ledger. Found ${chain.filter(b => b.tampered).length} tampered block(s) ${hasTampered ? `at ${tamperedIndices}` : '(chain is secure)'}.`,
        result: 'pass',
        timestamp: new Date().toISOString()
      });
      
      localStorage.setItem('veriblock:v1:activeMissionSteps', JSON.stringify(updatedSteps));
      navigate(`/missions/${missionId}`);
    } catch (e) {
      console.error('Failed to log step', e);
    }
  };

  const tamperedCount = chain.filter((b) => b.tampered).length;
  const validCount = chain.length - tamperedCount;

  return (
    <div className="space-y-6" role="main" aria-label="Blockchain Explorer">
      {/* Header */}
      <div className="animate-fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-primary">
              Blockchain Explorer
            </h1>
            <p className="text-xs text-dim font-mono mt-1">
              Build, inspect, and tamper with a hash-linked chain · Watch cascading invalidation in real-time
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4 text-[10px] font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-verified" aria-hidden="true" />
                <span className="text-dim">{validCount} VALID</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-tampered" aria-hidden="true" />
                <span className="text-dim">{tamperedCount} TAMPERED</span>
              </span>
            </div>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-[10px] font-mono text-dim hover:text-primary border border-hairline hover:border-gold/50 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-gold"
            >
              RESET CHAIN
            </button>
          </div>
        </div>
      </div>

      {/* Active Mission Banner */}
      {activeMission && (
        <div className="bg-gold/10 border border-gold/30 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in-up">
          <div>
            <p className="text-xs font-mono font-bold text-gold uppercase tracking-wider">
              Investigation Mode Active · Case #{activeMission.id.slice(0, 8)}
            </p>
            <p className="text-[11px] text-dim leading-snug mt-1">
              Verify the cryptographic linkage of the blocks. Locate any block data that has been tampered with and breaks the hash cascade, then log your report.
            </p>
          </div>
          <button
            onClick={handleLogStep}
            className="bg-gold text-void hover:bg-gold/90 font-mono font-bold py-1.5 px-3 rounded text-[10px] uppercase tracking-wider transition-colors shrink-0"
          >
            ✓ Log Chain Audit to Case File
          </button>
        </div>
      )}

      {/* Chain status bar */}
      {isValidating && (
        <div className="flex items-center gap-2 px-3 py-2 bg-unverified/10 border border-unverified/30 rounded text-[11px] font-mono text-unverified">
          <span className="w-2 h-2 rounded-full bg-unverified animate-pulse" />
          Validating chain integrity...
        </div>
      )}

      {/* Horizontal Chain Visualization */}
      <div className="bg-panel border border-hairline rounded-lg p-5 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] font-mono font-bold text-gold uppercase tracking-wider">Chain Topology</span>
          <div className="flex-1 h-px bg-hairline" aria-hidden="true" />
          <span className="text-[9px] font-mono text-dim">{chain.length} BLOCKS</span>
        </div>

        {/* Scrollable horizontal chain */}
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto pb-4"
          role="list"
          aria-label="Blockchain visualization"
        >
          <div className="flex items-stretch gap-0 min-w-max">
            {chain.map((block, i) => {
              const isCascading = cascadingIndices.has(i);
              const isExpanded = expandedBlock === i;

              return (
                <div key={`${block.index}-${i}`} className="flex items-stretch" role="listitem">
                  {/* Block card */}
                  <button
                    onClick={() => setExpandedBlock(isExpanded ? null : i)}
                    className={`relative flex flex-col items-center w-36 rounded-lg border-2 p-3 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gold cursor-pointer shrink-0
                      ${block.tampered
                        ? isCascading
                          ? 'border-tampered bg-tampered/10 animate-cascade-flash'
                          : 'border-tampered bg-tampered/5'
                        : 'border-verified/30 bg-void hover:border-verified/60 hover:bg-verified/5'
                      }
                      ${isExpanded ? 'ring-1 ring-gold scale-105 z-10' : ''}
                    `}
                    aria-expanded={isExpanded}
                    aria-label={`Block ${block.index}: ${block.tampered ? 'TAMPERED' : 'VALID'}. Click to ${isExpanded ? 'collapse' : 'expand'} details.`}
                  >
                    {/* Block index */}
                    <div className={`text-[9px] font-mono font-bold uppercase tracking-wider mb-1 ${
                      block.tampered ? 'text-tampered' : 'text-verified'
                    }`}>
                      {i === 0 ? 'GENESIS' : `BLOCK #${block.index}`}
                    </div>

                    {/* Status icon */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm mb-1.5 ${
                      block.tampered
                        ? 'bg-tampered/20 text-tampered'
                        : 'bg-verified/20 text-verified'
                    }`}>
                      {block.tampered ? '✗' : '✓'}
                    </div>

                    {/* Hash preview */}
                    <div className="text-[8px] font-mono text-dim truncate w-full text-center" title={block.contentHash}>
                      {block.contentHash.slice(0, 8)}…{block.contentHash.slice(-4)}
                    </div>

                    {/* Content preview */}
                    <div className="text-[9px] text-dim mt-1 truncate w-full text-center" title={block.content}>
                      {block.content.slice(0, 20)}…
                    </div>

                    {/* Tampered badge */}
                    {block.tampered && (
                      <span className="absolute -top-1.5 -right-1.5 bg-tampered text-void text-[7px] font-mono font-bold px-1.5 py-0.5 rounded-full leading-none">
                        !!
                      </span>
                    )}
                  </button>

                  {/* Chain link arrow */}
                  {i < chain.length - 1 && (
                    <div className="flex items-center px-1 shrink-0" aria-hidden="true">
                      <div className={`w-6 h-0.5 transition-colors duration-300 ${
                        chain[i + 1].tampered ? 'bg-tampered' : 'bg-verified/40'
                      }`} />
                      <div className={`w-0 h-0 border-t-[5px] border-b-[5px] border-l-[6px] border-t-transparent border-b-transparent transition-colors duration-300 ${
                        chain[i + 1].tampered ? 'border-l-tampered' : 'border-l-verified/40'
                      }`} />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add block button */}
            <div className="flex items-center px-1 shrink-0" aria-hidden="true">
              <div className="w-4 h-0.5 bg-hairline" />
            </div>
            <div className="flex items-center shrink-0">
              <button
                onClick={() => setExpandedBlock(-1)}
                className="w-36 h-full min-h-[120px] rounded-lg border-2 border-dashed border-hairline hover:border-gold/50 flex flex-col items-center justify-center gap-1 transition-colors focus:outline-none focus:ring-1 focus:ring-gold group"
                aria-label="Add new block to chain"
              >
                <span className="text-xl text-dim group-hover:text-gold transition-colors">+</span>
                <span className="text-[9px] font-mono text-dim group-hover:text-gold transition-colors">ADD BLOCK</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Block Detail Expansion Panel */}
      {expandedBlock !== null && expandedBlock >= 0 && expandedBlock < chain.length && (
        <div
          className="bg-panel border border-hairline rounded-lg p-5 animate-block-expand overflow-hidden"
          role="region"
          aria-label={`Block ${chain[expandedBlock].index} details`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                chain[expandedBlock].tampered ? 'bg-tampered animate-pulse' : 'bg-verified'
              }`} />
              <h3 className="text-sm font-display font-semibold text-primary">
                {expandedBlock === 0 ? 'Genesis Block' : `Block #${chain[expandedBlock].index}`}
              </h3>
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                chain[expandedBlock].tampered
                  ? 'text-tampered bg-tampered/10 border-tampered/30'
                  : 'text-verified bg-verified/10 border-verified/30'
              }`}>
                {chain[expandedBlock].tampered ? 'INTEGRITY COMPROMISED' : 'INTEGRITY VERIFIED'}
              </span>
            </div>
            <button
              onClick={() => setExpandedBlock(null)}
              className="text-dim hover:text-primary text-sm focus:outline-none focus:ring-1 focus:ring-gold rounded p-1"
              aria-label="Close block details"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Block Data */}
            <div className="space-y-3">
              <div>
                <span className="text-[9px] font-mono text-dim uppercase tracking-wider">Content</span>
                <div className="bg-void rounded p-3 mt-1 font-mono text-xs text-primary border border-hairline">
                  {chain[expandedBlock].content}
                </div>
              </div>
              <div>
                <span className="text-[9px] font-mono text-dim uppercase tracking-wider">Timestamp</span>
                <div className="bg-void rounded p-2 mt-1 font-mono text-[11px] text-dim border border-hairline">
                  {new Date(chain[expandedBlock].timestamp).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Hash Data */}
            <div className="space-y-3">
              <div>
                <span className="text-[9px] font-mono text-dim uppercase tracking-wider">Content Hash (Stored)</span>
                <div className={`bg-void rounded p-2 mt-1 font-mono text-[10px] break-all border ${
                  chain[expandedBlock].tampered ? 'border-tampered/30 text-tampered' : 'border-hairline text-verified'
                }`}>
                  {chain[expandedBlock].contentHash}
                </div>
              </div>
              <div>
                <span className="text-[9px] font-mono text-dim uppercase tracking-wider">Previous Hash (Link)</span>
                <div className="bg-void rounded p-2 mt-1 font-mono text-[10px] break-all border border-hairline text-dim">
                  {chain[expandedBlock].prevHash}
                </div>
              </div>
            </div>
          </div>

          {/* Tamper Controls */}
          <div className="mt-4 pt-4 border-t border-hairline">
            {tamperInput?.index === expandedBlock ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={tamperInput.content}
                  onChange={(e) => setTamperInput({ ...tamperInput, content: e.target.value })}
                  className="flex-1 bg-void border border-tampered/50 rounded px-3 py-2 text-primary font-mono text-xs focus:outline-none focus:ring-1 focus:ring-tampered"
                  placeholder="Enter tampered content..."
                  aria-label="New content for block tampering"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTamper(expandedBlock, tamperInput.content)}
                    disabled={!tamperInput.content.trim()}
                    className="px-4 py-2 bg-tampered/20 hover:bg-tampered/30 text-tampered border border-tampered/40 rounded text-[10px] font-mono font-bold transition-colors focus:outline-none focus:ring-1 focus:ring-tampered disabled:opacity-40"
                  >
                    EXECUTE TAMPER
                  </button>
                  <button
                    onClick={() => setTamperInput(null)}
                    className="px-3 py-2 text-dim hover:text-primary border border-hairline rounded text-[10px] font-mono transition-colors focus:outline-none focus:ring-1 focus:ring-gold"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setTamperInput({ index: expandedBlock, content: chain[expandedBlock].content })}
                className="px-4 py-2 bg-tampered/10 hover:bg-tampered/20 text-tampered border border-tampered/30 rounded text-[10px] font-mono font-bold transition-colors focus:outline-none focus:ring-1 focus:ring-tampered"
              >
                ⚠ TAMPER WITH THIS BLOCK
              </button>
            )}
          </div>
        </div>
      )}

      {/* Add Block Panel */}
      {expandedBlock === -1 && (
        <div className="bg-panel border border-hairline rounded-lg p-5 animate-block-expand overflow-hidden">
          <h3 className="text-sm font-display font-semibold text-primary mb-3">Add New Block</h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newBlockContent}
              onChange={(e) => setNewBlockContent(e.target.value)}
              className="flex-1 bg-void border border-hairline rounded px-3 py-2 text-primary font-mono text-xs focus:outline-none focus:ring-1 focus:ring-gold"
              placeholder="Enter block content (e.g., 'Transaction: Alice sent 10 coins to Bob')"
              aria-label="New block content"
              onKeyDown={(e) => e.key === 'Enter' && handleAddBlock()}
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddBlock}
                disabled={!newBlockContent.trim()}
                className="px-4 py-2 bg-gold/20 hover:bg-gold/30 text-gold border border-gold/40 rounded text-[10px] font-mono font-bold transition-colors focus:outline-none focus:ring-1 focus:ring-gold disabled:opacity-40"
              >
                MINE BLOCK
              </button>
              <button
                onClick={() => setExpandedBlock(null)}
                className="px-3 py-2 text-dim hover:text-primary border border-hairline rounded text-[10px] font-mono transition-colors focus:outline-none focus:ring-1 focus:ring-gold"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Educational Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
        <div className="bg-panel border border-hairline rounded-lg p-4">
          <h3 className="text-xs font-display font-semibold text-primary mb-2">How Blocks Link</h3>
          <p className="text-[11px] text-dim leading-relaxed">
            Each block stores the hash of the previous block. This creates an unbreakable chain — changing any block invalidates all blocks that follow.
          </p>
        </div>
        <div className="bg-panel border border-hairline rounded-lg p-4">
          <h3 className="text-xs font-display font-semibold text-primary mb-2">Tampering Detection</h3>
          <p className="text-[11px] text-dim leading-relaxed">
            When you modify a block&apos;s content, its stored hash no longer matches. The chain is broken from that point forward — that&apos;s cascading invalidation.
          </p>
        </div>
        <div className="bg-panel border border-hairline rounded-lg p-4">
          <h3 className="text-xs font-display font-semibold text-primary mb-2">Why Immutability Matters</h3>
          <p className="text-[11px] text-dim leading-relaxed">
            Blockchains make record tampering detectable. If someone alters historical data, the broken hash links expose the fraud immediately.
          </p>
        </div>
      </div>
    </div>
  );
}
