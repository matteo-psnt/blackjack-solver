import type { DisplayAction } from '../../core/blackjack/types'

const LEGEND: { action: DisplayAction; label: string }[] = [
  { action: 'H', label: 'Hit' },
  { action: 'S', label: 'Stand' },
  { action: 'D', label: 'Double' },
  { action: 'P', label: 'Split' },
  { action: 'R', label: 'Surrender' },
]

const ACTION_BG: Record<DisplayAction, string> = {
  H: 'bg-[var(--action-h)]',
  S: 'bg-[var(--action-s)]',
  D: 'bg-[var(--action-d)]',
  P: 'bg-[var(--action-p)]',
  R: 'bg-[var(--action-r)]',
}

export function ActionLegend() {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {LEGEND.map(({ action, label }) => (
        <div key={action} className="flex items-center gap-1.5">
          <span
            className={`inline-flex h-5 w-5 items-center justify-center rounded-sm text-[10px] font-mono font-bold text-white ${ACTION_BG[action]}`}
          >
            {action}
          </span>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  )
}
