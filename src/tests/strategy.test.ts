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

  it('hard17 vs A (S17, no surrender): action = S', () => {
    // With S17 rules and no surrender, stand is optimal vs A
    const row = table.hard['hard17']
    expect(row['A'].action).toBe('S')
  })

  it('hard16 vs T (no surrender): action = H', () => {
    // No surrender available, so hit is optimal
    const cell = table.hard['hard16']['T']
    expect(cell.action).toBe('H')
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

  it('all breakdown EVs are finite numbers or null', () => {
    for (const section of [table.hard, table.soft, table.pairs]) {
      for (const row of Object.values(section)) {
        for (const cell of Object.values(row)) {
          for (const ev of Object.values(cell.breakdown)) {
            if (ev !== null) expect(Number.isFinite(ev)).toBe(true)
          }
        }
      }
    }
  })

  it('cell.action is always the argmax of the non-null breakdown EVs', () => {
    const actionKeys: Record<string, keyof typeof table.hard[keyof typeof table.hard][keyof typeof table.hard[keyof typeof table.hard]]['breakdown']> = {
      H: 'H', S: 'S', D: 'D', P: 'P', R: 'R',
    }
    for (const section of [table.hard, table.soft, table.pairs]) {
      for (const row of Object.values(section)) {
        for (const cell of Object.values(row) as { action: string; ev: number; breakdown: Record<string, number | null> }[]) {
          const best = Object.entries(cell.breakdown)
            .filter(([, v]) => v !== null)
            .reduce((a, b) => ((b[1] as number) > (a[1] as number) ? b : a))
          expect(cell.action).toBe(best[0])
        }
      }
    }
  })
})

describe('early surrender vs late surrender strategy differences', () => {
  const earlySurrRules = { ...DEFAULT_RULES, surrender: 'early' as const }
  const lateSurrRules = { ...DEFAULT_RULES, surrender: 'late' as const }
  const earlyTable = computeStrategyTable(earlySurrRules)
  const lateTable = computeStrategyTable(lateSurrRules)

  it('early surrender produces at least as many R cells as late surrender', () => {
    let earlyR = 0, lateR = 0
    for (const section of ['hard', 'soft', 'pairs'] as const) {
      for (const key of Object.keys(earlyTable[section])) {
        for (const upcard of ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'A'] as const) {
          if ((earlyTable[section] as Record<string, Record<string, { action: string }>>)[key][upcard].action === 'R') earlyR++
          if ((lateTable[section] as Record<string, Record<string, { action: string }>>)[key][upcard].action === 'R') lateR++
        }
      }
    }
    expect(earlyR).toBeGreaterThan(lateR)
  })

  it('early surrender adds more R cells vs dealer A than vs other upcards', () => {
    // Effective threshold vs A is ≈ -0.278 (vs -0.5 for late), so many more hands surrender
    let extraVsA = 0, extraVsOther = 0
    for (const section of ['hard', 'soft', 'pairs'] as const) {
      for (const key of Object.keys(earlyTable[section])) {
        const earlyRow = (earlyTable[section] as Record<string, Record<string, { action: string }>>)[key]
        const lateRow = (lateTable[section] as Record<string, Record<string, { action: string }>>)[key]
        if (earlyRow['A'].action === 'R' && lateRow['A'].action !== 'R') extraVsA++
        for (const upcard of ['2', '3', '4', '5', '6', '7', '8', '9'] as const) {
          if (earlyRow[upcard].action === 'R' && lateRow[upcard].action !== 'R') extraVsOther++
        }
      }
    }
    // No early surrender benefit vs 2-9 (no BJ possible), but lots vs A
    expect(extraVsOther).toBe(0)
    expect(extraVsA).toBeGreaterThan(0)
  })

  it('early surrender: hard 14 vs A should be R (EV_noBJ ≈ -0.40 < threshold -0.278)', () => {
    // Hard 14 vs A with late surrender: evNoBJ > -0.5 so action = H
    // With early surrender: evNoBJ < -0.278 so action = R
    expect(lateTable.hard['hard14']['A'].action).not.toBe('R')
    expect(earlyTable.hard['hard14']['A'].action).toBe('R')
  })

  it('early surrender vs 2-9 upcards: identical to late surrender (no BJ possible)', () => {
    for (const upcard of ['2', '3', '4', '5', '6', '7', '8', '9'] as const) {
      for (const key of Object.keys(earlyTable.hard) as (keyof typeof earlyTable.hard)[]) {
        expect(earlyTable.hard[key][upcard].action).toBe(lateTable.hard[key][upcard].action)
      }
    }
  })
})

