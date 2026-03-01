import type {
  BlackjackRules,
  DeckComposition,
  DealerOutcomes,
  DealerUpcard,
  DisplayAction,
  EvBreakdown,
  Rank,
} from './types'
import { ALL_RANKS, INFINITE_DECK } from './constants'
import {
  addCard,
  dealerOutcomesNoBJ,
  dealerOutcomesFromUpcard,
  createDealerMemo,
} from './dealerProbabilities'

export { INFINITE_DECK, createDealerMemo }

// ---------------------------------------------------------------------------
// Stand EV
// ---------------------------------------------------------------------------

/**
 * EV of standing with playerTotal against the given dealer outcome distribution.
 * Returns expected value in units of the original bet (+1 = win, 0 = push, -1 = loss).
 */
export function evStand(playerTotal: number, dealerOutcomes: DealerOutcomes): number {
  let ev = dealerOutcomes.bust // win when dealer busts

  for (const t of [17, 18, 19, 20, 21] as const) {
    const p = dealerOutcomes[t]
    if (playerTotal > t) ev += p // win
    else if (playerTotal < t) ev -= p // lose
    // push: +0
  }

  return ev
}

// ---------------------------------------------------------------------------
// Hit EV (memoized per dealerOutcomes context)
// ---------------------------------------------------------------------------

/**
 * EV of hitting once from (total, isSoft), then playing optimally (hit/stand only).
 * hitMemo is keyed on `${total}_${isSoft ? 1 : 0}` for a fixed dealerOutcomes context.
 */
export function evHit(
  total: number,
  isSoft: boolean,
  dealerOutcomes: DealerOutcomes,
  composition: DeckComposition,
  hitMemo: Map<string, number>,
): number {
  const tw = Object.values(composition).reduce((a, b) => a + b, 0)
  let ev = 0

  for (const rank of ALL_RANKS) {
    const p = composition[rank] / tw
    const [newTotal, newSoft] = addCard(total, isSoft, rank)

    if (newTotal > 21) {
      ev -= p // bust
    } else {
      ev += p * evOptimalPostHit(newTotal, newSoft, dealerOutcomes, composition, hitMemo)
    }
  }

  return ev
}

/**
 * Optimal EV after hitting (can only stand or hit again; no double/split/surrender).
 */
export function evOptimalPostHit(
  total: number,
  isSoft: boolean,
  dealerOutcomes: DealerOutcomes,
  composition: DeckComposition,
  hitMemo: Map<string, number>,
): number {
  const key = `${total}_${isSoft ? 1 : 0}`
  const cached = hitMemo.get(key)
  if (cached !== undefined) return cached

  const standEV = evStand(total, dealerOutcomes)
  const hitEV = evHit(total, isSoft, dealerOutcomes, composition, hitMemo)
  const result = Math.max(standEV, hitEV)

  hitMemo.set(key, result)
  return result
}

// ---------------------------------------------------------------------------
// Double EV
// ---------------------------------------------------------------------------

/**
 * Whether the player can double given hand total and doubleRestriction rule.
 */
export function canDoubleHand(
  total: number,
  isSoft: boolean,
  restriction: BlackjackRules['doubleRestriction'],
): boolean {
  if (restriction === 'any') return true
  if (isSoft) return false // '9-11' and '10-11' only apply to hard totals
  if (restriction === '10-11') return total === 10 || total === 11
  // '9-11'
  return total >= 9 && total <= 11
}

/**
 * EV of doubling (draw exactly one card, then forced stand). Bet is doubled.
 * Returns null if doubling is not allowed by rules.
 */
export function evDouble(
  total: number,
  isSoft: boolean,
  dealerOutcomes: DealerOutcomes,
  composition: DeckComposition,
  restriction: BlackjackRules['doubleRestriction'],
): number | null {
  if (!canDoubleHand(total, isSoft, restriction)) return null

  const tw = Object.values(composition).reduce((a, b) => a + b, 0)
  let rawEV = 0

  for (const rank of ALL_RANKS) {
    const p = composition[rank] / tw
    const [newTotal] = addCard(total, isSoft, rank)

    if (newTotal > 21) {
      rawEV -= p
    } else {
      rawEV += p * evStand(newTotal, dealerOutcomes)
    }
  }

  return 2 * rawEV // bet is doubled
}

