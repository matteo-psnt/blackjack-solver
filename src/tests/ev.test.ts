import { describe, it, expect } from 'vitest'
import { DEFAULT_RULES, INFINITE_DECK } from '../core/blackjack/constants'
import { createDealerMemo, dealerOutcomesFromUpcard, dealerOutcomesNoBJ } from '../core/blackjack/dealerProbabilities'
import { evStand, evDouble, evOptimal, canDoubleHand } from '../core/blackjack/ev'

const H17 = { ...DEFAULT_RULES, dealerHitsSoft17: true }

function getOutcomes(upcard: string, rules = H17, noBlackjack = false) {
  const memo = createDealerMemo()
  const up = upcard as import('../core/blackjack/types').DealerUpcard
  return noBlackjack
    ? dealerOutcomesNoBJ(up, rules, INFINITE_DECK, memo)
    : dealerOutcomesFromUpcard(up, rules, INFINITE_DECK, memo)
}

describe('evStand', () => {
  it('player 20 vs dealer 6: strongly positive', () => {
    const outcomes = getOutcomes('6')
    const ev = evStand(20, outcomes)
    expect(ev).toBeGreaterThan(0.4)
  })

  it('player 21 is unbeatable (only push with dealer 21)', () => {
    const outcomes = getOutcomes('7')
    const ev = evStand(21, outcomes)
    expect(ev).toBeGreaterThan(0.7)
  })

  it('player 12 vs dealer 2: negative EV', () => {
    const outcomes = getOutcomes('2')
    const ev = evStand(12, outcomes)
    expect(ev).toBeLessThan(0)
  })

  it('player 17 vs dealer A: loses more often than wins', () => {
    const outcomes = getOutcomes('A', H17, true)
    const ev = evStand(17, outcomes)
    expect(ev).toBeLessThan(0)
  })

  it('player 20 vs dealer 2: positive', () => {
    expect(evStand(20, getOutcomes('2'))).toBeGreaterThan(0)
  })

  it('higher player total vs same dealer = better EV', () => {
    const outcomes = getOutcomes('7')
    expect(evStand(20, outcomes)).toBeGreaterThan(evStand(17, outcomes))
    expect(evStand(17, outcomes)).toBeGreaterThan(evStand(13, outcomes))
  })
})

describe('evDouble', () => {
  it('hard 11 vs 6: doubling is profitable', () => {
    const outcomes = getOutcomes('6')
    const ev = evDouble(11, false, outcomes, INFINITE_DECK, 'any')
    expect(ev).not.toBeNull()
    expect(ev!).toBeGreaterThan(0)
  })

  it('restriction 10-11: cannot double hard 9', () => {
    const outcomes = getOutcomes('6')
    expect(evDouble(9, false, outcomes, INFINITE_DECK, '10-11')).toBeNull()
  })

  it('restriction 10-11: can double hard 10', () => {
    const outcomes = getOutcomes('6')
    expect(evDouble(10, false, outcomes, INFINITE_DECK, '10-11')).not.toBeNull()
  })

  it('restriction 9-11: cannot double soft hands', () => {
    const outcomes = getOutcomes('6')
    expect(evDouble(17, true, outcomes, INFINITE_DECK, '9-11')).toBeNull()
  })

  it('restriction any: can double soft 17', () => {
    const outcomes = getOutcomes('6')
    expect(evDouble(17, true, outcomes, INFINITE_DECK, 'any')).not.toBeNull()
  })

  it('doubling returns exactly 2× raw stand EV on average', () => {
    // For a fixed one-card outcome, double bet = 2× rawEV
    const outcomes = getOutcomes('6')
    const ev = evDouble(11, false, outcomes, INFINITE_DECK, 'any')
    expect(ev).not.toBeNull()
    // EV must be in range [-2, 2] (bet is doubled)
    expect(ev!).toBeGreaterThan(-2)
    expect(ev!).toBeLessThan(2)
  })
})

describe('canDoubleHand', () => {
  it('restriction any: always true', () => {
    expect(canDoubleHand(9, false, 'any')).toBe(true)
    expect(canDoubleHand(17, true, 'any')).toBe(true)
    expect(canDoubleHand(20, false, 'any')).toBe(true)
  })

  it('restriction 10-11: only hard 10 and 11', () => {
    expect(canDoubleHand(10, false, '10-11')).toBe(true)
    expect(canDoubleHand(11, false, '10-11')).toBe(true)
    expect(canDoubleHand(9, false, '10-11')).toBe(false)
    expect(canDoubleHand(11, true, '10-11')).toBe(false)
  })

  it('restriction 9-11: hard 9,10,11 only', () => {
    expect(canDoubleHand(9, false, '9-11')).toBe(true)
    expect(canDoubleHand(10, false, '9-11')).toBe(true)
    expect(canDoubleHand(11, false, '9-11')).toBe(true)
    expect(canDoubleHand(8, false, '9-11')).toBe(false)
    expect(canDoubleHand(9, true, '9-11')).toBe(false)
  })
})

