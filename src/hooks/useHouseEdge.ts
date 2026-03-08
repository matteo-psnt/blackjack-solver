import { useMemo } from 'react'
import type { BlackjackRules, DeckComposition } from '../core/blackjack/types'
import { ALL_RANKS } from '../core/blackjack/constants'
import { computeHouseEdge } from '../core/blackjack/houseEdge'

export function useHouseEdge(rules: BlackjackRules, composition?: DeckComposition) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const compositionKey = composition ? ALL_RANKS.map(r => composition[r]).join(',') : null

  return useMemo(
    () => computeHouseEdge(rules, composition ?? undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      rules.decks,
      rules.dealerHitsSoft17,
      rules.dealerPeek,
      rules.blackjackPayout,
      rules.doubleAfterSplit,
      rules.doubleRestriction,
      rules.surrender,
      rules.resplitAces,
      rules.hitSplitAces,
      rules.blackjackAfterSplit,
      rules.maxSplits,
      compositionKey,
    ],
  )
}
