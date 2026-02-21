import { describe, it, expect } from 'vitest'
import { DEFAULT_RULES } from '../core/blackjack/constants'
import {
  computeDealerOutcomes,
  dealerOutcomesFromUpcard,
  dealerOutcomesNoBJ,
  dealerBJProbability,
  createDealerMemo,
} from '../core/blackjack/dealerProbabilities'
import { INFINITE_DECK } from '../core/blackjack/constants'

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

describe('dealerBJProbability', () => {
  it('upcard A: P(BJ) = 4/13', () => {
    expect(dealerBJProbability('A')).toBeCloseTo(4 / 13, 10)
  })

  it('upcard T: P(BJ) = 1/13', () => {
    expect(dealerBJProbability('T')).toBeCloseTo(1 / 13, 10)
  })

  it('other upcards: P(BJ) = 0', () => {
    for (const up of ['2', '3', '4', '5', '6', '7', '8', '9'] as const) {
      expect(dealerBJProbability(up)).toBe(0)
    }
  })
})
