export const TC_MIN = -10
export const TC_MAX = 15
export const TC_STEP = 0.1

const EPSILON = 1e-9
const TC_INPUT_PATTERN = /^-?(?:\d+)?(?:\.\d*)?$/

export function clampTc(value: number): number {
  if (!Number.isFinite(value)) return 0

  const clamped = Math.min(TC_MAX, Math.max(TC_MIN, value))
  return Object.is(clamped, -0) ? 0 : clamped
}

export function formatTc(value: number): string {
  return String(clampTc(value))
}

export function isValidTcInput(value: string): boolean {
  return value === '' || value === '-' || value === '.' || value === '-.' || TC_INPUT_PATTERN.test(value)
}

export function parseTcInput(value: string): number | null {
  if (!isValidTcInput(value) || value === '' || value === '-' || value === '.' || value === '-.') {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? clampTc(parsed) : null
}

export function stepTcByTenth(value: number, direction: 1 | -1): number {
  const current = clampTc(value)
  const stepped =
    direction > 0
      ? Math.ceil((current + EPSILON) / TC_STEP) * TC_STEP
      : Math.floor((current - EPSILON) / TC_STEP) * TC_STEP

  return clampTc(Math.round(stepped * 10) / 10)
}
