import type { DealerOutcomes, BlackjackRules, DeckComposition, DealerUpcard, Rank } from './types'
import { ALL_RANKS, INFINITE_DECK, cardNumericValue } from './constants'

export function zeroDealerOutcomes(): DealerOutcomes {
  return { 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, bust: 0 }
}

/**
 * Add a card to a dealer/player hand.
 * Handles ace logic: ace = 11 if ≤21, else 1. Converts existing soft ace if needed.
 * Returns [newTotal, newIsSoft].
 */
export function addCard(total: number, isSoft: boolean, rank: Rank): [number, boolean] {
  let newTotal: number
  let newSoft: boolean

  if (rank === 'A') {
    if (total + 11 <= 21) {
      newTotal = total + 11
      newSoft = true
    } else {
      newTotal = total + 1
      newSoft = isSoft
    }
  } else {
    newTotal = total + cardNumericValue(rank)
    newSoft = isSoft
  }

  // Convert soft ace if total exceeds 21
  if (newTotal > 21 && newSoft) {
    newTotal -= 10
    newSoft = false
  }

  return [newTotal, newSoft]
}

function addOutcomes(
  target: DealerOutcomes,
  source: DealerOutcomes,
  weight: number,
): void {
  target[17] += weight * source[17]
  target[18] += weight * source[18]
  target[19] += weight * source[19]
  target[20] += weight * source[20]
  target[21] += weight * source[21]
  target.bust += weight * source.bust
}

/**
 * Recursive memoized dealer outcome engine.
 * Computes the probability distribution of dealer final totals starting from (total, isSoft).
 * Memo key: `${total}_${isSoft ? 1 : 0}`
 */
export function computeDealerOutcomes(
  total: number,
  isSoft: boolean,
  rules: BlackjackRules,
  composition: DeckComposition,
  memo: Map<string, DealerOutcomes>,
): DealerOutcomes {
  // Safety: bust handled here
  if (total > 21) {
    return { 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, bust: 1 }
  }

  const key = `${total}_${isSoft ? 1 : 0}`
  const cached = memo.get(key)
  if (cached) return cached

  const shouldStand =
    total >= 18 ||
    (total === 17 && !isSoft) ||
    (total === 17 && isSoft && !rules.dealerHitsSoft17)

  if (shouldStand) {
    const result = zeroDealerOutcomes()
    // total is 17–21 here (checked above), so the cast is safe
    const key2 = total as 17 | 18 | 19 | 20 | 21
    result[key2] = 1
    memo.set(key, result)
    return result
  }

  // Dealer hits
  const result = zeroDealerOutcomes()
  const tw = Object.values(composition).reduce((a, b) => a + b, 0)

  for (const rank of ALL_RANKS) {
    const p = composition[rank] / tw
    const [newTotal, newSoft] = addCard(total, isSoft, rank)

    if (newTotal > 21) {
      result.bust += p
    } else {
      const sub = computeDealerOutcomes(newTotal, newSoft, rules, composition, memo)
      addOutcomes(result, sub, p)
    }
  }

  memo.set(key, result)
  return result
}

/**
 * Full dealer outcome distribution starting from a single upcard.
 * Includes the BJ case (upcard A/T: hole card may complete a natural).
 */
export function dealerOutcomesFromUpcard(
  upcard: DealerUpcard,
  rules: BlackjackRules,
  composition: DeckComposition,
  memo: Map<string, DealerOutcomes>,
): DealerOutcomes {
  const total = cardNumericValue(upcard as Rank)
  const isSoft = upcard === 'A'
  return computeDealerOutcomes(total, isSoft, rules, composition, memo)
}

/**
 * Dealer outcomes conditioned on dealer NOT having a natural blackjack.
 * For upcard A: excludes T as hole card (re-normalizes over remaining 9 ranks).
 * For upcard T: excludes A as hole card (re-normalizes over remaining 12 weight).
 * For other upcards: BJ is impossible, returns full distribution.
 */
export function dealerOutcomesNoBJ(
  upcard: DealerUpcard,
  rules: BlackjackRules,
  composition: DeckComposition,
  memo: Map<string, DealerOutcomes>,
): DealerOutcomes {
  const upcardValue = cardNumericValue(upcard as Rank)
  const upcardIsSoft = upcard === 'A'

  if (upcard !== 'A' && upcard !== 'T') {
    return dealerOutcomesFromUpcard(upcard, rules, composition, memo)
  }

  // Which hole card rank would give dealer BJ?
  const excludedRank: Rank = upcard === 'A' ? 'T' : 'A'

  // Sum weight of non-BJ hole cards
  let totalW = 0
  for (const rank of ALL_RANKS) {
    if (rank !== excludedRank) totalW += composition[rank]
  }

  const result = zeroDealerOutcomes()

  for (const rank of ALL_RANKS) {
    if (rank === excludedRank) continue
    const p = composition[rank] / totalW
    const [newTotal, newSoft] = addCard(upcardValue, upcardIsSoft, rank)

    if (newTotal > 21) {
      result.bust += p
    } else {
      const sub = computeDealerOutcomes(newTotal, newSoft, rules, composition, memo)
      addOutcomes(result, sub, p)
    }
  }

  return result
}

/**
 * P(dealer natural blackjack) given upcard, under infinite deck.
 * Upcard A: 4/13 (hole = T). Upcard T: 1/13 (hole = A). Other: 0.
 */
export function dealerBJProbability(upcard: DealerUpcard): number {
  const tw = Object.values(INFINITE_DECK).reduce((a, b) => a + b, 0) // 13
  if (upcard === 'A') return INFINITE_DECK['T'] / tw // 4/13
  if (upcard === 'T') return INFINITE_DECK['A'] / tw // 1/13
  return 0
}

export function createDealerMemo(): Map<string, DealerOutcomes> {
  return new Map()
}
