import type { Mission } from '../types';

export const MISSIONS: Mission[] = [
  // Beginner
  {
    id: 'm1',
    level: 'beginner',
    type: 'hash_verification',
    title: 'Case #01: The Hash Trial',
    briefing: 'A whistleblower has sent a hashed text document. You need to compute the hash of the original text to see if it matches the whistleblower\'s claim and verify the document\'s integrity.',
    requiredChecks: ['hash'],
    correctVerdict: 'authentic',
    hints: [
      'Copy the whistleblower\'s text into the Hash Lab.',
      'Check if the calculated SHA-256 matches the reported checksum.',
      'A single character difference will result in a completely different hash.'
    ],
    xpReward: 50,
    recommendedBadge: 'Hash Apprentice',
    signedAssetContent: 'OFFICIAL INVESTIGATION TRANSCRIPT: Witness statements confirm that the container ship was not carrying any illegal payload at the time of docking. Signed under custody code Omega-9.'
  },
  {
    id: 'm2',
    level: 'beginner',
    type: 'hash_verification',
    title: 'Case #02: Alter Ego',
    briefing: 'A leaked corporate email is suspected of being modified by a third party. Compare the computed hash of the official press release with the hash of the leaked email text.',
    requiredChecks: ['hash'],
    correctVerdict: 'tampered',
    hints: [
      'Compute the SHA-256 hash of both texts.',
      'If the hashes are not identical, the email has been altered.',
      'Look for subtle modifications like extra spacing or swapped characters.'
    ],
    xpReward: 60,
    recommendedBadge: 'Integrity Scout',
    signedAssetContent: 'LEAKED EMAIL: The CEO has approved the immediate shutdown of the Server Farm in sector 4. Shutdown scheduled for July 11th.'
  },
  {
    id: 'm3',
    level: 'beginner',
    type: 'publisher_verification',
    title: 'Case #03: Publisher\'s Seal',
    briefing: 'A press release from the Civic Media Alliance has a digital signature attached. Verify whether the signature is authentic and matches the Civic Media Alliance public key.',
    requiredChecks: ['signature'],
    correctVerdict: 'authentic',
    hints: [
      'Load the Civic Media Alliance public key from the directory.',
      'Input the text and the provided signature base64 into the Signature Panel.',
      'If verified, the document is untampered and is from the claimed publisher.'
    ],
    xpReward: 70,
    recommendedBadge: 'Signature Seeker',
    signedAssetContent: 'URGENT WIRE: Independent audit verifies that the voting terminals in District 4 were running outdated software. No votes were modified, but protocols were breached.',
    signedAssetPublisherId: 'pub-cma',
    signedAssetTampered: false
  },
  // Intermediate
  {
    id: 'm4',
    level: 'intermediate',
    type: 'chain_integrity',
    title: 'Case #04: Double Spend',
    briefing: 'A suspicious transaction block has been reported in the shared ledger. Analyze the blockchain explorer to identify if any historical block data has been tampered with.',
    requiredChecks: ['chain'],
    correctVerdict: 'tampered',
    hints: [
      'Navigate to the Chain Explorer.',
      'Trace the block linkage by comparing each block\'s prevHash with the previous block\'s hash.',
      'Identify the exact index where the hash chain is broken.'
    ],
    xpReward: 100,
    recommendedBadge: 'Chain Inspector',
    chainContents: [
      'Genesis: VeriBlock supply certified',
      'Transaction: Alice paid Bob 10 VBK',
      'Transaction: Bob paid Charlie 5 VBK',
      'Transaction: Charlie paid Dave 3 VBK'
    ],
    tamperBlockIndex: 2,
    tamperBlockContent: 'Transaction: Bob paid Charlie 500 VBK'
  },
  {
    id: 'm5',
    level: 'intermediate',
    type: 'publisher_verification',
    title: 'Case #05: The Phantom Article',
    briefing: 'A news portal claims an official scientific document was issued by the Science Institute. The signature is valid, but the text contents seem to conflict with official findings.',
    requiredChecks: ['hash', 'signature'],
    correctVerdict: 'tampered',
    hints: [
      'Verify the signature on the document first.',
      'Check if the signature matches the Science Institute public key or if a spoofed public key was used.',
      'Verify if the document has been tampered with post-signing by checking the content against the original hash registry.'
    ],
    xpReward: 120,
    recommendedBadge: 'Crypto Analyst',
    signedAssetContent: 'RESEARCH REPORT: Temperature fluctuations in the Arctic Circle show a cooling trend of 0.2C over the last decade, contrary to consensus.',
    signedAssetPublisherId: 'pub-sci',
    signedAssetTampered: true
  },
  {
    id: 'm6',
    level: 'intermediate',
    type: 'chain_integrity',
    title: 'Case #06: Broken Link',
    briefing: 'A block in the chain appears to have valid data, but its prevHash is incorrect. Track down which block\'s data was modified to break the cryptographic link.',
    requiredChecks: ['chain'],
    correctVerdict: 'tampered',
    hints: [
      'Inspect the block hashes.',
      'Look for the first block whose hash doesn\'t match the prevHash of the subsequent block.',
      'Validate if the block content hash was recalculated to cover up the edit.'
    ],
    xpReward: 140,
    recommendedBadge: 'Link Auditor',
    chainContents: [
      'Genesis: Science data registry',
      'Entry: Temperature record Station Alpha = 14.2C',
      'Entry: Temperature record Station Beta = 15.6C',
      'Entry: Temperature record Station Gamma = 12.8C'
    ],
    tamperBlockIndex: 1,
    tamperBlockContent: 'Entry: Temperature record Station Alpha = 24.2C'
  },
  // Advanced
  {
    id: 'm7',
    level: 'advanced',
    type: 'publisher_verification',
    title: 'Case #07: Sybil\'s Whisper',
    briefing: 'A broadcast message is signed, but the publisher ID doesn\'t exist in the trusted directory. Trace the signature and inspect the public key database.',
    requiredChecks: ['signature'],
    correctVerdict: 'tampered',
    hints: [
      'Attempt to verify the signature using the claimed key.',
      'Cross-check if the key belongs to any registered trusted publisher.',
      'An unregistered key indicates a Sybil spoofing attack.'
    ],
    xpReward: 200,
    recommendedBadge: 'Key Tracer',
    signedAssetContent: 'LEAKED MEMO: The central bank plans to devalue the national currency by 15% next Monday at midnight.',
    signedAssetPublisherId: 'pub-gnn',
    signedAssetTampered: true
  },
  {
    id: 'm8',
    level: 'advanced',
    type: 'chain_integrity',
    title: 'Case #08: Hard Fork Sabotage',
    briefing: 'A malicious actor has tampered with multiple historical blocks. Recompute the hashes and identify the block index at which the blockchain split into an unauthorized fork.',
    requiredChecks: ['chain', 'hash'],
    correctVerdict: 'tampered',
    hints: [
      'Compare the block hashes on the target chain with a known trusted node\'s chain.',
      'Find the fork point where the hashes diverge.',
      'Check if the malicious fork recalculated subsequent proof-of-work/hashes to seem valid.'
    ],
    xpReward: 220,
    recommendedBadge: 'Fork Finder',
    chainContents: [
      'Genesis: City budget ledger v1.0',
      'Alloc: Police department $800k',
      'Alloc: Fire department $400k',
      'Alloc: Municipal water & sewers $500k',
      'Alloc: Mayor emergency fund $10k'
    ],
    tamperBlockIndex: 3,
    tamperBlockContent: 'Alloc: Municipal water & sewers $50k'
  },
  {
    id: 'm9',
    level: 'advanced',
    type: 'deepfake_check',
    title: 'Case #09: Deep Blue',
    briefing: 'A research paper about marine biology has been signed using a key that might have been compromised. Perform a check across public key registries to verify authenticity.',
    requiredChecks: ['signature', 'hash'],
    correctVerdict: 'tampered',
    hints: [
      'Verify the signature using the registered public key.',
      'Check the public key revocation list in localStorage/directory.',
      'If the key was revoked before the signature date, the message is unverified.'
    ],
    xpReward: 250,
    recommendedBadge: 'Compromise Auditor',
    signedAssetContent: 'FORECAST: Coastal erosion rates will double by 2030, displacing local marine populations.',
    signedAssetPublisherId: 'pub-sci',
    signedAssetTampered: true
  },
  // Expert
  {
    id: 'm10',
    level: 'expert',
    type: 'chain_integrity',
    title: 'Case #10: The Genesis Heist',
    briefing: 'The genesis block of the entire network has been altered, invalidating the historical audit trail. Reconstruct the genesis block to restore the cryptographic chain.',
    requiredChecks: ['chain', 'hash', 'signature'],
    correctVerdict: 'tampered',
    hints: [
      'Inspect Block #0 in the Chain Explorer.',
      'Verify the hash of the genesis data.',
      'A change in the genesis block propagates errors to all subsequent blocks.'
    ],
    xpReward: 350,
    recommendedBadge: 'Genesis Guardian',
    chainContents: [
      'Genesis: State electoral registry v1',
      'Vote: Alice = Candidate A',
      'Vote: Bob = Candidate A',
      'Vote: Charlie = Candidate B'
    ],
    tamperBlockIndex: 0,
    tamperBlockContent: 'Genesis: State electoral registry v2 (altered genesis block data)'
  },
  {
    id: 'm11',
    level: 'expert',
    type: 'adversarial',
    title: 'Case #11: Man-in-the-Middle',
    briefing: 'An attacker has intercepted communications, modifying both the messages and the signatures, then replacing public keys in your local store. Diagnose this state.',
    requiredChecks: ['signature', 'chain'],
    correctVerdict: 'tampered',
    hints: [
      'Check if the local directory of trusted publishers has been altered.',
      'Compare local public keys with the master directory keys.',
      'Mitigate the MITM by restoring the authentic publisher keys.'
    ],
    xpReward: 400,
    recommendedBadge: 'Network Sentinel',
    signedAssetContent: 'CURRICULUM UPDATE: History textbooks for high schools will exclude chapters on the 20th-century economic depression.',
    signedAssetPublisherId: 'pub-edu',
    signedAssetTampered: true
  },
  {
    id: 'm12',
    level: 'expert',
    type: 'breaking_news',
    title: 'Case #12: Shadow State',
    briefing: 'A full-scale disinformation campaign is underway. False alerts are signed by spoofed publishers, and historical ledgers are being rewritten. Use all tools to expose the conspiracy.',
    requiredChecks: ['hash', 'chain', 'signature'],
    correctVerdict: 'tampered',
    hints: [
      'Verify all signatures against the master publisher keys.',
      'Scan the transaction ledger for blocks containing the spoofed contents.',
      'Construct a full cryptographic timeline of the modifications.'
    ],
    xpReward: 500,
    recommendedBadge: 'Forensics Master',
    signedAssetContent: 'CLASSIFIED BRIEFING: Comprehensive satellite imagery reveals troop movements along the demilitarized border zone.',
    signedAssetPublisherId: 'pub-gnn',
    signedAssetTampered: true,
    chainContents: [
      'Genesis: Military intel ledger',
      'Satellite Log: Zone A clear',
      'Satellite Log: Zone B clear',
      'Satellite Log: Zone C - troop presence detected'
    ],
    tamperBlockIndex: 2,
    tamperBlockContent: 'Satellite Log: Zone B - troop presence detected'
  }
];
