import { useMemo, useState } from 'react'
import {
  FileText,
  Search,
  Plus,
  MoreVertical,
  Copy,
  Trash2,
  Edit3,
  Download,
  LayoutGrid,
  ArrowRight,
} from 'lucide-react'
import { useReportStore } from '../store/reportStore'
import { TEMPLATES, instantiateTemplate } from '../lib/templates'
import { downloadReport } from '../lib/export'
import { downloadReportJSON } from '../lib/reportFile'

function formatDate(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleDateString('he-IL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function summarizeBlocks(blocks = []) {
  const headings = blocks.filter((b) => b.type === 'heading').slice(0, 3)
  if (headings.length === 0) {
    return `${blocks.length} בלוקים`
  }
  return headings.map((h) => h.data.text || 'כותרת ריקה').join(' · ')
}

function ReportCard({ report, isCurrent, onOpen, onDuplicate, onDelete, onRename }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const handleExportHTML = (e) => {
    e.stopPropagation()
    downloadReport(report.title, report.blocks, report.theme)
    setMenuOpen(false)
  }

  const handleExportJSON = (e) => {
    e.stopPropagation()
    downloadReportJSON(report)
    setMenuOpen(false)
  }

  const handleRename = (e) => {
    e.stopPropagation()
    const next = window.prompt('שם חדש לדוח:', report.title)
    if (next && next.trim() && next !== report.title) {
      onRename(report.id, next.trim())
    }
    setMenuOpen(false)
  }

  const handleDuplicate = (e) => {
    e.stopPropagation()
    onDuplicate(report.id)
    setMenuOpen(false)
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    if (window.confirm(`למחוק את "${report.title}"? פעולה זו לא ניתנת לביטול.`)) {
      onDelete(report.id)
    }
    setMenuOpen(false)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(report.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen(report.id)
      }}
      className={`group relative flex cursor-pointer flex-col gap-3 rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md ${
        isCurrent ? 'border-accent ring-2 ring-accent/30' : 'border-subtle'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <FileText size={18} className="shrink-0 text-ink/50" />
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen((v) => !v)
            }}
            aria-label="עוד פעולות"
            className="rounded p-1 text-ink/50 opacity-0 transition hover:bg-paper group-hover:opacity-100"
          >
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <div
              role="menu"
              onClick={(e) => e.stopPropagation()}
              className="absolute left-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-md border border-subtle bg-white text-xs shadow-lg"
            >
              <button
                type="button"
                onClick={handleRename}
                className="flex w-full items-center gap-2 px-3 py-2 text-right hover:bg-paper"
              >
                <Edit3 size={13} /> שנה שם
              </button>
              <button
                type="button"
                onClick={handleDuplicate}
                className="flex w-full items-center gap-2 px-3 py-2 text-right hover:bg-paper"
              >
                <Copy size={13} /> שכפל
              </button>
              <button
                type="button"
                onClick={handleExportHTML}
                className="flex w-full items-center gap-2 border-t border-subtle px-3 py-2 text-right hover:bg-paper"
              >
                <Download size={13} /> ייצוא HTML
              </button>
              <button
                type="button"
                onClick={handleExportJSON}
                className="flex w-full items-center gap-2 px-3 py-2 text-right hover:bg-paper"
              >
                <Download size={13} /> ייצוא JSON
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex w-full items-center gap-2 border-t border-subtle px-3 py-2 text-right text-red-600 hover:bg-red-50"
              >
                <Trash2 size={13} /> מחק
              </button>
            </div>
          )}
        </div>
      </div>
      <h3 className="font-serif text-lg font-semibold text-ink">
        {report.title || 'דוח ללא שם'}
      </h3>
      <p className="line-clamp-2 text-xs text-ink/60">
        {summarizeBlocks(report.blocks)}
      </p>
      <div className="mt-auto flex items-center justify-between text-xs text-ink/50">
        <span>{report.blocks?.length ?? 0} בלוקים</span>
        <span>{formatDate(report.updatedAt)}</span>
      </div>
    </div>
  )
}

function TemplatePicker({ onPick, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="border-b border-subtle px-5 py-3">
          <h2 className="font-serif text-lg font-semibold">בחר תבנית</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onPick(t.id)}
              className="flex flex-col gap-2 rounded-lg border border-subtle p-4 text-right transition hover:border-accent hover:bg-paper"
            >
              <span className="font-serif text-base font-semibold text-ink">
                {t.name}
              </span>
              <span className="text-xs text-ink/60">{t.description}</span>
              <span className="mt-1 text-xs text-ink/40">
                {t.blocks.length} בלוקים
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ReportLibrary() {
  const reports = useReportStore((s) => s.reports)
  const currentReportId = useReportStore((s) => s.currentReportId)
  const switchReport = useReportStore((s) => s.switchReport)
  const deleteReport = useReportStore((s) => s.deleteReport)
  const duplicateReport = useReportStore((s) => s.duplicateReport)
  const renameReport = useReportStore((s) => s.renameReport)
  const createReport = useReportStore((s) => s.createReport)
  const setView = useReportStore((s) => s.setView)

  const [query, setQuery] = useState('')
  const [templateOpen, setTemplateOpen] = useState(false)

  const list = useMemo(() => {
    const all = Object.values(reports)
    const filtered = query.trim()
      ? all.filter((r) =>
          (r.title || '').toLowerCase().includes(query.trim().toLowerCase()),
        )
      : all
    return filtered.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
  }, [reports, query])

  const handleOpen = (id) => {
    switchReport(id)
    setView('editor')
  }

  const handlePickTemplate = (templateId) => {
    const seed = instantiateTemplate(templateId)
    const seedWithIds = {
      ...seed,
      blocks: seed.blocks.map((b) => ({
        ...b,
        id: crypto.randomUUID(),
      })),
    }
    createReport(seedWithIds)
    setTemplateOpen(false)
  }

  return (
    <section className="flex h-full flex-col overflow-hidden bg-paper">
      <div className="flex items-center justify-between gap-4 border-b border-subtle bg-white px-6 py-3">
        <div className="flex items-center gap-2">
          <LayoutGrid size={18} className="text-ink/60" />
          <h1 className="font-serif text-lg font-semibold">הדוחות שלי</h1>
          <span className="text-xs text-ink/50">
            ({Object.keys(reports).length})
          </span>
        </div>
        <div className="flex items-center gap-2">
          {currentReportId && reports[currentReportId] && (
            <button
              type="button"
              onClick={() => setView('editor')}
              className="flex items-center gap-1.5 rounded-md border border-subtle px-3 py-1.5 text-sm text-ink/80 transition hover:bg-paper"
            >
              <ArrowRight size={14} />
              חזרה לעורך
            </button>
          )}
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/40"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="חיפוש..."
              className="w-48 rounded-md border border-subtle bg-paper py-1.5 pr-8 pl-3 text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <button
            type="button"
            onClick={() => setTemplateOpen(true)}
            className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm text-white hover:opacity-90"
          >
            <Plus size={16} />
            דוח חדש
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-ink/50">
            <FileText size={48} strokeWidth={1} />
            <p>{query ? 'אין דוחות שמתאימים לחיפוש' : 'אין דוחות עדיין'}</p>
            {!query && (
              <button
                type="button"
                onClick={() => setTemplateOpen(true)}
                className="rounded-md bg-accent px-4 py-1.5 text-sm text-white hover:opacity-90"
              >
                יצירת דוח ראשון
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.map((r) => (
              <ReportCard
                key={r.id}
                report={r}
                isCurrent={r.id === currentReportId}
                onOpen={handleOpen}
                onDuplicate={duplicateReport}
                onDelete={deleteReport}
                onRename={renameReport}
              />
            ))}
          </div>
        )}
      </div>

      {templateOpen && (
        <TemplatePicker
          onPick={handlePickTemplate}
          onClose={() => setTemplateOpen(false)}
        />
      )}
    </section>
  )
}
