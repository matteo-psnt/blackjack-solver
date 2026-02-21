import { useRulesStore } from './store/rulesStore'
import { useStrategyTable } from './hooks/useStrategyTable'
import { useHouseEdge } from './hooks/useHouseEdge'
import { RulesPanel } from './features/rules/RulesPanel'
import { HouseEdgeBanner } from './features/strategy/HouseEdgeBanner'
import { StrategyGrid } from './features/strategy/StrategyGrid'

function App() {
  const rules = useRulesStore((s) => s.rules)
  const strategyTable = useStrategyTable(rules)
  const houseEdge = useHouseEdge(rules)

  return (
    <div className="flex h-svh overflow-hidden">
      <RulesPanel />
      <main className="flex-1 flex flex-col overflow-hidden">
        <HouseEdgeBanner result={houseEdge} rules={rules} />
        <div className="flex-1 overflow-y-auto">
          <StrategyGrid table={strategyTable} />
        </div>
      </main>
    </div>
  )
}

export default App
