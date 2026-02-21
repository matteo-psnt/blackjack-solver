import { Button } from '../../components/ui/button'
import { Separator } from '../../components/ui/separator'
import { Switch } from '../../components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { useRulesStore } from '../../store/rulesStore'
import { RuleRow } from './RuleRow'
import type { BlackjackRules } from '../../core/blackjack/types'

export function RulesPanel() {
  const { rules, setRules, resetRules } = useRulesStore()

  return (
    <aside className="w-[280px] shrink-0 border-r border-border flex flex-col h-full">
      {/* Wordmark */}
      <div className="px-5 py-5 border-b border-border">
        <h1 className="text-lg font-serif tracking-wide text-foreground">The Counting Room</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Basic Strategy Analyzer</p>
      </div>

      {/* Scrollable rule controls */}
      <div className="flex-1 overflow-y-auto px-5 py-3">

        {/* Game Setup */}
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 mt-1">
          Game Setup
        </p>

        <RuleRow label="Decks" description="Number of decks in shoe">
          <Select
            value={String(rules.decks)}
            onValueChange={(v) => setRules({ decks: parseInt(v) as BlackjackRules['decks'] })}
          >
            <SelectTrigger className="w-20 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {([1, 2, 4, 6, 8] as const).map((d) => (
                <SelectItem key={d} value={String(d)}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </RuleRow>

        <RuleRow label="Blackjack Pays" description="Natural blackjack payout">
          <Select
            value={String(rules.blackjackPayout)}
            onValueChange={(v) =>
              setRules({ blackjackPayout: parseFloat(v) as BlackjackRules['blackjackPayout'] })
            }
          >
            <SelectTrigger className="w-20 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1.5">3:2</SelectItem>
              <SelectItem value="1.2">6:5</SelectItem>
              <SelectItem value="1">1:1</SelectItem>
            </SelectContent>
          </Select>
        </RuleRow>

        <Separator className="my-3" />

        {/* Dealer Rules */}
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
          Dealer Rules
        </p>

        <RuleRow label="Dealer Hits Soft 17" description="H17 increases house edge">
          <Switch
            checked={rules.dealerHitsSoft17}
            onCheckedChange={(v) => setRules({ dealerHitsSoft17: v })}
          />
        </RuleRow>

        <Separator className="my-3" />

        {/* Player Options */}
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
          Player Options
        </p>

        <RuleRow label="Double After Split" description="DAS — reduces house edge">
          <Switch
            checked={rules.doubleAfterSplit}
            onCheckedChange={(v) => setRules({ doubleAfterSplit: v })}
          />
        </RuleRow>

        <RuleRow label="Double On" description="Hands eligible for doubling">
          <Select
            value={rules.doubleRestriction}
            onValueChange={(v) =>
              setRules({ doubleRestriction: v as BlackjackRules['doubleRestriction'] })
            }
          >
            <SelectTrigger className="w-24 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="9-11">9–11</SelectItem>
              <SelectItem value="10-11">10–11</SelectItem>
            </SelectContent>
          </Select>
        </RuleRow>

        <RuleRow label="Surrender" description="Late or early surrender option">
          <Select
            value={rules.surrender}
            onValueChange={(v) => setRules({ surrender: v as BlackjackRules['surrender'] })}
          >
            <SelectTrigger className="w-20 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="late">Late</SelectItem>
              <SelectItem value="early">Early</SelectItem>
            </SelectContent>
          </Select>
        </RuleRow>

        <Separator className="my-3" />

        {/* Split Rules */}
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
          Split Rules
        </p>

        <RuleRow label="Re-split Aces" description="RSA — allows re-splitting aces">
          <Switch
            checked={rules.resplitAces}
            onCheckedChange={(v) => setRules({ resplitAces: v })}
          />
        </RuleRow>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={resetRules}
        >
          Reset to Defaults
        </Button>
      </div>
    </aside>
  )
}
