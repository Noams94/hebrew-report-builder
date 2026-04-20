import { useEffect, useState } from 'react'
import { FilePlus2, Download, Check } from 'lucide-react'
import { useReportStore } from '../store/reportStore'
import { downloadReport } from '../lib/export'

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
  const resetReport = useReportStore((s) => s.resetReport)
  const [lastSaved, setLastSaved] = useState(() => new Date())

  useEffect(() => {
    setLastSaved(new Date())
  }, [title, blocks])

  const handleExport = () => {
    downloadReport(title, blocks)
  }

  const handleNew = () => {
    if (window.confirm('לאתחל את הדוח? כל התוכן הנוכחי יימחק.')) {
      resetReport()
    }
  }

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        handleExport()
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        handleNew()
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
        <button
          type="button"
          onClick={handleNew}
          className="flex items-center gap-1.5 rounded-md border border-subtle px-3 py-1.5 text-sm text-ink/80 transition hover:bg-paper"
        >
          <FilePlus2 size={16} />
          דוח חדש
        </button>
        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm text-white transition hover:opacity-90"
        >
          <Download size={16} />
          ייצוא
        </button>
      </div>
    </header>
  )
}
