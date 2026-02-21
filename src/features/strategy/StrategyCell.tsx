import type { DisplayAction } from '../../core/blackjack/types'

interface StrategyCellProps {
  action: DisplayAction
  compact?: boolean
}

const ACTION_STYLES: Record<DisplayAction, string> = {
  H: 'bg-[var(--action-h)] text-white',
  S: 'bg-[var(--action-s)] text-white',
  D: 'bg-[var(--action-d)] text-white',
  P: 'bg-[var(--action-p)] text-white',
  R: 'bg-[var(--action-r)] text-white',
}

export function StrategyCell({ action, compact = false }: StrategyCellProps) {
  return (
    <td
      className={`strategy-cell text-center font-mono font-semibold tracking-wider select-none ${
        compact ? 'text-[10px] px-0.5 py-[3px]' : 'text-xs px-1 py-1.5'
      } ${ACTION_STYLES[action]}`}
    >
      {action}
    </td>
  )
}
