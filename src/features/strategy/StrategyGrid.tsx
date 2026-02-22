import type { StrategyTable } from '../../core/blackjack/types'
import { StrategyTable as StrategyTableComponent } from './StrategyTable'
import { ActionLegend } from './ActionLegend'

const HARD_LABELS: Record<string, string> = {
  hard5: '5', hard6: '6', hard7: '7', hard8: '8', hard9: '9',
  hard10: '10', hard11: '11', hard12: '12', hard13: '13', hard14: '14',
  hard15: '15', hard16: '16', hard17: '17',
}

const SOFT_LABELS: Record<string, string> = {
  soft13: 'A+2', soft14: 'A+3', soft15: 'A+4', soft16: 'A+5',
  soft17: 'A+6', soft18: 'A+7', soft19: 'A+8', soft20: 'A+9',
}

const PAIR_LABELS: Record<string, string> = {
  pair2: '2–2', pair3: '3–3', pair4: '4–4', pair5: '5–5', pair6: '6–6',
  pair7: '7–7', pair8: '8–8', pair9: '9–9', pairT: 'T–T', pairA: 'A–A',
}

interface StrategyGridProps {
  table: StrategyTable
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/60">
        {children}
      </span>
      <div className="flex-1 h-px bg-border/40" />
    </div>
  )
}

export function StrategyGrid({ table }: StrategyGridProps) {
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
    <div className="px-8 py-6 flex flex-col gap-10">
      {/* Legend */}
      <ActionLegend />

      {/* Hard hands — full width */}
      <section>
        <SectionLabel>Hard</SectionLabel>
        <StrategyTableComponent rows={hardRows} />
      </section>

      {/* Soft + Pairs — side by side */}
      <div className="flex flex-wrap gap-x-14 gap-y-10">
        <section>
          <SectionLabel>Soft</SectionLabel>
          <StrategyTableComponent rows={softRows} />
        </section>

        <section>
          <SectionLabel>Pairs</SectionLabel>
          <StrategyTableComponent rows={pairRows} />
        </section>
      </div>
    </div>
  )
}
