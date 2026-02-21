import type { HouseEdgeResult } from '../../core/blackjack/types'
import type { BlackjackRules } from '../../core/blackjack/types'

interface HouseEdgeBannerProps {
  result: HouseEdgeResult
  rules: BlackjackRules
}

export function HouseEdgeBanner({ result, rules }: HouseEdgeBannerProps) {
  const isPlayerEdge = result.playerEdge > 0

  const payoutLabel =
    rules.blackjackPayout === 1.5 ? '3:2' : rules.blackjackPayout === 1.2 ? '6:5' : '1:1'

  const summaryTags = [
    `${rules.decks}D`,
    rules.dealerHitsSoft17 ? 'H17' : 'S17',
    `BJ ${payoutLabel}`,
    rules.doubleAfterSplit ? 'DAS' : 'No DAS',
    rules.surrender !== 'none' ? `${rules.surrender === 'late' ? 'LS' : 'ES'}` : 'No LS',
  ]

  return (
    <div className="border-b border-border px-6 py-5 flex items-center justify-between gap-4">
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
          {isPlayerEdge ? 'Player Edge' : 'House Edge'}
        </p>
        <p
          key={result.formatted}
          className="text-4xl font-mono tabular-nums font-light tracking-tight animate-edge-flash"
          style={{
            color: isPlayerEdge ? 'var(--action-s)' : 'var(--foreground)',
          }}
        >
          {result.formatted}
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5 justify-end max-w-xs">
        {summaryTags.map((tag) => (
          <span
            key={tag}
            className="inline-block rounded px-2 py-0.5 text-[10px] font-mono tracking-wide bg-muted text-muted-foreground"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}
