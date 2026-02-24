import type { HouseEdgeResult, BlackjackRules } from '../../core/blackjack/types'

interface HouseEdgeBannerProps {
  result: HouseEdgeResult
  rules: BlackjackRules
}

export function HouseEdgeBanner({ result, rules }: HouseEdgeBannerProps) {
  const isPlayerEdge = result.playerEdge > 0
  const payoutLabel =
    rules.blackjackPayout === 1.5 ? '3:2' : rules.blackjackPayout === 1.2 ? '6:5' : '1:1'

  const tags = [
    `${rules.decks} Decks`,
    rules.dealerHitsSoft17 ? 'H17' : 'S17',
    `BJ ${payoutLabel}`,
    rules.doubleAfterSplit ? 'DAS' : 'No DAS',
    rules.surrender === 'late' ? 'Late Surrender' : rules.surrender === 'early' ? 'Early Surrender' : 'No Surrender',
    rules.resplitAces ? 'RSA' : null,
  ].filter(Boolean) as string[]

  return (
    <div className="border-b border-border px-6 py-3">
      <div className="flex items-center justify-between gap-6">
        {/* Metric */}
        <div className="flex items-baseline gap-3">
          <p
            key={result.formatted}
            className="text-3xl font-mono tabular-nums font-light animate-edge-flash leading-none"
            style={{ color: isPlayerEdge ? 'var(--action-s)' : 'var(--foreground)' }}
          >
            {result.formatted}
          </p>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/50">
            {isPlayerEdge ? 'Player Edge' : 'House Edge'}
          </p>
        </div>

        {/* Rule summary — right-aligned, inline with separators */}
        <div className="flex items-center gap-0 text-[11px] font-mono text-muted-foreground/50 flex-wrap justify-end">
          {tags.map((tag, i) => (
            <span key={tag} className="flex items-center">
              {i > 0 && <span className="mx-2 opacity-30">·</span>}
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