// ---------------------------------------------------------------------------
// Split EV
// ---------------------------------------------------------------------------

/**
 * EV of a single post-split hand starting with one card of pairRank.
 * Handles: hitSplitAces=false (forced stand after 1 card), DAS, RSA, maxSplits.
 */
export function evPostSplitHand(
  pairRank: Rank,
  splitsRemaining: number,
  dealerUpcard: DealerUpcard,
  dealerOutcomes: DealerOutcomes,
  rules: BlackjackRules,
  composition: DeckComposition,
  dealerMemo: Map<string, DealerOutcomes>,
): number {
  const tw = Object.values(composition).reduce((a, b) => a + b, 0)
  const startValue = pairRank === 'A' ? 11 : pairRank === 'T' ? 10 : parseInt(pairRank, 10)
  const startIsSoft = pairRank === 'A'
  let sum = 0

  for (const rank of ALL_RANKS) {
    const p = composition[rank] / tw
    const [newTotal, newSoft] = addCard(startValue, startIsSoft, rank)

    if (pairRank === 'A' && !rules.hitSplitAces) {
      // Aces: forced stand after exactly one drawn card
      if (rank === 'A' && rules.resplitAces && splitsRemaining > 0) {
        sum +=
          p *
          evPostSplitHand(
            'A',
            splitsRemaining - 1,
            dealerUpcard,
            dealerOutcomes,
            rules,
            composition,
            dealerMemo,
          )
      } else if (rank === 'T' && rules.blackjackAfterSplit) {
        sum += p * rules.blackjackPayout
      } else {
        sum += p * evStand(newTotal, dealerOutcomes)
      }
    } else {
      // Non-ace (or hitSplitAces=true): play hand normally
      if (rank === pairRank && splitsRemaining > 0 && pairRank !== 'A') {
        // Non-ace re-split
        sum +=
          p *
          evPostSplitHand(
            pairRank,
            splitsRemaining - 1,
            dealerUpcard,
            dealerOutcomes,
            rules,
            composition,
            dealerMemo,
          )
      } else {
        const postHitMemo = new Map<string, number>()
        sum += p * evOptimalPostSplit(newTotal, newSoft, dealerOutcomes, rules, composition, postHitMemo)
      }
    }
  }

  return sum
}

/**
 * Optimal EV for a post-split hand (can hit, stand, double if DAS; cannot split or surrender).
 */
function evOptimalPostSplit(
  total: number,
  isSoft: boolean,
  dealerOutcomes: DealerOutcomes,
  rules: BlackjackRules,
  composition: DeckComposition,
  hitMemo: Map<string, number>,
): number {
  const standEV = evStand(total, dealerOutcomes)
  let best = standEV

  const hitEV = evHit(total, isSoft, dealerOutcomes, composition, hitMemo)
  if (hitEV > best) best = hitEV

  if (rules.doubleAfterSplit) {
    const dblEV = evDouble(total, isSoft, dealerOutcomes, composition, rules.doubleRestriction)
    if (dblEV !== null && dblEV > best) best = dblEV
  }

  return best
}

/**
 * EV of the split action for a pair of pairRank.
 * Returns 2 × evPostSplitHand (two independent initial hands under infinite deck).
 */
export function evSplit(
  pairRank: Rank,
  dealerUpcard: DealerUpcard,
  dealerOutcomes: DealerOutcomes,
  rules: BlackjackRules,
  composition: DeckComposition,
  dealerMemo: Map<string, DealerOutcomes>,
): number {
  const initialSplits =
    pairRank === 'A'
      ? rules.resplitAces
        ? rules.maxSplits - 1
        : 0
      : rules.maxSplits - 1

  const singleHandEV = evPostSplitHand(
    pairRank,
    initialSplits,
    dealerUpcard,
    dealerOutcomes,
    rules,
    composition,
    dealerMemo,
  )
  return 2 * singleHandEV
}

