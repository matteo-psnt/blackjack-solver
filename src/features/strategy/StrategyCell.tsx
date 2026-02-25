import { useEffect, useRef, useState } from 'react'
import type { DisplayAction, EvBreakdown } from '../../core/blackjack/types'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../components/ui/tooltip'

interface StrategyCellProps {
  action: DisplayAction
  breakdown: EvBreakdown
  handLabel: string
  upcardLabel: string
}

const ACTION_STYLES: Record<DisplayAction, string> = {
  H: 'bg-[var(--action-h)]',
  S: 'bg-[var(--action-s)]',
  D: 'bg-[var(--action-d)]',
  P: 'bg-[var(--action-p)]',
  R: 'bg-[var(--action-r)]',
}

const ACTION_LABEL: Record<DisplayAction, string> = {
  H: 'Hit',
  S: 'Stand',
  D: 'Double',
  P: 'Split',
  R: 'Surrender',
}

const ACTION_DOT: Record<DisplayAction, string> = {
  H: 'bg-[var(--action-h)]',
  S: 'bg-[var(--action-s)]',
  D: 'bg-[var(--action-d)]',
  P: 'bg-[var(--action-p)]',
  R: 'bg-[var(--action-r)]',
}

function formatEV(ev: number): string {
  const sign = ev >= 0 ? '+' : ''
  return `${sign}${(ev * 100).toFixed(1)}¢`
}

export function StrategyCell({ action, breakdown, handLabel, upcardLabel }: StrategyCellProps) {
  // Build sorted list of available actions (non-null), descending by EV
  const entries = (
    Object.entries(breakdown) as [DisplayAction, number | null][]
  )
    .filter((entry): entry is [DisplayAction, number] => entry[1] !== null)
    .sort((a, b) => b[1] - a[1])

  const prevActionRef = useRef<DisplayAction>(action)
  const [flashCount, setFlashCount] = useState(0)

  useEffect(() => {
    if (prevActionRef.current !== action) {
      prevActionRef.current = action
      setFlashCount(c => c + 1)
    }
  }, [action])

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <td
          className={`strategy-cell relative overflow-hidden text-center font-mono font-bold text-[11px] text-white tracking-wide select-none px-0 py-[5px] w-9 cursor-default ${ACTION_STYLES[action]}`}
        >
          {action}
          {flashCount > 0 && (
            <span key={flashCount} className="animate-cell-changed pointer-events-none absolute inset-0 bg-white" />
          )}
        </td>
      </TooltipTrigger>
      <TooltipContent side="top" className="px-3 py-2 flex flex-col gap-1.5 min-w-[140px]">
        <p className="text-[10px] font-mono opacity-60 mb-0.5">
          {handLabel} vs {upcardLabel}
        </p>
        {entries.map(([act, ev], i) => (
          <div key={act} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${ACTION_DOT[act]}`} />
              <span className={`text-[11px] font-mono ${i === 0 ? 'font-semibold' : 'opacity-60'}`}>
                {ACTION_LABEL[act]}
              </span>
            </div>
            <span className={`text-[11px] font-mono tabular-nums ${i === 0 ? '' : 'opacity-50'}`}>
              {formatEV(ev)}
            </span>
          </div>
        ))}
      </TooltipContent>
    </Tooltip>
  )
}
