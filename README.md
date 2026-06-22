# VeriBlock — Build Specification for Antigravity

**Read this entire document before writing any code.** This is the single source of truth for what to build, in what order, and how to verify each step before moving to the next. Do not skip ahead. Do not invent scope that isn't in here without checking with the user first.

---

## 0. How to work this spec (rules of engagement)

1. **Page by page, phase by phase.** Each phase in Section 8 is a complete, runnable increment. Finish a phase, run the app, visually confirm the page works and matches its acceptance criteria, *then* move to the next phase. Never build three pages in parallel and wire them up at the end.
2. **Stop and report after every phase.** Tell the user what was built, show how to run/view it, and call out any deviation from this spec before continuing.
3. **Don't fake the cryptography.** SHA-256 and signature verification must use the browser's real `Web Crypto API` (`crypto.subtle`), not a placeholder string or a fake "looks like a hash" function. This is the entire educational point of the product — see Section 7.1.
4. **Don't add a backend.** This build is 100% client-side. All persistence is `localStorage`. If you find yourself wanting an API route or a database, stop — that's out of scope (see Section 2).
5. **If something in this spec is ambiguous or you need to deviate, ask before proceeding** rather than guessing silently.
6. **Accessibility is not a later pass.** Every component you build needs keyboard focus states, semantic HTML, and ARIA labels where it's not implicit, from the first commit — not bolted on at the end.

---

## 1. Project context (why this exists)

VeriBlock is an educational web app that teaches 10–14-year-olds how to detect misinformation and deepfakes — not through "spot the fake" heuristics, but by giving them the actual mechanics that make digital trust possible: cryptographic hashing, blockchain-style tamper-evidence, and digital signatures.

The product's core teaching thesis, taken directly from the source materials: **AI deepfake detection is a losing arms race; provenance is not.** If a piece of content can't be traced back to a cryptographically verified publisher, unmodified since signing, it should be treated as untrustworthy — regardless of how convincing it looks. The whole app is built to make that idea visceral and hands-on for a 12-year-old, using real SHA-256 hashing running live in their browser, not a metaphor for it.

Students play as **Digital Investigators** working through a "Mission Control" HQ, using three real tools — a Hash Lab, a Blockchain Explorer, and a Signature Verification Panel — to resolve "case files" (viral news stories, deepfake video alerts, election misinformation, etc.) and render a verdict: authentic or tampered.

Full source material lives in the four uploaded reference files (IEEE report, supporting report, two pitch decks). This spec distills them into a buildable plan.

---

## 2. Locked decisions & non-goals for v1

**Locked decisions (confirmed with the user):**

| Decision | Choice |
|---|---|
| v1 scope | Full single-player platform: all mission levels, student analytics dashboard, educator dashboard, adaptive difficulty engine. **No multiplayer.** |
| Stack | React + Vite + Tailwind CSS |
| Persistence | Client-side only — `localStorage`. No backend, no database, no auth server. |

**Explicitly out of scope for v1 — do not build these unless the user asks again:**

- Multiplayer / collaborative sessions, shared evidence boards, WebSocket/Socket.io anything.
- Any real backend (Node/Express API, Firebase, Supabase, PostgreSQL/Mongo).
- Real blockchain network integration (Ethereum Sepolia, Hyperledger) — this is a *simulated* chain, in-browser only.
- Actual AI-based deepfake/media-pixel detection. The product's stance is explicitly **provenance over pixel analysis** — don't build a CV model.
- Multilingual i18n, curriculum-alignment tooling, competition/leaderboard backends, research-partnership features. These are Year-2+ ideas in the source roadmap, not v1.

---

## 3. Tech stack & project setup

