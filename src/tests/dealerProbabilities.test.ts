import { describe, it, expect } from 'vitest'
import { DEFAULT_RULES } from '../core/blackjack/constants'
import {
  computeDealerOutcomes,
  dealerOutcomesFromUpcard,
  dealerOutcomesNoBJ,
  dealerBJProbability,
  createDealerMemo,
} from '../core/blackjack/dealerProbabilities'
import { INFINITE_DECK, buildShoeComposition, removeCard } from '../core/blackjack/constants'

const S17_RULES = { ...DEFAULT_RULES, dealerHitsSoft17: false }
const H17_RULES = { ...DEFAULT_RULES, dealerHitsSoft17: true }

function sumOutcomes(o: ReturnType<typeof computeDealerOutcomes>): number {
  return o[17] + o[18] + o[19] + o[20] + o[21] + o.bust
}

describe('computeDealerOutcomes', () => {
  it('dealer soft 17 with S17: stands → outcomes[17] ≈ 1', () => {
    const memo = createDealerMemo()
    const result = computeDealerOutcomes(17, true, S17_RULES, INFINITE_DECK, memo)
    expect(result[17]).toBeCloseTo(1.0, 10)
    expect(sumOutcomes(result)).toBeCloseTo(1.0, 10)
  })

  it('dealer soft 17 with H17: hits → outcomes[17] < 1, distributed', () => {
    const memo = createDealerMemo()
    const result = computeDealerOutcomes(17, true, H17_RULES, INFINITE_DECK, memo)
    expect(result[17]).toBeLessThan(1.0)
    expect(result[17]).toBeGreaterThan(0)
    expect(result.bust).toBeGreaterThan(0)
    expect(sumOutcomes(result)).toBeCloseTo(1.0, 10)
  })

  it('dealer hard 17 always stands regardless of H17/S17', () => {
    const memoS = createDealerMemo()
    const memoH = createDealerMemo()
    const rs = computeDealerOutcomes(17, false, S17_RULES, INFINITE_DECK, memoS)
    const rh = computeDealerOutcomes(17, false, H17_RULES, INFINITE_DECK, memoH)
    expect(rs[17]).toBeCloseTo(1.0, 10)
    expect(rh[17]).toBeCloseTo(1.0, 10)
  })

  it('all outcome probabilities sum to 1 for any starting state', () => {
    const cases: [number, boolean][] = [
      [11, false], [16, false], [17, true], [17, false], [12, true],
    ]
    for (const [total, isSoft] of cases) {
      const memo = createDealerMemo()
      const result = computeDealerOutcomes(total, isSoft, H17_RULES, INFINITE_DECK, memo)
      expect(sumOutcomes(result)).toBeCloseTo(1.0, 9)
    }
  })
})

describe('dealerOutcomesFromUpcard', () => {
  it('dealer upcard 6 (S17): bust rate ≈ 42%', () => {
    const memo = createDealerMemo()
    const result = dealerOutcomesFromUpcard('6', S17_RULES, INFINITE_DECK, memo)
    expect(result.bust).toBeCloseTo(0.42, 1) // within 1 decimal place
    expect(sumOutcomes(result)).toBeCloseTo(1.0, 9)
  })

  it('dealer upcard 6 (H17): bust rate > 40%', () => {
    const memo = createDealerMemo()
    const result = dealerOutcomesFromUpcard('6', H17_RULES, INFINITE_DECK, memo)
    expect(result.bust).toBeGreaterThan(0.40)
    expect(sumOutcomes(result)).toBeCloseTo(1.0, 9)
  })

  it('all upcards sum to 1', () => {
    const upcards = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'A'] as const
    for (const up of upcards) {
      const memo = createDealerMemo()
      const result = dealerOutcomesFromUpcard(up, H17_RULES, INFINITE_DECK, memo)
      expect(sumOutcomes(result)).toBeCloseTo(1.0, 9)
    }
  })
})

describe('dealerOutcomesNoBJ', () => {
  it('conditions out dealer BJ for ace upcard', () => {
    const memo = createDealerMemo()
    const result = dealerOutcomesNoBJ('A', H17_RULES, INFINITE_DECK, memo)
    // Conditioned on no BJ: dealer drew a non-T hole card, played out
    // Total should still sum to 1
    expect(sumOutcomes(result)).toBeCloseTo(1.0, 9)
  })

  it('conditions out dealer BJ for T upcard', () => {
    const memo = createDealerMemo()
    const result = dealerOutcomesNoBJ('T', H17_RULES, INFINITE_DECK, memo)
    expect(sumOutcomes(result)).toBeCloseTo(1.0, 9)
    // Dealer cannot have 21 after just drawing (no natural 21 since BJ excluded)
    // But dealer can reach 21 via hitting — just verify sum=1
  })

  it('non-BJ upcards return same result as fromUpcard', () => {
    const memo1 = createDealerMemo()
    const memo2 = createDealerMemo()
    const r1 = dealerOutcomesNoBJ('6', H17_RULES, INFINITE_DECK, memo1)
    const r2 = dealerOutcomesFromUpcard('6', H17_RULES, INFINITE_DECK, memo2)
    expect(r1.bust).toBeCloseTo(r2.bust, 10)
    expect(r1[17]).toBeCloseTo(r2[17], 10)
  })
})

