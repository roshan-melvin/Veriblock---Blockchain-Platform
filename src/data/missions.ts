import type { Mission } from '../types';

/**
 * All 15 VeriBlock missions.
 * Levels:   Beginner 1-4 | Intermediate 5-8 | Advanced 9-13 | Expert 14-15
 * Themes:   fake news, election misinformation, scientific misinformation,
 *           publisher verification, deepfake investigations, adversarial
 */
export const MISSIONS: Mission[] = [
  // ─────────────────────────────────────────────────────
  // BEGINNER (1–4) — introduces basic tools one at a time
  // ─────────────────────────────────────────────────────
  {
    id: 'm1',
    level: 'beginner',
    type: 'hash_verification',
    title: 'Case #01: The Hash Trial',
    briefing:
      'A whistleblower has sent a hashed text document. Compute the SHA-256 of the original text and compare it against the whistleblower\'s claimed checksum to verify the document\'s integrity.',
    requiredChecks: ['hash'],
    correctVerdict: 'authentic',
    hints: [
      'Paste the whistleblower\'s text into the Hash Lab.',
      'Compare the generated SHA-256 against the reported checksum.',
      'A single character difference produces a completely different hash.',
    ],
    xpReward: 50,
    recommendedBadge: 'Hash Apprentice',
    signedAssetContent:
      'OFFICIAL INVESTIGATION TRANSCRIPT: Witness statements confirm that the container ship was not carrying any illegal payload at the time of docking. Signed under custody code Omega-9.',
  },

  {
    id: 'm2',
    level: 'beginner',
    type: 'hash_verification',
    title: 'Case #02: Alter Ego',
    briefing:
      'A leaked corporate email is suspected of being tampered with by a third party before publication. Compare the SHA-256 of the official press release against the leaked version.',
    requiredChecks: ['hash'],
    correctVerdict: 'tampered',
    hints: [
      'Hash both the official text and the leaked text separately.',
      'If hashes differ, the content has been altered.',
      'Look for subtle changes — extra spacing, replaced digits, or swapped characters.',
    ],
    xpReward: 60,
    recommendedBadge: 'Integrity Scout',
    signedAssetContent:
      'LEAKED EMAIL: The CEO has approved the immediate shutdown of the Server Farm in sector 4. Shutdown scheduled for July 11th.',
  },

  {
    id: 'm3',
    level: 'beginner',
    type: 'publisher_verification',
    title: 'Case #03: Publisher\'s Seal',
    briefing:
      'A press release from the Civic Media Alliance carries a digital signature. Verify whether the signature is valid and matches their registered public key in the trusted publisher directory.',
    requiredChecks: ['signature'],
    correctVerdict: 'authentic',
    hints: [
      'Open the Signature Panel and load the Civic Media Alliance public key.',
      'Paste the document text and the base-64 signature.',
      'A successful verification confirms the document is unmodified and from the real publisher.',
    ],
    xpReward: 70,
    recommendedBadge: 'Signature Seeker',
    signedAssetContent:
      'URGENT WIRE: Independent audit verifies that the voting terminals in District 4 were running outdated software. No votes were modified, but protocols were breached.',
    signedAssetPublisherId: 'pub-cma',
    signedAssetTampered: false,
  },

  {
    id: 'm4',
    level: 'beginner',
    type: 'chain_integrity',
    title: 'Case #04: First Link',
    briefing:
      'You have received a short blockchain ledger of three entries. A local news outlet claims one entry may have been quietly edited. Verify every block\'s hash linkage in the Chain Explorer.',
    requiredChecks: ['chain'],
    correctVerdict: 'authentic',
    hints: [
      'Open the Chain Explorer and load the provided ledger.',
      'Check that each block\'s prevHash equals the contentHash of the block before it.',
      'If all links are intact, the chain is authentic.',
    ],
    xpReward: 80,
    recommendedBadge: 'Chain Novice',
    chainContents: [
      'Genesis: Community bulletin board v1.0',
      'Post: School reopening rescheduled to August 14.',
      'Post: Annual town hall confirmed for September 3.',
    ],
  },

  // ─────────────────────────────────────────────────────
  // INTERMEDIATE (5–8) — multi-tool investigations
  // ─────────────────────────────────────────────────────
  {
    id: 'm5',
    level: 'intermediate',
    type: 'chain_integrity',
    title: 'Case #05: Double Spend',
    briefing:
      'A suspicious transaction block has been reported in a shared financial ledger. Analyse the Chain Explorer to identify if any historical block data has been silently altered.',
    requiredChecks: ['chain'],
    correctVerdict: 'tampered',
    hints: [
      'Navigate to the Chain Explorer and examine each block.',
      'Trace block linkage by comparing each block\'s prevHash with the previous block\'s contentHash.',
      'Identify the exact index where the hash chain breaks.',
    ],
    xpReward: 100,
    recommendedBadge: 'Chain Inspector',
    chainContents: [
      'Genesis: VeriBlock supply certified',
      'Transaction: Alice paid Bob 10 VBK',
      'Transaction: Bob paid Charlie 5 VBK',
      'Transaction: Charlie paid Dave 3 VBK',
    ],
    tamperBlockIndex: 2,
    tamperBlockContent: 'Transaction: Bob paid Charlie 500 VBK',
  },

  {
    id: 'm6',
    level: 'intermediate',
    type: 'publisher_verification',
    title: 'Case #06: The Phantom Article',
    briefing:
      'A news portal claims an official scientific report was issued by the Science Institute. The signature seems valid, but the contents appear to contradict the Institute\'s actual findings. Verify both the signature and the hash.',
    requiredChecks: ['hash', 'signature'],
    correctVerdict: 'tampered',
    hints: [
      'First verify the signature using the Science Institute\'s registered public key.',
      'Check whether a spoofed key was used instead of the genuine one.',
      'Recompute the hash of the document and compare with the Institute\'s published checksum.',
    ],
    xpReward: 120,
    recommendedBadge: 'Crypto Analyst',
    signedAssetContent:
      'RESEARCH REPORT: Temperature fluctuations in the Arctic Circle show a cooling trend of 0.2°C over the last decade, contrary to the scientific consensus.',
    signedAssetPublisherId: 'pub-sci',
    signedAssetTampered: true,
  },

  {
    id: 'm7',
    level: 'intermediate',
    type: 'chain_integrity',
    title: 'Case #07: Broken Link',
    briefing:
      'A climate data registry block carries the correct-looking data, but its prevHash is wrong. Track down which block was silently modified to break the cryptographic chain.',
    requiredChecks: ['chain'],
    correctVerdict: 'tampered',
    hints: [
      'Inspect each block\'s contentHash and prevHash in the Chain Explorer.',
      'Find the first block whose contentHash does not match the prevHash of the next block.',
      'Determine whether the block content or just its hash reference was altered.',
    ],
    xpReward: 140,
    recommendedBadge: 'Link Auditor',
    chainContents: [
      'Genesis: Science data registry',
      'Entry: Temperature record Station Alpha = 14.2°C',
      'Entry: Temperature record Station Beta = 15.6°C',
      'Entry: Temperature record Station Gamma = 12.8°C',
    ],
    tamperBlockIndex: 1,
    tamperBlockContent: 'Entry: Temperature record Station Alpha = 24.2°C',
  },

  {
    id: 'm8',
    level: 'intermediate',
    type: 'breaking_news',
    title: 'Case #08: Election Flash',
    briefing:
      'Breaking: A viral post claims a government agency officially declared that early voting results are invalid. The post links to a signed press release. Use both signature verification and hash checking to determine whether the press release is genuine.',
    requiredChecks: ['hash', 'signature'],
    correctVerdict: 'tampered',
    hints: [
      'Check the claimed publisher in the directory — does the ID exist?',
      'Verify the signature with the registered public key for that agency.',
      'Hash the text and compare with the checksum posted on the official government website.',
    ],
    xpReward: 160,
    recommendedBadge: 'Election Sentinel',
    signedAssetContent:
      'OFFICIAL STATEMENT: The Electoral Commission hereby declares all early votes submitted in District 7 null and void due to procedural irregularities.',
    signedAssetPublisherId: 'pub-gov',
    signedAssetTampered: true,
  },

  // ─────────────────────────────────────────────────────
  // ADVANCED (9–13) — complex, multi-vector misinformation
  // ─────────────────────────────────────────────────────
  {
    id: 'm9',
    level: 'advanced',
    type: 'publisher_verification',
    title: 'Case #09: Sybil\'s Whisper',
    briefing:
      'A broadcast message is signed, but the publisher ID does not exist in the trusted directory. Trace the signature and inspect the public key database to determine if a Sybil spoofing attack is underway.',
    requiredChecks: ['signature'],
    correctVerdict: 'tampered',
    hints: [
      'Attempt to verify the signature using the claimed publisher ID.',
      'Cross-check the key against the trusted publisher registry.',
      'An unregistered or unknown key indicates a Sybil spoofing attack.',
    ],
    xpReward: 200,
    recommendedBadge: 'Key Tracer',
    signedAssetContent:
      'LEAKED MEMO: The central bank plans to devalue the national currency by 15% next Monday at midnight.',
    signedAssetPublisherId: 'pub-gnn',
    signedAssetTampered: true,
  },

  {
    id: 'm10',
    level: 'advanced',
    type: 'chain_integrity',
    title: 'Case #10: Hard Fork Sabotage',
    briefing:
      'A malicious actor has tampered with multiple historical blocks in a municipal budget ledger. Recompute the hashes and pinpoint the block index at which the blockchain diverges into an unauthorized fork.',
    requiredChecks: ['chain', 'hash'],
    correctVerdict: 'tampered',
    hints: [
      'Compare each block\'s hashes against the expected values.',
      'Find the fork point where the legitimate chain diverges from the tampered one.',
      'The attacker may have recalculated subsequent hashes to disguise the modification.',
    ],
    xpReward: 220,
    recommendedBadge: 'Fork Finder',
    chainContents: [
      'Genesis: City budget ledger v1.0',
      'Alloc: Police department $800k',
      'Alloc: Fire department $400k',
      'Alloc: Municipal water & sewers $500k',
      'Alloc: Mayor emergency fund $10k',
    ],
    tamperBlockIndex: 3,
    tamperBlockContent: 'Alloc: Municipal water & sewers $50k',
  },

  {
    id: 'm11',
    level: 'advanced',
    type: 'deepfake_check',
    title: 'Case #11: Deep Blue',
    briefing:
      'A research paper on marine biology has been signed using a key that may have been compromised or revoked. Perform a signature check and cross-reference the key against the publisher revocation list.',
    requiredChecks: ['signature', 'hash'],
    correctVerdict: 'tampered',
    hints: [
      'Verify the signature using the registered public key for the Science Institute.',
      'Check the publisher revocation list — was this key revoked before the signing date?',
      'A revoked key means the signature cannot be trusted, even if mathematically valid.',
    ],
    xpReward: 250,
    recommendedBadge: 'Compromise Auditor',
    signedAssetContent:
      'FORECAST: Coastal erosion rates will double by 2030, displacing local marine populations and threatening freshwater reserves.',
    signedAssetPublisherId: 'pub-sci',
    signedAssetTampered: true,
  },

  {
    id: 'm12',
    level: 'advanced',
    type: 'adversarial',
    title: 'Case #12: Deepfake Directive',
    briefing:
      'A viral video transcript is circulating online alongside a "signed" government order. The transcript appears to show an official announcing emergency lockdown powers. Verify the authenticity of the signed order using all tools.',
    requiredChecks: ['hash', 'signature'],
    correctVerdict: 'tampered',
    hints: [
      'Hash the transcript and compare against the official government checksum registry.',
      'Verify the signature on the order against the registered government key.',
      'Deepfake-assisted misinformation often combines forged transcripts with spoofed signatures.',
    ],
    xpReward: 280,
    recommendedBadge: 'Deepfake Detector',
    signedAssetContent:
      'EMERGENCY ORDER #2049-X: Under Article 12 of the National Security Act, all citizens must register biometric data within 48 hours. Non-compliance carries criminal liability.',
    signedAssetPublisherId: 'pub-gov',
    signedAssetTampered: true,
  },

  {
    id: 'm13',
    level: 'advanced',
    type: 'chain_integrity',
    title: 'Case #13: Scientific Rewrite',
    briefing:
      'A prestigious scientific journal\'s peer-review ledger has been compromised. Historical approval records have been silently altered to include fraudulent research. Use the Chain Explorer and Hash Lab to expose the tampering.',
    requiredChecks: ['chain', 'hash'],
    correctVerdict: 'tampered',
    hints: [
      'Load the journal\'s peer-review ledger in the Chain Explorer.',
      'Identify which block\'s contentHash no longer matches its content.',
      'Check whether the tampered entry introduced fraudulent research claims.',
    ],
    xpReward: 300,
    recommendedBadge: 'Science Guardian',
    chainContents: [
      'Genesis: Journal peer-review ledger v2.0',
      'Approval: Paper #4412 — "Quantum Dot Solar Cells" — APPROVED',
      'Approval: Paper #4413 — "mRNA Vaccine Efficacy Meta-Analysis" — APPROVED',
      'Rejection: Paper #4414 — "Homeopathic Cancer Cure" — REJECTED',
      'Approval: Paper #4415 — "Carbon Capture Efficiency Study" — APPROVED',
    ],
    tamperBlockIndex: 3,
    tamperBlockContent: 'Approval: Paper #4414 — "Homeopathic Cancer Cure" — APPROVED',
  },

  // ─────────────────────────────────────────────────────
  // EXPERT (14–15) — full-spectrum adversarial challenges
  // ─────────────────────────────────────────────────────
  {
    id: 'm14',
    level: 'expert',
    type: 'chain_integrity',
    title: 'Case #14: The Genesis Heist',
    briefing:
      'The genesis block of the entire national electoral registry has been altered, invalidating the historical audit trail. Every block downstream is now suspect. Reconstruct the original genesis block data and identify the scope of the damage.',
    requiredChecks: ['chain', 'hash', 'signature'],
    correctVerdict: 'tampered',
    hints: [
      'Inspect Block #0 in the Chain Explorer — its contentHash is the root of all trust.',
      'Verify the hash of the claimed genesis data against the notarised backup.',
      'Any change in the genesis block cascades errors to all subsequent blocks.',
    ],
    xpReward: 350,
    recommendedBadge: 'Genesis Guardian',
    chainContents: [
      'Genesis: State electoral registry v1',
      'Vote: Alice = Candidate A',
      'Vote: Bob = Candidate A',
      'Vote: Charlie = Candidate B',
    ],
    tamperBlockIndex: 0,
    tamperBlockContent: 'Genesis: State electoral registry v2 (altered genesis block data)',
  },

  {
    id: 'm15',
    level: 'expert',
    type: 'adversarial',
    title: 'Case #15: Shadow State',
    briefing:
      'A coordinated, full-scale disinformation campaign is underway. False government alerts are signed by spoofed publishers, historical intelligence ledgers are being rewritten in real-time, and deepfake transcripts have been circulated globally. Deploy every tool in your arsenal to expose the conspiracy.',
    requiredChecks: ['hash', 'chain', 'signature'],
    correctVerdict: 'tampered',
    hints: [
      'Verify all signatures against the master publisher key directory — look for unknown or revoked keys.',
      'Scan the intelligence ledger in the Chain Explorer for blocks with broken hash chains.',
      'Construct a complete cryptographic timeline of modifications to present your evidence.',
    ],
    xpReward: 500,
    recommendedBadge: 'Forensics Master',
    signedAssetContent:
      'CLASSIFIED BRIEFING: Comprehensive satellite imagery reveals large-scale troop movements along the demilitarised border zone. Immediate escalation recommended.',
    signedAssetPublisherId: 'pub-gnn',
    signedAssetTampered: true,
    chainContents: [
      'Genesis: Military intelligence ledger',
      'Satellite Log: Zone A — clear',
      'Satellite Log: Zone B — clear',
      'Satellite Log: Zone C — troop presence detected',
    ],
    tamperBlockIndex: 2,
    tamperBlockContent: 'Satellite Log: Zone B — troop presence detected',
  },
];