```
npm create vite@latest veriblock -- --template react-ts
cd veriblock
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

- **Framework:** React 18 + TypeScript, via Vite.
- **Styling:** Tailwind CSS, extended with the design tokens in Section 4 (do not ship default Tailwind blue/gray theme — this product has a specific visual identity, defined below).
- **Routing:** `react-router-dom` (hash or browser router — browser router is fine since this deploys as a static site).
- **State:** React Context + hooks is sufficient. No Redux needed for v1.
- **Crypto:** Native `window.crypto.subtle` (Web Crypto API). No `crypto-js`, no polyfills — every supported school Chromebook/laptop browser has this natively.
- **Charts (analytics dashboards):** `recharts` is fine, or hand-rolled SVG if simpler — your call.
- **Animation:** CSS transitions / `@keyframes` for the avalanche-effect and tamper-propagation animations (Section 4, "Signature element"). Don't pull in a heavy animation library for this.
- **No backend.** Deploy target is a static build (Netlify/Vercel-style), but actual deployment is out of scope for this build pass — just get it running locally first.

### Folder structure

```
src/
  main.tsx
  App.tsx
  routes/                  -- one file per top-level page/route
  components/
    common/                -- buttons, cards, badges, tooltips, status pills
    dashboard/
    hashlab/
    chainexplorer/
    signaturepanel/
    mission/
    analytics/
    educator/
  engines/
    crypto.ts              -- sha256Hex(), genKeyPair(), sign(), verify()
    blockchain.ts          -- Block type, buildChain(), tamperBlock(), validateChain()
    adaptive.ts            -- competency scoring + threshold logic
    storage.ts             -- typed localStorage read/write helpers
  data/
    missions.ts            -- mission definitions (Section 9)
    publishers.ts           -- trusted publisher directory (Section 7.2)
    badges.ts
  types/
    index.ts               -- shared TypeScript interfaces (Section 6)
  styles/
    tokens.css             -- CSS variables backing the Tailwind theme
