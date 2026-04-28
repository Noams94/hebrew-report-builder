import { useEffect } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { useSettingsStore } from '../store/settingsStore'
import { useReportStore } from '../store/reportStore'
import { useT, useLang } from '../i18n'

export default function SettingsPanel({ onClose }) {
  const t = useT()
  const currentLang = useLang()
  const setLang = useReportStore((s) => s.setLang)
  const defaultLang = useReportStore((s) => s.defaultLang || 'he')
  const setDefaultLang = useReportStore((s) => s.setDefaultLang)
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
        aria-label={t.settings.title}
        className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-subtle px-5 py-3">
          <h2 className="font-serif text-lg font-semibold">{t.settings.title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="rounded p-1 text-ink/60 hover:bg-paper"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-5 p-5">
          <section>
            <h3 className="mb-2 text-sm font-medium text-ink/80">
              {t.settings.language}
            </h3>
            <p className="mb-2 text-xs text-ink/60">{t.settings.languageDesc}</p>
            <div className="flex flex-col gap-2 text-sm">
              <label className="flex items-center gap-2 rounded border border-subtle p-2">
                <input
                  type="radio"
                  name="reportLang"
                  checked={currentLang === 'he'}
                  onChange={() => setLang('he')}
                />
                <span>{t.settings.languageHe}</span>
              </label>
              <label className="flex items-center gap-2 rounded border border-subtle p-2">
                <input
                  type="radio"
                  name="reportLang"
                  checked={currentLang === 'en'}
                  onChange={() => setLang('en')}
                />
                <span>{t.settings.languageEn}</span>
              </label>
            </div>
            <label className="mt-3 flex items-center gap-2 text-xs text-ink/70">
              <input
                type="checkbox"
                checked={defaultLang === currentLang}
                onChange={(e) =>
                  setDefaultLang(e.target.checked ? currentLang : defaultLang === 'he' ? 'en' : 'he')
                }
              />
              <span>{t.settings.languageDefault}</span>
            </label>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-medium text-ink/80">
              {t.settings.aiSection}
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
                  <div className="font-medium">{t.settings.aiModeOff}</div>
                  <div className="text-xs text-ink/60">
                    {t.settings.aiModeOffDesc}
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
                  <div className="font-medium">{t.settings.aiModeClaude}</div>
                  <div className="text-xs text-ink/60">
                    {t.settings.aiModeClaudeDesc}
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
                  <div className="font-medium">{t.settings.aiModeOllama}</div>
                  <div className="text-xs text-ink/60">
                    {t.settings.aiModeOllamaDesc}
                  </div>
                </div>
              </label>
            </div>
          </section>

          {aiMode === 'claude' && (
            <section className="flex flex-col gap-3 rounded border border-subtle bg-paper p-3">
              <div className="flex items-start gap-2 rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>{t.settings.claudeWarning}</span>
              </div>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-medium text-ink/80">
                  {t.settings.apiKey}
                </span>
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
                <span className="text-xs font-medium text-ink/80">
                  {t.settings.model}
                </span>
                <select
                  value={claudeModel}
                  onChange={(e) => setClaudeModel(e.target.value)}
                  className="rounded border border-subtle bg-white px-3 py-1.5 text-sm"
                >
                  <option value="claude-haiku-4-5-20251001">
                    {t.settings.haiku}
                  </option>
                  <option value="claude-sonnet-4-6">{t.settings.sonnet}</option>
                  <option value="claude-opus-4-7">{t.settings.opus}</option>
                </select>
              </label>
            </section>
          )}

          {aiMode === 'ollama' && (
            <section className="flex flex-col gap-3 rounded border border-subtle bg-paper p-3">
              {typeof window !== 'undefined' &&
                window.location.protocol === 'https:' && (
                  <div className="flex flex-col gap-2 rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
                    <span>{t.settings.ollamaHttpsTitle()}</span>
                    <div className="flex flex-col gap-1">
                      <span>{t.settings.ollamaHttpsAppStep}</span>
                      <code
                        dir="ltr"
                        className="rounded bg-white px-2 py-1 font-mono text-[11px] break-all"
                      >
                        launchctl setenv OLLAMA_ORIGINS "{window.location.origin}"
                      </code>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span>{t.settings.ollamaHttpsTerminalStep}</span>
                      <code
                        dir="ltr"
                        className="rounded bg-white px-2 py-1 font-mono text-[11px] break-all"
                      >
                        OLLAMA_ORIGINS="{window.location.origin}" ollama serve
                      </code>
                    </div>
                    <span className="text-[11px] opacity-80">{t.settings.ollamaHttpsMultipleNote}</span>
                  </div>
                )}
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-medium text-ink/80">
                  {t.settings.ollamaUrl}
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
                  {t.settings.ollamaModelName}
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
