import { describe, it, expect } from 'vitest'
import { buildShoeComposition } from '../core/blackjack/constants'
import {
  buildCompositionFromRcPenetration,
  computeRunningCount,
  computeTrueCount,
  totalRemainingCards,
} from '../core/blackjack/shoeUtils'

describe('totalRemainingCards', () => {
  it('full 6-deck shoe has 312 cards', () => {
    expect(totalRemainingCards(buildShoeComposition(6))).toBe(312)
  })

  it('full 1-deck shoe has 52 cards', () => {
    expect(totalRemainingCards(buildShoeComposition(1))).toBe(52)
  })
})

describe('computeRunningCount', () => {
  it('full shoe has RC = 0', () => {
    const full = buildShoeComposition(6)
    expect(computeRunningCount(full, 6)).toBe(0)
  })

  it('remove 4 low cards → RC = +4', () => {
    const comp = { ...buildShoeComposition(6) }
    comp['2'] -= 4
    expect(computeRunningCount(comp, 6)).toBe(4)
  })

  it('remove 4 high (T) cards → RC = -4', () => {
    const comp = { ...buildShoeComposition(6) }
    comp['T'] -= 4
    expect(computeRunningCount(comp, 6)).toBe(-4)
  })

  it('remove 2 low and 2 high → RC = 0', () => {
    const comp = { ...buildShoeComposition(6) }
    comp['2'] -= 2
    comp['T'] -= 2
    expect(computeRunningCount(comp, 6)).toBe(0)
  })
})

describe('computeTrueCount', () => {
  it('full shoe has TC = 0', () => {
    const full = buildShoeComposition(6)
    expect(computeTrueCount(full, 6)).toBe(0)
  })

  it('RC=4 with exactly 2 decks remaining → TC ≈ 2.0', () => {
    // 2 decks = 104 cards; remove 4 low cards to get RC=4
    const twoDecks = buildShoeComposition(2)
    const comp = { ...twoDecks }
    comp['2'] -= 4
    // remaining = 104 - 4 = 100 cards
    const remaining = totalRemainingCards(comp)
    const tc = computeTrueCount(comp, 2)
    // TC = 4 / (100/52) ≈ 2.08
    expect(tc).toBeCloseTo(4 / (remaining / 52), 5)
    expect(tc).toBeGreaterThan(1.9)
    expect(tc).toBeLessThan(2.2)
  })

  it('empty shoe returns TC = 0', () => {
    const comp = buildShoeComposition(6)
    const empty = Object.fromEntries(Object.keys(comp).map(k => [k, 0])) as typeof comp
    expect(computeTrueCount(empty, 6)).toBe(0)
  })
})

describe('buildCompositionFromRcPenetration', () => {
  it('penetration=0 returns full shoe (no cards dealt)', () => {
    const result = buildCompositionFromRcPenetration(6, 100, 0)
    const full = buildShoeComposition(6)
    expect(totalRemainingCards(result)).toBe(totalRemainingCards(full))
    for (const rank of Object.keys(full) as Array<keyof typeof full>) {
      expect(result[rank]).toBe(full[rank])
    }
  })

  it('penetration=100 returns zeros (all dealt)', () => {
    const result = buildCompositionFromRcPenetration(6, 0, 0)
    expect(totalRemainingCards(result)).toBe(0)
  })

  it('50% pen + RC=0 gives approximately half counts', () => {
    const result = buildCompositionFromRcPenetration(6, 50, 0)
    const full = buildShoeComposition(6)
    const totalFull = totalRemainingCards(full)
    const totalResult = totalRemainingCards(result)
    // Should be close to half (within rounding)
    expect(totalResult).toBeGreaterThanOrEqual(totalFull * 0.49)
    expect(totalResult).toBeLessThanOrEqual(totalFull * 0.51)
    // RC should be near 0
    const rc = computeRunningCount(result, 6)
    expect(rc).toBe(0)
  })

  it('RC=+4 depletes 4 extra low cards compared to neutral', () => {
    const neutral = buildCompositionFromRcPenetration(6, 75, 0)
    const positive = buildCompositionFromRcPenetration(6, 75, 4)
    const rcNeutral = computeRunningCount(neutral, 6)
    const rcPositive = computeRunningCount(positive, 6)
    expect(rcNeutral).toBe(0)
    expect(rcPositive).toBe(4)
  })

  it('RC=-4 depletes 4 extra high cards compared to neutral', () => {
    const neutral = buildCompositionFromRcPenetration(6, 75, 0)
    const negative = buildCompositionFromRcPenetration(6, 75, -4)
    const rcNeutral = computeRunningCount(neutral, 6)
    const rcNegative = computeRunningCount(negative, 6)
    expect(rcNeutral).toBe(0)
    expect(rcNegative).toBe(-4)
  })

  it('never returns negative counts', () => {
    const result = buildCompositionFromRcPenetration(6, 5, 100)
    for (const v of Object.values(result)) {
      expect(v).toBeGreaterThanOrEqual(0)
    }
  })

  it('never returns counts above full shoe', () => {
    const result = buildCompositionFromRcPenetration(6, 99, -100)
    const full = buildShoeComposition(6)
    for (const rank of Object.keys(full) as Array<keyof typeof full>) {
      expect(result[rank]).toBeLessThanOrEqual(full[rank])
    }
  })
})
