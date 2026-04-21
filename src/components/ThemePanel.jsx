import { useEffect, useRef } from 'react'
import { X, Upload, Trash2 } from 'lucide-react'
import { useReportStore } from '../store/reportStore'

const ACCENT_PRESETS = [
  { value: '#1e3a5f', label: 'כחול כהה' },
  { value: '#7c2d12', label: 'חום' },
  { value: '#556b2f', label: 'ירוק זית' },
  { value: '#b45309', label: 'כתום חם' },
  { value: '#4c1d95', label: 'סגול עמוק' },
  { value: '#0f766e', label: 'טורקיז' },
  { value: '#be185d', label: 'ורוד' },
  { value: '#111827', label: 'שחור' },
]

const FONT_OPTIONS = {
  heading: [
    { value: 'Frank Ruhl Libre', label: 'Frank Ruhl Libre (ספרותי)' },
    { value: 'Heebo', label: 'Heebo (מודרני)' },
    { value: 'Rubik', label: 'Rubik' },
    { value: 'Assistant', label: 'Assistant' },
    { value: 'Arial', label: 'Arial (מערכת)' },
  ],
  body: [
    { value: 'Heebo', label: 'Heebo' },
    { value: 'Rubik', label: 'Rubik' },
    { value: 'Assistant', label: 'Assistant' },
    { value: 'Arial', label: 'Arial' },
    { value: 'Frank Ruhl Libre', label: 'Frank Ruhl Libre' },
  ],
}

export default function ThemePanel({ onClose }) {
  const theme = useReportStore((s) => s.theme)
  const setTheme = useReportStore((s) => s.setTheme)
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
        aria-label="עיצוב הדוח"
        className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-subtle px-5 py-3">
          <h2 className="font-serif text-lg font-semibold">עיצוב הדוח</h2>
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
            <h3 className="mb-2 text-sm font-medium text-ink/80">צבע ראשי</h3>
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
            <h3 className="mb-2 text-sm font-medium text-ink/80">גופן כותרות</h3>
            <select
              value={theme?.headingFont ?? 'Frank Ruhl Libre'}
              onChange={(e) => setTheme({ headingFont: e.target.value })}
              className="w-full rounded border border-subtle bg-white px-3 py-2 text-sm"
            >
              {FONT_OPTIONS.heading.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-medium text-ink/80">גופן גוף</h3>
            <select
              value={theme?.bodyFont ?? 'Heebo'}
              onChange={(e) => setTheme({ bodyFont: e.target.value })}
              className="w-full rounded border border-subtle bg-white px-3 py-2 text-sm"
            >
              {FONT_OPTIONS.body.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-medium text-ink/80">לוגו</h3>
            <div className="flex items-center gap-3">
              {theme?.logo ? (
                <img
                  src={theme.logo}
                  alt="לוגו"
                  className="h-14 w-auto rounded border border-subtle bg-white p-1"
                />
              ) : (
                <div className="flex h-14 w-20 items-center justify-center rounded border border-dashed border-subtle text-xs text-ink/40">
                  אין לוגו
                </div>
              )}
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded border border-subtle bg-white px-3 py-1.5 text-sm hover:bg-paper"
              >
                <Upload size={14} />
                {theme?.logo ? 'החלף' : 'העלה לוגו'}
              </button>
              {theme?.logo && (
                <button
                  type="button"
                  onClick={() => setTheme({ logo: null })}
                  className="flex items-center gap-1.5 rounded border border-subtle bg-white px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                  הסר
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

