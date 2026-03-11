/**
 * Cell-by-cell verification against Wizard of Odds basic strategy.
 * Source: https://blackjack-strategy.co/blackjack-strategy-chart/blackjack-strategy-card-6-decks-pays-3-to-2-stand-17/
 * Rules: 6 decks, S17, DAS, resplit aces, no surrender, 3:2, dealer peek.
 *
 * All 130 cells (13 hard × 10 + 8 soft × 10 + 9 pair × 10) are checked.
 * WoO uses "Ds" (double if allowed else stand) — here DAS is allowed so Ds = D.
 */

import { describe, it, expect } from 'vitest'
import { computeStrategyTable } from '../core/blackjack/strategy'
import { DEFAULT_RULES } from '../core/blackjack/constants'
import type { BlackjackRules } from '../core/blackjack/types'

const rules: BlackjackRules = {
  ...DEFAULT_RULES,
  decks: 6,
  dealerHitsSoft17: false,
  doubleAfterSplit: true,
  resplitAces: true,
  surrender: 'none',
}

const t = computeStrategyTable(rules)
const h = t.hard
const s = t.soft
const p = t.pairs

// Helper: assert action
function chk(label: string, actual: string, expected: string) {
  it(`${label}`, () => expect(actual).toBe(expected))
}

describe('WoO 6d S17 DAS — Hard totals', () => {
  // 5–8: always H
  for (const key of ['hard5','hard6','hard7','hard8'] as const) {
    for (const up of ['2','3','4','5','6','7','8','9','T','A'] as const) {
      chk(`${key} vs ${up}`, h[key][up].action, 'H')
    }
  }
  // 9: D vs 3-6, H otherwise
  for (const up of ['2','7','8','9','T','A'] as const) chk(`hard9 vs ${up}`, h.hard9[up].action, 'H')
  for (const up of ['3','4','5','6'] as const) chk(`hard9 vs ${up}`, h.hard9[up].action, 'D')
  // 10: D vs 2-9, H vs T, A
  for (const up of ['2','3','4','5','6','7','8','9'] as const) chk(`hard10 vs ${up}`, h.hard10[up].action, 'D')
  for (const up of ['T','A'] as const) chk(`hard10 vs ${up}`, h.hard10[up].action, 'H')
  // 11: D vs 2-T, H vs A
  for (const up of ['2','3','4','5','6','7','8','9','T'] as const) chk(`hard11 vs ${up}`, h.hard11[up].action, 'D')
  chk('hard11 vs A', h.hard11['A'].action, 'H')
  // 12: S vs 4-6, H otherwise
  for (const up of ['2','3','7','8','9','T','A'] as const) chk(`hard12 vs ${up}`, h.hard12[up].action, 'H')
  for (const up of ['4','5','6'] as const) chk(`hard12 vs ${up}`, h.hard12[up].action, 'S')
  // 13-16: S vs 2-6, H otherwise
  for (const key of ['hard13','hard14','hard15','hard16'] as const) {
    for (const up of ['2','3','4','5','6'] as const) chk(`${key} vs ${up}`, h[key][up].action, 'S')
    for (const up of ['7','8','9','T','A'] as const) chk(`${key} vs ${up}`, h[key][up].action, 'H')
  }
  // 17: always S
  for (const up of ['2','3','4','5','6','7','8','9','T','A'] as const) {
    chk(`hard17 vs ${up}`, h.hard17[up].action, 'S')
  }
})

