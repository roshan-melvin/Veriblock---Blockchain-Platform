export type CheckType = 'hash' | 'chain' | 'signature';
export type Verdict = 'authentic' | 'tampered';
export type MissionLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type MissionType =
  | 'hash_verification'
  | 'chain_integrity'
  | 'publisher_verification'
  | 'breaking_news'
  | 'adversarial'
  | 'deepfake_check';

export interface InvestigatorProfile {
  id: string;
  name: string;
  avatarSeed: string;
  reputationScore: number; // 0-1000, drives "Level"
  badges: string[]; // badge ids unlocked
  completedMissions: MissionResult[];
  competency: Record<CheckType, number>; // 0-100 rolling skill score
  createdAt: string;
}

export interface DecisionStep {
  step: CheckType | 'verdict';
  action: string; // human-readable, e.g. "Computed SHA-256 hash"
  result: 'pass' | 'fail';
  timestamp: string;
}

export interface MissionResult {
  missionId: string;
  correct: boolean;
  submittedVerdict: Verdict;
  timeTakenSeconds: number;
  hintsUsed: number;
  stepsLog: DecisionStep[];
  completedAt: string;
}

export interface Block {
  index: number;
  timestamp: string;
  content: string;
  contentHash: string;
  prevHash: string;
  tampered: boolean; // computed at runtime, not stored as truth
}

export interface Publisher {
  id: string;
  name: string;
  publicKeyJwk: JsonWebKey;
  trusted: boolean;
  privateKeyJwk?: JsonWebKey;
}

export interface SignedAsset {
  content: string;
  signatureBase64: string;
  claimedPublisherId: string;
}

export interface Mission {
  id: string;
  level: MissionLevel;
  type: MissionType;
  title: string;
  briefing: string; // the "case file" narrative
  requiredChecks: CheckType[]; // which tools the student must use
  chain?: Block[]; // pre-seeded chain, if relevant
  signedAsset?: SignedAsset; // pre-seeded signed content, if relevant
  correctVerdict: Verdict;
  hints: string[]; // progressive hints, revealed on request
  xpReward: number;
  recommendedBadge?: string;

  // Custom helper fields to generate evidence dynamically
  chainContents?: string[];
  tamperBlockIndex?: number;
  tamperBlockContent?: string;
  signedAssetContent?: string;
  signedAssetPublisherId?: string;
  signedAssetTampered?: boolean;
}

