import { useEffect } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { useSettingsStore } from '../store/settingsStore'

export default function SettingsPanel({ onClose }) {
  const {
    aiMode,
    claudeApiKey,
    claudeModel,
    ollamaUrl,
    ollamaModel,
    setAiMode,
    setClaudeApiKey,
    setClaudeModel,
    setOllamaUrl,
    setOllamaModel,
  } = useSettingsStore()

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="הגדרות"
        className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-subtle px-5 py-3">
          <h2 className="font-serif text-lg font-semibold">הגדרות</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="סגור"
            className="rounded p-1 text-ink/60 hover:bg-paper"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-5 p-5">
          <section>
            <h3 className="mb-2 text-sm font-medium text-ink/80">
              עוזר AI
            </h3>
            <div className="flex flex-col gap-2 text-sm">
              <label className="flex items-center gap-2 rounded border border-subtle p-2">
                <input
                  type="radio"
                  name="aiMode"
                  checked={aiMode === 'off'}
                  onChange={() => setAiMode('off')}
                />
                <div>
                  <div className="font-medium">כבוי</div>
                  <div className="text-xs text-ink/60">
                    ברירת מחדל — local-first, ללא רשת
                  </div>
                </div>
              </label>
              <label className="flex items-center gap-2 rounded border border-subtle p-2">
                <input
                  type="radio"
                  name="aiMode"
                  checked={aiMode === 'claude'}
                  onChange={() => setAiMode('claude')}
                />
                <div>
                  <div className="font-medium">Claude API</div>
                  <div className="text-xs text-ink/60">
                    איכות גבוהה. דורש API key. יישלח ל-anthropic.com.
                  </div>
                </div>
              </label>
              <label className="flex items-center gap-2 rounded border border-subtle p-2">
                <input
                  type="radio"
                  name="aiMode"
                  checked={aiMode === 'ollama'}
                  onChange={() => setAiMode('ollama')}
                />
                <div>
                  <div className="font-medium">Ollama (לוקלי)</div>
                  <div className="text-xs text-ink/60">
                    פרטיות מלאה. דורש Ollama רץ במכונה.
                  </div>
                </div>
              </label>
            </div>
          </section>

          {aiMode === 'claude' && (
            <section className="flex flex-col gap-3 rounded border border-subtle bg-paper p-3">
              <div className="flex items-start gap-2 rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>
                  המפתח נשמר ב-localStorage במחשב בלבד. לא להשתמש ב-API key של
                  production באפליקציית דפדפן. לשימוש אישי בלבד.
                </span>
              </div>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-medium text-ink/80">API Key</span>
                <input
                  type="password"
                  value={claudeApiKey}
                  onChange={(e) => setClaudeApiKey(e.target.value)}
                  placeholder="sk-ant-..."
                  dir="ltr"
                  className="rounded border border-subtle bg-white px-3 py-1.5 font-mono text-xs focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-medium text-ink/80">מודל</span>
                <select
                  value={claudeModel}
                  onChange={(e) => setClaudeModel(e.target.value)}
                  className="rounded border border-subtle bg-white px-3 py-1.5 text-sm"
                >
                  <option value="claude-haiku-4-5-20251001">
                    Haiku 4.5 (מהיר וזול)
                  </option>
                  <option value="claude-sonnet-4-6">Sonnet 4.6 (מאוזן)</option>
                  <option value="claude-opus-4-7">Opus 4.7 (הכי חזק)</option>
                </select>
              </label>
            </section>
          )}

          {aiMode === 'ollama' && (
            <section className="flex flex-col gap-3 rounded border border-subtle bg-paper p-3">
              {typeof window !== 'undefined' &&
                window.location.protocol === 'https:' && (
                  <div className="flex flex-col gap-1 rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
                    <span>
                      Ollama רץ על המחשב שלך. כדי לאפשר גישה מאתר HTTPS, הפעל
                      את Ollama עם משתנה הסביבה הבא:
                    </span>
                    <code
                      dir="ltr"
                      className="mt-1 rounded bg-white px-2 py-1 font-mono text-[11px]"
                    >
                      OLLAMA_ORIGINS={window.location.origin} ollama serve
                    </code>
                  </div>
                )}
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-medium text-ink/80">
                  Ollama URL
                </span>
                <input
                  type="text"
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  dir="ltr"
                  className="rounded border border-subtle bg-white px-3 py-1.5 font-mono text-xs focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-medium text-ink/80">
                  שם המודל
                </span>
                <input
                  type="text"
                  value={ollamaModel}
                  onChange={(e) => setOllamaModel(e.target.value)}
                  placeholder="llama3"
                  dir="ltr"
                  className="rounded border border-subtle bg-white px-3 py-1.5 font-mono text-xs focus:outline-none"
                />
              </label>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
