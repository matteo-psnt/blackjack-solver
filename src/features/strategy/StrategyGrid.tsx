import type { StrategyTable } from '../../core/blackjack/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { StrategyTable as StrategyTableComponent } from './StrategyTable'
import { ActionLegend } from './ActionLegend'

const HARD_LABELS: Record<string, string> = {
  hard5: '5', hard6: '6', hard7: '7', hard8: '8', hard9: '9',
  hard10: '10', hard11: '11', hard12: '12', hard13: '13', hard14: '14',
  hard15: '15', hard16: '16', hard17: '17',
}

const SOFT_LABELS: Record<string, string> = {
  soft13: 'A+2', soft14: 'A+3', soft15: 'A+4', soft16: 'A+5',
  soft17: 'A+6', soft18: 'A+7', soft19: 'A+8', soft20: 'A+9',
}

const PAIR_LABELS: Record<string, string> = {
  pair2: '2-2', pair3: '3-3', pair4: '4-4', pair5: '5-5', pair6: '6-6',
  pair7: '7-7', pair8: '8-8', pair9: '9-9', pairT: 'T-T', pairA: 'A-A',
}

interface StrategyGridProps {
  table: StrategyTable
}

export function StrategyGrid({ table }: StrategyGridProps) {
  const hardRows = Object.entries(table.hard).map(([key, row]) => ({
    key: key as keyof typeof table.hard,
    label: HARD_LABELS[key] ?? key,
    row,
  }))

  const softRows = Object.entries(table.soft).map(([key, row]) => ({
    key: key as keyof typeof table.soft,
    label: SOFT_LABELS[key] ?? key,
    row,
  }))

  const pairRows = Object.entries(table.pairs).map(([key, row]) => ({
    key: key as keyof typeof table.pairs,
    label: PAIR_LABELS[key] ?? key,
    row,
  }))

  return (
    <div className="flex flex-col gap-4 px-6 py-5">
      <Tabs defaultValue="hard">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <TabsList className="bg-muted">
            <TabsTrigger value="hard">Hard</TabsTrigger>
            <TabsTrigger value="soft">Soft</TabsTrigger>
            <TabsTrigger value="pairs">Pairs</TabsTrigger>
          </TabsList>
          <ActionLegend />
        </div>

        <TabsContent value="hard" className="mt-0">
          <StrategyTableComponent rows={hardRows} />
        </TabsContent>

        <TabsContent value="soft" className="mt-0">
          <StrategyTableComponent rows={softRows} />
        </TabsContent>

        <TabsContent value="pairs" className="mt-0">
          <StrategyTableComponent rows={pairRows} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
