import type { DeckComposition, Rank } from './types'
import { ALL_RANKS, buildShoeComposition } from './constants'

const LOW_RANKS: Rank[] = ['2', '3', '4', '5', '6']   // Hi-Lo +1
const HIGH_RANKS: Rank[] = ['T', 'A']                  // Hi-Lo -1

export function totalRemainingCards(composition: DeckComposition): number {
  return Object.values(composition).reduce((a, b) => a + b, 0)
}

export function computeRunningCount(composition: DeckComposition, decks: number): number {
  const full = buildShoeComposition(decks)
  let rc = 0
  for (const rank of LOW_RANKS) {
    rc += full[rank] - composition[rank]
  }
  for (const rank of HIGH_RANKS) {
    rc -= full[rank] - composition[rank]
  }
  return rc
}

export function computeTrueCount(composition: DeckComposition, decks: number): number {
  const remaining = totalRemainingCards(composition)
  if (remaining === 0) return 0
  const rc = computeRunningCount(composition, decks)
  return rc / (remaining / 52)
}

export interface DerivedCountState {
  rc: number
  effectiveTc: number
  composition?: DeckComposition
}

/**
 * Builds a DeckComposition that approximates a given running count at a given
 * penetration percentage. Cards are dealt proportionally, then low/high counts
 * are adjusted to hit the target RC.
 *
 * @param decks - Number of decks in the shoe
 * @param remainingPct - Percentage of shoe remaining (0–100)
 * @param targetRC - Desired running count
 */
export function buildCompositionFromRcPenetration(
  decks: number,
  remainingPct: number,
  targetRC: number,
): DeckComposition {
  const full = buildShoeComposition(decks)
  const totalCards = totalRemainingCards(full)

  // Edge cases
  if (remainingPct >= 100) return { ...full }
  if (remainingPct <= 0) {
    return Object.fromEntries(ALL_RANKS.map(r => [r, 0])) as DeckComposition
  }

  const dealtTotal = Math.round(totalCards * (1 - remainingPct / 100))

  // Distribute dealt cards proportionally across ranks using largest-remainder method
  const rawDealt = ALL_RANKS.map(r => dealtTotal * (full[r] / totalCards))
  const floored = rawDealt.map(Math.floor)
  const remainderSum = dealtTotal - floored.reduce((a, b) => a + b, 0)
  const remainders = rawDealt.map((v, i) => v - floored[i])
  // Sort indices by remainder descending, pick top `remainderSum`
  const order = remainders
    .map((r, i) => ({ r, i }))
    .sort((a, b) => b.r - a.r)
  for (let k = 0; k < remainderSum; k++) {
    floored[order[k].i]++
  }

  // Build remaining composition after proportional removal
  const remaining: DeckComposition = Object.fromEntries(
    ALL_RANKS.map((r, i) => [r, full[r] - floored[i]])
  ) as DeckComposition

  // Compute neutral RC from proportional removal
  let neutralRC = 0
  for (const rank of LOW_RANKS) neutralRC += full[rank] - remaining[rank]
  for (const rank of HIGH_RANKS) neutralRC -= full[rank] - remaining[rank]

  const rcDelta = targetRC - neutralRC

  if (rcDelta > 0) {
    // Remove extra low cards to increase RC
    let toRemove = rcDelta
    for (const rank of LOW_RANKS) {
      if (toRemove <= 0) break
      const canRemove = Math.min(remaining[rank], toRemove)
      remaining[rank] -= canRemove
      toRemove -= canRemove
    }
  } else if (rcDelta < 0) {
    // Remove extra high cards to decrease RC
    let toRemove = -rcDelta
    for (const rank of HIGH_RANKS) {
      if (toRemove <= 0) break
      const canRemove = Math.min(remaining[rank], toRemove)
      remaining[rank] -= canRemove
      toRemove -= canRemove
    }
  }

  // Clamp all to [0, full[rank]]
  for (const rank of ALL_RANKS) {
    remaining[rank] = Math.max(0, Math.min(full[rank], remaining[rank]))
  }

  return remaining
}

export function deriveCountState(
  tc: number,
  decks: number,
  remainingPct = 50,
): DerivedCountState {
  const rawRc = Math.trunc(tc * decks * (remainingPct / 100))
  const rc = Object.is(rawRc, -0) ? 0 : rawRc

  if (rc === 0) {
    return {
      rc: 0,
      effectiveTc: 0,
    }
  }

  const composition = buildCompositionFromRcPenetration(decks, remainingPct, rc)

  return {
    rc,
    effectiveTc: computeTrueCount(composition, decks),
    composition,
  }
}
