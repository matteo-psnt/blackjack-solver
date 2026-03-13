import { describe, expect, it } from 'vitest'
import {
  clampPenetration,
  parsePenetrationInput,
  stepPenetration,
} from '../features/strategy/penetrationInput'

describe('penetrationInput', () => {
  it('allows precise typed values', () => {
    expect(parsePenetrationInput('75.5')).toBe(75.5)
    expect(parsePenetrationInput('0')).toBe(0)
  })

  it('steps upward to the next whole percent', () => {
    expect(stepPenetration(74.2, 1)).toBe(75)
    expect(stepPenetration(75, 1)).toBe(76)
  })

  it('steps downward to the previous whole percent', () => {
    expect(stepPenetration(74.8, -1)).toBe(74)
    expect(stepPenetration(75, -1)).toBe(74)
  })

  it('clamps values to the supported penetration range', () => {
    expect(clampPenetration(125)).toBe(100)
    expect(clampPenetration(-20)).toBe(0)
  })
})
