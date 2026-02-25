export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T'
export type DealerUpcard = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'A'
export type DisplayAction = 'H' | 'S' | 'D' | 'P' | 'R'

/**
 * Remaining count per rank. Used as relative weights (normalized internally).
 * Infinite deck: { A:1, 2:1, ..., 9:1, T:4 } — total weight = 13.
 */
export type DeckComposition = Record<Rank, number>

export interface BlackjackRules {
  // Game setup — stored for display; does not affect v1 EV computation
  decks: 1 | 2 | 4 | 6 | 8

  // Dealer rules
  dealerHitsSoft17: boolean
  dealerPeek: boolean // true = US peek (default); false = ENHC / no-peek

  // Payout
  blackjackPayout: 1.5 | 1.2 | 1.0 // 3:2, 6:5, 1:1

  // Player options
  doubleAfterSplit: boolean
  doubleRestriction: 'any' | '9-11' | '10-11'
  surrender: 'none' | 'late' | 'early'

  // Split-specific rules
  resplitAces: boolean
  hitSplitAces: boolean
  blackjackAfterSplit: boolean
  maxSplits: 2 | 3 | 4
}

export interface DealerOutcomes {
  17: number
  18: number
  19: number
  20: number
  21: number
  bust: number
}

export interface EvBreakdown {
  S: number
  H: number
  D: number | null
  P: number | null
  R: number | null
}

export interface StrategyCell {
  action: DisplayAction
  ev: number
  breakdown: EvBreakdown
}

export type StrategyRow = Record<DealerUpcard, StrategyCell>

export type HardHandKey =
  | 'hard5'
  | 'hard6'
  | 'hard7'
  | 'hard8'
  | 'hard9'
  | 'hard10'
  | 'hard11'
  | 'hard12'
  | 'hard13'
  | 'hard14'
  | 'hard15'
  | 'hard16'
  | 'hard17'

export type SoftHandKey =
  | 'soft13'
  | 'soft14'
  | 'soft15'
  | 'soft16'
  | 'soft17'
  | 'soft18'
  | 'soft19'
  | 'soft20'

export type PairHandKey =
  | 'pair2'
  | 'pair3'
  | 'pair4'
  | 'pair5'
  | 'pair6'
  | 'pair7'
  | 'pair8'
  | 'pair9'
  | 'pairT'
  | 'pairA'

export type HandKey = HardHandKey | SoftHandKey | PairHandKey

export interface StrategyTable {
  hard: Record<HardHandKey, StrategyRow>
  soft: Record<SoftHandKey, StrategyRow>
  pairs: Record<PairHandKey, StrategyRow>
}

export interface HouseEdgeResult {
  playerEdge: number
  houseEdge: number
  formatted: string // e.g. "0.43%"
}
