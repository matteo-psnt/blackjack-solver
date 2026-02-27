import { useState } from 'react'
import type { StrategyTable } from '../../core/blackjack/types'
import { StrategyTable as StrategyTableComponent } from './StrategyTable'
import { ActionLegend } from './ActionLegend'

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

export function StrategyGrid({ table }: StrategyGridProps) {
  const [evOverlay, setEvOverlay] = useState(false)

  const hardRows = Object.entries(table.hard).map(([key, row]) => ({
    key: key as keyof typeof table.hard,
    label: HARD_LABELS[key] ?? key,
    row,
  }))

  const softRows = Object.entries(table.soft).map(([key, row]) => ({
    key: key as keyof typeof table.soft,
    label: SOFT_LABELS[key] ?? key,
    row,
  }))

  const pairRows = Object.entries(table.pairs).map(([key, row]) => ({
    key: key as keyof typeof table.pairs,
    label: PAIR_LABELS[key] ?? key,
    row,
  }))

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
          <button
            onClick={() => setEvOverlay(v => !v)}
            className={`text-[10px] font-mono tracking-wide px-2 py-1 rounded border transition-colors ${
              evOverlay
                ? 'border-muted-foreground/50 text-foreground bg-muted/40'
                : 'border-muted-foreground/20 text-muted-foreground hover:text-foreground hover:border-muted-foreground/40'
            }`}
          >
            EV heatmap
          </button>
        </div>
      </div>

      <section>
        <SectionLabel>Hard</SectionLabel>
        <StrategyTableComponent rows={hardRows} evOverlay={evOverlay} />
      </section>

      <section>
        <SectionLabel>Soft</SectionLabel>
        <StrategyTableComponent rows={softRows} evOverlay={evOverlay} />
      </section>

      <section>
        <SectionLabel>Pairs</SectionLabel>
        <StrategyTableComponent rows={pairRows} evOverlay={evOverlay} />
      </section>
    </div>
  )
}
