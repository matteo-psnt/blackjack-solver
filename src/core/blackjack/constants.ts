import type {
  BlackjackRules,
  DeckComposition,
  DealerUpcard,
  HardHandKey,
  SoftHandKey,
  PairHandKey,
  Rank,
} from './types'

/**
 * Infinite-deck model: relative weights per rank.
 * T covers 10, J, Q, K (weight=4). Total weight = 13.
 * P(A) = 1/13, P(2-9) = 1/13 each, P(T) = 4/13.
 */
export const INFINITE_DECK: DeckComposition = {
  A: 1,
  '2': 1,
  '3': 1,
  '4': 1,
  '5': 1,
  '6': 1,
  '7': 1,
  '8': 1,
  '9': 1,
  T: 4,
}

export const TOTAL_WEIGHT = 13

/**
 * Build a finite shoe composition for the given number of decks.
 * Each rank A–9 has 4*decks cards; T-value (10/J/Q/K) has 16*decks cards.
 */
export function buildShoeComposition(decks: number): DeckComposition {
  return {
    A: 4 * decks,
    '2': 4 * decks,
    '3': 4 * decks,
    '4': 4 * decks,
    '5': 4 * decks,
    '6': 4 * decks,
    '7': 4 * decks,
    '8': 4 * decks,
    '9': 4 * decks,
    T: 16 * decks,
  }
}

/** Return a new composition with one card of `rank` removed (floor at 0). */
export function removeCard(comp: DeckComposition, rank: Rank): DeckComposition {
  return { ...comp, [rank]: Math.max(0, comp[rank] - 1) }
}

/** Numeric card value for addition (ace = 11; handled specially in addCard). */
export function cardNumericValue(rank: Rank): number {
  if (rank === 'A') return 11
  if (rank === 'T') return 10
  return parseInt(rank, 10)
}

export const ALL_RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T']

/** Sum of all card counts in a composition. Avoids Object.values() array allocation in hot recursive paths. */
export function totalWeight(comp: DeckComposition): number {
  let sum = 0
  for (const rank of ALL_RANKS) sum += comp[rank]
  return sum
}

export const ALL_DEALER_UPCARDS: DealerUpcard[] = [
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  'T',
  'A',
]

// Common U.S. Shoe: 6-deck, S17, no DAS, no surrender, 3:2, dealer peek
export const DEFAULT_RULES: BlackjackRules = {
  decks: 6,
  dealerHitsSoft17: false,
  dealerPeek: true,
  blackjackPayout: 1.5,
  doubleAfterSplit: false,
  doubleRestriction: 'any',
  surrender: 'none',
  resplitAces: false,
  hitSplitAces: false,
  blackjackAfterSplit: false,
  maxSplits: 4,
}

export const HARD_HAND_KEYS: HardHandKey[] = [
  'hard5',
  'hard6',
  'hard7',
  'hard8',
  'hard9',
  'hard10',
  'hard11',
  'hard12',
  'hard13',
  'hard14',
  'hard15',
  'hard16',
  'hard17',
]

export const SOFT_HAND_KEYS: SoftHandKey[] = [
  'soft13',
  'soft14',
  'soft15',
  'soft16',
  'soft17',
  'soft18',
  'soft19',
  'soft20',
]

export const PAIR_HAND_KEYS: PairHandKey[] = [
  'pair2',
  'pair3',
  'pair4',
  'pair5',
  'pair6',
  'pair7',
  'pair8',
  'pair9',
  'pairT',
  'pairA',
]
