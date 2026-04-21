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
  ArrowLeft,
} from 'lucide-react'
import { useReportStore } from '../store/reportStore'
import { TEMPLATES, instantiateTemplate } from '../lib/templates'
import { downloadReport } from '../lib/export'
import { downloadReportJSON } from '../lib/reportFile'
import { useT, useLang, useDir, isRtl } from '../i18n'

function formatDate(ts, locale) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function summarizeBlocks(blocks = [], t) {
  const headings = blocks.filter((b) => b.type === 'heading').slice(0, 3)
  if (headings.length === 0) {
    return t.library.blockCount(blocks.length)
  }
  return headings.map((h) => h.data.text || t.common.emptyHeading).join(' · ')
}

function ReportCard({ report, isCurrent, onOpen, onDuplicate, onDelete, onRename, t, lang }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuAlign = isRtl(lang) ? 'text-right' : 'text-left'

  const handleExportHTML = (e) => {
    e.stopPropagation()
    downloadReport(report.title, report.blocks, report.theme, report.lang || lang)
    setMenuOpen(false)
  }

  const handleExportJSON = (e) => {
    e.stopPropagation()
    downloadReportJSON(report)
    setMenuOpen(false)
  }

  const handleRename = (e) => {
    e.stopPropagation()
    const next = window.prompt(t.library.renamePrompt, report.title)
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
    if (window.confirm(t.library.deleteConfirm(report.title))) {
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
      dir={isRtl(report.lang || lang) ? 'rtl' : 'ltr'}
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
            aria-label={t.library.more}
            className="rounded p-1 text-ink/50 opacity-0 transition hover:bg-paper group-hover:opacity-100"
          >
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <div
              role="menu"
              onClick={(e) => e.stopPropagation()}
              className="absolute start-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-md border border-subtle bg-white text-xs shadow-lg"
            >
              <button
                type="button"
                onClick={handleRename}
                className={`flex w-full items-center gap-2 px-3 py-2 ${menuAlign} hover:bg-paper`}
              >
                <Edit3 size={13} /> {t.common.rename}
              </button>
              <button
                type="button"
                onClick={handleDuplicate}
                className={`flex w-full items-center gap-2 px-3 py-2 ${menuAlign} hover:bg-paper`}
              >
                <Copy size={13} /> {t.common.duplicate}
              </button>
              <button
                type="button"
                onClick={handleExportHTML}
                className={`flex w-full items-center gap-2 border-t border-subtle px-3 py-2 ${menuAlign} hover:bg-paper`}
              >
                <Download size={13} /> {t.library.exportHTML}
              </button>
              <button
                type="button"
                onClick={handleExportJSON}
                className={`flex w-full items-center gap-2 px-3 py-2 ${menuAlign} hover:bg-paper`}
              >
                <Download size={13} /> {t.library.exportJSON}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className={`flex w-full items-center gap-2 border-t border-subtle px-3 py-2 ${menuAlign} text-red-600 hover:bg-red-50`}
              >
                <Trash2 size={13} /> {t.common.delete}
              </button>
            </div>
          )}
        </div>
      </div>
      <h3 className="font-serif text-lg font-semibold text-ink">
        {report.title || t.common.untitled}
      </h3>
      <p className="line-clamp-2 text-xs text-ink/60">
        {summarizeBlocks(report.blocks, t)}
      </p>
      <div className="mt-auto flex items-center justify-between text-xs text-ink/50">
        <span>{t.library.blockCount(report.blocks?.length ?? 0)}</span>
        <span className="flex items-center gap-2">
          <span className="rounded bg-paper px-1 font-mono uppercase">
            {(report.lang || 'he')}
          </span>
          {formatDate(report.updatedAt, t.common.locale)}
        </span>
      </div>
    </div>
  )
}

function TemplatePicker({ onPick, onClose, t, lang }) {
  const align = isRtl(lang) ? 'text-right' : 'text-left'
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="border-b border-subtle px-5 py-3">
          <h2 className="font-serif text-lg font-semibold">{t.library.pickTemplate}</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
          {TEMPLATES.filter((tpl) => !tpl.lang || tpl.lang === lang).map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onPick(tpl.id)}
              className={`flex flex-col gap-2 rounded-lg border border-subtle p-4 ${align} transition hover:border-accent hover:bg-paper`}
            >
              <span className="font-serif text-base font-semibold text-ink">
                {tpl.name}
              </span>
              <span className="text-xs text-ink/60">{tpl.description}</span>
              <span className="mt-1 text-xs text-ink/40">
                {t.library.blockCount(tpl.blocks.length)}
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
  const t = useT()
  const lang = useLang()
  const dir = useDir()
  const BackArrow = dir === 'rtl' ? ArrowRight : ArrowLeft

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
    const seed = instantiateTemplate(templateId, lang)
    const seedWithIds = {
      ...seed,
      lang: seed.lang || lang,
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
          <h1 className="font-serif text-lg font-semibold">{t.library.title}</h1>
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
              <BackArrow size={14} />
              {t.library.back}
            </button>
          )}
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-ink/40"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.library.search}
              className="w-48 rounded-md border border-subtle bg-paper py-1.5 pe-8 ps-3 text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <button
            type="button"
            onClick={() => setTemplateOpen(true)}
            className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm text-white hover:opacity-90"
          >
            <Plus size={16} />
            {t.library.newReport}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-ink/50">
            <FileText size={48} strokeWidth={1} />
            <p>{query ? t.library.noMatches : t.library.noReports}</p>
            {!query && (
              <button
                type="button"
                onClick={() => setTemplateOpen(true)}
                className="rounded-md bg-accent px-4 py-1.5 text-sm text-white hover:opacity-90"
              >
                {t.library.createFirst}
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
                t={t}
                lang={lang}
              />
            ))}
          </div>
        )}
      </div>

      {templateOpen && (
        <TemplatePicker
          onPick={handlePickTemplate}
          onClose={() => setTemplateOpen(false)}
          t={t}
          lang={lang}
        />
      )}
    </section>
  )
}
