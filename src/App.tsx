import { useMemo, useState } from 'react'
import { useRulesStore } from './store/rulesStore'
import { useStrategyTable } from './hooks/useStrategyTable'
import { useHouseEdge } from './hooks/useHouseEdge'
import { buildCompositionFromRcPenetration } from './core/blackjack/shoeUtils'
import { RulesPanel } from './features/rules/RulesPanel'
import { HouseEdgeBanner } from './features/strategy/HouseEdgeBanner'
import { StrategyGrid } from './features/strategy/StrategyGrid'
import { TooltipProvider } from './components/ui/tooltip'
import type { DeckComposition } from './core/blackjack/types'

function App() {
  const rules = useRulesStore((s) => s.rules)
  const [tc, setTc] = useState<number>(0)

  function handleTcChange(nextTc: number) {
    const roundedTc = Math.round(nextTc * 10) / 10
    setTc(Object.is(roundedTc, -0) ? 0 : roundedTc)
  }

  const countComposition = useMemo<DeckComposition | undefined>(() => {
    if (tc === 0) return undefined
    const rc = Math.round(tc * rules.decks * 0.5)
    return buildCompositionFromRcPenetration(rules.decks, 50, rc)
  }, [tc, rules.decks])

  const strategyTable = useStrategyTable(rules)
  const houseEdge = useHouseEdge(rules, countComposition)

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
