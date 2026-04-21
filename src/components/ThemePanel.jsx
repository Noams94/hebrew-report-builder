import { useEffect, useRef } from 'react'
import { X, Upload, Trash2 } from 'lucide-react'
import { useReportStore } from '../store/reportStore'
import { useT, useLang } from '../i18n'

export default function ThemePanel({ onClose }) {
  const theme = useReportStore((s) => s.theme)
  const setTheme = useReportStore((s) => s.setTheme)
  const t = useT()
  const lang = useLang()
  const logoInputRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleLogo = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setTheme({ logo: reader.result })
    }
    reader.readAsDataURL(file)
  }

  const ACCENT_PRESETS = t.theme.accentPresets
  const defaultHeadingFont = lang === 'en' ? 'Merriweather' : 'Frank Ruhl Libre'
  const defaultBodyFont = lang === 'en' ? 'Inter' : 'Heebo'

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
        aria-label={t.theme.title}
        className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-subtle px-5 py-3">
          <h2 className="font-serif text-lg font-semibold">{t.theme.title}</h2>
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
              {t.theme.accentColor}
            </h3>
            <div className="flex flex-wrap gap-2">
              {ACCENT_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setTheme({ accentColor: p.value })}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    (theme?.accentColor ?? '#1e3a5f') === p.value
                      ? 'border-ink'
                      : 'border-transparent'
                  }`}
                  style={{ background: p.value }}
                  aria-label={p.label}
                  title={p.label}
                />
              ))}
              <label className="flex items-center gap-1">
                <input
                  type="color"
                  value={theme?.accentColor ?? '#1e3a5f'}
                  onChange={(e) => setTheme({ accentColor: e.target.value })}
                  className="h-8 w-10 cursor-pointer rounded border border-subtle"
                />
              </label>
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-medium text-ink/80">
              {t.theme.headingFont}
            </h3>
            <select
              value={theme?.headingFont ?? defaultHeadingFont}
              onChange={(e) => setTheme({ headingFont: e.target.value })}
              className="w-full rounded border border-subtle bg-white px-3 py-2 text-sm"
            >
              {t.theme.headingFonts.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-medium text-ink/80">
              {t.theme.bodyFont}
            </h3>
            <select
              value={theme?.bodyFont ?? defaultBodyFont}
              onChange={(e) => setTheme({ bodyFont: e.target.value })}
              className="w-full rounded border border-subtle bg-white px-3 py-2 text-sm"
            >
              {t.theme.bodyFonts.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-medium text-ink/80">{t.theme.logo}</h3>
            <div className="flex items-center gap-3">
              {theme?.logo ? (
                <img
                  src={theme.logo}
                  alt={t.common.logo}
                  className="h-14 w-auto rounded border border-subtle bg-white p-1"
                />
              ) : (
                <div className="flex h-14 w-20 items-center justify-center rounded border border-dashed border-subtle text-xs text-ink/40">
                  {t.theme.noLogo}
                </div>
              )}
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded border border-subtle bg-white px-3 py-1.5 text-sm hover:bg-paper"
              >
                <Upload size={14} />
                {theme?.logo ? t.theme.replaceLogo : t.theme.uploadLogo}
              </button>
              {theme?.logo && (
                <button
                  type="button"
                  onClick={() => setTheme({ logo: null })}
                  className="flex items-center gap-1.5 rounded border border-subtle bg-white px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                  {t.theme.removeLogo}
                </button>
              )}
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogo}
              className="hidden"
            />
          </section>
        </div>
      </div>
    </div>
  )
}
