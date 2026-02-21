import { describe, it, expect } from 'vitest'
import { DEFAULT_RULES } from '../core/blackjack/constants'
import { computeStrategyTable } from '../core/blackjack/strategy'

describe('computeStrategyTable', () => {
  const table = computeStrategyTable(DEFAULT_RULES)

  it('returns all three sections', () => {
    expect(table.hard).toBeDefined()
    expect(table.soft).toBeDefined()
    expect(table.pairs).toBeDefined()
  })

  it('hard17 vs 2-T: action = S (never hit hard 17)', () => {
    const row = table.hard['hard17']
    // vs 2-T: stand is correct (surrender EV > stand only vs A in H17)
    for (const upcard of ['2', '3', '4', '5', '6', '7', '8', '9', 'T'] as const) {
      expect(row[upcard].action).toBe('S')
    }
  })

  it('hard17 vs A (H17): action = R (surrender is correct per basic strategy)', () => {
    // With H17 rules, evStand(17) vs A (no BJ) ≈ -0.61 < -0.5 → surrender
    const row = table.hard['hard17']
    expect(row['A'].action).toBe('R')
  })

  it('hard16 vs T: action = R (late surrender available)', () => {
    // Default rules have late surrender
    const cell = table.hard['hard16']['T']
    expect(cell.action).toBe('R')
  })

  it('pair of aces vs any upcard: action = P', () => {
    const row = table.pairs['pairA']
    for (const upcard of ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'A'] as const) {
      expect(row[upcard].action).toBe('P')
    }
  })

  it('pair of 8s vs any upcard: action = P', () => {
    const row = table.pairs['pair8']
    for (const upcard of ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'A'] as const) {
      expect(row[upcard].action).toBe('P')
    }
  })

  it('hard 11 vs 2-T: action = D', () => {
    const row = table.hard['hard11']
    for (const upcard of ['2', '3', '4', '5', '6', '7', '8', '9', 'T'] as const) {
      expect(row[upcard].action).toBe('D')
    }
  })

  it('all cells have valid actions', () => {
    const validActions = new Set(['H', 'S', 'D', 'P', 'R'])
    for (const section of [table.hard, table.soft, table.pairs]) {
      for (const row of Object.values(section)) {
        for (const cell of Object.values(row)) {
          expect(validActions.has(cell.action)).toBe(true)
          expect(Number.isFinite(cell.ev)).toBe(true)
        }
      }
    }
  })

  it('pair of tens vs any: action = S (never split tens)', () => {
    const row = table.pairs['pairT']
    for (const upcard of ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'A'] as const) {
      expect(row[upcard].action).toBe('S')
    }
  })

  it('soft 20 (A+9): action = S always', () => {
    const row = table.soft['soft20']
    for (const upcard of ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'A'] as const) {
      expect(row[upcard].action).toBe('S')
    }
  })
})