```

---

## 4. Design system

**Do not reach for a generic AI-default look here** (cream-background-serif, or near-black-with-one-random-neon-accent chosen arbitrarily). The visual identity below is taken directly from the source mockups — it's the brief's actual content, not a stylistic default, so follow it deliberately and specifically.

### Palette (CSS variables)

```css
--bg-void:        #0B0F14;   /* main app background — dark HQ */
--bg-panel:       #131B22;   /* card/panel surface */
--bg-panel-raised:#1B2530;   /* hover/raised surface */
--border-hairline:#28323D;
--text-primary:   #E8EDF2;
--text-dim:       #8A97A3;
--state-verified: #2BD97C;   /* "Cyber Green" — verified / authentic */
--state-tampered: #FF4D4F;   /* "Alert Red" — tampered / invalid */
--state-unverified:#F5A623;  /* "Amber" — unverified / pending */
--accent-gold:    #D4AF37;   /* signature-verified lock, achievement highlights */
```

### Typography

- **Display/UI face** (headings, nav, buttons): `Sora` or `Space Grotesk` — geometric, technical-feeling, used with restraint (don't set body copy in it).
- **Body face** (mission briefs, explanations, tooltips): `Inter`.
- **Data/mono face** (hashes, block fields, timestamps, signatures, terminal-style alert feed): `JetBrains Mono` — this is called out explicitly in the source mockups for hash/block data and must read as genuinely technical, monospaced, slightly terminal-like.

### Signature element (the one thing this app is remembered by)

**The Avalanche Shatter.** When a student changes even one character of input in the Hash Lab (or tampers with a block in the Chain Explorer), the resulting hash doesn't just update — it visibly "shatters": a brief glitch/scramble transition through randomized hex characters before settling on the real new hash, accompanied by the panel flashing from green to red. This is literally the subject's own most characteristic phenomenon (the SHA-256 avalanche effect) turned into the page's signature interaction — reuse this same transition anywhere a verified state flips to tampered (Chain Explorer block flip, Signature Panel rejection). Keep every *other* animation in the app quiet and purposeful by comparison — this is the one place to spend visual energy.

### Layout concept

Mission Control is a command-center grid: a profile/status strip across the top, a primary case-file/active-mission card on the left, a center "toolkit" launcher (Hash Lab / Chain Explorer / Signature Panel), and a live, scrolling monospaced alert feed along the bottom — exactly as described in the source mockups. Sub-tools (Hash Lab, Chain Explorer, Signature Panel) are full-screen focused workspaces, not crammed into the dashboard.

### Interaction & copy conventions

- Status is always color-coded the same way everywhere: green = verified/authentic, red = tampered/invalid, amber = unverified/pending. Never reuse these three colors for anything else in the UI.
- Buttons name the action, not the mechanism: "Submit Verdict," not "Run Validation." A button labeled "Verify Signature" should produce a result that says "Signature Verified" or "Signature Rejected" — keep the vocabulary consistent through the whole flow.
- Empty/locked states (e.g., a mission tier not yet unlocked) explain what unlocks it, not just that it's locked.
- All interactive elements need a visible focus ring (don't suppress `:focus` outlines) and full keyboard operability.

---

## 5. Information architecture (routes)

| Route | Page | Notes |
|---|---|---|
| `/` | Onboarding / Create Investigator | First-run only; redirects to `/dashboard` if a profile already exists in localStorage |
| `/dashboard` | Mission Control (home hub) | |
| `/tools/hash-lab` | Hash Computation Lab | Standalone tool, also embedded contextually inside missions |
| `/tools/chain-explorer` | Blockchain Explorer | Standalone tool + embedded in missions |
| `/tools/signature-panel` | Signature Verification Panel | Standalone tool + embedded in missions |
| `/missions` | Mission Library / Select | Grouped by Beginner / Intermediate / Advanced / Expert |
| `/missions/:missionId` | Mission Investigation Screen | The case-file workspace tying the three tools together |
| `/missions/:missionId/replay` | Decision Replay | Shown right after verdict submission, also revisitable from analytics |
| `/analytics` | Student Analytics Dashboard | Personal competency + badges |
| `/educator` | Educator Dashboard | Reads all investigator profiles stored in this browser (see Section 6) |

A persistent top nav (Dashboard / Missions / Tools / Analytics / Educator) is present on every authenticated route except onboarding.

---

## 6. Data model & storage

All data lives under a single localStorage namespace, e.g. `veriblock:v1:*`. Use the `engines/storage.ts` helpers — never call `localStorage` directly from components.

```ts
// types/index.ts

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
  reputationScore: number;       // 0-1000, drives "Level"
  badges: string[];               // badge ids unlocked
  completedMissions: MissionResult[];
  competency: Record<CheckType, number>; // 0-100 rolling skill score, drives adaptive engine
  createdAt: string;
}

export interface DecisionStep {
  step: CheckType | 'verdict';
  action: string;          // human-readable, e.g. "Computed SHA-256 hash"
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
  tampered: boolean;       // computed at runtime, not stored as truth
}

export interface Publisher {
  id: string;
  name: string;
  publicKeyJwk: JsonWebKey;
  trusted: boolean;
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
  briefing: string;            // the "case file" narrative
  requiredChecks: CheckType[];  // which tools the student must use
  chain?: Block[];              // pre-seeded chain, if relevant
  signedAsset?: SignedAsset;    // pre-seeded signed content, if relevant
  correctVerdict: Verdict;
  hints: string[];              // progressive hints, revealed on request
  xpReward: number;
}
```

**Storage keys:**

- `veriblock:v1:profiles` → `InvestigatorProfile[]` (supports multiple local profiles, e.g. several students sharing a classroom device — this is what makes the Educator Dashboard meaningful without a backend)
- `veriblock:v1:activeProfileId` → string
- `veriblock:v1:publisherKeys` → generated keypairs (public parts only need persisting; see Section 7.2)

---

## 7. Core engines

### 7.1 Crypto engine (`engines/crypto.ts`)

This is the credibility of the entire product — implement it for real.

```ts
export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function generatePublisherKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  );
}

export async function signContent(privateKey: CryptoKey, content: string): Promise<string> {
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(content)
  );
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

