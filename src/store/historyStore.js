import { create } from 'zustand'
import { useReportStore } from './reportStore'

const MAX_HISTORY = 50
const DEBOUNCE_MS = 500

const snapshotOf = (state) => ({
  reportId: state.currentReportId,
  title: state.title,
  blocks: state.blocks,
  theme: state.theme,
})

const initialEntry = () => ({ past: [], future: [] })

export const useHistoryStore = create((set, get) => ({
  byReport: {},

  hasUndo: (reportId) => (get().byReport[reportId]?.past?.length ?? 0) > 0,
  hasRedo: (reportId) => (get().byReport[reportId]?.future?.length ?? 0) > 0,

  push: (snap) => {
    if (!snap.reportId) return
    set((s) => {
      const entry = s.byReport[snap.reportId] ?? initialEntry()
      const next = {
        past: [...entry.past, snap].slice(-MAX_HISTORY),
        future: [],
      }
      return { byReport: { ...s.byReport, [snap.reportId]: next } }
    })
  },

  undo: () => {
    const reportState = useReportStore.getState()
    const reportId = reportState.currentReportId
    const entry = get().byReport[reportId]
    if (!entry || entry.past.length === 0) return false
    const prev = entry.past[entry.past.length - 1]
    const current = snapshotOf(reportState)
    set((s) => ({
      byReport: {
        ...s.byReport,
        [reportId]: {
          past: entry.past.slice(0, -1),
          future: [current, ...entry.future].slice(0, MAX_HISTORY),
        },
      },
    }))
    applySnapshot(prev)
    return true
  },

  redo: () => {
    const reportState = useReportStore.getState()
    const reportId = reportState.currentReportId
    const entry = get().byReport[reportId]
    if (!entry || entry.future.length === 0) return false
    const next = entry.future[0]
    const current = snapshotOf(reportState)
    set((s) => ({
      byReport: {
        ...s.byReport,
        [reportId]: {
          past: [...entry.past, current].slice(-MAX_HISTORY),
          future: entry.future.slice(1),
        },
      },
    }))
    applySnapshot(next)
    return true
  },

  clearForReport: (reportId) =>
    set((s) => {
      if (!s.byReport[reportId]) return s
      const next = { ...s.byReport }
      delete next[reportId]
      return { byReport: next }
    }),
}))

let suppressCapture = false
let pendingSnapshot = null
let debounceTimer = null

function applySnapshot(snap) {
  suppressCapture = true
  useReportStore.setState((s) => {
    const report = s.reports[snap.reportId]
    if (!report) return {}
    const updated = {
      ...report,
      title: snap.title,
      blocks: snap.blocks,
      theme: snap.theme,
      updatedAt: Date.now(),
    }
    return {
      title: snap.title,
      blocks: snap.blocks,
      theme: snap.theme,
      reports: { ...s.reports, [snap.reportId]: updated },
    }
  })
  queueMicrotask(() => {
    suppressCapture = false
  })
}

function flushPendingCapture() {
  if (!pendingSnapshot) return
  useHistoryStore.getState().push(pendingSnapshot)
  pendingSnapshot = null
}

export function initHistoryTracking() {
  return useReportStore.subscribe((state, prev) => {
    if (suppressCapture) return
    if (!prev.currentReportId) return
    if (state.currentReportId !== prev.currentReportId) {
      flushPendingCapture()
      return
    }
    const changed =
      state.title !== prev.title ||
      state.blocks !== prev.blocks ||
      state.theme !== prev.theme
    if (!changed) return

    if (!pendingSnapshot) {
      pendingSnapshot = snapshotOf(prev)
    }
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      flushPendingCapture()
      debounceTimer = null
    }, DEBOUNCE_MS)
  })
}
