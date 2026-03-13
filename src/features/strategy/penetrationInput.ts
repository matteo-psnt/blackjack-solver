export const PENETRATION_MIN = 0
export const PENETRATION_MAX = 100
export const PENETRATION_STEP = 1

const EPSILON = 1e-9
const PENETRATION_INPUT_PATTERN = /^-?(?:\d+)?(?:\.\d*)?$/

export function clampPenetration(value: number): number {
  if (!Number.isFinite(value)) return 50

  const clamped = Math.min(PENETRATION_MAX, Math.max(PENETRATION_MIN, value))
  return Object.is(clamped, -0) ? 0 : clamped
}

export function formatPenetration(value: number): string {
  return String(clampPenetration(value))
}

export function isValidPenetrationInput(value: string): boolean {
  return value === '' || value === '-' || value === '.' || value === '-.' || PENETRATION_INPUT_PATTERN.test(value)
}

export function parsePenetrationInput(value: string): number | null {
  if (!isValidPenetrationInput(value) || value === '' || value === '-' || value === '.' || value === '-.') {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? clampPenetration(parsed) : null
}

export function stepPenetration(value: number, direction: 1 | -1): number {
  const current = clampPenetration(value)
  const stepped =
    direction > 0
      ? Math.ceil((current + EPSILON) / PENETRATION_STEP) * PENETRATION_STEP
      : Math.floor((current - EPSILON) / PENETRATION_STEP) * PENETRATION_STEP

  return clampPenetration(Math.round(stepped))
}
