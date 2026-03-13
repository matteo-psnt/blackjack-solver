import { useEffect, useMemo, useState } from 'react'
import type { BlackjackRules, DeckComposition, StrategyTable } from '../../core/blackjack/types'
import { useStrategyTable } from '../../hooks/useStrategyTable'
import { StrategyTable as StrategyTableComponent } from './StrategyTable'
import { ActionLegend } from './ActionLegend'
import {
  formatPenetration,
  isValidPenetrationInput,
  parsePenetrationInput,
  stepPenetration,
} from './penetrationInput'
import { formatTc, isValidTcInput, parseTcInput, stepTcByTenth } from './tcInput'

const HARD_LABELS: Record<string, string> = {
  hard5: '5',
  hard6: '6',
  hard7: '7',
  hard8: '8',
  hard9: '9',
  hard10: '10',
  hard11: '11',
  hard12: '12',
  hard13: '13',
  hard14: '14',
  hard15: '15',
  hard16: '16',
  hard17: '17',
}

const SOFT_LABELS: Record<string, string> = {
  soft13: 'A+2',
  soft14: 'A+3',
  soft15: 'A+4',
  soft16: 'A+5',
  soft17: 'A+6',
  soft18: 'A+7',
  soft19: 'A+8',
  soft20: 'A+9',
}

const PAIR_LABELS: Record<string, string> = {
  pair2: '2–2',
  pair3: '3–3',
  pair4: '4–4',
  pair5: '5–5',
  pair6: '6–6',
  pair7: '7–7',
  pair8: '8–8',
  pair9: '9–9',
  pairT: 'T–T',
  pairA: 'A–A',
}

interface StrategyGridProps {
  table: StrategyTable
  rules: BlackjackRules
  tc: number
  setTc: (tc: number) => void
  penetration: number
  setPenetration: (penetration: number) => void
  countComposition: DeckComposition | undefined
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="mb-2">
      <span className="text-[10px] font-medium tracking-[0.18em] text-muted-foreground/60 uppercase">
        {children}
      </span>
    </div>
  )
}

