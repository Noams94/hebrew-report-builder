import { useRef } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Upload, Trash2, Plus, BarChart3 } from 'lucide-react'
import { useReportStore } from '../../store/reportStore'
import { parseExcel } from '../../lib/excel'

const LABELS_5 = ['לא מסכים בכלל', 'לא מסכים', 'ניטרלי', 'מסכים', 'מסכים בהחלט']
const LABELS_7 = [
  'לא מסכים בכלל',
  'לא מסכים',
  'די לא מסכים',
  'ניטרלי',
  'די מסכים',
  'מסכים',
  'מסכים בהחלט',
]
const COLORS_5 = ['#b91c1c', '#f87171', '#9ca3af', '#4ade80', '#15803d']
const COLORS_7 = [
  '#7f1d1d',
  '#b91c1c',
  '#f87171',
  '#9ca3af',
  '#4ade80',
  '#15803d',
  '#14532d',
]

const getConfig = (scale) =>
  scale === 7
    ? { labels: LABELS_7, colors: COLORS_7 }
    : { labels: LABELS_5, colors: COLORS_5 }

const emptyQuestion = (scale) => ({
  text: '',
  responses: Array(scale).fill(0),
})

export default function LikertBlock({ block }) {
  const updateBlock = useReportStore((s) => s.updateBlock)
  const fileInputRef = useRef(null)
  const { scale = 5, questions = [], title = '' } = block.data
  const { labels, colors } = getConfig(scale)

  const setScale = (next) => {
    updateBlock(block.id, {
      scale: next,
      questions: questions.map((q) => ({
        text: q.text,
        responses: Array(next)
          .fill(0)
          .map((_, i) => q.responses[i] ?? 0),
      })),
    })
  }

  const addQuestion = () => {
    updateBlock(block.id, {
      questions: [...questions, emptyQuestion(scale)],
    })
  }

  const removeQuestion = (i) => {
    updateBlock(block.id, {
      questions: questions.filter((_, idx) => idx !== i),
    })
  }

  const updateQuestion = (i, patch) => {
    updateBlock(block.id, {
      questions: questions.map((q, idx) => (idx === i ? { ...q, ...patch } : q)),
    })
  }

  const updateResponse = (qIdx, colIdx, value) => {
    const n = Number(value) || 0
    const q = questions[qIdx]
    const responses = q.responses.slice()
    responses[colIdx] = Math.max(0, Math.floor(n))
    updateQuestion(qIdx, { responses })
  }

  const handleExcelImport = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const result = await parseExcel(file)
    const firstSheet = result.data[result.sheets[0]]
    if (!firstSheet) return
    const newQuestions = firstSheet.rows.map((row) => ({
      text: row[0] || '',
      responses: Array(scale)
        .fill(0)
        .map((_, i) => Number(row[i + 1]) || 0),
    }))
    updateBlock(block.id, { questions: newQuestions })
  }

  const chartData = questions.map((q, i) => {
    const row = { question: q.text || `שאלה ${i + 1}` }
    labels.forEach((label, j) => {
      row[label] = q.responses[j] ?? 0
    })
    return row
  })

  const hasData = questions.length > 0 && questions.some((q) =>
    q.responses.some((r) => r > 0),
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-subtle bg-white p-3 text-xs">
        <BarChart3 size={14} className="text-ink/50" />
        <span className="font-medium">סקר Likert</span>
        <label className="flex items-center gap-1">
          סולם:
          <select
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="rounded border border-subtle px-2 py-1"
          >
            <option value={5}>5 נקודות</option>
            <option value={7}>7 נקודות</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 rounded border border-subtle px-2 py-1 hover:bg-paper"
        >
          <Upload size={12} />
          ייבוא Excel
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleExcelImport}
          className="hidden"
        />
        <span className="text-ink/50">
          (שורה לשאלה: עמודה 1 טקסט, עמודות 2..{scale + 1} ספירות)
        </span>
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => updateBlock(block.id, { title: e.target.value })}
        placeholder="כותרת הגרף (אופציונלי)"
        className="rounded border border-subtle bg-white px-3 py-1.5 text-sm focus:outline-none"
      />

      <div className="overflow-x-auto rounded-lg border border-subtle bg-white">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-subtle bg-paper/60">
              <th className="p-2 text-right font-medium">שאלה</th>
              {labels.map((l) => (
                <th key={l} className="p-2 text-center font-medium">
                  {l}
                </th>
              ))}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {questions.length === 0 && (
              <tr>
                <td
                  colSpan={scale + 2}
                  className="p-4 text-center text-ink/40"
                >
                  אין שאלות. הוסף שאלה או ייבא Excel.
                </td>
              </tr>
            )}
            {questions.map((q, i) => (
              <tr key={i} className="border-b border-subtle">
                <td className="p-1">
                  <input
                    type="text"
                    value={q.text}
                    onChange={(e) => updateQuestion(i, { text: e.target.value })}
                    placeholder={`שאלה ${i + 1}`}
                    className="w-full rounded bg-transparent px-2 py-1 focus:bg-paper focus:outline-none"
                  />
                </td>
                {labels.map((_, j) => (
                  <td key={j} className="p-1">
                    <input
                      type="number"
                      min={0}
                      value={q.responses[j] ?? 0}
                      onChange={(e) => updateResponse(i, j, e.target.value)}
                      className="w-14 rounded bg-transparent px-1 py-1 text-center focus:bg-paper focus:outline-none"
                    />
                  </td>
                ))}
                <td className="p-1 text-center">
                  <button
                    type="button"
                    onClick={() => removeQuestion(i)}
                    aria-label="מחק שאלה"
                    className="rounded p-1 text-ink/40 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-subtle p-2 text-center">
          <button
            type="button"
            onClick={addQuestion}
            className="flex items-center gap-1 rounded border border-subtle px-3 py-1 text-xs text-ink/70 hover:bg-paper"
          >
            <Plus size={12} /> הוסף שאלה
          </button>
        </div>
      </div>

      {hasData && (
        <div className="my-2" data-chart-id={block.id}>
          <LikertChart
            title={title}
            data={chartData}
            labels={labels}
            colors={colors}
          />
        </div>
      )}
    </div>
  )
}

export function LikertChart({ title, data, labels, colors, height = null }) {
  const h = height ?? Math.max(180, data.length * 48 + 80)
  return (
    <div className="flex flex-col gap-2">
      {title && (
        <h4 className="text-center font-serif text-lg font-semibold text-ink">
          {title}
        </h4>
      )}
      <div style={{ width: '100%', height: h }}>
        <ResponsiveContainer>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 10, right: 20, left: 60, bottom: 10 }}
          >
            <XAxis type="number" fontSize={11} />
            <YAxis
              type="category"
              dataKey="question"
              fontSize={11}
              width={140}
            />
            <Tooltip />
            <Legend />
            {labels.map((label, i) => (
              <Bar
                key={label}
                dataKey={label}
                stackId="likert"
                fill={colors[i]}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
