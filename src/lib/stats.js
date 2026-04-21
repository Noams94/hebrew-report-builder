function toNumbers(values) {
  return values
    .map((v) => {
      if (v === null || v === undefined || v === '') return null
      const n = Number(v)
      return Number.isFinite(n) ? n : null
    })
    .filter((v) => v !== null)
}

export const METRIC_LABELS_BY_LANG = {
  he: {
    n: 'N',
    mean: 'ממוצע',
    median: 'חציון',
    std: 'סטיית תקן',
    min: 'ערך מינימלי',
    max: 'ערך מקסימלי',
    sum: 'סכום',
  },
  en: {
    n: 'N',
    mean: 'Mean',
    median: 'Median',
    std: 'Std dev',
    min: 'Min',
    max: 'Max',
    sum: 'Sum',
  },
}

export const METRIC_LABELS = METRIC_LABELS_BY_LANG.he

export function getMetricLabels(lang = 'he') {
  return METRIC_LABELS_BY_LANG[lang] || METRIC_LABELS_BY_LANG.he
}

export const DEFAULT_METRICS = ['n', 'mean', 'median', 'std', 'min', 'max']

export function computeStats(values, metrics = DEFAULT_METRICS) {
  const nums = toNumbers(values)
  const n = nums.length
  const out = {}
  for (const m of metrics) {
    if (m === 'n') {
      out.n = n
      continue
    }
    if (n === 0) {
      out[m] = null
      continue
    }
    if (m === 'mean') {
      out.mean = nums.reduce((a, b) => a + b, 0) / n
    } else if (m === 'median') {
      const sorted = nums.slice().sort((a, b) => a - b)
      const mid = Math.floor(n / 2)
      out.median = n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
    } else if (m === 'std') {
      const mean = nums.reduce((a, b) => a + b, 0) / n
      const variance = nums.reduce((a, b) => a + (b - mean) ** 2, 0) / n
      out.std = Math.sqrt(variance)
    } else if (m === 'min') {
      out.min = Math.min(...nums)
    } else if (m === 'max') {
      out.max = Math.max(...nums)
    } else if (m === 'sum') {
      out.sum = nums.reduce((a, b) => a + b, 0)
    }
  }
  return out
}

export function formatMetric(value, metric) {
  if (value === null || value === undefined) return '—'
  if (metric === 'n') return String(value)
  const abs = Math.abs(value)
  const digits = abs >= 100 ? 1 : abs >= 10 ? 2 : 3
  return value.toFixed(digits)
}
