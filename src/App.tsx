import { useMemo, useState } from 'react'
import { useRulesStore } from './store/rulesStore'
import { useStrategyTable } from './hooks/useStrategyTable'
import { useHouseEdge } from './hooks/useHouseEdge'
import { deriveCountState } from './core/blackjack/shoeUtils'
import { RulesPanel } from './features/rules/RulesPanel'
import { HouseEdgeBanner } from './features/strategy/HouseEdgeBanner'
import { StrategyGrid } from './features/strategy/StrategyGrid'
import { clampTc } from './features/strategy/tcInput'
import { clampPenetration } from './features/strategy/penetrationInput'
import { TooltipProvider } from './components/ui/tooltip'

function App() {
  const rules = useRulesStore((s) => s.rules)
  const [tc, setTc] = useState<number>(0)
  const [penetration, setPenetration] = useState<number>(50)

  function handleTcChange(nextTc: number) {
    setTc(clampTc(nextTc))
  }

  function handlePenetrationChange(nextPenetration: number) {
    setPenetration(clampPenetration(nextPenetration))
  }

  const countState = useMemo(
    () => deriveCountState(tc, rules.decks, 100 - penetration),
    [tc, rules.decks, penetration],
  )

  const strategyTable = useStrategyTable(rules)
  const houseEdge = useHouseEdge(rules, countState.composition)

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
              penetration={penetration}
              setPenetration={handlePenetrationChange}
              countComposition={countState.composition}
            />
          </div>
        </main>
      </div>
    </TooltipProvider>
  )
}

export default App
