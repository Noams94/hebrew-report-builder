import { useRef } from 'react'
import { BarChart3, LineChart, AreaChart, PieChart, Upload } from 'lucide-react'
import { useReportStore } from '../../store/reportStore'
import { parseExcel } from '../../lib/excel'
import ChartRenderer from '../ChartRenderer'
import { useLang } from '../../i18n'

const EXTRA = {
  he: {
    titlePh: 'כותרת לגרף',
    types: [
      { value: 'bar', label: 'עמודות', Icon: BarChart3 },
      { value: 'line', label: 'קווי', Icon: LineChart },
      { value: 'area', label: 'שטח', Icon: AreaChart },
      { value: 'pie', label: 'עוגה', Icon: PieChart },
    ],
    uploadExcel: 'העלה קובץ Excel',
    imported: 'גרף מיובא (SVG)',
    replaceSvg: 'החלף בגרף חדש',
    sheet: 'גיליון:',
    xAxis: 'ציר X:',
    yAxis: 'ציר Y:',
    choose: 'בחר...',
    replace: 'החלף קובץ',
  },
  en: {
    titlePh: 'Chart title',
    types: [
      { value: 'bar', label: 'Bar', Icon: BarChart3 },
      { value: 'line', label: 'Line', Icon: LineChart },
      { value: 'area', label: 'Area', Icon: AreaChart },
      { value: 'pie', label: 'Pie', Icon: PieChart },
    ],
    uploadExcel: 'Upload Excel file',
    imported: 'Imported chart (SVG)',
    replaceSvg: 'Replace with a new chart',
    sheet: 'Sheet:',
    xAxis: 'X axis:',
    yAxis: 'Y axis:',
    choose: 'Select…',
    replace: 'Replace file',
  },
}

export default function ChartBlock({ block }) {
  const updateBlock = useReportStore((s) => s.updateBlock)
  const lang = useLang()
  const L = EXTRA[lang] || EXTRA.he
  const fileInputRef = useRef(null)
  const { source, sheet, xColumn, yColumns = [], chartType = 'bar', title = '' } = block.data

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const result = await parseExcel(file)
    const firstSheet = result.sheets[0]
    updateBlock(block.id, {
      source: result,
      sheet: firstSheet,
      xColumn: null,
      yColumns: [],
    })
  }

  if (chartType === 'imported' && block.data.importedSvg) {
    return (
      <div className="flex flex-col gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => updateBlock(block.id, { title: e.target.value })}
          placeholder={L.titlePh}
          className="rounded border border-subtle bg-white px-3 py-1.5 text-sm focus:outline-none"
        />
        <div
          className="rounded-lg border border-subtle bg-white p-3 text-center"
          dangerouslySetInnerHTML={{ __html: block.data.importedSvg }}
        />
        <div className="flex items-center justify-between gap-2 text-xs text-ink/60">
          <span>{L.imported}</span>
          <button
            type="button"
            onClick={() =>
              updateBlock(block.id, {
                chartType: 'bar',
                importedSvg: null,
                source: null,
              })
            }
            className="rounded border border-subtle bg-white px-2 py-1 hover:bg-paper"
          >
            {L.replaceSvg}
          </button>
        </div>
      </div>
    )
  }

  if (!source) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-subtle py-8 text-center">
        <BarChart3 size={32} strokeWidth={1.5} className="text-ink/40" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 rounded-md border border-subtle bg-white px-4 py-2 text-sm text-ink/80 hover:bg-paper"
        >
          <Upload size={14} />
          {L.uploadExcel}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleUpload}
          className="hidden"
        />
      </div>
    )
  }

  const sheetData = source.data[sheet]
  const headers = sheetData?.headers ?? []
  const data = (sheetData?.rows ?? []).map((row) => {
    const obj = {}
    headers.forEach((h, i) => {
      const raw = row[i]
      const num = Number(raw)
      obj[h] = Number.isFinite(num) && raw !== '' ? num : raw
    })
    return obj
  })

  const toggleYColumn = (col) => {
    const next = yColumns.includes(col)
      ? yColumns.filter((c) => c !== col)
      : [...yColumns, col]
    updateBlock(block.id, { yColumns: next })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-subtle bg-white p-3 text-xs">
        {source.sheets.length > 1 && (
          <label className="flex items-center gap-1">
            {L.sheet}
            <select
              value={sheet ?? ''}
              onChange={(e) =>
                updateBlock(block.id, { sheet: e.target.value, xColumn: null, yColumns: [] })
              }
              className="rounded border border-subtle px-2 py-1"
            >
              {source.sheets.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="flex items-center gap-1">
          {L.xAxis}
          <select
            value={xColumn ?? ''}
            onChange={(e) => updateBlock(block.id, { xColumn: e.target.value })}
            className="rounded border border-subtle px-2 py-1"
          >
            <option value="">{L.choose}</option>
            {headers.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap items-center gap-1">
          {L.yAxis}
          {headers.map((h) => (
            <label key={h} className="flex items-center gap-1 rounded border border-subtle px-2 py-1">
              <input
                type="checkbox"
                checked={yColumns.includes(h)}
                onChange={() => toggleYColumn(h)}
              />
              {h}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => updateBlock(block.id, { title: e.target.value })}
          placeholder={L.titlePh}
          className="flex-1 rounded border border-subtle bg-white px-3 py-1.5 text-sm focus:outline-none"
        />
        <div className="flex gap-1">
          {L.types.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => updateBlock(block.id, { chartType: value })}
              className={`flex items-center gap-1 rounded border px-2 py-1.5 text-xs ${
                chartType === value
                  ? 'border-accent bg-accent text-white'
                  : 'border-subtle bg-white text-ink/70 hover:bg-paper'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded border border-subtle bg-white px-2 py-1.5 text-xs text-ink/70 hover:bg-paper"
        >
          {L.replace}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      <ChartRenderer
        chartType={chartType}
        data={data}
        xKey={xColumn}
        yKeys={yColumns}
        title={title}
        lang={lang}
      />
    </div>
  )
}
