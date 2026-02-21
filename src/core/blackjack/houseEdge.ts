import type { BlackjackRules, DealerUpcard, HouseEdgeResult, Rank } from './types'
import { ALL_RANKS, INFINITE_DECK } from './constants'
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
 * Aggregates per-hand EVs over all player starting hands and dealer upcards
 * under the infinite-deck probability model.
 *
 * Handles:
 * - Player and dealer naturals
 * - Early vs late surrender
 * - Dealer peek conditioning
 */
export function computeHouseEdge(rules: BlackjackRules): HouseEdgeResult {
  const composition = INFINITE_DECK
  const tw = Object.values(composition).reduce((a, b) => a + b, 0) // 13

  const dealerMemo = createDealerMemo()
  let totalEV = 0

  for (const rank1 of ALL_RANKS) {
    for (const rank2 of ALL_RANKS) {
      for (const upcard of ALL_DEALER_UPCARDS) {
        const pRank1 = composition[rank1] / tw
        const pRank2 = composition[rank2] / tw
        const pUpcard = composition[upcard as Rank] / tw
        const pCombo = pRank1 * pRank2 * pUpcard

        const pBJ = dealerBJProbability(upcard)
        let cellEV: number

        if (isNatural(rank1, rank2)) {
          // Player natural BJ
          // If dealer also has BJ (push), else player wins at BJ payout
          cellEV = pBJ * 0 + (1 - pBJ) * rules.blackjackPayout
        } else if (pBJ > 0) {
          // Dealer may have BJ; player does not have natural
          let evGivenBJ: number
          if (rules.surrender === 'early') {
            evGivenBJ = -0.5 // early surrender beats losing full bet
          } else {
            evGivenBJ = -1.0 // player loses original bet
          }

          // Conditioned on no dealer BJ: play normally
          const dealerOutcomesNoBlackjack = rules.dealerPeek
            ? dealerOutcomesNoBJ(upcard, rules, composition, dealerMemo)
            : dealerOutcomesFromUpcard(upcard, rules, composition, dealerMemo)

          const hand = playerHand(rank1, rank2)
          const hitMemo = new Map<string, number>()
          const { ev: evGivenNoBJ } = evOptimal(
            hand.total,
            hand.isSoft,
            hand.isPair,
            hand.pairRank,
            upcard,
            dealerOutcomesNoBlackjack,
            rules,
            composition,
            dealerMemo,
            hitMemo,
          )

          cellEV = pBJ * evGivenBJ + (1 - pBJ) * evGivenNoBJ
        } else {
          // No dealer BJ possible (upcards 2-9)
          const dealerOutcomes = dealerOutcomesFromUpcard(upcard, rules, composition, dealerMemo)
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
            composition,
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
