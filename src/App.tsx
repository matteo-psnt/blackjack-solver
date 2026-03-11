import { useMemo, useState } from 'react'
import { useRulesStore } from './store/rulesStore'
import { useStrategyTable } from './hooks/useStrategyTable'
import { useHouseEdge } from './hooks/useHouseEdge'
import { buildCompositionFromRcPenetration } from './core/blackjack/shoeUtils'
import { RulesPanel } from './features/rules/RulesPanel'
import { HouseEdgeBanner } from './features/strategy/HouseEdgeBanner'
import { StrategyGrid } from './features/strategy/StrategyGrid'
import { clampTc } from './features/strategy/tcInput'
import { TooltipProvider } from './components/ui/tooltip'
import type { DeckComposition } from './core/blackjack/types'

function App() {
  const rules = useRulesStore((s) => s.rules)
  const [tc, setTc] = useState<number>(0)

  function handleTcChange(nextTc: number) {
    setTc(clampTc(nextTc))
  }

  const rc = useMemo(() => Math.trunc(tc * rules.decks * 0.5), [tc, rules.decks])

  const countComposition = useMemo<DeckComposition>(
    () => buildCompositionFromRcPenetration(rules.decks, 50, rc),
    [rc, rules.decks],
  )

  const strategyTable = useStrategyTable(rules)
  // Use canonical (full-shoe) house edge at rc=0; count-adjusted otherwise.
  // This avoids a model-switch discontinuity: rc=0 means the count hasn't
  // changed anything meaningful, so the standard published figure is correct.
  const houseEdge = useHouseEdge(rules, rc !== 0 ? countComposition : undefined)

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-svh overflow-hidden min-w-[860px]">
        <RulesPanel />
        <main className="flex-1 flex flex-col overflow-hidden">
          <HouseEdgeBanner result={houseEdge} rules={rules} />
          <div className="flex-1 overflow-y-auto">
            <StrategyGrid
              table={strategyTable}
              rules={rules}
              tc={tc}
              setTc={handleTcChange}
              countComposition={countComposition}
            />
          </div>
        </main>
      </div>
    </TooltipProvider>
  )
}

export default App
