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
import { useLang, isRtl } from '../../i18n'

const LABELS_BY_LANG = {
  he: {
    5: ['לא מסכים בכלל', 'לא מסכים', 'ניטרלי', 'מסכים', 'מסכים בהחלט'],
    7: [
      'לא מסכים בכלל',
      'לא מסכים',
      'די לא מסכים',
      'ניטרלי',
      'די מסכים',
      'מסכים',
      'מסכים בהחלט',
    ],
  },
  en: {
    5: ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'],
    7: [
      'Strongly disagree',
      'Disagree',
      'Somewhat disagree',
      'Neutral',
      'Somewhat agree',
      'Agree',
      'Strongly agree',
    ],
  },
}

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

const EXTRA = {
  he: {
    title: 'סקר Likert',
    scale: 'סולם:',
    scale5: '5 נקודות',
    scale7: '7 נקודות',
    importExcel: 'ייבוא Excel',
    importHint: (n) => `(שורה לשאלה: עמודה 1 טקסט, עמודות 2..${n + 1} ספירות)`,
    question: 'שאלה',
    empty: 'אין שאלות. הוסף שאלה או ייבא Excel.',
    deleteQ: 'מחק שאלה',
    addQ: 'הוסף שאלה',
    titlePh: 'כותרת הגרף (אופציונלי)',
    questionN: (i) => `שאלה ${i}`,
  },
  en: {
    title: 'Likert survey',
    scale: 'Scale:',
    scale5: '5 points',
    scale7: '7 points',
    importExcel: 'Import Excel',
    importHint: (n) => `(One row per question: col 1 = text, cols 2..${n + 1} = counts)`,
    question: 'Question',
    empty: 'No questions. Add one or import Excel.',
    deleteQ: 'Delete question',
    addQ: 'Add question',
    titlePh: 'Chart title (optional)',
    questionN: (i) => `Question ${i}`,
  },
}

const getConfig = (scale, lang) => {
  const labels = (LABELS_BY_LANG[lang] || LABELS_BY_LANG.he)[scale === 7 ? 7 : 5]
  const colors = scale === 7 ? COLORS_7 : COLORS_5
  return { labels, colors }
}

const emptyQuestion = (scale) => ({
  text: '',
  responses: Array(scale).fill(0),
})

export default function LikertBlock({ block }) {
  const updateBlock = useReportStore((s) => s.updateBlock)
  const lang = useLang()
  const L = EXTRA[lang] || EXTRA.he
  const fileInputRef = useRef(null)
  const { scale = 5, questions = [], title = '' } = block.data
  const { labels, colors } = getConfig(scale, lang)
  const cellAlign = isRtl(lang) ? 'text-right' : 'text-left'

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
    const row = { question: q.text || L.questionN(i + 1) }
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
        <span className="font-medium">{L.title}</span>
        <label className="flex items-center gap-1">
          {L.scale}
          <select
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="rounded border border-subtle px-2 py-1"
          >
            <option value={5}>{L.scale5}</option>
            <option value={7}>{L.scale7}</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 rounded border border-subtle px-2 py-1 hover:bg-paper"
        >
          <Upload size={12} />
          {L.importExcel}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleExcelImport}
          className="hidden"
        />
        <span className="text-ink/50">{L.importHint(scale)}</span>
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
              <th className={`p-2 ${cellAlign} font-medium`}>{L.question}</th>
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
                  {L.empty}
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
                    placeholder={L.questionN(i + 1)}
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
                    aria-label={L.deleteQ}
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
            <Plus size={12} /> {L.addQ}
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
            lang={lang}
          />
        </div>
      )}
    </div>
  )
}

export function LikertChart({ title, data, labels, colors, height = null, lang = 'he' }) {
  const h = height ?? Math.max(180, data.length * 48 + 80)
  const rtl = isRtl(lang)
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
            <XAxis type="number" fontSize={11} reversed={rtl} />
            <YAxis
              type="category"
              dataKey="question"
              fontSize={11}
              width={140}
              orientation={rtl ? 'right' : 'left'}
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
