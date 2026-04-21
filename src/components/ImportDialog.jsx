import { useEffect, useRef, useState } from 'react'
import { X, FileUp, Clipboard } from 'lucide-react'
import { useReportStore } from '../store/reportStore'
import { parseReportJSON, readFileAsText } from '../lib/reportFile'
import { parseReportHTML } from '../lib/htmlImport'
import { useT } from '../i18n'

function detectFormat(text, filename = '') {
  const trimmed = text.trim()
  if (filename.toLowerCase().endsWith('.json')) return 'json'
  if (filename.toLowerCase().endsWith('.html')) return 'html'
  if (filename.toLowerCase().endsWith('.htm')) return 'html'
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json'
  if (trimmed.startsWith('<')) return 'html'
  return null
}

export default function ImportDialog({ onClose }) {
  const loadReport = useReportStore((s) => s.loadReport)
  const t = useT()
  const [mode, setMode] = useState('file')
  const [pasteValue, setPasteValue] = useState('')
  const [error, setError] = useState(null)
  const dialogRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const importText = (text, filename) => {
    const format = detectFormat(text, filename)
    try {
      if (format === 'json') {
        const report = parseReportJSON(text)
        loadReport(report)
      } else if (format === 'html') {
        const report = parseReportHTML(text)
        loadReport(report)
      } else {
        throw new Error(t.importDialog.errorUnknownFormat)
      }
      onClose()
    } catch (err) {
      setError(err.message || t.importDialog.errorImport)
    }
  }

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError(null)
    try {
      const text = await readFileAsText(file)
      importText(text, file.name)
    } catch (err) {
      setError(err.message || t.importDialog.errorFileRead)
    }
  }

  const handlePaste = () => {
    setError(null)
    if (!pasteValue.trim()) {
      setError(t.importDialog.errorEmpty)
      return
    }
    importText(pasteValue, '')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t.importDialog.title}
        className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-subtle px-5 py-3">
          <h2 className="font-serif text-lg font-semibold">{t.importDialog.title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="rounded p-1 text-ink/60 hover:bg-paper"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex border-b border-subtle text-sm">
          <button
            type="button"
            onClick={() => setMode('file')}
            className={`flex flex-1 items-center justify-center gap-2 py-2.5 transition ${
              mode === 'file'
                ? 'bg-paper font-medium text-ink'
                : 'text-ink/60 hover:bg-paper/50'
            }`}
          >
            <FileUp size={16} />
            {t.importDialog.modeFile}
          </button>
          <button
            type="button"
            onClick={() => setMode('paste')}
            className={`flex flex-1 items-center justify-center gap-2 py-2.5 transition ${
              mode === 'paste'
                ? 'bg-paper font-medium text-ink'
                : 'text-ink/60 hover:bg-paper/50'
            }`}
          >
            <Clipboard size={16} />
            {t.importDialog.modePaste}
          </button>
        </div>

        <div className="p-5">
          {mode === 'file' && (
            <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-subtle py-10 text-center">
              <FileUp size={28} className="text-ink/40" />
              <p className="text-sm text-ink/70">{t.importDialog.fileHint}</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-md bg-accent px-4 py-1.5 text-sm text-white hover:opacity-90"
              >
                {t.importDialog.chooseFile}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.html,.htm,application/json,text/html"
                onChange={handleFile}
                className="hidden"
              />
            </div>
          )}

          {mode === 'paste' && (
            <div className="flex flex-col gap-3">
              <label
                htmlFor="import-paste"
                className="text-sm font-medium text-ink/80"
              >
                {t.importDialog.pasteLabel}
              </label>
              <textarea
                id="import-paste"
                value={pasteValue}
                onChange={(e) => setPasteValue(e.target.value)}
                placeholder={t.importDialog.pastePlaceholder}
                rows={10}
                dir="ltr"
                className="w-full rounded-md border border-subtle bg-paper p-3 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handlePaste}
                  className="rounded-md bg-accent px-4 py-1.5 text-sm text-white hover:opacity-90"
                >
                  {t.importDialog.importBtn}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
