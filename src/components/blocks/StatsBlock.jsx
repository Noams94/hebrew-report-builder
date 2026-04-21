import { useMemo, useRef } from 'react'
import { Upload, Calculator } from 'lucide-react'
import { useReportStore } from '../../store/reportStore'
import { parseExcel } from '../../lib/excel'
import {
  computeStats,
  formatMetric,
  METRIC_LABELS,
  DEFAULT_METRICS,
} from '../../lib/stats'

const ALL_METRICS = ['n', 'mean', 'median', 'std', 'min', 'max', 'sum']

export default function StatsBlock({ block }) {
  const updateBlock = useReportStore((s) => s.updateBlock)
  const fileInputRef = useRef(null)

  const {
    source,
    sheet,
    column,
    metrics = DEFAULT_METRICS,
    title = '',
  } = block.data

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const result = await parseExcel(file)
    const firstSheet = result.sheets[0]
    updateBlock(block.id, {
      source: result,
      sheet: firstSheet,
      column: null,
    })
  }

  const values = useMemo(() => {
    if (!source || !sheet || !column) return []
    const sheetData = source.data[sheet]
    if (!sheetData) return []
    const colIndex = sheetData.headers.indexOf(column)
    if (colIndex === -1) return []
    return sheetData.rows.map((r) => r[colIndex])
  }, [source, sheet, column])

  const stats = useMemo(() => computeStats(values, metrics), [values, metrics])

  const toggleMetric = (m) => {
    const next = metrics.includes(m)
      ? metrics.filter((x) => x !== m)
      : [...metrics, m]
    updateBlock(block.id, { metrics: next })
  }

  if (!source) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-subtle py-8 text-center">
        <Calculator size={32} strokeWidth={1.5} className="text-ink/40" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 rounded-md border border-subtle bg-white px-4 py-2 text-sm text-ink/80 hover:bg-paper"
        >
          <Upload size={14} />
          העלה Excel לחישוב סטטיסטיקה
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleUpload}
          className="hidden"
        />
      </div>
    )
  }

  const headers = source.data[sheet]?.headers ?? []

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-subtle bg-white p-3 text-xs">
        {source.sheets.length > 1 && (
          <label className="flex items-center gap-1">
            גיליון:
            <select
              value={sheet ?? ''}
              onChange={(e) =>
                updateBlock(block.id, { sheet: e.target.value, column: null })
              }
              className="rounded border border-subtle px-2 py-1"
            >
              {source.sheets.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="flex items-center gap-1">
          עמודה:
          <select
            value={column ?? ''}
            onChange={(e) => updateBlock(block.id, { column: e.target.value })}
            className="rounded border border-subtle px-2 py-1"
          >
            <option value="">בחר...</option>
            {headers.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap items-center gap-1">
          מדדים:
          {ALL_METRICS.map((m) => (
            <label
              key={m}
              className="flex items-center gap-1 rounded border border-subtle px-2 py-1"
            >
              <input
                type="checkbox"
                checked={metrics.includes(m)}
                onChange={() => toggleMetric(m)}
              />
              {METRIC_LABELS[m]}
            </label>
          ))}
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded border border-subtle bg-white px-2 py-1 text-xs text-ink/70 hover:bg-paper"
        >
          החלף קובץ
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => updateBlock(block.id, { title: e.target.value })}
        placeholder="כותרת (אופציונלי)"
        className="rounded border border-subtle bg-white px-3 py-1.5 text-sm focus:outline-none"
      />

      <StatsGrid title={title} stats={stats} metrics={metrics} />
    </div>
  )
}

export function StatsGrid({ title, stats, metrics }) {
  return (
    <div className="my-2 rounded-lg border border-subtle bg-white p-4">
      {title && (
        <div className="mb-3 text-center font-serif text-base font-semibold">
          {title}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {metrics.map((m) => (
          <div
            key={m}
            className="flex flex-col items-center rounded-md bg-paper px-3 py-2"
          >
            <span className="text-xs text-ink/60">{METRIC_LABELS[m]}</span>
            <span className="font-serif text-2xl font-bold text-ink">
              {formatMetric(stats[m], m)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