export function StrategyGrid({
  table,
  rules,
  tc,
  setTc,
  penetration,
  setPenetration,
  countComposition,
}: StrategyGridProps) {
  const [evOverlay, setEvOverlay] = useState(false)
  const [tcInput, setTcInput] = useState(() => formatTc(tc))
  const [isEditingTc, setIsEditingTc] = useState(false)
  const [penetrationInput, setPenetrationInput] = useState(() => formatPenetration(penetration))
  const [isEditingPenetration, setIsEditingPenetration] = useState(false)
  const isCountAdjusted = countComposition !== undefined

  function handleTcInputChange(value: string) {
    if (!isValidTcInput(value)) return

    setTcInput(value)

    const nextTc = parseTcInput(value)
    if (nextTc !== null) setTc(nextTc)
  }

  function handleTcStep(direction: 1 | -1) {
    const baseTc = parseTcInput(tcInput) ?? tc
    const nextTc = stepTcByTenth(baseTc, direction)
    setTc(nextTc)
    setTcInput(formatTc(nextTc))
  }

  function handleTcBlur() {
    setIsEditingTc(false)
    setTcInput(formatTc(tc))
  }

  function handlePenetrationInputChange(value: string) {
    if (!isValidPenetrationInput(value)) return

    setPenetrationInput(value)

    const nextPenetration = parsePenetrationInput(value)
    if (nextPenetration !== null) setPenetration(nextPenetration)
  }

  function handlePenetrationStep(direction: 1 | -1) {
    const basePenetration = parsePenetrationInput(penetrationInput) ?? penetration
    const nextPenetration = stepPenetration(basePenetration, direction)
    setPenetration(nextPenetration)
    setPenetrationInput(formatPenetration(nextPenetration))
  }

  function handlePenetrationBlur() {
    setIsEditingPenetration(false)
    setPenetrationInput(formatPenetration(penetration))
  }

  useEffect(() => {
    if (!isEditingTc) setTcInput(formatTc(tc))
  }, [isEditingTc, tc])

  useEffect(() => {
    if (!isEditingPenetration) setPenetrationInput(formatPenetration(penetration))
  }, [isEditingPenetration, penetration])

  const countTable = useStrategyTable(rules, countComposition)

  const displayTable = isCountAdjusted ? countTable : table

  const deviationSet = useMemo<Set<string>>(() => {
    if (!isCountAdjusted) return new Set()
    const s = new Set<string>()
    for (const section of ['hard', 'soft', 'pairs'] as const) {
      for (const [handKey, row] of Object.entries(countTable[section])) {
        for (const [up, cell] of Object.entries(row as Record<string, { action: string }>)) {
          const basic = (table[section] as Record<string, Record<string, { action: string }>>)[handKey]?.[up]
          if (basic && cell.action !== basic.action) s.add(`${handKey}|${up}`)
        }
      }
    }
    return s
  }, [isCountAdjusted, table, countTable])

  const hardRows = Object.entries(displayTable.hard).map(([key, row]) => ({
    key: key as keyof typeof displayTable.hard,
    label: HARD_LABELS[key] ?? key,
    row,
  }))

  const softRows = Object.entries(displayTable.soft).map(([key, row]) => ({
    key: key as keyof typeof displayTable.soft,
    label: SOFT_LABELS[key] ?? key,
    row,
  }))

  const pairRows = Object.entries(displayTable.pairs).map(([key, row]) => ({
    key: key as keyof typeof displayTable.pairs,
    label: PAIR_LABELS[key] ?? key,
    row,
  }))

  const btnClass = (active: boolean) =>
    `text-[10px] font-mono tracking-wide px-2 py-1 rounded border transition-colors ${
      active
        ? 'border-muted-foreground/50 text-foreground bg-muted/40'
        : 'border-muted-foreground/20 text-muted-foreground hover:text-foreground hover:border-muted-foreground/40'
    }`

  return (
    <div className="flex flex-col gap-3 px-6 py-4">
      <div className="flex items-center justify-between">
        <ActionLegend />
        <div className="flex items-center gap-2">
          {evOverlay && (
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: 'oklch(0.38 0.18 22)' }} />
              <span>lose</span>
              <span className="mx-0.5 opacity-40">—</span>
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: 'oklch(0.38 0.18 148)' }} />
              <span>win</span>
            </div>
          )}
          <button onClick={() => setEvOverlay(v => !v)} className={btnClass(evOverlay)}>
            EV heatmap
          </button>
          <div className={`flex items-center gap-1 border rounded px-2 py-1 ${isCountAdjusted ? 'border-muted-foreground/50' : 'border-muted-foreground/20'}`}>
            <span className="text-[10px] font-mono text-muted-foreground">TC</span>
            <input
              aria-label="True count"
              type="text"
              inputMode="decimal"
              value={tcInput}
              onFocus={() => setIsEditingTc(true)}
              onChange={e => handleTcInputChange(e.target.value)}
              onBlur={handleTcBlur}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  handleTcStep(1)
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  handleTcStep(-1)
                }
              }}
              className="w-14 bg-transparent text-[10px] font-mono text-center text-foreground outline-none [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
          <div className={`flex items-center gap-1 border rounded px-2 py-1 ${isCountAdjusted ? 'border-muted-foreground/50' : 'border-muted-foreground/20'}`}>
            <span className="text-[10px] font-mono text-muted-foreground">Pen</span>
            <input
              aria-label="Penetration dealt percentage"
              type="text"
              inputMode="decimal"
              value={penetrationInput}
              onFocus={() => setIsEditingPenetration(true)}
              onChange={e => handlePenetrationInputChange(e.target.value)}
              onBlur={handlePenetrationBlur}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  handlePenetrationStep(1)
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  handlePenetrationStep(-1)
                }
              }}
              className="w-12 bg-transparent text-[10px] font-mono text-center text-foreground outline-none [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="text-[10px] font-mono text-muted-foreground">%</span>
          </div>
        </div>
      </div>

      <section className="mx-auto w-fit max-w-full">
        <SectionLabel>Hard</SectionLabel>
        <StrategyTableComponent rows={hardRows} evOverlay={evOverlay} deviationSet={deviationSet} />
      </section>

      <section className="mx-auto w-fit max-w-full">
        <SectionLabel>Soft</SectionLabel>
        <StrategyTableComponent rows={softRows} evOverlay={evOverlay} deviationSet={deviationSet} />
      </section>

      <section className="mx-auto w-fit max-w-full">
        <SectionLabel>Pairs</SectionLabel>
        <StrategyTableComponent rows={pairRows} evOverlay={evOverlay} deviationSet={deviationSet} />
      </section>
    </div>
  )
}
