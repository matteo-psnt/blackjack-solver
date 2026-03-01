import { describe, it, expect } from 'vitest'
import { DEFAULT_RULES } from '../core/blackjack/constants'
import { computeHouseEdge } from '../core/blackjack/houseEdge'

const H17 = { ...DEFAULT_RULES, dealerHitsSoft17: true }
const S17 = { ...DEFAULT_RULES, dealerHitsSoft17: false }

describe('computeHouseEdge', () => {
  it('returns a valid HouseEdgeResult', () => {
    const result = computeHouseEdge(DEFAULT_RULES)
    expect(typeof result.houseEdge).toBe('number')
    expect(typeof result.playerEdge).toBe('number')
    expect(typeof result.formatted).toBe('string')
    expect(result.formatted).toMatch(/^\d+\.\d{2}%$/)
  })

  it('house edge is within plausible bounds (0% – 10%)', () => {
    const result = computeHouseEdge(DEFAULT_RULES)
    expect(result.houseEdge).toBeGreaterThan(0)
    expect(result.houseEdge).toBeLessThan(0.10)
  })

  it('H17 has higher house edge than S17 (~0.20% difference)', () => {
    const h17 = computeHouseEdge(H17)
    const s17 = computeHouseEdge(S17)
    const diff = h17.houseEdge - s17.houseEdge
    expect(diff).toBeGreaterThan(0)
    expect(diff).toBeCloseTo(0.002, 1)
  })

  it('6:5 BJ payout vs 3:2: house edge difference > 1.3%', () => {
    const threeTwo = computeHouseEdge({ ...H17, blackjackPayout: 1.5 })
    const sixFive = computeHouseEdge({ ...H17, blackjackPayout: 1.2 })
    const diff = sixFive.houseEdge - threeTwo.houseEdge
    expect(diff).toBeGreaterThan(0.013)
  })

  it('late surrender reduces house edge vs no surrender', () => {
    const withSurr = computeHouseEdge({ ...H17, surrender: 'late' })
    const noSurr = computeHouseEdge({ ...H17, surrender: 'none' })
    expect(withSurr.houseEdge).toBeLessThan(noSurr.houseEdge)
  })

  it('early surrender reduces house edge more than late surrender (~0.5-0.7% extra)', () => {
    const early = computeHouseEdge({ ...H17, surrender: 'early' })
    const late = computeHouseEdge({ ...H17, surrender: 'late' })
    const none = computeHouseEdge({ ...H17, surrender: 'none' })
    expect(early.houseEdge).toBeLessThan(none.houseEdge)
    expect(late.houseEdge).toBeLessThan(none.houseEdge)
    expect(early.houseEdge).toBeLessThan(late.houseEdge)
    const earlyBenefit = none.houseEdge - early.houseEdge
    expect(earlyBenefit).toBeGreaterThan(0.004)
    expect(earlyBenefit).toBeLessThan(0.012)
  })

  it('DAS enabled reduces house edge vs DAS disabled', () => {
    const withDAS = computeHouseEdge({ ...H17, doubleAfterSplit: true })
    const noDAS = computeHouseEdge({ ...H17, doubleAfterSplit: false })
    expect(withDAS.houseEdge).toBeLessThan(noDAS.houseEdge)
  })

  it('houseEdge = -playerEdge', () => {
    const result = computeHouseEdge(DEFAULT_RULES)
    expect(result.houseEdge).toBeCloseTo(-result.playerEdge, 12)
  })

  it('formatted string matches houseEdge value', () => {
    const result = computeHouseEdge(DEFAULT_RULES)
    const expected = (Math.abs(result.houseEdge) * 100).toFixed(2) + '%'
    expect(result.formatted).toBe(expected)
  })
})

describe('ENHC (no-peek) house edge', () => {
  it('ENHC increases house edge vs US peek', () => {
    const peek = computeHouseEdge({ ...H17, dealerPeek: true })
    const enhc = computeHouseEdge({ ...H17, dealerPeek: false })
    expect(enhc.houseEdge).toBeGreaterThan(peek.houseEdge)
  })

  it('ENHC penalty is in realistic range (0.05% – 0.40%)', () => {
    const peek = computeHouseEdge({ ...H17, dealerPeek: true })
    const enhc = computeHouseEdge({ ...H17, dealerPeek: false })
    const penalty = enhc.houseEdge - peek.houseEdge
    expect(penalty).toBeGreaterThan(0.0005)
    expect(penalty).toBeLessThan(0.004)
  })

  it('ENHC house edge is still within plausible bounds', () => {
    const result = computeHouseEdge({ ...H17, dealerPeek: false })
    expect(result.houseEdge).toBeGreaterThan(0)
    expect(result.houseEdge).toBeLessThan(0.10)
  })
})

describe('max splits house edge', () => {
  it('more splits allowed is better for player (or equal)', () => {
    const splits2 = computeHouseEdge({ ...H17, maxSplits: 2 })
    const splits4 = computeHouseEdge({ ...H17, maxSplits: 4 })
    // More splits = more player options = lower house edge
    expect(splits4.houseEdge).toBeLessThanOrEqual(splits2.houseEdge)
  })

  it('max splits difference is small (< 0.1%)', () => {
    const splits2 = computeHouseEdge({ ...H17, maxSplits: 2 })
    const splits4 = computeHouseEdge({ ...H17, maxSplits: 4 })
    expect(Math.abs(splits4.houseEdge - splits2.houseEdge)).toBeLessThan(0.001)
  })
})

describe('double restriction house edge', () => {
  it('unrestricted doubling is better for player than 10-11 only', () => {
    const any = computeHouseEdge({ ...H17, doubleRestriction: 'any' })
    const restricted = computeHouseEdge({ ...H17, doubleRestriction: '10-11' })
    expect(any.houseEdge).toBeLessThan(restricted.houseEdge)
  })

  it('9-11 doubling is better for player than 10-11 only', () => {
    const nineEleven = computeHouseEdge({ ...H17, doubleRestriction: '9-11' })
    const tenEleven = computeHouseEdge({ ...H17, doubleRestriction: '10-11' })
    expect(nineEleven.houseEdge).toBeLessThan(tenEleven.houseEdge)
  })
})

describe('resplit aces', () => {
  it('RSA reduces house edge vs no RSA', () => {
    const rsa = computeHouseEdge({ ...H17, resplitAces: true })
    const noRsa = computeHouseEdge({ ...H17, resplitAces: false })
    expect(rsa.houseEdge).toBeLessThan(noRsa.houseEdge)
  })
})
