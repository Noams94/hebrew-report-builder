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
  likert: { scale: 5, questions: [], title: '' },
  stats: {
    source: null,
    sheet: null,
    column: null,
    metrics: ['n', 'mean', 'median', 'std', 'min', 'max'],
    title: '',
  },
  map: {
    title: '',
    points: [],
    center: [31.5, 34.8],
    zoom: 8,
    colorByValue: false,
    clickToAdd: false,
  },
  cover: {
    useReportTitle: true,
    overrideTitle: '',
    subtitle: '',
    client: '',
    date: '',
    logo: null,
    useThemeLogo: true,
  },
}

const createBlock = (type) => ({
  id: crypto.randomUUID(),
  type,
  data: structuredClone(defaultDataByType[type] ?? {}),
})

const createEmptyReport = (title = 'דוח חדש') => {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    title,
    blocks: [],
    theme: {},
    createdAt: now,
    updatedAt: now,
  }
}

const makeInitialState = () => {
  const report = createEmptyReport()
  return {
    title: report.title,
    blocks: report.blocks,
    theme: report.theme,
    reports: { [report.id]: report },
    currentReportId: report.id,
    view: 'editor',
  }
}

const syncToReports = (state, patch) => {
  if (!state.currentReportId) return patch
  const current = state.reports[state.currentReportId]
  if (!current) return patch
  const merged = { ...current, ...patch, updatedAt: Date.now() }
  return {
    ...patch,
    reports: {
      ...state.reports,
      [state.currentReportId]: merged,
    },
  }
}

export const useReportStore = create(
  persist(
    (set) => ({
      ...makeInitialState(),

      setTitle: (title) => set((s) => syncToReports(s, { title })),

      setTheme: (theme) =>
        set((s) => syncToReports(s, { theme: { ...s.theme, ...theme } })),

      addBlock: (type, afterId = null) => {
        const block = createBlock(type)
        set((s) => {
          let nextBlocks
          if (!afterId) {
            nextBlocks = [...s.blocks, block]
          } else {
            const index = s.blocks.findIndex((b) => b.id === afterId)
            if (index === -1) {
              nextBlocks = [...s.blocks, block]
            } else {
              nextBlocks = s.blocks.slice()
              nextBlocks.splice(index + 1, 0, block)
            }
          }
          return syncToReports(s, { blocks: nextBlocks })
        })
        return block.id
      },

      updateBlock: (id, data) =>
        set((s) => {
          const blocks = s.blocks.map((b) =>
            b.id === id ? { ...b, data: { ...b.data, ...data } } : b,
          )
          return syncToReports(s, { blocks })
        }),

      deleteBlock: (id) =>
        set((s) => {
          const blocks = s.blocks.filter((b) => b.id !== id)
          return syncToReports(s, { blocks })
        }),

      duplicateBlock: (id) =>
        set((s) => {
          const index = s.blocks.findIndex((b) => b.id === id)
          if (index === -1) return s
          const original = s.blocks[index]
          const copy = {
            id: crypto.randomUUID(),
            type: original.type,
            data: structuredClone(original.data),
          }
          const blocks = s.blocks.slice()
          blocks.splice(index + 1, 0, copy)
          return syncToReports(s, { blocks })
        }),

      moveBlock: (fromIndex, toIndex) =>
        set((s) => {
          if (
            fromIndex < 0 ||
            toIndex < 0 ||
            fromIndex >= s.blocks.length ||
            toIndex >= s.blocks.length ||
            fromIndex === toIndex
          ) {
            return s
          }
          const blocks = s.blocks.slice()
          const [moved] = blocks.splice(fromIndex, 1)
          blocks.splice(toIndex, 0, moved)
          return syncToReports(s, { blocks })
        }),

      resetReport: () =>
        set((s) =>
          syncToReports(s, { title: 'דוח חדש', blocks: [], theme: {} }),
        ),

      loadReport: (report) =>
        set((s) => {
          const id = report.id || crypto.randomUUID()
          const now = Date.now()
          const full = {
            id,
            title: report.title || 'דוח חדש',
            blocks: report.blocks || [],
            theme: report.theme || {},
            createdAt: report.createdAt || now,
            updatedAt: now,
          }
          return {
            reports: { ...s.reports, [id]: full },
            currentReportId: id,
            title: full.title,
            blocks: full.blocks,
            theme: full.theme,
            view: 'editor',
          }
        }),

      createReport: (seed = {}) =>
        set((s) => {
          const report = createEmptyReport(seed.title || 'דוח חדש')
          if (seed.blocks) {
            report.blocks = seed.blocks.map((b) => ({
              ...structuredClone(b),
              id: crypto.randomUUID(),
            }))
          }
          if (seed.theme) report.theme = { ...seed.theme }
          return {
            reports: { ...s.reports, [report.id]: report },
            currentReportId: report.id,
            title: report.title,
            blocks: report.blocks,
            theme: report.theme,
            view: 'editor',
          }
        }),

      switchReport: (id) =>
        set((s) => {
          const target = s.reports[id]
          if (!target) return s
          return {
            currentReportId: id,
            title: target.title,
            blocks: target.blocks,
            theme: target.theme || {},
          }
        }),

      deleteReport: (id) =>
        set((s) => {
          const nextReports = { ...s.reports }
          delete nextReports[id]
          if (Object.keys(nextReports).length === 0) {
            const fresh = createEmptyReport()
            return {
              reports: { [fresh.id]: fresh },
              currentReportId: fresh.id,
              title: fresh.title,
              blocks: fresh.blocks,
              theme: fresh.theme,
            }
          }
          if (s.currentReportId === id) {
            const nextId = Object.keys(nextReports)[0]
            const next = nextReports[nextId]
            return {
              reports: nextReports,
              currentReportId: nextId,
              title: next.title,
              blocks: next.blocks,
              theme: next.theme || {},
            }
          }
          return { reports: nextReports }
        }),

      duplicateReport: (id) =>
        set((s) => {
          const original = s.reports[id]
          if (!original) return s
          const copy = {
            ...structuredClone(original),
            id: crypto.randomUUID(),
            title: `${original.title} (עותק)`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }
          return { reports: { ...s.reports, [copy.id]: copy } }
        }),

      renameReport: (id, title) =>
        set((s) => {
          const report = s.reports[id]
          if (!report) return s
          const updated = { ...report, title, updatedAt: Date.now() }
          const patch = { reports: { ...s.reports, [id]: updated } }
          if (s.currentReportId === id) patch.title = title
          return patch
        }),

      setView: (view) => set({ view }),
    }),
    {
      name: 'hebrew-report-builder',
      version: 2,
      migrate: (persistedState, version) => {
        if (!persistedState) return makeInitialState()
        if (version >= 2) return persistedState
        const now = Date.now()
        const report = {
          id: crypto.randomUUID(),
          title: persistedState.title || 'דוח חדש',
          blocks: persistedState.blocks || [],
          theme: {},
          createdAt: now,
          updatedAt: now,
        }
        return {
          title: report.title,
          blocks: report.blocks,
          theme: report.theme,
          reports: { [report.id]: report },
          currentReportId: report.id,
          view: 'editor',
        }
      },
    },
  ),
)
