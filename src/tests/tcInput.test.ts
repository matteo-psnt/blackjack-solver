import { describe, expect, it } from 'vitest'
import { clampTc, parseTcInput, stepTcByTenth } from '../features/strategy/tcInput'

describe('tcInput', () => {
  it('allows precise typed values', () => {
    expect(parseTcInput('0.05')).toBe(0.05)
    expect(parseTcInput('-1.275')).toBe(-1.275)
  })

  it('steps upward to the next tenth boundary', () => {
    expect(stepTcByTenth(0.05, 1)).toBe(0.1)
    expect(stepTcByTenth(0.1, 1)).toBe(0.2)
    expect(stepTcByTenth(-0.05, 1)).toBe(0)
  })

  it('steps downward to the previous tenth boundary', () => {
    expect(stepTcByTenth(0.05, -1)).toBe(0)
    expect(stepTcByTenth(0.1, -1)).toBe(0)
    expect(stepTcByTenth(-0.05, -1)).toBe(-0.1)
  })

  it('clamps values to the supported TC range', () => {
    expect(clampTc(99)).toBe(15)
    expect(clampTc(-99)).toBe(-10)
  })
})
