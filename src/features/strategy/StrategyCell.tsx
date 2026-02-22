import type { DisplayAction } from '../../core/blackjack/types'

interface StrategyCellProps {
  action: DisplayAction
}

const ACTION_STYLES: Record<DisplayAction, string> = {
  H: 'bg-[var(--action-h)]',
  S: 'bg-[var(--action-s)]',
  D: 'bg-[var(--action-d)]',
  P: 'bg-[var(--action-p)]',
  R: 'bg-[var(--action-r)]',
}

export function StrategyCell({ action }: StrategyCellProps) {
  return (
    <td
      className={`strategy-cell text-center font-mono font-bold text-[11px] text-white tracking-wide select-none px-0 py-[5px] w-9 border border-white/[0.06] ${ACTION_STYLES[action]}`}
    >
      {action}
    </td>
  )
}
