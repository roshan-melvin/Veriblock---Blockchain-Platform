import { sha256Hex } from './crypto';
import type { Block } from '../types';

/**
 * Build a blockchain from an array of content strings.
 * Each block's contentHash is the SHA-256 of its content,
 * and prevHash links to the previous block's contentHash.
 */
export async function buildChain(contents: string[]): Promise<Block[]> {
  const chain: Block[] = [];

  for (let i = 0; i < contents.length; i++) {
    const content = contents[i];
    const contentHash = await sha256Hex(content);
    const prevHash = i === 0 ? '0'.repeat(64) : chain[i - 1].contentHash;

    chain.push({
      index: i,
      timestamp: new Date(Date.now() - (contents.length - i) * 60000).toISOString(),
      content,
      contentHash,
      prevHash,
      tampered: false,
    });
  }

  return chain;
}

/**
 * Validate a chain by recomputing hashes and checking links.
 * Returns a new array of blocks with the `tampered` flag set correctly.
 */
export async function validateChain(chain: Block[]): Promise<Block[]> {
  const validated: Block[] = [];

  for (let i = 0; i < chain.length; i++) {
    const block = chain[i];
    const expectedHash = await sha256Hex(block.content);
    const expectedPrevHash = i === 0 ? '0'.repeat(64) : validated[i - 1].contentHash;

    // A block is tampered if its content hash doesn't match the recomputed hash,
    // OR if its prevHash doesn't match what it should link to.
    // Once a block is tampered, all subsequent blocks are also invalid
    // because their prevHash chain is broken.
    const contentTampered = block.contentHash !== expectedHash;
    const linkBroken = block.prevHash !== expectedPrevHash;
    const previouslyTampered = i > 0 && validated[i - 1].tampered;

    validated.push({
      ...block,
      tampered: contentTampered || linkBroken || previouslyTampered,
    });
  }

  return validated;
}

/**
 * Tamper with a specific block by changing its content.
 * This does NOT recompute the hash — the mismatch is the point.
 * The chain must be re-validated after tampering to see cascading effects.
 */
export function tamperBlock(chain: Block[], index: number, newContent: string): Block[] {
  return chain.map((block, i) => {
    if (i === index) {
      return {
        ...block,
        content: newContent,
        // Leave contentHash unchanged — this creates the detectable mismatch
      };
    }
    return block;
  });
}
