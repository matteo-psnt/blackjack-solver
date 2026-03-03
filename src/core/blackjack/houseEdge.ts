import type { BlackjackRules, DealerUpcard, HouseEdgeResult, Rank } from './types'
import { ALL_RANKS, buildShoeComposition, removeCard } from './constants'
import {
  addCard,
  createDealerMemo,
  dealerBJProbability,
  dealerOutcomesFromUpcard,
  dealerOutcomesNoBJ,
} from './dealerProbabilities'
import { evOptimal } from './ev'

const ALL_DEALER_UPCARDS: DealerUpcard[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'A']

/**
 * Is this a natural blackjack? One rank is A, the other is T (= 10-value card).
 */
function isNatural(rank1: Rank, rank2: Rank): boolean {
  return (rank1 === 'A' && rank2 === 'T') || (rank1 === 'T' && rank2 === 'A')
}

/**
 * Compute player hand parameters from two dealt ranks.
 */
function playerHand(
  rank1: Rank,
  rank2: Rank,
): { total: number; isSoft: boolean; isPair: boolean; pairRank: Rank | null } {
  const v1 = rank1 === 'A' ? 11 : rank1 === 'T' ? 10 : parseInt(rank1, 10)
  const startIsSoft = rank1 === 'A'
  const [total, isSoft] = addCard(v1, startIsSoft, rank2)
  const isPair = rank1 === rank2
  return { total, isSoft, isPair, pairRank: isPair ? rank1 : null }
}

/**
 * Aggregates per-hand EVs over all player starting hands and dealer upcards.
 * Uses a finite-deck shoe composition derived from rules.decks, with proper
 * without-replacement probabilities for the three dealt cards.
 *
 * Handles:
 * - Player and dealer naturals
 * - Early vs late surrender
 * - Dealer peek / ENHC conditioning
 */
export function computeHouseEdge(rules: BlackjackRules): HouseEdgeResult {
  const baseComposition = buildShoeComposition(rules.decks)
  const tw = Object.values(baseComposition).reduce((a, b) => a + b, 0) // 52 * decks

  let totalEV = 0

  for (const rank1 of ALL_RANKS) {
    // Probability of player's first card; remove it from shoe for subsequent draws.
    const pRank1 = baseComposition[rank1] / tw
    const comp1 = removeCard(baseComposition, rank1)
    const tw1 = tw - 1

    for (const rank2 of ALL_RANKS) {
      // Probability of player's second card given rank1 was dealt.
      const pRank2 = comp1[rank2] / tw1
      const comp2 = removeCard(comp1, rank2)
      const tw2 = tw - 2

      for (const upcard of ALL_DEALER_UPCARDS) {
        // Probability of dealer upcard given rank1 and rank2 were dealt.
        const pUpcard = comp2[upcard as Rank] / tw2
        const pCombo = pRank1 * pRank2 * pUpcard

        // Remaining shoe after the three known cards — used for all draw probabilities.
        const playComp = removeCard(comp2, upcard as Rank)

        const pBJ = dealerBJProbability(upcard, playComp)
        const dealerMemo = createDealerMemo()
        let cellEV: number

        if (isNatural(rank1, rank2)) {
          // Player natural BJ: push if dealer also has BJ, else win at BJ payout.
          cellEV = pBJ * 0 + (1 - pBJ) * rules.blackjackPayout
        } else if (pBJ > 0) {
          // Dealer may have BJ; player does not have natural.
          const dealerOutcomesNoBlackjack = dealerOutcomesNoBJ(upcard, rules, playComp, dealerMemo)

          const hand = playerHand(rank1, rank2)
          const hitMemo = new Map<string, number>()
          const { ev: evGivenNoBJ, action } = evOptimal(
            hand.total,
            hand.isSoft,
            hand.isPair,
            hand.pairRank,
            upcard,
            dealerOutcomesNoBlackjack,
            rules,
            playComp,
            dealerMemo,
            hitMemo,
          )

          // ENHC: player acts before peek — lose 2 units on D/P if dealer has BJ.
          // Peek: dealer BJ always caught first, player loses exactly 1 unit.
          const evGivenBJ = !rules.dealerPeek && (action === 'D' || action === 'P')
            ? -2.0
            : -1.0

          const evPlay = pBJ * evGivenBJ + (1 - pBJ) * evGivenNoBJ
          cellEV = rules.surrender === 'early' ? Math.max(evPlay, -0.5) : evPlay
        } else {
          // No dealer BJ possible (upcards 2–9).
          const dealerOutcomes = dealerOutcomesFromUpcard(upcard, rules, playComp, dealerMemo)
          const hand = playerHand(rank1, rank2)
          const hitMemo = new Map<string, number>()
          const { ev } = evOptimal(
            hand.total,
            hand.isSoft,
            hand.isPair,
            hand.pairRank,
            upcard,
            dealerOutcomes,
            rules,
            playComp,
            dealerMemo,
            hitMemo,
          )
          cellEV = ev
        }

        totalEV += pCombo * cellEV
      }
    }
  }

  const playerEdge = totalEV
  const houseEdge = -playerEdge
  const formatted = (Math.abs(houseEdge) * 100).toFixed(2) + '%'

  return { playerEdge, houseEdge, formatted }
}
