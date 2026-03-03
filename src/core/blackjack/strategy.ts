import type {
  BlackjackRules,
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
  PAIR_HAND_KEYS,
  SOFT_HAND_KEYS,
  buildShoeComposition,
  removeCard,
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
// Canonical starting cards for each hand key (for shoe composition adjustment)
// ---------------------------------------------------------------------------

/**
 * The two starting cards for each hand key.
 * Hard totals 12–17 use T as one card (most common), 5–11 use small cards.
 * Soft hands are always A + the second card. Pairs are two of the same rank.
 */
const HAND_STARTING_CARDS: Record<HandKey, [Rank, Rank]> = {
  // Hard hands
  hard5: ['2', '3'], hard6: ['2', '4'], hard7: ['3', '4'],
  hard8: ['3', '5'], hard9: ['4', '5'], hard10: ['4', '6'],
  hard11: ['5', '6'],
  hard12: ['2', 'T'], hard13: ['3', 'T'], hard14: ['4', 'T'],
  hard15: ['5', 'T'], hard16: ['6', 'T'], hard17: ['7', 'T'],
  // Soft hands: A + second card
  soft13: ['A', '2'], soft14: ['A', '3'], soft15: ['A', '4'],
  soft16: ['A', '5'], soft17: ['A', '6'], soft18: ['A', '7'],
  soft19: ['A', '8'], soft20: ['A', '9'],
  // Pairs
  pair2: ['2', '2'], pair3: ['3', '3'], pair4: ['4', '4'],
  pair5: ['5', '5'], pair6: ['6', '6'], pair7: ['7', '7'],
  pair8: ['8', '8'], pair9: ['9', '9'], pairT: ['T', 'T'], pairA: ['A', 'A'],
}

// ---------------------------------------------------------------------------
// Strategy table computation
// ---------------------------------------------------------------------------

/**
 * Computes the full basic strategy table for the given rules.
 * All cells represent optimal action conditioned on dealer not having blackjack.
 * Uses a finite-deck shoe composition derived from rules.decks.
 */
export function computeStrategyTable(rules: BlackjackRules): StrategyTable {
  const baseComposition = buildShoeComposition(rules.decks)

  function computeRow(key: HandKey, params: HandParams): StrategyRow {
    const row = {} as StrategyRow
    const [card1, card2] = HAND_STARTING_CARDS[key]

    for (const upcard of ALL_DEALER_UPCARDS) {
      // Remove the player's two starting cards and the dealer upcard from the shoe.
      // This remaining composition is used for all dealer and player draw probabilities.
      const playComp = removeCard(removeCard(removeCard(baseComposition, card1), card2), upcard as Rank)

      // Fresh memos per cell — compositions differ, so memos cannot be shared.
      const dealerMemo = createDealerMemo()
      const hitMemo = new Map<string, number>()

      const dealerOutcomes = getDealerOutcomesForStrategy(upcard, rules, playComp, dealerMemo)

      // Early surrender threshold: more permissive in the no-BJ-conditioned space.
      //   threshold = (-0.5 + pBJ) / (1 - pBJ)
      let effectiveSurrenderThreshold: number | undefined
      if (rules.surrender === 'early') {
        const pBJ = dealerBJProbability(upcard, playComp)
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
        playComp,
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
    hard[key] = computeRow(key, handKeyToParams(key))
  }

  const soft = {} as Record<SoftHandKey, StrategyRow>
  for (const key of SOFT_HAND_KEYS) {
    soft[key] = computeRow(key, handKeyToParams(key))
  }

  const pairs = {} as Record<PairHandKey, StrategyRow>
  for (const key of PAIR_HAND_KEYS) {
    pairs[key] = computeRow(key, handKeyToParams(key))
  }

  return { hard, soft, pairs }
}