describe('no surrender rules', () => {
  it('no R actions when surrender = none', () => {
    const noSurrTable = computeStrategyTable({ ...DEFAULT_RULES, surrender: 'none' })
    for (const section of [noSurrTable.hard, noSurrTable.soft, noSurrTable.pairs]) {
      for (const row of Object.values(section)) {
        for (const cell of Object.values(row)) {
          expect(cell.action).not.toBe('R')
        }
      }
    }
  })
})

describe('rule variations affect strategy', () => {
  it('disabling DAS changes some split decisions', () => {
    const withDAS = computeStrategyTable({ ...DEFAULT_RULES, doubleAfterSplit: true })
    const noDAS = computeStrategyTable({ ...DEFAULT_RULES, doubleAfterSplit: false })
    let diffs = 0
    for (const key of Object.keys(withDAS.pairs) as (keyof typeof withDAS.pairs)[]) {
      for (const upcard of ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'A'] as const) {
        if (withDAS.pairs[key][upcard].action !== noDAS.pairs[key][upcard].action) diffs++
      }
    }
    expect(diffs).toBeGreaterThan(0)
  })

  it('double restriction 10-11 removes D actions on hard 9', () => {
    const restricted = computeStrategyTable({ ...DEFAULT_RULES, doubleRestriction: '10-11' })
    const row = restricted.hard['hard9']
    for (const upcard of ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'A'] as const) {
      expect(row[upcard].action).not.toBe('D')
    }
  })

  it('RSA enabled: strategy table computes without error', () => {
    const rsaTable = computeStrategyTable({ ...DEFAULT_RULES, resplitAces: true })
    expect(rsaTable.pairs['pairA']['A'].action).toBe('P')
  })

  it('max splits 2 vs 4: strategy table computes without error for both', () => {
    const t2 = computeStrategyTable({ ...DEFAULT_RULES, maxSplits: 2 })
    const t4 = computeStrategyTable({ ...DEFAULT_RULES, maxSplits: 4 })
    // Both should always split A-A
    expect(t2.pairs['pairA']['6'].action).toBe('P')
    expect(t4.pairs['pairA']['6'].action).toBe('P')
  })
})

describe('finite deck strategy', () => {
  it('1-deck strategy table computes without error and returns valid actions', () => {
    const table = computeStrategyTable({ ...DEFAULT_RULES, decks: 1 })
    const validActions = new Set(['H', 'S', 'D', 'P', 'R'])
    for (const section of [table.hard, table.soft, table.pairs]) {
      for (const row of Object.values(section)) {
        for (const cell of Object.values(row)) {
          expect(validActions.has(cell.action)).toBe(true)
        }
      }
    }
  })

  it('1-deck: pair of aces always split', () => {
    const table = computeStrategyTable({ ...DEFAULT_RULES, decks: 1 })
    for (const upcard of ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'A'] as const) {
      expect(table.pairs['pairA'][upcard].action).toBe('P')
    }
  })

  it('strategy table is consistent across all supported deck counts', () => {
    for (const decks of [1, 2, 4, 6, 8] as const) {
      const table = computeStrategyTable({ ...DEFAULT_RULES, decks })
      // Hard 17 should never hit regardless of deck count
      for (const upcard of ['2', '3', '4', '5', '6', '7', '8', '9', 'T'] as const) {
        expect(table.hard['hard17'][upcard].action).toBe('S')
      }
    }
  })
})
