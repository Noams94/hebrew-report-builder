import { useMemo } from 'react'
import { useReportStore } from '../store/reportStore'
import { parseMarkdown } from '../lib/markdown'
import { slugify } from '../lib/slugify'
import ChartRenderer from './ChartRenderer'
import { LikertChart } from './blocks/LikertBlock'
import { StatsGrid } from './blocks/StatsBlock'
import { CoverPreview } from './blocks/CoverBlock'
import { computeStats } from '../lib/stats'
import MapPreview from './MapPreview'

function PreviewBlock({ block, headingIdsById, theme = {}, reportTitle = '' }) {
  const { type, data } = block

  if (type === 'heading') {
    const { level = 2, text = '' } = data
    const Tag = `h${level}`
    const id = headingIdsById[block.id]
    const sizeClass =
      level === 1
        ? 'text-4xl mt-10 mb-4'
        : level === 2
          ? 'text-3xl mt-8 mb-3'
          : 'text-2xl mt-6 mb-2'
    return (
      <Tag
        id={id}
        className={`font-bold text-ink ${sizeClass}`}
        style={{
          fontFamily: `'${theme.headingFont || 'Frank Ruhl Libre'}', serif`,
        }}
      >
        {text || <span className="text-ink/30">כותרת ריקה</span>}
      </Tag>
    )
  }

  if (type === 'text') {
    const html = parseMarkdown(data.markdown ?? '')
    if (!html) {
      return <p className="my-3 text-ink/30">פסקה ריקה</p>
    }
    return (
      <div
        className="report-prose my-3"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  }

  if (type === 'image') {
    const { src, caption, alt } = data
    if (!src) {
      return <div className="my-4 text-sm text-ink/40">[תמונה לא הוטענה]</div>
    }
    return (
      <figure className="my-5">
        <img
          src={src}
          alt={alt || caption || 'תמונה בדוח'}
          className="mx-auto max-h-[480px] w-auto rounded"
        />
        {caption && (
          <figcaption className="mt-2 text-center text-sm italic text-ink/60">
            {caption}
          </figcaption>
        )}
      </figure>
    )
  }

  if (type === 'chart') {
    const { source, sheet, xColumn, yColumns, chartType, title, importedSvg } = data
    if (chartType === 'imported' && importedSvg) {
      return (
        <div className="my-5">
          {title && (
            <div className="mb-2 text-center font-serif text-lg font-semibold">
              {title}
            </div>
          )}
          <div
            className="text-center"
            dangerouslySetInnerHTML={{ __html: importedSvg }}
          />
        </div>
      )
    }
    if (!source || !sheet || !xColumn || !yColumns?.length) {
      return (
        <div className="my-4 rounded border border-dashed border-subtle p-4 text-sm text-ink/40">
          [הגדר את הגרף בעורך]
        </div>
      )
    }
    const headers = source.data[sheet]?.headers ?? []
    const rows = source.data[sheet]?.rows ?? []
    const chartData = rows.map((row) => {
      const obj = {}
      headers.forEach((h, i) => {
        const raw = row[i]
        const num = Number(raw)
        obj[h] = Number.isFinite(num) && raw !== '' ? num : raw
      })
      return obj
    })
    return (
      <div className="my-5" data-chart-id={block.id}>
        <ChartRenderer
          chartType={chartType}
          data={chartData}
          xKey={xColumn}
          yKeys={yColumns}
          title={title}
        />
      </div>
    )
  }

  if (type === 'table') {
    const { headers = [], rows = [] } = data
    if (headers.length === 0) {
      return <div className="my-4 text-sm text-ink/40">[טבלה ריקה]</div>
    }
    return (
      <div className="my-5 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-ink/80 bg-paper/60">
              {headers.map((h, i) => (
                <th key={i} className="p-3 text-right font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r} className="border-b border-subtle">
                {row.map((cell, c) => (
                  <td key={c} className="p-3">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (type === 'divider') {
    return <hr className="my-8 border-t border-subtle" />
  }

  if (type === 'likert') {
    const { scale = 5, questions = [], title } = data
    const labels5 = ['לא מסכים בכלל', 'לא מסכים', 'ניטרלי', 'מסכים', 'מסכים בהחלט']
    const labels7 = [
      'לא מסכים בכלל',
      'לא מסכים',
      'די לא מסכים',
      'ניטרלי',
      'די מסכים',
      'מסכים',
      'מסכים בהחלט',
    ]
    const colors5 = ['#b91c1c', '#f87171', '#9ca3af', '#4ade80', '#15803d']
    const colors7 = [
      '#7f1d1d',
      '#b91c1c',
      '#f87171',
      '#9ca3af',
      '#4ade80',
      '#15803d',
      '#14532d',
    ]
    const labels = scale === 7 ? labels7 : labels5
    const colors = scale === 7 ? colors7 : colors5
    const hasData = questions.some((q) => q.responses?.some((r) => r > 0))
    if (!hasData) {
      return (
        <div className="my-4 rounded border border-dashed border-subtle p-4 text-sm text-ink/40">
          [בלוק Likert — מלא נתונים בעורך]
        </div>
      )
    }
    const chartData = questions.map((q, i) => {
      const row = { question: q.text || `שאלה ${i + 1}` }
      labels.forEach((label, j) => {
        row[label] = q.responses[j] ?? 0
      })
      return row
    })
    return (
      <div className="my-5" data-chart-id={block.id}>
        <LikertChart
          title={title}
          data={chartData}
          labels={labels}
          colors={colors}
        />
      </div>
    )
  }

  if (type === 'stats') {
    const {
      source,
      sheet,
      column,
      metrics = ['n', 'mean', 'median', 'std', 'min', 'max'],
      title,
    } = data
    if (!source || !sheet || !column) {
      return (
        <div className="my-4 rounded border border-dashed border-subtle p-4 text-sm text-ink/40">
          [בלוק סטטיסטיקה — הגדר מקור בעורך]
        </div>
      )
    }
    const sheetData = source.data[sheet]
    if (!sheetData) return null
    const colIndex = sheetData.headers.indexOf(column)
    if (colIndex === -1) return null
    const values = sheetData.rows.map((r) => r[colIndex])
    const stats = computeStats(values, metrics)
    return <StatsGrid title={title} stats={stats} metrics={metrics} />
  }

  if (type === 'cover') {
    const {
      useReportTitle = true,
      overrideTitle = '',
      subtitle,
      client,
      date,
      logo,
      useThemeLogo = true,
    } = data
    const displayTitle = useReportTitle ? reportTitle : overrideTitle
    const displayLogo = useThemeLogo ? theme.logo : logo
    return (
      <CoverPreview
        title={displayTitle}
        subtitle={subtitle}
        client={client}
        date={date}
        logo={displayLogo}
        theme={theme}
      />
    )
  }

  if (type === 'map') {
    return <MapPreview data={data} />
  }

  return null
}

export default function Preview() {
  const title = useReportStore((s) => s.title)
  const blocks = useReportStore((s) => s.blocks)
  const theme = useReportStore((s) => s.theme) || {}

  const headingIdsById = useMemo(() => {
    const map = {}
    const seen = new Map()
    blocks.forEach((b) => {
      if (b.type !== 'heading') return
      const base = slugify(b.data.text, `section-${Object.keys(map).length + 1}`)
      const count = seen.get(base) ?? 0
      seen.set(base, count + 1)
      map[b.id] = count === 0 ? base : `${base}-${count + 1}`
    })
    return map
  }, [blocks])

  const headings = useMemo(
    () =>
      blocks
        .filter((b) => b.type === 'heading')
        .map((b) => ({
          id: headingIdsById[b.id],
          text: b.data.text || 'כותרת ריקה',
          level: b.data.level ?? 2,
        })),
    [blocks, headingIdsById],
  )

  const showTOC = headings.length >= 3

  return (
    <section
      aria-label="תצוגה מקדימה"
      className="flex h-full w-1/2 flex-col overflow-y-auto bg-paper/60"
    >
      <div className="mx-auto flex w-full max-w-5xl gap-6 p-8">
        <article
          className="flex-1 rounded-lg bg-white p-12 shadow-sm"
          style={{
            fontFamily: `'${theme.bodyFont || 'Heebo'}', system-ui, sans-serif`,
            color: '#1a1a1a',
          }}
        >
          {theme.logo && (
            <img
              src={theme.logo}
              alt="לוגו"
              className="mb-6 h-16 w-auto"
              style={{ objectFit: 'contain' }}
            />
          )}
          <h1
            className="mb-8 border-b pb-6 text-4xl font-bold"
            style={{
              fontFamily: `'${theme.headingFont || 'Frank Ruhl Libre'}', serif`,
              borderColor: theme.accentColor || '#e7e5e0',
            }}
          >
            {title || 'דוח ללא שם'}
          </h1>
          {blocks.length === 0 ? (
            <p className="text-ink/40">הדוח ריק. הוסף בלוקים בעורך.</p>
          ) : (
            blocks.map((block) => (
              <PreviewBlock
                key={block.id}
                block={block}
                headingIdsById={headingIdsById}
                theme={theme}
                reportTitle={title}
              />
            ))
          )}
        </article>

        {showTOC && (
          <nav
            aria-label="תוכן עניינים"
            className="sticky top-4 hidden h-fit w-48 shrink-0 rounded-lg border border-subtle bg-white p-4 text-sm xl:block"
          >
            <h2 className="mb-2 font-serif font-semibold text-ink">תוכן עניינים</h2>
            <ul className="flex flex-col gap-1">
              {headings.map((h) => (
                <li key={h.id} style={{ paddingInlineStart: (h.level - 1) * 10 }}>
                  <a
                    href={`#${h.id}`}
                    onClick={(e) => {
                      e.preventDefault()
                      document
                        .getElementById(h.id)
                        ?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className="text-ink/70 hover:text-accent hover:underline"
                  >
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </section>
  )
}
