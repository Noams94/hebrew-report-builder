import { useRef } from 'react'
import { Upload, Trash2 } from 'lucide-react'
import { useReportStore } from '../../store/reportStore'
import { useT, useLang } from '../../i18n'

const EXTRA = {
  he: {
    heading: 'עמוד שער',
    useTitle: 'השתמש בכותרת הדוח',
    useLogo: 'השתמש בלוגו מהעיצוב',
    title: 'כותרת',
    subtitle: 'כותרת משנה',
    subtitlePh: 'לדוגמה: דוח רבעוני Q2 2026',
    client: 'לקוח / נמען',
    clientPh: 'שם הלקוח',
    date: 'תאריך',
    datePh: 'אפריל 2026',
    noLogo: 'אין לוגו',
    upload: 'העלה',
    fallbackTitle: 'כותרת הדוח',
  },
  en: {
    heading: 'Cover page',
    useTitle: 'Use report title',
    useLogo: 'Use theme logo',
    title: 'Title',
    subtitle: 'Subtitle',
    subtitlePh: 'e.g. Quarterly report, Q2 2026',
    client: 'Client / recipient',
    clientPh: 'Client name',
    date: 'Date',
    datePh: 'April 2026',
    noLogo: 'No logo',
    upload: 'Upload',
    fallbackTitle: 'Report title',
  },
}

function defaultHeadingFont(lang) {
  return lang === 'en' ? 'Merriweather' : 'Frank Ruhl Libre'
}
function defaultBodyFont(lang) {
  return lang === 'en' ? 'Inter' : 'Heebo'
}

export default function CoverBlock({ block }) {
  const updateBlock = useReportStore((s) => s.updateBlock)
  const theme = useReportStore((s) => s.theme) || {}
  const t = useT()
  const lang = useLang()
  const L = EXTRA[lang] || EXTRA.he
  const logoInputRef = useRef(null)
  const {
    subtitle = '',
    client = '',
    date = '',
    useReportTitle = true,
    overrideTitle = '',
    logo = null,
    useThemeLogo = true,
  } = block.data

  const title = useReportStore((s) => s.title)
  const displayTitle = useReportTitle ? title : overrideTitle
  const displayLogo = useThemeLogo ? theme.logo : logo

  const handleLogo = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      updateBlock(block.id, { logo: reader.result, useThemeLogo: false })
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-subtle bg-white p-3 text-xs">
        <span className="font-medium">{L.heading}</span>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={useReportTitle}
            onChange={(e) =>
              updateBlock(block.id, { useReportTitle: e.target.checked })
            }
          />
          {L.useTitle}
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={useThemeLogo}
            onChange={(e) =>
              updateBlock(block.id, { useThemeLogo: e.target.checked })
            }
          />
          {L.useLogo}
        </label>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-subtle bg-white p-3 text-sm">
        {!useReportTitle && (
          <label className="flex flex-col gap-1">
            <span className="text-xs text-ink/60">{L.title}</span>
            <input
              type="text"
              value={overrideTitle}
              onChange={(e) =>
                updateBlock(block.id, { overrideTitle: e.target.value })
              }
              className="rounded border border-subtle px-2 py-1 focus:outline-none"
            />
          </label>
        )}
        <label className="flex flex-col gap-1">
          <span className="text-xs text-ink/60">{L.subtitle}</span>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => updateBlock(block.id, { subtitle: e.target.value })}
            placeholder={L.subtitlePh}
            className="rounded border border-subtle px-2 py-1 focus:outline-none"
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-ink/60">{L.client}</span>
            <input
              type="text"
              value={client}
              onChange={(e) => updateBlock(block.id, { client: e.target.value })}
              placeholder={L.clientPh}
              className="rounded border border-subtle px-2 py-1 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-ink/60">{L.date}</span>
            <input
              type="text"
              value={date}
              onChange={(e) => updateBlock(block.id, { date: e.target.value })}
              placeholder={L.datePh}
              className="rounded border border-subtle px-2 py-1 focus:outline-none"
            />
          </label>
        </div>
        {!useThemeLogo && (
          <div className="flex items-center gap-2">
            {logo ? (
              <img
                src={logo}
                alt={t.common.logo}
                className="h-10 w-auto rounded border border-subtle bg-white p-1"
              />
            ) : (
              <div className="flex h-10 w-16 items-center justify-center rounded border border-dashed border-subtle text-xs text-ink/40">
                {L.noLogo}
              </div>
            )}
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="flex items-center gap-1 rounded border border-subtle px-2 py-1 text-xs hover:bg-paper"
            >
              <Upload size={12} /> {L.upload}
            </button>
            {logo && (
              <button
                type="button"
                onClick={() => updateBlock(block.id, { logo: null })}
                className="rounded border border-subtle p-1 text-red-600 hover:bg-red-50"
              >
                <Trash2 size={12} />
              </button>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogo}
              className="hidden"
            />
          </div>
        )}
      </div>

      <CoverPreview
        title={displayTitle}
        subtitle={subtitle}
        client={client}
        date={date}
        logo={displayLogo}
        theme={theme}
        lang={lang}
      />
    </div>
  )
}

export function CoverPreview({ title, subtitle, client, date, logo, theme = {}, lang = 'he' }) {
  const L = EXTRA[lang] || EXTRA.he
  return (
    <div
      className="my-4 flex min-h-[360px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-subtle p-10 text-center"
      style={{
        borderColor: theme.accentColor || '#e7e5e0',
      }}
    >
      {logo && (
        <img src={logo} alt={L.noLogo} className="mb-6 h-20 w-auto object-contain" />
      )}
      <h1
        className="text-4xl font-bold"
        style={{
          fontFamily: `'${theme.headingFont || defaultHeadingFont(lang)}', serif`,
          color: theme.accentColor || '#1a1a1a',
        }}
      >
        {title || L.fallbackTitle}
      </h1>
      {subtitle && (
        <div
          className="mt-3 text-lg text-ink/70"
          style={{
            fontFamily: `'${theme.bodyFont || defaultBodyFont(lang)}', sans-serif`,
          }}
        >
          {subtitle}
        </div>
      )}
      <div className="mt-8 flex flex-col items-center gap-1 text-sm text-ink/60">
        {client && <div>{client}</div>}
        {date && <div>{date}</div>}
      </div>
    </div>
  )
}
