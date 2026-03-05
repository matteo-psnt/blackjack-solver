import { Separator } from "../../components/ui/separator"
import { Switch } from "../../components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select"
import {
  getRulesPreset,
  resolveRulesPresetId,
  RULE_PRESETS,
  type RulesPresetId,
} from "../../core/blackjack/rulePresets"
import { useRulesStore } from "../../store/rulesStore"
import { RuleRow } from "./RuleRow"
import type { BlackjackRules } from "../../core/blackjack/types"

function SectionHeading({ children }: { children: string }) {
  return (
    <p className="mt-5 mb-1 text-[9px] font-medium tracking-[0.2em] text-muted-foreground/50 uppercase first:mt-2">
      {children}
    </p>
  )
}

export function RulesPanel() {
  const { rules, setRules } = useRulesStore()
  const activePresetId = resolveRulesPresetId(rules)

  function handlePresetChange(value: string) {
    const preset = getRulesPreset(value as RulesPresetId)
    if (!preset) return
    setRules(preset.rules)
  }

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-border">
      {/* Wordmark + Preset */}
      <div className="border-b border-border px-6 pt-6 pb-5">
        <h1 className="font-serif text-xl leading-none tracking-wide text-foreground">
          The Counting Room
        </h1>
        <p className="mt-1.5 text-[11px] text-muted-foreground/60">
          Basic Blackjack Strategy Analyzer
        </p>
        <div className="mt-4">
          <Select value={activePresetId === 'custom' ? undefined : activePresetId} onValueChange={handlePresetChange}>
            <SelectTrigger className="h-8 w-full text-xs">
              <SelectValue placeholder="Custom" />
            </SelectTrigger>
            <SelectContent>
              {RULE_PRESETS.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Controls */}
      <div className="flex-1 overflow-y-auto px-6 py-2">
        <SectionHeading>Game Setup</SectionHeading>

        <RuleRow label="Decks">
          <Select
            value={String(rules.decks)}
            onValueChange={(v) =>
              setRules({ decks: parseInt(v) as BlackjackRules["decks"] })
            }
          >
            <SelectTrigger className="h-7 w-[72px] text-xs">
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

        <RuleRow label="Blackjack Pays">
          <Select
            value={String(rules.blackjackPayout)}
            onValueChange={(v) =>
              setRules({
                blackjackPayout: parseFloat(
                  v
                ) as BlackjackRules["blackjackPayout"],
              })
            }
          >
            <SelectTrigger className="h-7 w-[72px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1.5">3:2</SelectItem>
              <SelectItem value="1.2">6:5</SelectItem>
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

        <RuleRow
          label="Dealer Peek"
          description={rules.dealerPeek ? "US rules" : "ENHC — no hole card"}
        >
          <Switch
            checked={rules.dealerPeek}
            onCheckedChange={(v) => setRules({ dealerPeek: v })}
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
              setRules({
                doubleRestriction: v as BlackjackRules["doubleRestriction"],
              })
            }
          >
            <SelectTrigger className="h-7 w-[72px] text-xs">
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
            onValueChange={(v) =>
              setRules({ surrender: v as BlackjackRules["surrender"] })
            }
          >
            <SelectTrigger className="h-7 w-[72px] text-xs">
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

        <RuleRow label="Max Splits">
          <Select
            value={String(rules.maxSplits)}
            onValueChange={(v) =>
              setRules({
                maxSplits: parseInt(v) as BlackjackRules["maxSplits"],
              })
            }
          >
            <SelectTrigger className="h-7 w-[72px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {([2, 3, 4] as const).map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} hands
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </RuleRow>
      </div>

    </aside>
  )
}
