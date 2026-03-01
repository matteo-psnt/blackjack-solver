import type {
  BlackjackRules,
  DealerOutcomes,
  DealerUpcard,
  HandKey,
  HardHandKey,
  PairHandKey,
  Rank,
  SoftHandKey,
  StrategyRow,
  StrategyTable,
} from './types'
import {
  ALL_DEALER_UPCARDS,
  HARD_HAND_KEYS,
  INFINITE_DECK,
  PAIR_HAND_KEYS,
  SOFT_HAND_KEYS,
} from './constants'
import { createDealerMemo, dealerBJProbability } from './dealerProbabilities'
import { evOptimal, getDealerOutcomesForStrategy } from './ev'

// ---------------------------------------------------------------------------
// Hand key parsing
// ---------------------------------------------------------------------------

interface HandParams {
  total: number
  isSoft: boolean
  isPair: boolean
  pairRank: Rank | null
}

/** Converts a HandKey string to the numeric parameters needed by evOptimal. */
export function handKeyToParams(key: HandKey): HandParams {
  if (key.startsWith('hard')) {
    return { total: parseInt(key.slice(4), 10), isSoft: false, isPair: false, pairRank: null }
  }
  if (key.startsWith('soft')) {
    return { total: parseInt(key.slice(4), 10), isSoft: true, isPair: false, pairRank: null }
  }
  // pair
  const rankStr = key.slice(4) as string
  const pairRank: Rank =
    rankStr === 'A' ? 'A' : rankStr === 'T' ? 'T' : (rankStr as Rank)
  const startValue = pairRank === 'A' ? 11 : pairRank === 'T' ? 10 : parseInt(pairRank, 10)
  // A+A = addCard(11, true, 'A') → soft 12; T+T = hard 20; others = hard 2*n
  let total: number
  let isSoft: boolean
  if (pairRank === 'A') {
    total = 12
    isSoft = true // soft 12 (A+A)
  } else {
    total = 2 * startValue
    isSoft = false
  }
  return { total, isSoft, isPair: true, pairRank }
}

// ---------------------------------------------------------------------------
// Strategy table computation
// ---------------------------------------------------------------------------

/**
 * Computes the full basic strategy table for the given rules.
 * All cells represent optimal action conditioned on dealer not having blackjack.
 */
export function computeStrategyTable(rules: BlackjackRules): StrategyTable {
  const composition = INFINITE_DECK
  const dealerMemo = createDealerMemo()

  // Pre-compute dealer outcomes for each upcard (fresh memo, rules-specific)
  const dealerOutcomesCache = new Map<DealerUpcard, DealerOutcomes>()
  for (const upcard of ALL_DEALER_UPCARDS) {
    dealerOutcomesCache.set(upcard, getDealerOutcomesForStrategy(upcard, rules, composition, dealerMemo))
  }

  function computeRow(
    params: HandParams,
  ): StrategyRow {
    const row = {} as StrategyRow

    for (const upcard of ALL_DEALER_UPCARDS) {
      const dealerOutcomes = dealerOutcomesCache.get(upcard)!
      // Fresh hit memo per (hand, upcard) — could share per upcard for performance
      const hitMemo = new Map<string, number>()

      // Early surrender is decided before the dealer peeks, so the threshold for
      // choosing surrender (in the no-BJ-conditioned space) is more permissive:
      //   threshold = (-0.5 + pBJ) / (1 - pBJ)
      // For late/no surrender (or upcards with no BJ risk), use the default -0.5.
      let effectiveSurrenderThreshold: number | undefined
      if (rules.surrender === 'early') {
        const pBJ = dealerBJProbability(upcard)
        if (pBJ > 0) effectiveSurrenderThreshold = (-0.5 + pBJ) / (1 - pBJ)
      }

      const result = evOptimal(
        params.total,
        params.isSoft,
        params.isPair,
        params.pairRank,
        upcard,
        dealerOutcomes,
        rules,
        composition,
        dealerMemo,
        hitMemo,
        true,
        true,
        effectiveSurrenderThreshold,
      )

      row[upcard] = { action: result.action, ev: result.ev, breakdown: result.breakdown }
    }

    return row
  }

  const hard = {} as Record<HardHandKey, StrategyRow>
  for (const key of HARD_HAND_KEYS) {
    hard[key] = computeRow(handKeyToParams(key))
  }

  const soft = {} as Record<SoftHandKey, StrategyRow>
  for (const key of SOFT_HAND_KEYS) {
    soft[key] = computeRow(handKeyToParams(key))
  }

  const pairs = {} as Record<PairHandKey, StrategyRow>
  for (const key of PAIR_HAND_KEYS) {
    pairs[key] = computeRow(handKeyToParams(key))
  }

  return { hard, soft, pairs }
}
