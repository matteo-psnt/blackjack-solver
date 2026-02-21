import { create } from 'zustand'
import type { BlackjackRules } from '../core/blackjack/types'
import { DEFAULT_RULES } from '../core/blackjack/constants'

interface RulesState {
  rules: BlackjackRules
  setRules: (update: Partial<BlackjackRules>) => void
  resetRules: () => void
}

export const useRulesStore = create<RulesState>((set) => ({
  rules: DEFAULT_RULES,
  setRules: (update) =>
    set((state) => ({ rules: { ...state.rules, ...update } })),
  resetRules: () => set({ rules: DEFAULT_RULES }),
}))
