/**
 * Snapshot regression tests.
 *
 * These tests lock the complete strategy table and key house edge values.
 * Any change to the engine that affects a strategy decision or house edge
 * will cause a snapshot mismatch, forcing an explicit review.
 *
 * To update snapshots after an intentional model change:
 *   npx vitest run --update-snapshots
 */
import { describe, it, expect } from 'vitest'
import { DEFAULT_RULES } from '../core/blackjack/constants'
import { computeStrategyTable } from '../core/blackjack/strategy'
import { computeHouseEdge } from '../core/blackjack/houseEdge'
import type { DealerUpcard } from '../core/blackjack/types'

const UPCARDS: DealerUpcard[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'A']

// ---------------------------------------------------------------------------
// Strategy table snapshot (DEFAULT_RULES: 6-deck H17 DAS late-surr 3:2)
// ---------------------------------------------------------------------------

describe('strategy table snapshot — DEFAULT_RULES', () => {
  const table = computeStrategyTable(DEFAULT_RULES)

  // Flatten the table to a simple action grid for easy snapshot diffing.
  // Format: { sectionKey: { handKey: "2:H 3:H 4:S ..." } }
  function tableToGrid(t: typeof table) {
    const grid: Record<string, Record<string, string>> = {}
    for (const [section, rows] of Object.entries(t)) {
      grid[section] = {}
      for (const [handKey, row] of Object.entries(rows)) {
        grid[section][handKey] = UPCARDS.map(u => `${u}:${(row as any)[u].action}`).join(' ')
      }
    }
    return grid
  }

  it('full strategy table matches snapshot', () => {
    expect(tableToGrid(table)).toMatchSnapshot()
  })
})

// ---------------------------------------------------------------------------
// House edge anchors — locked to 4 decimal places
// ---------------------------------------------------------------------------

describe('house edge anchors', () => {
  function he(rules: Parameters<typeof computeHouseEdge>[0]) {
    return parseFloat((computeHouseEdge(rules).houseEdge * 100).toFixed(4))
  }

  it('DEFAULT_RULES (6-deck H17 DAS late-surr 3:2)', () => {
    expect(he(DEFAULT_RULES)).toMatchSnapshot()
  })

  it('6-deck H17 DAS no-surr 3:2', () => {
    expect(he({ ...DEFAULT_RULES, surrender: 'none' })).toMatchSnapshot()
  })

  it('6-deck S17 DAS no-surr 3:2', () => {
    expect(he({ ...DEFAULT_RULES, surrender: 'none', dealerHitsSoft17: false })).toMatchSnapshot()
  })

  it('1-deck H17 DAS no-surr 3:2', () => {
    expect(he({ ...DEFAULT_RULES, decks: 1, surrender: 'none' })).toMatchSnapshot()
  })

  it('6-deck H17 DAS no-surr 6:5', () => {
    expect(he({ ...DEFAULT_RULES, surrender: 'none', blackjackPayout: 1.2 })).toMatchSnapshot()
  })

  it('6-deck H17 no-DAS no-surr 3:2', () => {
    expect(he({ ...DEFAULT_RULES, surrender: 'none', doubleAfterSplit: false })).toMatchSnapshot()
  })

  it('6-deck H17 DAS early-surr 3:2', () => {
    expect(he({ ...DEFAULT_RULES, surrender: 'early' })).toMatchSnapshot()
  })
})
