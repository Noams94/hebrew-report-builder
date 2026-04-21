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
} from 'lucide-react'
import { useReportStore } from '../store/reportStore'
import { useHistoryStore } from '../store/historyStore'
import { downloadReport, printReport } from '../lib/export'
import { downloadReportJSON } from '../lib/reportFile'
import { exportReportDOCX } from '../lib/docxExport'
import ImportDialog from './ImportDialog'
import ThemePanel from './ThemePanel'
import SettingsPanel from './SettingsPanel'

function formatTime(date) {
  return date.toLocaleTimeString('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Toolbar() {
  const title = useReportStore((s) => s.title)
  const setTitle = useReportStore((s) => s.setTitle)
  const blocks = useReportStore((s) => s.blocks)
  const theme = useReportStore((s) => s.theme)
  const currentReportId = useReportStore((s) => s.currentReportId)
  const resetReport = useReportStore((s) => s.resetReport)
  const setView = useReportStore((s) => s.setView)

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
  const [importOpen, setImportOpen] = useState(false)
  const [themeOpen, setThemeOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const exportMenuRef = useRef(null)

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

  const handleExportHTML = () => {
    downloadReport(title, blocks, theme)
    setExportOpen(false)
  }

  const handleExportJSON = () => {
    downloadReportJSON({
      id: currentReportId,
      title,
      blocks,
      theme,
    })
    setExportOpen(false)
  }

  const handleExportPDF = () => {
    printReport(title, blocks, theme)
    setExportOpen(false)
  }

  const handleExportDOCX = async () => {
    try {
      await exportReportDOCX(title, blocks)
    } catch (err) {
      alert('שגיאה בייצוא Word: ' + (err.message || 'לא ידוע'))
    }
    setExportOpen(false)
  }

  const handleNew = () => {
    if (window.confirm('לאתחל את הדוח? כל התוכן הנוכחי יימחק.')) {
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
        placeholder="שם הדוח"
        aria-label="שם הדוח"
        className="flex-1 bg-transparent text-lg font-medium text-ink placeholder:text-ink/40 focus:outline-none"
      />
      <div
        className="flex items-center gap-1 text-xs text-ink/50"
        aria-live="polite"
      >
        <Check size={12} />
        נשמר ב-{formatTime(lastSaved)}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-md border border-subtle">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            aria-label="בטל (Cmd+Z)"
            title="בטל (Cmd+Z)"
            className="flex items-center p-1.5 text-ink/70 transition hover:bg-paper disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <Undo2 size={16} />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!canRedo}
            aria-label="שחזר (Cmd+Shift+Z)"
            title="שחזר (Cmd+Shift+Z)"
            className="flex items-center border-r border-subtle p-1.5 text-ink/70 transition hover:bg-paper disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <Redo2 size={16} />
          </button>
        </div>
        <button
          type="button"
          onClick={handleOpenLibrary}
          className="flex items-center gap-1.5 rounded-md border border-subtle px-3 py-1.5 text-sm text-ink/80 transition hover:bg-paper"
        >
          <LayoutGrid size={16} />
          כל הדוחות
        </button>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          aria-label="הגדרות"
          title="הגדרות"
          className="flex items-center rounded-md border border-subtle p-1.5 text-ink/70 transition hover:bg-paper"
        >
          <Settings size={16} />
        </button>
        <button
          type="button"
          onClick={() => setThemeOpen(true)}
          aria-label="עיצוב הדוח"
          title="עיצוב הדוח"
          className="flex items-center gap-1.5 rounded-md border border-subtle px-3 py-1.5 text-sm text-ink/80 transition hover:bg-paper"
        >
          <Palette size={16} />
          עיצוב
        </button>
        <button
          type="button"
          onClick={() => setImportOpen(true)}
          className="flex items-center gap-1.5 rounded-md border border-subtle px-3 py-1.5 text-sm text-ink/80 transition hover:bg-paper"
        >
          <Upload size={16} />
          ייבוא
        </button>
        <button
          type="button"
          onClick={handleNew}
          className="flex items-center gap-1.5 rounded-md border border-subtle px-3 py-1.5 text-sm text-ink/80 transition hover:bg-paper"
        >
          <FilePlus2 size={16} />
          איפוס
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
            ייצוא
            <ChevronDown size={14} />
          </button>
          {exportOpen && (
            <div
              role="menu"
              className="absolute left-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-md border border-subtle bg-white text-sm shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                onClick={handleExportHTML}
                className="block w-full px-3 py-2 text-right text-ink/80 transition hover:bg-paper"
              >
                קובץ HTML עצמאי
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={handleExportPDF}
                className="block w-full border-t border-subtle px-3 py-2 text-right text-ink/80 transition hover:bg-paper"
              >
                הדפסה / PDF
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={handleExportDOCX}
                className="block w-full border-t border-subtle px-3 py-2 text-right text-ink/80 transition hover:bg-paper"
              >
                מסמך Word (.docx)
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={handleExportJSON}
                className="block w-full border-t border-subtle px-3 py-2 text-right text-ink/80 transition hover:bg-paper"
              >
                קובץ עריכה (JSON)
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