describe('buildShoeComposition', () => {
  it('1-deck: total cards = 52', () => {
    const comp = buildShoeComposition(1)
    const total = Object.values(comp).reduce((a, b) => a + b, 0)
    expect(total).toBe(52)
  })

  it('6-deck: total cards = 312', () => {
    const comp = buildShoeComposition(6)
    const total = Object.values(comp).reduce((a, b) => a + b, 0)
    expect(total).toBe(312)
  })

  it('1-deck: T has 16 cards (10,J,Q,K × 4 suits)', () => {
    expect(buildShoeComposition(1)['T']).toBe(16)
  })

  it('1-deck: each non-T rank has 4 cards', () => {
    const comp = buildShoeComposition(1)
    for (const rank of ['A', '2', '3', '4', '5', '6', '7', '8', '9'] as const) {
      expect(comp[rank]).toBe(4)
    }
  })

  it('n-deck scales linearly: 2-deck = 2 × 1-deck', () => {
    const one = buildShoeComposition(1)
    const two = buildShoeComposition(2)
    for (const rank of Object.keys(one) as (keyof typeof one)[]) {
      expect(two[rank]).toBe(2 * one[rank])
    }
  })
})

describe('removeCard', () => {
  it('removes one card of the specified rank', () => {
    const comp = buildShoeComposition(1)
    const after = removeCard(comp, 'A')
    expect(after['A']).toBe(comp['A'] - 1)
  })

  it('does not affect other ranks', () => {
    const comp = buildShoeComposition(1)
    const after = removeCard(comp, 'A')
    for (const rank of ['2', '3', '4', '5', '6', '7', '8', '9', 'T'] as const) {
      expect(after[rank]).toBe(comp[rank])
    }
  })

  it('total decreases by exactly 1', () => {
    const comp = buildShoeComposition(6)
    const after = removeCard(comp, 'T')
    const before = Object.values(comp).reduce((a, b) => a + b, 0)
    const afterTotal = Object.values(after).reduce((a, b) => a + b, 0)
    expect(afterTotal).toBe(before - 1)
  })

  it('does not mutate the original composition', () => {
    const comp = buildShoeComposition(1)
    const original = comp['A']
    removeCard(comp, 'A')
    expect(comp['A']).toBe(original)
  })

  it('clamps to 0 when rank count is already 0', () => {
    const comp = buildShoeComposition(1)
    // Remove all 4 aces then one more
    let c = comp
    for (let i = 0; i < 4; i++) c = removeCard(c, 'A')
    const after = removeCard(c, 'A')
    expect(after['A']).toBe(0)
  })
})

describe('dealer bust rate ordering', () => {
  it('upcard 5 and 6 bust more than upcard 7 (S17)', () => {
    const rules = { ...DEFAULT_RULES, dealerHitsSoft17: false }
    const memo1 = createDealerMemo()
    const memo2 = createDealerMemo()
    const memo3 = createDealerMemo()
    const b5 = dealerOutcomesFromUpcard('5', rules, INFINITE_DECK, memo1).bust
    const b6 = dealerOutcomesFromUpcard('6', rules, INFINITE_DECK, memo2).bust
    const b7 = dealerOutcomesFromUpcard('7', rules, INFINITE_DECK, memo3).bust
    expect(b5).toBeGreaterThan(b7)
    expect(b6).toBeGreaterThan(b7)
  })

  it('bust rates: 2<3<4<5<6 ordering holds (S17, dealer weak upcards)', () => {
    const rules = { ...DEFAULT_RULES, dealerHitsSoft17: false }
    const busts: Record<string, number> = {}
    for (const up of ['2', '3', '4', '5', '6'] as const) {
      const memo = createDealerMemo()
      busts[up] = dealerOutcomesFromUpcard(up, rules, INFINITE_DECK, memo).bust
    }
    expect(busts['3']).toBeGreaterThan(busts['2'])
    expect(busts['4']).toBeGreaterThan(busts['3'])
    expect(busts['5']).toBeGreaterThan(busts['4'])
    expect(busts['6']).toBeGreaterThan(busts['5'])
  })

  it('upcard A and T have low bust rates (< 25%)', () => {
    const rules = { ...DEFAULT_RULES, dealerHitsSoft17: false }
    for (const up of ['A', 'T'] as const) {
      const memo = createDealerMemo()
      const bust = dealerOutcomesFromUpcard(up, rules, INFINITE_DECK, memo).bust
      expect(bust).toBeLessThan(0.25)
    }
  })
})

describe('dealerBJProbability', () => {
  it('upcard A: P(BJ) = 4/13 under infinite deck', () => {
    expect(dealerBJProbability('A', INFINITE_DECK)).toBeCloseTo(4 / 13, 10)
  })

  it('upcard T: P(BJ) = 1/13 under infinite deck', () => {
    expect(dealerBJProbability('T', INFINITE_DECK)).toBeCloseTo(1 / 13, 10)
  })

  it('other upcards: P(BJ) = 0', () => {
    for (const up of ['2', '3', '4', '5', '6', '7', '8', '9'] as const) {
      expect(dealerBJProbability(up, INFINITE_DECK)).toBe(0)
    }
  })

  it('1-deck: upcard A, player has (T,T) — fewer Ts left → P(BJ) < infinite-deck', () => {
    const shoe = buildShoeComposition(1) // 16 Ts
    const reduced = removeCard(removeCard(removeCard(shoe, 'T'), 'T'), 'A') // remove 2Ts + upcard A
    // Remaining Ts: 14 out of 49 cards
    const pBJ = dealerBJProbability('A', reduced)
    expect(pBJ).toBeCloseTo(14 / 49, 10)
    expect(pBJ).toBeLessThan(4 / 13) // fewer Ts means lower BJ probability
  })
})
