export const NPS_RATINGS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export const NPS_COLORS = {
  detractors: '#dc2626',
  passives: '#eab308',
  promoters: '#16a34a',
}

const toCount = (n) => {
  const v = Number(n)
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : 0
}

export function emptyNpsCounts() {
  return Array(11).fill(0)
}

export function computeNps(counts = []) {
  const safe = NPS_RATINGS.map((_, i) => toCount(counts[i]))
  const n = safe.reduce((a, b) => a + b, 0)
  if (n === 0) {
    return {
      n: 0,
      detractorCount: 0,
      passiveCount: 0,
      promoterCount: 0,
      detractorPct: 0,
      passivePct: 0,
      promoterPct: 0,
      score: 0,
      counts: safe,
    }
  }
  const detractorCount = safe.slice(0, 7).reduce((a, b) => a + b, 0)
  const passiveCount = safe[7] + safe[8]
  const promoterCount = safe[9] + safe[10]
  const detractorPct = (detractorCount / n) * 100
  const passivePct = (passiveCount / n) * 100
  const promoterPct = (promoterCount / n) * 100
  const score = Math.round(promoterPct - detractorPct)
  return {
    n,
    detractorCount,
    passiveCount,
    promoterCount,
    detractorPct,
    passivePct,
    promoterPct,
    score,
    counts: safe,
  }
}

export function npsScoreColor(score) {
  if (score >= 50) return NPS_COLORS.promoters
  if (score >= 0) return '#0891b2'
  return NPS_COLORS.detractors
}

export function importNpsFromRows(rows) {
  const counts = emptyNpsCounts()
  for (const row of rows) {
    if (!Array.isArray(row)) continue
    for (const cell of row) {
      const n = Number(cell)
      if (Number.isFinite(n) && n >= 0 && n <= 10 && Math.floor(n) === n) {
        counts[n] += 1
      }
    }
  }
  return counts
}