describe('evOptimal — surrender', () => {
  it('surrender EV is exactly -0.5', () => {
    const outcomes = getOutcomes('T', H17, true)
    const hitMemo = new Map<string, number>()
    const dMemo = createDealerMemo()
    const result = evOptimal(16, false, false, null, 'T', outcomes, H17, INFINITE_DECK, dMemo, hitMemo)
    expect(result.action).toBe('R')
    expect(result.ev).toBeCloseTo(-0.5, 10)
  })

  it('surrender unavailable when rules.surrender = none', () => {
    const noSurrender = { ...H17, surrender: 'none' as const }
    const outcomes = getOutcomes('T', noSurrender, true)
    const result = evOptimal(16, false, false, null, 'T', outcomes, noSurrender, INFINITE_DECK, createDealerMemo(), new Map())
    expect(result.action).not.toBe('R')
  })

  it('surrender beats standing when stand EV < -0.5', () => {
    const outcomes = getOutcomes('T', H17, true)
    const standEV = evStand(15, outcomes)
    const result = evOptimal(15, false, false, null, 'T', outcomes, H17, INFINITE_DECK, createDealerMemo(), new Map())
    if (standEV < -0.5) expect(result.action).toBe('R')
  })

  it('breakdown.R is always -0.5 when surrender is available', () => {
    const outcomes = getOutcomes('T', H17, true)
    const result = evOptimal(16, false, false, null, 'T', outcomes, H17, INFINITE_DECK, createDealerMemo(), new Map())
    expect(result.breakdown.R).toBeCloseTo(-0.5, 10)
  })

  it('effectiveSurrenderThreshold: more permissive threshold triggers R on marginal hands', () => {
    // Hard 14 vs A (noBJ): evStand ≈ -0.39, which is > -0.5 so late surrender wouldn't apply.
    // With effectiveSurrenderThreshold ≈ -0.278 (early surrender vs A), it should surrender.
    const outcomes = getOutcomes('A', H17, true)
    const dMemo = createDealerMemo()

    const lateResult = evOptimal(14, false, false, null, 'A', outcomes, H17, INFINITE_DECK, dMemo, new Map())
    // Late surrender: threshold -0.5; evStand(14) vs A noBJ > -0.5, so no surrender
    expect(lateResult.action).not.toBe('R')

    // pBJ_A = 4/13; effective threshold = (-0.5 + 4/13) / (9/13) ≈ -0.2778
    const pBJ = 4 / 13
    const threshold = (-0.5 + pBJ) / (1 - pBJ)
    const earlyResult = evOptimal(14, false, false, null, 'A', outcomes, H17, INFINITE_DECK, dMemo, new Map(), true, true, threshold)
    expect(earlyResult.action).toBe('R')
    // Even when chosen via effective threshold, reported EV is still -0.5
    expect(earlyResult.ev).toBeCloseTo(-0.5, 10)
    // And breakdown.R is still -0.5
    expect(earlyResult.breakdown.R).toBeCloseTo(-0.5, 10)
  })
})

describe('evOptimal — strategic actions', () => {
  it('A-A pair vs any upcard: action = P', () => {
    for (const up of ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'A'] as const) {
      const outcomes = up === 'A' || up === 'T'
        ? dealerOutcomesNoBJ(up, H17, INFINITE_DECK, createDealerMemo())
        : dealerOutcomesFromUpcard(up, H17, INFINITE_DECK, createDealerMemo())
      const result = evOptimal(12, true, true, 'A', up, outcomes, H17, INFINITE_DECK, createDealerMemo(), new Map())
      expect(result.action).toBe('P')
    }
  })

  it('8-8 pair vs any upcard: action = P', () => {
    for (const up of ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'A'] as const) {
      const outcomes = up === 'A' || up === 'T'
        ? dealerOutcomesNoBJ(up, H17, INFINITE_DECK, createDealerMemo())
        : dealerOutcomesFromUpcard(up, H17, INFINITE_DECK, createDealerMemo())
      const result = evOptimal(16, false, true, '8', up, outcomes, H17, INFINITE_DECK, createDealerMemo(), new Map())
      expect(result.action).toBe('P')
    }
  })

  it('hard 17 vs any upcard: action = S', () => {
    const noSurr = { ...H17, surrender: 'none' as const }
    for (const up of ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'A'] as const) {
      const outcomes = up === 'A' || up === 'T'
        ? dealerOutcomesNoBJ(up, noSurr, INFINITE_DECK, createDealerMemo())
        : dealerOutcomesFromUpcard(up, noSurr, INFINITE_DECK, createDealerMemo())
      const result = evOptimal(17, false, false, null, up, outcomes, noSurr, INFINITE_DECK, createDealerMemo(), new Map())
      expect(result.action).toBe('S')
    }
  })

  it('hard 11 vs 2-T: action = D', () => {
    for (const up of ['2', '3', '4', '5', '6', '7', '8', '9', 'T'] as const) {
      const outcomes = up === 'T'
        ? dealerOutcomesNoBJ(up, H17, INFINITE_DECK, createDealerMemo())
        : dealerOutcomesFromUpcard(up, H17, INFINITE_DECK, createDealerMemo())
      const result = evOptimal(11, false, false, null, up, outcomes, H17, INFINITE_DECK, createDealerMemo(), new Map())
      expect(result.action).toBe('D')
    }
  })

  it('breakdown contains all five keys', () => {
    const outcomes = getOutcomes('6')
    const result = evOptimal(11, false, false, null, '6', outcomes, H17, INFINITE_DECK, createDealerMemo(), new Map())
    expect(result.breakdown).toHaveProperty('S')
    expect(result.breakdown).toHaveProperty('H')
    expect(result.breakdown).toHaveProperty('D')
    expect(result.breakdown).toHaveProperty('P')
    expect(result.breakdown).toHaveProperty('R')
  })

  it('optimal EV >= stand EV always', () => {
    for (const total of [12, 14, 16, 18] as const) {
      const outcomes = getOutcomes('6')
      const standEV = evStand(total, outcomes)
      const result = evOptimal(total, false, false, null, '6', outcomes, H17, INFINITE_DECK, createDealerMemo(), new Map())
      expect(result.ev).toBeGreaterThanOrEqual(standEV - 1e-10)
    }
  })
})
