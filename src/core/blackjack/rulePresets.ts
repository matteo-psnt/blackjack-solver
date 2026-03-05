import type { BlackjackRules } from "./types"

export type RulesPresetId =
  | "classic-6d-shoe"
  | "common-us-shoe"
  | "single-deck-pitch"
  | "double-deck-pitch"
  | "vegas-strip-6-5"
  | "atlantic-city"
  | "european-enhc"
  | "custom"

export interface RulesPreset {
  id: Exclude<RulesPresetId, "custom">
  label: string
  description: string
  rules: BlackjackRules
}

// Internal base — never changes, presets don't depend on DEFAULT_RULES
const B: BlackjackRules = {
  decks: 6,
  dealerHitsSoft17: false,
  dealerPeek: true,
  blackjackPayout: 1.5,
  doubleAfterSplit: false,
  doubleRestriction: "any",
  surrender: "none",
  resplitAces: false,
  hitSplitAces: false,
  blackjackAfterSplit: false,
  maxSplits: 4,
}

const RULE_KEYS: (keyof BlackjackRules)[] = [
  "decks",
  "dealerHitsSoft17",
  "dealerPeek",
  "blackjackPayout",
  "doubleAfterSplit",
  "doubleRestriction",
  "surrender",
  "resplitAces",
  "hitSplitAces",
  "blackjackAfterSplit",
  "maxSplits",
]

export const RULE_PRESETS: RulesPreset[] = [
  {
    id: "classic-6d-shoe",
    label: "Classic 6D Shoe",
    description: "6 decks · S17 · no DAS · no surrender · 3:2",
    rules: { ...B },
  },
  {
    id: "common-us-shoe",
    label: "Common U.S. Shoe",
    description: "6 decks · H17 · DAS · late surrender · 3:2",
    rules: { ...B, dealerHitsSoft17: true, doubleAfterSplit: true, surrender: "late" },
  },
  {
    id: "single-deck-pitch",
    label: "Single Deck Pitch",
    description: "1 deck · S17 · no DAS · double 10–11 · no surrender · 3:2",
    rules: { ...B, decks: 1, doubleRestriction: "10-11" },
  },
  {
    id: "double-deck-pitch",
    label: "Double Deck Pitch",
    description: "2 decks · S17 · DAS · no surrender · 3:2",
    rules: { ...B, decks: 2, doubleAfterSplit: true },
  },
  {
    id: "vegas-strip-6-5",
    label: "Vegas Strip 6:5",
    description: "6 decks · H17 · DAS · no surrender · 6:5",
    rules: { ...B, dealerHitsSoft17: true, doubleAfterSplit: true, blackjackPayout: 1.2 },
  },
  {
    id: "atlantic-city",
    label: "Atlantic City",
    description: "8 decks · S17 · DAS · late surrender · 3:2",
    rules: { ...B, decks: 8, doubleAfterSplit: true, surrender: "late" },
  },
  {
    id: "european-enhc",
    label: "European ENHC",
    description: "6 decks · S17 · ENHC · DAS · no surrender · 3 hands max",
    rules: { ...B, dealerPeek: false, doubleAfterSplit: true, maxSplits: 3 },
  },
]

function rulesEqual(a: BlackjackRules, b: BlackjackRules): boolean {
  return RULE_KEYS.every((key) => a[key] === b[key])
}

export function getRulesPreset(id: RulesPresetId): RulesPreset | null {
  if (id === "custom") return null
  return RULE_PRESETS.find((preset) => preset.id === id) ?? null
}

export function resolveRulesPresetId(rules: BlackjackRules): RulesPresetId {
  return (
    RULE_PRESETS.find((preset) => rulesEqual(rules, preset.rules))?.id ?? "custom"
  )
}
