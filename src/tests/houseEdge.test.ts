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
    expect(diff).toBeGreaterThan(0) // H17 is worse for player
    expect(diff).toBeCloseTo(0.002, 1) // ~0.20% ≈ 0.002
  })

  it('6:5 BJ payout vs 3:2: house edge difference > 1.3%', () => {
    const threeTwo = computeHouseEdge({ ...H17, blackjackPayout: 1.5 })
    const sixFive = computeHouseEdge({ ...H17, blackjackPayout: 1.2 })
    const diff = sixFive.houseEdge - threeTwo.houseEdge
    expect(diff).toBeGreaterThan(0.013) // > 1.3%
  })

  it('late surrender reduces house edge vs no surrender', () => {
    const withSurr = computeHouseEdge({ ...H17, surrender: 'late' })
    const noSurr = computeHouseEdge({ ...H17, surrender: 'none' })
    expect(withSurr.houseEdge).toBeLessThan(noSurr.houseEdge)
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
