import { useEffect, useRef, useState } from 'react'
import {
  FilePlus2,
  Download,
  Check,
  Upload,
  ChevronDown,
  Undo2,
  Redo2,
  LayoutGrid,
  Palette,
  Settings,
  Languages,
} from 'lucide-react'
import { useReportStore } from '../store/reportStore'
import { useHistoryStore } from '../store/historyStore'
import { downloadReport, printReport } from '../lib/export'
import { downloadReportJSON } from '../lib/reportFile'
import { exportReportDOCX } from '../lib/docxExport'
import ImportDialog from './ImportDialog'
import ThemePanel from './ThemePanel'
import SettingsPanel from './SettingsPanel'
import { useT, useLang } from '../i18n'

function formatTime(date, locale) {
  return date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Toolbar() {
  const t = useT()
  const lang = useLang()
  const title = useReportStore((s) => s.title)
  const setTitle = useReportStore((s) => s.setTitle)
  const blocks = useReportStore((s) => s.blocks)
  const theme = useReportStore((s) => s.theme)
  const currentReportId = useReportStore((s) => s.currentReportId)
  const resetReport = useReportStore((s) => s.resetReport)
  const setView = useReportStore((s) => s.setView)
  const setLang = useReportStore((s) => s.setLang)

  const canUndo = useHistoryStore((s) =>
    (s.byReport[currentReportId]?.past?.length ?? 0) > 0,
  )
  const canRedo = useHistoryStore((s) =>
    (s.byReport[currentReportId]?.future?.length ?? 0) > 0,
  )
  const undo = useHistoryStore((s) => s.undo)
  const redo = useHistoryStore((s) => s.redo)

  const [lastSaved, setLastSaved] = useState(() => new Date())
  const [exportOpen, setExportOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [themeOpen, setThemeOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const exportMenuRef = useRef(null)
  const langMenuRef = useRef(null)

  useEffect(() => {
    setLastSaved(new Date())
  }, [title, blocks])

  useEffect(() => {
    if (!exportOpen) return
    const handler = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setExportOpen(false)
      }
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [exportOpen])

  useEffect(() => {
    if (!langOpen) return
    const handler = (e) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target)) {
        setLangOpen(false)
      }
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [langOpen])

  const handleExportHTML = () => {
    downloadReport(title, blocks, theme, lang)
    setExportOpen(false)
  }

  const handleExportJSON = () => {
    downloadReportJSON({
      id: currentReportId,
      title,
      blocks,
      theme,
      lang,
    })
    setExportOpen(false)
  }

  const handleExportPDF = () => {
    printReport(title, blocks, theme, lang)
    setExportOpen(false)
  }

  const handleExportDOCX = async () => {
    try {
      await exportReportDOCX(title, blocks, lang)
    } catch (err) {
      alert(t.toolbar.exportDocxError + (err.message || t.common.unknown))
    }
    setExportOpen(false)
  }

  const handleNew = () => {
    if (window.confirm(t.toolbar.resetConfirm)) {
      resetReport()
    }
  }

  const handleOpenLibrary = () => {
    setView('library')
  }

  useEffect(() => {
    const handler = (e) => {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return
      const k = e.key.toLowerCase()
      if (k === 's') {
        e.preventDefault()
        handleExportHTML()
      } else if (k === 'n') {
        e.preventDefault()
        handleOpenLibrary()
      } else if (k === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if ((k === 'z' && e.shiftKey) || k === 'y') {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  return (
    <header className="flex items-center gap-4 border-b border-subtle bg-white px-6 py-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t.toolbar.titlePlaceholder}
        aria-label={t.toolbar.titleAria}
        className="flex-1 bg-transparent text-lg font-medium text-ink placeholder:text-ink/40 focus:outline-none"
      />
      <div
        className="flex items-center gap-1 text-xs text-ink/50"
        aria-live="polite"
      >
        <Check size={12} />
        {t.toolbar.savedAt(formatTime(lastSaved, t.common.locale))}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-md border border-subtle">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            aria-label={t.toolbar.undo}
            title={t.toolbar.undo}
            className="flex items-center p-1.5 text-ink/70 transition hover:bg-paper disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <Undo2 size={16} />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!canRedo}
            aria-label={t.toolbar.redo}
            title={t.toolbar.redo}
            className="flex items-center border-s border-subtle p-1.5 text-ink/70 transition hover:bg-paper disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <Redo2 size={16} />
          </button>
        </div>
        <div className="relative" ref={langMenuRef}>
          <button
            type="button"
            onClick={() => setLangOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={langOpen}
            title={t.settings.language}
            className="flex items-center gap-1.5 rounded-md border border-subtle px-2 py-1.5 text-xs text-ink/80 transition hover:bg-paper"
          >
            <Languages size={14} />
            <span className="font-medium uppercase">{lang}</span>
            <ChevronDown size={12} />
          </button>
          {langOpen && (
            <div
              role="menu"
              className="absolute end-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-md border border-subtle bg-white text-sm shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setLang('he')
                  setLangOpen(false)
                }}
                className={`block w-full px-3 py-2 text-start transition hover:bg-paper ${
                  lang === 'he' ? 'bg-paper font-medium' : 'text-ink/80'
                }`}
              >
                עברית (RTL)
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setLang('en')
                  setLangOpen(false)
                }}
                className={`block w-full border-t border-subtle px-3 py-2 text-start transition hover:bg-paper ${
                  lang === 'en' ? 'bg-paper font-medium' : 'text-ink/80'
                }`}
              >
                English (LTR)
              </button>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleOpenLibrary}
          className="flex items-center gap-1.5 rounded-md border border-subtle px-3 py-1.5 text-sm text-ink/80 transition hover:bg-paper"
        >
          <LayoutGrid size={16} />
          {t.toolbar.allReports}
        </button>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          aria-label={t.toolbar.settings}
          title={t.toolbar.settings}
          className="flex items-center rounded-md border border-subtle p-1.5 text-ink/70 transition hover:bg-paper"
        >
          <Settings size={16} />
        </button>
        <button
          type="button"
          onClick={() => setThemeOpen(true)}
          aria-label={t.toolbar.themeAria}
          title={t.toolbar.themeAria}
          className="flex items-center gap-1.5 rounded-md border border-subtle px-3 py-1.5 text-sm text-ink/80 transition hover:bg-paper"
        >
          <Palette size={16} />
          {t.toolbar.theme}
        </button>
        <button
          type="button"
          onClick={() => setImportOpen(true)}
          className="flex items-center gap-1.5 rounded-md border border-subtle px-3 py-1.5 text-sm text-ink/80 transition hover:bg-paper"
        >
          <Upload size={16} />
          {t.toolbar.import}
        </button>
        <button
          type="button"
          onClick={handleNew}
          className="flex items-center gap-1.5 rounded-md border border-subtle px-3 py-1.5 text-sm text-ink/80 transition hover:bg-paper"
        >
          <FilePlus2 size={16} />
          {t.toolbar.reset}
        </button>
        <div className="relative" ref={exportMenuRef}>
          <button
            type="button"
            onClick={() => setExportOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={exportOpen}
            className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm text-white transition hover:opacity-90"
          >
            <Download size={16} />
            {t.toolbar.export}
            <ChevronDown size={14} />
          </button>
          {exportOpen && (
            <div
              role="menu"
              className="absolute start-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-md border border-subtle bg-white text-sm shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                onClick={handleExportHTML}
                className="block w-full px-3 py-2 text-start text-ink/80 transition hover:bg-paper"
              >
                {t.toolbar.exportHTML}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={handleExportPDF}
                className="block w-full border-t border-subtle px-3 py-2 text-start text-ink/80 transition hover:bg-paper"
              >
                {t.toolbar.exportPDF}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={handleExportDOCX}
                className="block w-full border-t border-subtle px-3 py-2 text-start text-ink/80 transition hover:bg-paper"
              >
                {t.toolbar.exportDOCX}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={handleExportJSON}
                className="block w-full border-t border-subtle px-3 py-2 text-start text-ink/80 transition hover:bg-paper"
              >
                {t.toolbar.exportJSON}
              </button>
            </div>
          )}
        </div>
      </div>
      {importOpen && <ImportDialog onClose={() => setImportOpen(false)} />}
      {themeOpen && <ThemePanel onClose={() => setThemeOpen(false)} />}
      {settingsOpen && (
        <SettingsPanel onClose={() => setSettingsOpen(false)} />
      )}
    </header>
  )
}