// ---------------------------------------------------------------------------
// Optimal EV (main decision function)
// ---------------------------------------------------------------------------

export interface EvOptimalResult {
  ev: number
  action: DisplayAction
  breakdown: EvBreakdown
}

/**
 * Computes the optimal EV and best action for a given hand, plus the EV of every available action.
 *
 * dealerOutcomes must be pre-computed for this upcard (conditioned on no-BJ if applicable).
 * canSplit: set false for post-hit hands.
 * canSurrender: set false for post-split hands.
 */
export function evOptimal(
  total: number,
  isSoft: boolean,
  isPair: boolean,
  pairRank: Rank | null,
  dealerUpcard: DealerUpcard,
  dealerOutcomes: DealerOutcomes,
  rules: BlackjackRules,
  composition: DeckComposition,
  dealerMemo: Map<string, DealerOutcomes>,
  hitMemo: Map<string, number>,
  canSplit = true,
  canSurrender = true,
  /**
   * Effective surrender threshold for the comparison only — used when the
   * surrender decision is made before dealer peek (early surrender vs A/T).
   * The threshold is (-0.5 + pBJ) / (1 - pBJ), which is more permissive than
   * -0.5 (the actual outcome). breakdown.R always reports -0.5.
   */
  effectiveSurrenderThreshold?: number,
): EvOptimalResult {
  const standEV = evStand(total, dealerOutcomes)
  const hitEV = evHit(total, isSoft, dealerOutcomes, composition, hitMemo)
  const dblEV = evDouble(total, isSoft, dealerOutcomes, composition, rules.doubleRestriction)
  const splitEV =
    canSplit && isPair && pairRank !== null
      ? evSplit(pairRank, dealerUpcard, dealerOutcomes, rules, composition, dealerMemo)
      : null
  const surrenderEV = canSurrender && rules.surrender !== 'none' ? -0.5 : null

  const breakdown: EvBreakdown = {
    S: standEV,
    H: hitEV,
    D: dblEV,
    P: splitEV,
    R: surrenderEV,
  }

  // Pick best action. For surrender, use the effective threshold for comparison
  // but always report the actual EV (-0.5) if chosen.
  const surrenderThreshold = surrenderEV !== null ? (effectiveSurrenderThreshold ?? surrenderEV) : null

  let best: { ev: number; action: DisplayAction } = { ev: standEV, action: 'S' }
  if (hitEV > best.ev) best = { ev: hitEV, action: 'H' }
  if (dblEV !== null && dblEV > best.ev) best = { ev: dblEV, action: 'D' }
  if (splitEV !== null && splitEV > best.ev) best = { ev: splitEV, action: 'P' }
  if (surrenderThreshold !== null && surrenderThreshold > best.ev) best = { ev: -0.5, action: 'R' }

  return { ...best, breakdown }
}

// ---------------------------------------------------------------------------
// Dealer outcome helper for strategy/house edge callers
// ---------------------------------------------------------------------------

/**
 * Get dealer outcomes appropriate for strategy table computation.
 * Uses no-BJ conditioning for A/T upcards with dealer peek.
 */
export function getDealerOutcomesForStrategy(
  dealerUpcard: DealerUpcard,
  rules: BlackjackRules,
  composition: DeckComposition,
  dealerMemo: Map<string, DealerOutcomes>,
): DealerOutcomes {
  if (rules.dealerPeek && (dealerUpcard === 'A' || dealerUpcard === 'T')) {
    return dealerOutcomesNoBJ(dealerUpcard, rules, composition, dealerMemo)
  }
  return dealerOutcomesFromUpcard(dealerUpcard, rules, composition, dealerMemo)
}
