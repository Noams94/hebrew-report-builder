import { useRef } from 'react'
import { Upload, TrendingUp } from 'lucide-react'
import { useReportStore } from '../../store/reportStore'
import { parseExcel } from '../../lib/excel'
import {
  NPS_RATINGS,
  NPS_COLORS,
  computeNps,
  emptyNpsCounts,
  importNpsFromRows,
  npsScoreColor,
} from '../../lib/nps'
import { useLang, useT, isRtl } from '../../i18n'

export default function NpsBlock({ block }) {
  const updateBlock = useReportStore((s) => s.updateBlock)
  const lang = useLang()
  const t = useT()
  const L = t.blocks.nps
  const fileInputRef = useRef(null)
  const counts = block.data.counts ?? emptyNpsCounts()
  const title = block.data.title ?? ''
  const result = computeNps(counts)
  const cellAlign = isRtl(lang) ? 'text-right' : 'text-left'

  const updateCount = (i, value) => {
    const next = counts.slice()
    const n = Number(value) || 0
    next[i] = Math.max(0, Math.floor(n))
    updateBlock(block.id, { counts: next })
  }

  const reset = () => updateBlock(block.id, { counts: emptyNpsCounts() })

  const handleExcelImport = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const result = await parseExcel(file)
    const firstSheet = result.data[result.sheets[0]]
    if (!firstSheet) return
    const next = importNpsFromRows(firstSheet.rows)
    updateBlock(block.id, { counts: next })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-subtle bg-white p-3 text-xs">
        <TrendingUp size={14} className="text-ink/50" aria-hidden="true" />
        <span className="font-medium">{L.title}</span>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 rounded border border-subtle px-2 py-1 hover:bg-paper"
        >
          <Upload size={12} aria-hidden="true" />
          {L.importExcel}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleExcelImport}
          className="hidden"
        />
        <button
          type="button"
          onClick={reset}
          className="rounded border border-subtle bg-white px-2 py-1 text-ink/70 hover:bg-paper"
        >
          {L.reset}
        </button>
        <span className="text-ink/50">{L.importHint}</span>
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => updateBlock(block.id, { title: e.target.value })}
        placeholder={L.titlePh}
        className="rounded border border-subtle bg-white px-3 py-1.5 text-sm focus:outline-none"
      />

      <div className="overflow-x-auto rounded-lg border border-subtle bg-white">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-subtle bg-paper/60">
              <th className={`p-2 ${cellAlign} font-medium`}>{L.rating}</th>
              {NPS_RATINGS.map((r) => (
                <th key={r} className="p-2 text-center font-medium">
                  {r}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={`p-2 ${cellAlign} text-ink/60`}>{L.responses}</td>
              {NPS_RATINGS.map((r, i) => (
                <td key={r} className="p-1">
                  <input
                    type="number"
                    min={0}
                    value={counts[i] ?? 0}
                    onChange={(e) => updateCount(i, e.target.value)}
                    className="w-12 rounded bg-transparent px-1 py-1 text-center focus:bg-paper focus:outline-none"
                    aria-label={`${L.responses} ${r}`}
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {result.n > 0 && <NpsView title={title} result={result} L={L} />}
    </div>
  )
}

export function NpsView({ title, result, L }) {
  const { n, score, detractorCount, passiveCount, promoterCount } = result
  const scoreColor = npsScoreColor(score)
  return (
    <div className="my-2 rounded-lg border border-subtle bg-white p-4">
      {title && (
        <h4 className="mb-3 text-center font-serif text-lg font-semibold text-ink">
          {title}
        </h4>
      )}
      <div className="flex flex-col items-center gap-2">
        <div className="text-xs uppercase tracking-wide text-ink/50">
          {L.scoreLabel}
        </div>
        <div
          dir="ltr"
          className="font-serif text-6xl font-bold leading-none"
          style={{ color: scoreColor }}
        >
          {score >= 0 ? `+${score}` : score}
        </div>
        <div className="text-xs text-ink/50">
          {L.basedOn} <strong>{n}</strong> {L.responsesLower}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Segment
          label={L.detractors}
          range="0-6"
          count={detractorCount}
          total={n}
          color={NPS_COLORS.detractors}
        />
        <Segment
          label={L.passives}
          range="7-8"
          count={passiveCount}
          total={n}
          color={NPS_COLORS.passives}
        />
        <Segment
          label={L.promoters}
          range="9-10"
          count={promoterCount}
          total={n}
          color={NPS_COLORS.promoters}
        />
      </div>

      <NpsStackedBar result={result} />
    </div>
  )
}

function Segment({ label, range, count, total, color }) {
  const pct = total === 0 ? 0 : (count / total) * 100
  return (
    <div className="flex flex-col items-center rounded-md p-3 text-center" style={{ backgroundColor: `${color}14` }}>
      <span className="text-xs font-semibold" style={{ color }}>
        {label}
      </span>
      <span className="text-[10px] text-ink/40">{range}</span>
      <span className="mt-1 font-serif text-2xl font-bold text-ink">
        {pct.toFixed(0)}%
      </span>
      <span className="text-[11px] text-ink/50">{count}</span>
    </div>
  )
}

function NpsStackedBar({ result }) {
  const { detractorPct, passivePct, promoterPct, n } = result
  if (n === 0) return null
  return (
    <div className="mt-4">
      <div
        className="flex h-3 w-full overflow-hidden rounded-full"
        role="img"
        aria-label={`Detractors ${detractorPct.toFixed(0)}%, Passives ${passivePct.toFixed(0)}%, Promoters ${promoterPct.toFixed(0)}%`}
      >
        {detractorPct > 0 && (
          <div style={{ width: `${detractorPct}%`, backgroundColor: NPS_COLORS.detractors }} />
        )}
        {passivePct > 0 && (
          <div style={{ width: `${passivePct}%`, backgroundColor: NPS_COLORS.passives }} />
        )}
        {promoterPct > 0 && (
          <div style={{ width: `${promoterPct}%`, backgroundColor: NPS_COLORS.promoters }} />
        )}
      </div>
    </div>
  )
}
