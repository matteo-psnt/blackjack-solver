import type { DealerUpcard, HandKey, StrategyRow } from '../../core/blackjack/types'
import { StrategyCell } from './StrategyCell'

const DEALER_UPCARDS: DealerUpcard[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'A']

interface StrategyTableProps {
  rows: { key: HandKey; label: string; row: StrategyRow }[]
  evOverlay: boolean
}

export function StrategyTable({ rows, evOverlay }: StrategyTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="border-collapse w-auto">
        <thead>
          <tr>
            <th className="w-12" />
            <th
              colSpan={10}
              className="text-center text-[9px] font-medium uppercase tracking-[0.18em] text-muted-foreground/60 pb-1.5 pt-0"
            >
              Dealer Upcard
            </th>
          </tr>
          <tr>
            <th className="w-12 text-right pr-3 pb-1 text-[9px] font-medium uppercase tracking-widest text-muted-foreground/50">
              Hand
            </th>
            {DEALER_UPCARDS.map((up) => (
              <th
                key={up}
                className="w-9 text-center pb-1 text-[11px] font-mono font-semibold text-muted-foreground"
              >
                {up}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ key, label, row }) => (
            <tr key={key}>
              <td className="text-right pr-3 py-0 text-muted-foreground/70 font-mono text-[11px] font-medium whitespace-nowrap">
                {label}
              </td>
              {DEALER_UPCARDS.map((up) => (
                <StrategyCell
                  key={up}
                  action={row[up].action}
                  breakdown={row[up].breakdown}
                  handLabel={label}
                  upcardLabel={up}
                  evOverlay={evOverlay}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
