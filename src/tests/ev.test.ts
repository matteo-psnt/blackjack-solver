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
    const ev = evDouble(9, false, outcomes, INFINITE_DECK, '10-11')
    expect(ev).toBeNull()
  })

  it('restriction 10-11: can double hard 10', () => {
    const outcomes = getOutcomes('6')
    const ev = evDouble(10, false, outcomes, INFINITE_DECK, '10-11')
    expect(ev).not.toBeNull()
  })

  it('restriction any: cannot double soft hands when restriction is 9-11', () => {
    const outcomes = getOutcomes('6')
    const ev = evDouble(17, true, outcomes, INFINITE_DECK, '9-11')
    expect(ev).toBeNull()
  })

  it('restriction any: can double soft 17', () => {
    const outcomes = getOutcomes('6')
    const ev = evDouble(17, true, outcomes, INFINITE_DECK, 'any')
    expect(ev).not.toBeNull()
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
    expect(canDoubleHand(11, true, '10-11')).toBe(false) // soft
  })

  it('restriction 9-11: hard 9,10,11 only', () => {
    expect(canDoubleHand(9, false, '9-11')).toBe(true)
    expect(canDoubleHand(10, false, '9-11')).toBe(true)
    expect(canDoubleHand(11, false, '9-11')).toBe(true)
    expect(canDoubleHand(8, false, '9-11')).toBe(false)
    expect(canDoubleHand(9, true, '9-11')).toBe(false) // soft
  })
})

describe('evOptimal — surrender', () => {
  it('surrender EV is exactly -0.5', () => {
    const outcomes = getOutcomes('T', H17, true)
    const hitMemo = new Map<string, number>()
    const dMemo = createDealerMemo()
    // Hard 16 vs T with late surrender
    const result = evOptimal(16, false, false, null, 'T', outcomes, H17, INFINITE_DECK, dMemo, hitMemo)
    expect(result.action).toBe('R')
    expect(result.ev).toBeCloseTo(-0.5, 10)
  })

  it('surrender unavailable when rules.surrender = none', () => {
    const noSurrender = { ...H17, surrender: 'none' as const }
    const outcomes = getOutcomes('T', noSurrender, true)
    const hitMemo = new Map<string, number>()
    const dMemo = createDealerMemo()
    const result = evOptimal(16, false, false, null, 'T', outcomes, noSurrender, INFINITE_DECK, dMemo, hitMemo)
    expect(result.action).not.toBe('R')
  })

  it('surrender beats standing when stand EV < -0.5', () => {
    // Hard 15 vs T: standing EV is worse than -0.5 under most rules
    const outcomes = getOutcomes('T', H17, true)
    const hitMemo = new Map<string, number>()
    const dMemo = createDealerMemo()
    const standEV = evStand(15, outcomes)
    const result = evOptimal(15, false, false, null, 'T', outcomes, H17, INFINITE_DECK, dMemo, hitMemo)
    if (standEV < -0.5) {
      expect(result.action).toBe('R')
    }
  })
})

describe('evOptimal — strategic actions', () => {
  it('A-A pair vs any upcard: action = P', () => {
    const upcards = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'A'] as const
    for (const up of upcards) {
      const outcomes = up === 'A' || up === 'T'
        ? dealerOutcomesNoBJ(up, H17, INFINITE_DECK, createDealerMemo())
        : dealerOutcomesFromUpcard(up, H17, INFINITE_DECK, createDealerMemo())
      const hitMemo = new Map<string, number>()
      const dMemo = createDealerMemo()
      const result = evOptimal(12, true, true, 'A', up, outcomes, H17, INFINITE_DECK, dMemo, hitMemo)
      expect(result.action).toBe('P')
    }
  })

  it('8-8 pair vs any upcard: action = P', () => {
    const upcards = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'A'] as const
    for (const up of upcards) {
      const outcomes = up === 'A' || up === 'T'
        ? dealerOutcomesNoBJ(up, H17, INFINITE_DECK, createDealerMemo())
        : dealerOutcomesFromUpcard(up, H17, INFINITE_DECK, createDealerMemo())
      const hitMemo = new Map<string, number>()
      const dMemo = createDealerMemo()
      const result = evOptimal(16, false, true, '8', up, outcomes, H17, INFINITE_DECK, dMemo, hitMemo)
      expect(result.action).toBe('P')
    }
  })

  it('hard 17 vs any upcard: action = S', () => {
    const upcards = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'A'] as const
    const noSurr = { ...H17, surrender: 'none' as const }
    for (const up of upcards) {
      const outcomes = up === 'A' || up === 'T'
        ? dealerOutcomesNoBJ(up, noSurr, INFINITE_DECK, createDealerMemo())
        : dealerOutcomesFromUpcard(up, noSurr, INFINITE_DECK, createDealerMemo())
      const hitMemo = new Map<string, number>()
      const dMemo = createDealerMemo()
      const result = evOptimal(17, false, false, null, up, outcomes, noSurr, INFINITE_DECK, dMemo, hitMemo)
      expect(result.action).toBe('S')
    }
  })

  it('hard 11 vs 2-T: action = D (most rule sets)', () => {
    const upcards = ['2', '3', '4', '5', '6', '7', '8', '9', 'T'] as const
    for (const up of upcards) {
      const outcomes = up === 'T'
        ? dealerOutcomesNoBJ(up, H17, INFINITE_DECK, createDealerMemo())
        : dealerOutcomesFromUpcard(up, H17, INFINITE_DECK, createDealerMemo())
      const hitMemo = new Map<string, number>()
      const dMemo = createDealerMemo()
      const result = evOptimal(11, false, false, null, up, outcomes, H17, INFINITE_DECK, dMemo, hitMemo)
      expect(result.action).toBe('D')
    }
  })
})
