import type { DealerUpcard, HandKey, StrategyRow } from '../../core/blackjack/types'
import { StrategyCell } from './StrategyCell'

const DEALER_UPCARDS: DealerUpcard[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'A']

interface StrategyTableProps {
  rows: { key: HandKey; label: string; row: StrategyRow }[]
}

export function StrategyTable({ rows }: StrategyTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-xs w-full">
        <thead>
          <tr>
            <th className="w-12 text-right pr-2 py-1 text-muted-foreground font-medium text-[10px] uppercase tracking-widest">
              Hand
            </th>
            {DEALER_UPCARDS.map((up) => (
              <th
                key={up}
                className="w-8 text-center py-1 text-muted-foreground font-medium text-[10px] uppercase tracking-widest"
              >
                {up}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ key, label, row }) => (
            <tr key={key}>
              <td className="text-right pr-2 py-0 text-muted-foreground font-mono text-[11px] whitespace-nowrap">
                {label}
              </td>
              {DEALER_UPCARDS.map((up) => (
                <StrategyCell key={up} action={row[up].action} compact />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
