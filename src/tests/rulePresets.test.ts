import { describe, expect, it } from "vitest"
import { DEFAULT_RULES } from "../core/blackjack/constants"
import {
  getRulesPreset,
  resolveRulesPresetId,
  RULE_PRESETS,
} from "../core/blackjack/rulePresets"

describe("rule presets", () => {
  it("maps default rules to the classic 6-deck preset", () => {
    expect(resolveRulesPresetId(DEFAULT_RULES)).toBe("classic-6d-shoe")
  })

  it("resolves every preset from its exact rule set", () => {
    for (const preset of RULE_PRESETS) {
      expect(resolveRulesPresetId(preset.rules)).toBe(preset.id)
    }
  })

  it("falls back to custom when rules no longer match a preset", () => {
    expect(
      resolveRulesPresetId({ ...DEFAULT_RULES, resplitAces: true })
    ).toBe("custom")
  })

  it("keeps the European preset explicit about ENHC rules", () => {
    const preset = getRulesPreset("european-enhc")

    expect(preset).not.toBeNull()
    expect(preset?.rules.dealerPeek).toBe(false)
    expect(preset?.rules.maxSplits).toBe(3)
  })
})