export async function verifySignature(
  publicKey: CryptoKey,
  content: string,
  signatureBase64: string
): Promise<boolean> {
  const sigBytes = Uint8Array.from(atob(signatureBase64), c => c.charCodeAt(0));
  return crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    publicKey,
    sigBytes,
    new TextEncoder().encode(content)
  );
}
```

Use `crypto.subtle.exportKey('jwk', ...)` / `importKey` to move keys in and out of localStorage as plain JSON (JWK format) since `CryptoKey` objects themselves aren't serializable.

### 7.2 Trusted publisher directory (`data/publishers.ts`)

On first app load, generate 3–4 ECDSA key pairs once (e.g. "Global News Network," "Science Institute," "Educational Consortium" — names taken directly from the source mockup), export the public keys, and persist them. These are the app's "trusted directory" used in the Signature Panel.

For **adversarial / tampered** missions, generate a *separate, untrusted* key pair, sign the fake content with it, but present it to the student as if claiming to be a trusted publisher. Verification will correctly fail because the signature doesn't validate against the claimed publisher's real public key — this is the actual mechanism, not a scripted "this one is fake" flag. The mission's `correctVerdict` should be derivable purely from running real crypto, never hardcoded as a shortcut in the UI logic.

### 7.3 Blockchain engine (`engines/blockchain.ts`)

```ts
export async function buildChain(contents: string[]): Promise<Block[]> {
  const chain: Block[] = [];
  let prevHash = '0'.repeat(64);
  for (let i = 0; i < contents.length; i++) {
    const contentHash = await sha256Hex(contents[i] + prevHash);
    chain.push({ index: i, timestamp: new Date().toISOString(), content: contents[i], contentHash, prevHash, tampered: false });
    prevHash = contentHash;
  }
  return chain;
}

export function tamperBlock(chain: Block[], index: number, newContent: string): Block[] {
  // mutate one block's content; downstream hashes are recomputed lazily by validateChain,
  // which is what produces the cascading "INVALID" effect the student observes.
}

export async function validateChain(chain: Block[]): Promise<Block[]> {
  // recompute each block's expected hash given its stored content + prevHash,
  // flag tampered: true on the first mismatch and every block after it.
}
```

The cascading-failure visual (Section 4, signature element) is driven directly by this validation pass — don't fake the propagation animation independently of the actual recomputation.

### 7.4 Adaptive difficulty engine (`engines/adaptive.ts`)

Implements the flowchart from the source material: *Mission Completed → Evaluate metrics (accuracy, time, hint usage) → above threshold: advance complexity; below threshold: scaffolded review.*

```ts
export function scoreCompetency(prevScore: number, result: MissionResult): number {
  let delta = result.correct ? 12 : -10;
  delta -= result.hintsUsed * 3;
  return Math.max(0, Math.min(100, prevScore + delta));
}

