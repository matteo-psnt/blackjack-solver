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
    <div className="border-b border-border px-8 py-6">
      <div className="flex items-end justify-between gap-6">
        {/* Metric */}
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">
            {isPlayerEdge ? 'Player Edge' : 'House Edge'}
          </p>
          <p
            key={result.formatted}
            className="text-5xl font-mono tabular-nums font-light animate-edge-flash leading-none"
            style={{ color: isPlayerEdge ? 'var(--action-s)' : 'var(--foreground)' }}
          >
            {result.formatted}
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
