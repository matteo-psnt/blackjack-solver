import { useMemo } from 'react'
import type { BlackjackRules } from '../core/blackjack/types'
import { computeStrategyTable } from '../core/blackjack/strategy'

export function useStrategyTable(rules: BlackjackRules) {
  return useMemo(
    () => computeStrategyTable(rules),
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
