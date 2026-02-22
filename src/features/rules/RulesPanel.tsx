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

function SectionHeading({ children }: { children: string }) {
  return (
    <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground/50 mt-5 mb-1 first:mt-2">
      {children}
    </p>
  )
}

export function RulesPanel() {
  const { rules, setRules, resetRules } = useRulesStore()

  return (
    <aside className="w-[260px] shrink-0 border-r border-border flex flex-col h-full">
      {/* Wordmark */}
      <div className="px-6 pt-6 pb-5 border-b border-border">
        <h1 className="font-serif text-xl tracking-wide text-foreground leading-none">
          The Counting Room
        </h1>
        <p className="text-[11px] text-muted-foreground/60 mt-1.5">Basic Blackjack Strategy Analyzer</p>
      </div>

      {/* Controls */}
      <div className="flex-1 overflow-y-auto px-6 py-2">

        <SectionHeading>Game Setup</SectionHeading>

        <RuleRow label="Decks">
          <Select
            value={String(rules.decks)}
            onValueChange={(v) => setRules({ decks: parseInt(v) as BlackjackRules['decks'] })}
          >
            <SelectTrigger className="w-[72px] h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {([1, 2, 4, 6, 8] as const).map((d) => (
                <SelectItem key={d} value={String(d)}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </RuleRow>

        <RuleRow label="Blackjack Pays">
          <Select
            value={String(rules.blackjackPayout)}
            onValueChange={(v) =>
              setRules({ blackjackPayout: parseFloat(v) as BlackjackRules['blackjackPayout'] })
            }
          >
            <SelectTrigger className="w-[72px] h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1.5">3:2</SelectItem>
              <SelectItem value="1.2">6:5</SelectItem>
              <SelectItem value="1">1:1</SelectItem>
            </SelectContent>
          </Select>
        </RuleRow>

        <Separator className="mt-4 mb-1 opacity-40" />
        <SectionHeading>Dealer</SectionHeading>

        <RuleRow label="Hits Soft 17" description="Dealer draws on soft 17">
          <Switch
            checked={rules.dealerHitsSoft17}
            onCheckedChange={(v) => setRules({ dealerHitsSoft17: v })}
          />
        </RuleRow>

        <Separator className="mt-4 mb-1 opacity-40" />
        <SectionHeading>Player Options</SectionHeading>

        <RuleRow label="Double After Split" description="DAS">
          <Switch
            checked={rules.doubleAfterSplit}
            onCheckedChange={(v) => setRules({ doubleAfterSplit: v })}
          />
        </RuleRow>

        <RuleRow label="Double On">
          <Select
            value={rules.doubleRestriction}
            onValueChange={(v) =>
              setRules({ doubleRestriction: v as BlackjackRules['doubleRestriction'] })
            }
          >
            <SelectTrigger className="w-[72px] h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="9-11">9–11</SelectItem>
              <SelectItem value="10-11">10–11</SelectItem>
            </SelectContent>
          </Select>
        </RuleRow>

        <RuleRow label="Surrender">
          <Select
            value={rules.surrender}
            onValueChange={(v) => setRules({ surrender: v as BlackjackRules['surrender'] })}
          >
            <SelectTrigger className="w-[72px] h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="late">Late</SelectItem>
              <SelectItem value="early">Early</SelectItem>
            </SelectContent>
          </Select>
        </RuleRow>

        <Separator className="mt-4 mb-1 opacity-40" />
        <SectionHeading>Splits</SectionHeading>

        <RuleRow label="Re-split Aces" description="RSA">
          <Switch
            checked={rules.resplitAces}
            onCheckedChange={(v) => setRules({ resplitAces: v })}
          />
        </RuleRow>

      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground hover:text-foreground"
          onClick={resetRules}
        >
          Reset to Defaults
        </Button>
      </div>
    </aside>
  )
}