describe('WoO 6d S17 DAS — Soft totals', () => {
  // A,2-3 (soft13-14): D vs 5-6, H otherwise
  for (const key of ['soft13','soft14'] as const) {
    for (const up of ['2','3','4','7','8','9','T','A'] as const) chk(`${key} vs ${up}`, s[key][up].action, 'H')
    for (const up of ['5','6'] as const) chk(`${key} vs ${up}`, s[key][up].action, 'D')
  }
  // A,4-5 (soft15-16): D vs 4-6, H otherwise
  for (const key of ['soft15','soft16'] as const) {
    for (const up of ['2','3','7','8','9','T','A'] as const) chk(`${key} vs ${up}`, s[key][up].action, 'H')
    for (const up of ['4','5','6'] as const) chk(`${key} vs ${up}`, s[key][up].action, 'D')
  }
  // A,6 (soft17): D vs 3-6, H otherwise
  for (const up of ['2','7','8','9','T','A'] as const) chk(`soft17 vs ${up}`, s.soft17[up].action, 'H')
  for (const up of ['3','4','5','6'] as const) chk(`soft17 vs ${up}`, s.soft17[up].action, 'D')
  // A,7 (soft18): D vs 3-6, S vs 2/7/8, H vs 9/T/A
  chk('soft18 vs 2', s.soft18['2'].action, 'S')
  for (const up of ['3','4','5','6'] as const) chk(`soft18 vs ${up}`, s.soft18[up].action, 'D')
  for (const up of ['7','8'] as const) chk(`soft18 vs ${up}`, s.soft18[up].action, 'S')
  for (const up of ['9','T','A'] as const) chk(`soft18 vs ${up}`, s.soft18[up].action, 'H')
  // A,8-9 (soft19-20): always S
  for (const key of ['soft19','soft20'] as const) {
    for (const up of ['2','3','4','5','6','7','8','9','T','A'] as const) {
      chk(`${key} vs ${up}`, s[key][up].action, 'S')
    }
  }
})

describe('WoO 6d S17 DAS — Pairs', () => {
  // 2,2 and 3,3: P vs 2-7, H vs 8-A
  for (const key of ['pair2','pair3'] as const) {
    for (const up of ['2','3','4','5','6','7'] as const) chk(`${key} vs ${up}`, p[key][up].action, 'P')
    for (const up of ['8','9','T','A'] as const) chk(`${key} vs ${up}`, p[key][up].action, 'H')
  }
  // 4,4: P vs 5-6, H otherwise
  for (const up of ['2','3','4','7','8','9','T','A'] as const) chk(`pair4 vs ${up}`, p.pair4[up].action, 'H')
  for (const up of ['5','6'] as const) chk(`pair4 vs ${up}`, p.pair4[up].action, 'P')
  // 5,5: treat as hard 10 — D vs 2-9, H vs T/A
  for (const up of ['2','3','4','5','6','7','8','9'] as const) chk(`pair5 vs ${up}`, p.pair5[up].action, 'D')
  for (const up of ['T','A'] as const) chk(`pair5 vs ${up}`, p.pair5[up].action, 'H')
  // 6,6: P vs 2-6, H vs 7-A
  for (const up of ['2','3','4','5','6'] as const) chk(`pair6 vs ${up}`, p.pair6[up].action, 'P')
  for (const up of ['7','8','9','T','A'] as const) chk(`pair6 vs ${up}`, p.pair6[up].action, 'H')
  // 7,7: P vs 2-7, H vs 8-A
  for (const up of ['2','3','4','5','6','7'] as const) chk(`pair7 vs ${up}`, p.pair7[up].action, 'P')
  for (const up of ['8','9','T','A'] as const) chk(`pair7 vs ${up}`, p.pair7[up].action, 'H')
  // 8,8: always P
  for (const up of ['2','3','4','5','6','7','8','9','T','A'] as const) {
    chk(`pair8 vs ${up}`, p.pair8[up].action, 'P')
  }
  // 9,9: P vs 2-6/8-9, S vs 7/T/A
  for (const up of ['2','3','4','5','6','8','9'] as const) chk(`pair9 vs ${up}`, p.pair9[up].action, 'P')
  for (const up of ['7','T','A'] as const) chk(`pair9 vs ${up}`, p.pair9[up].action, 'S')
  // T,T: always S
  for (const up of ['2','3','4','5','6','7','8','9','T','A'] as const) {
    chk(`pairT vs ${up}`, p.pairT[up].action, 'S')
  }
  // A,A: always P
  for (const up of ['2','3','4','5','6','7','8','9','T','A'] as const) {
    chk(`pairA vs ${up}`, p.pairA[up].action, 'P')
  }
})
