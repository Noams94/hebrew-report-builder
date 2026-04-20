import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const defaultDataByType = {
  heading: { level: 2, text: '' },
  text: { markdown: '' },
  image: { src: null, caption: '', alt: '' },
  chart: {
    source: null,
    sheet: null,
    xColumn: null,
    yColumns: [],
    chartType: 'bar',
    title: '',
  },
  table: { headers: [], rows: [] },
  divider: {},
}

const createBlock = (type) => ({
  id: crypto.randomUUID(),
  type,
  data: structuredClone(defaultDataByType[type] ?? {}),
})

export const useReportStore = create(
  persist(
    (set, get) => ({
      title: 'דוח חדש',
      blocks: [],

      setTitle: (title) => set({ title }),

      addBlock: (type, afterId = null) => {
        const block = createBlock(type)
        set((state) => {
          if (!afterId) {
            return { blocks: [...state.blocks, block] }
          }
          const index = state.blocks.findIndex((b) => b.id === afterId)
          if (index === -1) {
            return { blocks: [...state.blocks, block] }
          }
          const next = state.blocks.slice()
          next.splice(index + 1, 0, block)
          return { blocks: next }
        })
        return block.id
      },

      updateBlock: (id, data) =>
        set((state) => ({
          blocks: state.blocks.map((b) =>
            b.id === id ? { ...b, data: { ...b.data, ...data } } : b,
          ),
        })),

      deleteBlock: (id) =>
        set((state) => ({
          blocks: state.blocks.filter((b) => b.id !== id),
        })),

      duplicateBlock: (id) =>
        set((state) => {
          const index = state.blocks.findIndex((b) => b.id === id)
          if (index === -1) return state
          const original = state.blocks[index]
          const copy = {
            id: crypto.randomUUID(),
            type: original.type,
            data: structuredClone(original.data),
          }
          const next = state.blocks.slice()
          next.splice(index + 1, 0, copy)
          return { blocks: next }
        }),

      moveBlock: (fromIndex, toIndex) =>
        set((state) => {
          if (
            fromIndex < 0 ||
            toIndex < 0 ||
            fromIndex >= state.blocks.length ||
            toIndex >= state.blocks.length ||
            fromIndex === toIndex
          ) {
            return state
          }
          const next = state.blocks.slice()
          const [moved] = next.splice(fromIndex, 1)
          next.splice(toIndex, 0, moved)
          return { blocks: next }
        }),

      resetReport: () => set({ title: 'דוח חדש', blocks: [] }),
    }),
    {
      name: 'hebrew-report-builder',
      version: 1,
    },
  ),
)
