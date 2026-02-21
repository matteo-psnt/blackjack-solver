import { useMemo } from 'react'
import type { BlackjackRules } from '../core/blackjack/types'
import { computeHouseEdge } from '../core/blackjack/houseEdge'

export function useHouseEdge(rules: BlackjackRules) {
  return useMemo(
    () => computeHouseEdge(rules),
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
    ],
  )
}
