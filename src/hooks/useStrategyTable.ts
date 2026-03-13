import { useMemo } from 'react'
import type { BlackjackRules, DeckComposition } from '../core/blackjack/types'
import { ALL_RANKS } from '../core/blackjack/constants'
import { computeStrategyTable } from '../core/blackjack/strategy'

export function useStrategyTable(rules: BlackjackRules, composition?: DeckComposition) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const compositionKey = composition ? ALL_RANKS.map(r => composition[r]).join(',') : null

  return useMemo(
    () => computeStrategyTable(rules, composition ?? undefined),
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
      rules.maxSplits,
      compositionKey,
    ],
  )
}
