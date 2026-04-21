import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useSettingsStore = create(
  persist(
    (set) => ({
      aiMode: 'off',
      claudeApiKey: '',
      claudeModel: 'claude-haiku-4-5-20251001',
      ollamaUrl: 'http://localhost:11434',
      ollamaModel: 'llama3',
      setAiMode: (mode) => set({ aiMode: mode }),
      setClaudeApiKey: (key) => set({ claudeApiKey: key }),
      setClaudeModel: (model) => set({ claudeModel: model }),
      setOllamaUrl: (url) => set({ ollamaUrl: url }),
      setOllamaModel: (model) => set({ ollamaModel: model }),
    }),
    {
      name: 'hebrew-report-builder-settings',
      version: 1,
    },
  ),
)