export function nextRecommendation(competency: Record<CheckType, number>): 'advance' | 'review' {
  const avg = (competency.hash + competency.chain + competency.signature) / 3;
  return avg >= 70 ? 'advance' : 'review';
}
```

After each mission, update the profile's `competency` scores per check type used, then use `nextRecommendation` to decide whether the Mission Library highlights the next-tier mission as recommended, or instead surfaces a same-tier "review" mission with hints pre-expanded. Don't hard-lock tiers — let students attempt anything unlocked by level progression, but make the *recommendation* adaptive.

---

## 8. Build plan — phase by phase

Work through these in order. Each phase = one runnable increment with its own acceptance criteria. **Stop after each phase and confirm before continuing.**

### Phase 0 — Project scaffold
- Vite + React + TS project initialized, Tailwind configured with the tokens from Section 4 (as real Tailwind theme extensions, not inline hex everywhere).
- Folder structure from Section 3 created.
- `engines/storage.ts`, `engines/crypto.ts` written and unit-tested in isolation (a throwaway script or console check is fine — confirm `sha256Hex('hello')` matches the known SHA-256 of "hello").
- Router set up with placeholder pages for every route in Section 5.
- **Acceptance:** `npm run dev` runs, navigating between empty placeholder routes works, `sha256Hex` produces correct, verified output.

### Phase 1 — Onboarding / Create Investigator (`/`)
- Simple form: investigator name + avatar seed/picker. On submit, create an `InvestigatorProfile` (Section 6), store it, set as active, redirect to `/dashboard`.
- If a profile already exists for this browser, skip straight to `/dashboard` (don't force re-onboarding every load) — but add a small "switch / add investigator" affordance, since multiple local profiles matter for the Educator Dashboard later.
- **Acceptance:** Fresh browser → onboarding shown → profile created → persists across reload → lands on dashboard.

### Phase 2 — Mission Control Dashboard (`/dashboard`)
- Investigator profile strip (name, reputation score, level derived from score).
- Active/recommended mission card (pulls from adaptive engine's recommendation once missions exist — stub with "no active mission yet" until Phase 6/7 are done, then wire it).
- Toolkit launcher: three cards linking to Hash Lab, Chain Explorer, Signature Panel.
- Live alert feed: a scrolling list of flavor-text system events (e.g., "BLOCK #1452 CONFIRMED", "SIGNATURE MISMATCH DETECTED") — purely atmospheric for now, generated client-side, monospace styled.
- **Acceptance:** Dashboard renders fully styled per Section 4, all three toolkit links navigate correctly, alert feed animates/scrolls.

### Phase 3 — Hash Computation Lab (`/tools/hash-lab`)
- Split-screen: text input (left) → live SHA-256 hex output (right), recomputed on every keystroke via the real crypto engine.
- Avalanche/shatter transition (Section 4) plays when the hash changes.
- A "change-sensitivity" readout: percentage of output hex characters that differ from the previous hash.
- Explanation side panel + a couple of contextual hints (static copy is fine here).
- **Acceptance:** Typing a single character changes the entire hash output; the shatter animation plays; the sensitivity readout updates correctly.

### Phase 4 — Blockchain Explorer (`/tools/chain-explorer`)
- Renders a horizontal chain of blocks (index, timestamp, truncated content hash w/ tooltip for full hash, prev hash) using `buildChain`/`validateChain`.
- Clicking a block expands full detail.
- A "tamper this block" control lets the student edit a block's content; on save, `validateChain` reruns and every downstream block visibly flips to the tampered/invalid state with the cascading animation.
- **Acceptance:** Tampering block N turns blocks N through end red/invalid; block 0..N-1 remain green; reloading resets to a fresh demo chain.

### Phase 5 — Signature Verification Panel (`/tools/signature-panel`)
- Lock-and-key visual metaphor per Section 4.
- Left: content + its claimed signature. Right: trusted publisher directory (Section 7.2) to choose a public key against.
- "Verify" button runs real `verifySignature`; shows golden-lock/green-check on success or broken-lock/red-X on failure, with a one-line plain-English explanation of what passed or failed.
- **Acceptance:** Verifying a genuinely signed asset against the correct publisher passes; verifying a forged/mismatched asset fails — both outcomes driven by real crypto, not a hardcoded flag.

### Phase 6 — Mission Library (`/missions`)
- Missions grouped into the four tiers (Section 9), each shown as a case-file card (title, type, short teaser, lock/unlock state, "recommended" badge if the adaptive engine flags it).
- Tier unlock rule: Beginner always unlocked; each subsequent tier unlocks once N missions of the prior tier are completed (pick a sane N, e.g. 3).
- **Acceptance:** All defined missions (Section 9) render in the correct tier; locked tiers show what unlocks them; clicking an unlocked mission navigates to `/missions/:id`.

### Phase 7 — Mission Investigation Screen (`/missions/:missionId`)
- Case-file layout: mission briefing, the content under investigation, and a verification checklist matching the mission's `requiredChecks` (hash / chain / signature), each item driven by the actual tool logic (embed simplified versions of the Phase 3–5 components, or route the student to the standalone tool and bring them back with a result flag — your call, but the verification must be real, not a checkbox the student just ticks).
- "Submit Verdict" enabled only once required checks are complete; compares student's verdict to `correctVerdict`, builds the `MissionResult` + `DecisionStep[]` log, updates the profile (reputation, competency via the adaptive engine, badges if thresholds crossed), and redirects to the replay screen.
- **Acceptance:** Completing a mission updates `localStorage` profile state correctly; an intentionally wrong verdict is recorded as incorrect (not silently passed); revisiting `/missions` reflects the new unlock state if a tier threshold was crossed.

### Phase 8 — Decision Replay (`/missions/:missionId/replay`)
- Timestamped log of the `DecisionStep[]` from the just-completed mission, with a plain-language note on what an alternative/faster path could have looked like.
- Reachable again later from the Analytics dashboard's mission history.
- **Acceptance:** Replay accurately reflects the actual steps taken in that run, in order.

### Phase 9 — Student Analytics Dashboard (`/analytics`)
- Visual breakdown of the metrics in the source material's metric table: mission completion rate, verification accuracy, avg time-to-decision, hint utilization, tamper-detection rate, signature-verification score.
- Competency bars per check type (hash/chain/signature), badge case, mission history list linking back to individual replays.
- **Acceptance:** All numbers are computed from real stored `MissionResult[]` data, not mocked — verify by completing 2–3 missions and confirming the dashboard reflects them.

### Phase 10 — Educator Dashboard (`/educator`)
- Reads **all** `InvestigatorProfile`s in this browser's localStorage (Section 6 — this is the no-backend workaround for "class view"), shows a roster table: name, level, completion rate, accuracy, tamper-detection accuracy, hint usage.
- Selecting a student drills into their analytics view (reuse Phase 9 components).
- Add a clear, honest note in the UI that this view is scoped to "investigators on this device" — don't imply it pulls from a real class roster across devices, since there's no backend.
- **Acceptance:** Creating a second profile (via the "switch/add investigator" affordance from Phase 1) and completing a mission on it produces a second row in this roster.

### Phase 11 — Content pass: all 15 missions
- Write out every mission defined in Section 9 in full (`data/missions.ts`), following the schema and tone of the worked examples given there.
- **Acceptance:** Every mission in Section 9's table exists, is reachable, completable, and produces a correct/incorrect verdict outcome that matches its intended `correctVerdict` when solved honestly with the real tools.

### Phase 12 — Polish & accessibility pass
- Keyboard-only walkthrough of every page (tab order, focus rings, no dead ends).
- Screen-reader spot check on status pills, checklist items, and the verdict result (ARIA-live region for verdict outcome is a good idea).
- Responsive check at tablet width (this is meant to run on school Chromebooks).
- Empty/zero states everywhere (new profile with no missions completed, etc.) — written in the interface's voice per Section 4's copy conventions, not left blank.
- **Acceptance:** A full keyboard-only pass through onboarding → one mission → analytics is possible with no mouse.

---

## 9. Mission content

15 missions total across four tiers, matching the source material's progression table.

| # | Level | Type | Title | Required checks | Correct verdict |
|---|---|---|---|---|---|
| 1–4 | Beginner | hash_verification | "Single Hash Verification" (×4, varying content) | hash | mixed (2 authentic, 2 tampered) |
| 5–8 | Intermediate | chain_integrity | "Chain Integrity Check" (×4) | hash, chain | mixed |
| 9–11 | Advanced | publisher_verification / adversarial | "Multi-Source Investigation" (×3) | hash, chain, signature | mixed |
| 12–13 | Advanced | adversarial | "Adversarial Challenge" (×2) | hash, signature | tampered |
| 14–15 | Expert | breaking_news / deepfake_check | "Live Breaking News Scenario" (×2) | hash, chain, signature | mixed, time-pressured |

### Worked examples (use as the template/tone for the rest)

**Mission 1 — Beginner — "The Quick Brown Fox"**
- Type: `hash_verification`
- Briefing: *"A reader claims this headline was altered after publication. The newsroom's original hash is on file. Confirm whether the version you're holding matches it."*
- Required checks: `hash`
- Mechanic: present original content + its recorded hash; student pastes the current version into the Hash Lab and compares.
- Correct verdict: `tampered` (one word has been silently changed).

**Mission 5 — Intermediate — "Block #1025"**
- Type: `chain_integrity`
- Briefing: *"Three consecutive blocks from the city archive's record chain look suspicious. Trace the chain and find where it breaks."*
- Required checks: `hash`, `chain`
- Mechanic: a 4-block chain with block #2's content quietly altered; student must locate the first invalid link, not just confirm "something's wrong."
- Correct verdict: `tampered`.

**Mission 9 — Advanced — "The Climate Accord Photo"**
- Type: `publisher_verification`
- Briefing: *"This photo and caption are credited to Global News Network. Verify the claimed signature against the trusted directory before this spreads further."*
- Required checks: `hash`, `signature`
- Mechanic: genuinely signed by the real Global News Network key → verification passes.
- Correct verdict: `authentic`.

**Mission 12 — Advanced — "Senator Thompson's Crypto-Tax Announcement"** *(taken directly from the source mockup)*
- Type: `adversarial`
- Briefing: *"BREAKING: Senator Thompson Announces Radical New Crypto-Tax — viral post, 2.4M views, claims to nationalize digital assets within 24 hours. Before this spreads further: verify it."*
- Required checks: `hash`, `chain`, `signature`
- Mechanic: hash check passes (content matches what was hashed), but the claimed signature does not validate against any trusted publisher's real public key — exposing it as unverified/forged despite looking legitimate.
- Correct verdict: `tampered`.

**Mission 14 — Expert — "Deepfake Video Alert"**
- Type: `deepfake_check`
- Briefing: *"A video of a public figure making a controversial statement is going viral. Check whether it has any verified provenance record at all before forming a judgment based on how convincing it looks."*
- Required checks: `hash`, `chain`, `signature`
- Mechanic: the asset has **no** matching blockchain record and **no** valid publisher signature — the lesson is that absence of provenance, not pixel artifacts, is the tell.
- Correct verdict: `tampered`.

Generate missions 2–4, 6–8, 10–11, 13, and 15 following this same pattern (real scenario framing, 1–2 sentence briefing, a deliberate, honest mechanic that produces the correct verdict through real crypto rather than a scripted flag). Pull additional scenario flavor from Section 6.4 of the IEEE report (election misinformation, scientific misinformation citing a research institution) for variety. **Show the full mission list to the user for a quick content review before treating Phase 11 as done** — copy quality matters here since this is what a 12-year-old reads.

---

## 10. Definition of done for v1

- All 12 phases in Section 8 complete and individually verified.
- All 15 missions in Section 9 written, playable, and resolving correctly.
- No backend calls anywhere in the network tab — confirm this explicitly.
- Full keyboard-only walkthrough possible.
- `npm run build` produces a deployable static bundle with no console errors.

---

## Appendix — source material map

| Source file | What it contributed to this spec |
|---|---|
| `VeriBlock_IEEE_Report_v2.docx` / `VeriBlock_IEEE_Supporting_Report.docx` | Pedagogical framework (Sections 1–3, 7–9 of the report), full tech stack recommendation, mission taxonomy, metrics table, roadmap |
| `VeriBlock_Detective_Academy.pdf` | Role model (Content Creator / Digital Investigator / Blockchain Validator / Adversarial Actor), UI mockups for Hash Lab, Node Explorer, Signature Panel, Mission Control, Mission Investigation screen |
| `VeriBlock_Digital_Trust_Engine.pdf` | Threat framing (6x misinformation spread rate), architecture stack confirmation, accessibility/equity requirements, phased roadmap, deployment feasibility notes |
