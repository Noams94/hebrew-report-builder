import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import heDict from '../i18n/he'
import enDict from '../i18n/en'

const DEFAULT_LANG = 'he'

const LOCALES = { he: heDict, en: enDict }

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
  nps: {
    title: '',
    counts: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
}

const createBlock = (type) => ({
  id: crypto.randomUUID(),
  type,
  data: structuredClone(defaultDataByType[type] ?? {}),
})

const dictFor = (lang) => (lang === 'en' ? enDict : heDict)

const createEmptyReport = (title, lang = DEFAULT_LANG) => {
  const dict = dictFor(lang)
  const finalTitle = title ?? dict.common.newReport
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    title: finalTitle,
    blocks: [],
    theme: {},
    lang,
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
    lang: report.lang,
    reports: { [report.id]: report },
    currentReportId: report.id,
    view: 'editor',
    defaultLang: DEFAULT_LANG,
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

      setLang: (lang) =>
        set((s) => {
          const defaultTitles = new Set(
            Object.values(LOCALES).map((d) => d.common.newReport),
          )
          const patch = { lang }
          if (defaultTitles.has(s.title)) {
            patch.title = dictFor(lang).common.newReport
          }
          return syncToReports(s, patch)
        }),

      setDefaultLang: (lang) => set({ defaultLang: lang }),

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
        set((s) => {
          const dict = dictFor(s.lang || DEFAULT_LANG)
          return syncToReports(s, {
            title: dict.common.newReport,
            blocks: [],
            theme: {},
          })
        }),

      loadReport: (report) =>
        set((s) => {
          const id = report.id || crypto.randomUUID()
          const now = Date.now()
          const lang = report.lang || s.defaultLang || DEFAULT_LANG
          const dict = dictFor(lang)
          const full = {
            id,
            title: report.title || dict.common.newReport,
            blocks: report.blocks || [],
            theme: report.theme || {},
            lang,
            createdAt: report.createdAt || now,
            updatedAt: now,
          }
          return {
            reports: { ...s.reports, [id]: full },
            currentReportId: id,
            title: full.title,
            blocks: full.blocks,
            theme: full.theme,
            lang: full.lang,
            view: 'editor',
          }
        }),

      createReport: (seed = {}) =>
        set((s) => {
          const lang = seed.lang || s.defaultLang || DEFAULT_LANG
          const dict = dictFor(lang)
          const report = createEmptyReport(
            seed.title || dict.common.newReport,
            lang,
          )
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
            lang: report.lang,
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
            lang: target.lang || DEFAULT_LANG,
          }
        }),

      deleteReport: (id) =>
        set((s) => {
          const nextReports = { ...s.reports }
          delete nextReports[id]
          if (Object.keys(nextReports).length === 0) {
            const fresh = createEmptyReport(undefined, s.defaultLang || DEFAULT_LANG)
            return {
              reports: { [fresh.id]: fresh },
              currentReportId: fresh.id,
              title: fresh.title,
              blocks: fresh.blocks,
              theme: fresh.theme,
              lang: fresh.lang,
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
              lang: next.lang || DEFAULT_LANG,
            }
          }
          return { reports: nextReports }
        }),

      duplicateReport: (id) =>
        set((s) => {
          const original = s.reports[id]
          if (!original) return s
          const dict = dictFor(original.lang || DEFAULT_LANG)
          const copy = {
            ...structuredClone(original),
            id: crypto.randomUUID(),
            title: `${original.title} ${dict.common.copy}`,
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
      version: 3,
      migrate: (persistedState, version) => {
        if (!persistedState) return makeInitialState()
        if (version >= 3) return persistedState
        if (version === 2) {
          const reports = Object.fromEntries(
            Object.entries(persistedState.reports || {}).map(([id, r]) => [
              id,
              { ...r, lang: r.lang || DEFAULT_LANG },
            ]),
          )
          return {
            ...persistedState,
            reports,
            lang:
              reports[persistedState.currentReportId]?.lang || DEFAULT_LANG,
            defaultLang: DEFAULT_LANG,
          }
        }
        const now = Date.now()
        const report = {
          id: crypto.randomUUID(),
          title: persistedState.title || heDict.common.newReport,
          blocks: persistedState.blocks || [],
          theme: {},
          lang: DEFAULT_LANG,
          createdAt: now,
          updatedAt: now,
        }
        return {
          title: report.title,
          blocks: report.blocks,
          theme: report.theme,
          lang: report.lang,
          reports: { [report.id]: report },
          currentReportId: report.id,
          view: 'editor',
          defaultLang: DEFAULT_LANG,
        }
      },
    },
  ),
)
