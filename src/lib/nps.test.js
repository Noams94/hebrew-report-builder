import { describe, it, expect } from 'vitest'
import {
  computeNps,
  emptyNpsCounts,
  importNpsFromRows,
  npsScoreColor,
  NPS_RATINGS,
} from './nps'

describe('computeNps', () => {
  it('returns zero result for empty counts', () => {
    const r = computeNps(emptyNpsCounts())
    expect(r.n).toBe(0)
    expect(r.score).toBe(0)
    expect(r.detractorCount).toBe(0)
    expect(r.passiveCount).toBe(0)
    expect(r.promoterCount).toBe(0)
  })

  it('scores +100 when all responses are 10', () => {
    const counts = emptyNpsCounts()
    counts[10] = 50
    const r = computeNps(counts)
    expect(r.score).toBe(100)
    expect(r.promoterCount).toBe(50)
    expect(r.detractorCount).toBe(0)
  })

  it('scores -100 when all responses are 0', () => {
    const counts = emptyNpsCounts()
    counts[0] = 50
    const r = computeNps(counts)
    expect(r.score).toBe(-100)
    expect(r.detractorCount).toBe(50)
    expect(r.promoterCount).toBe(0)
  })

  it('scores 0 when promoter % equals detractor %', () => {
    const counts = emptyNpsCounts()
    counts[0] = 10
    counts[8] = 10
    counts[10] = 10
    const r = computeNps(counts)
    expect(r.score).toBe(0)
    expect(r.passiveCount).toBe(10)
  })

  it('classifies ratings correctly', () => {
    const counts = emptyNpsCounts()
    counts[6] = 1
    counts[7] = 1
    counts[8] = 1
    counts[9] = 1
    const r = computeNps(counts)
    expect(r.detractorCount).toBe(1)
    expect(r.passiveCount).toBe(2)
    expect(r.promoterCount).toBe(1)
  })

  it('coerces invalid count cells to zero', () => {
    const r = computeNps(['x', null, undefined, -5, 1.7, NaN, 0, 0, 0, 0, 4])
    expect(r.n).toBe(5)
    expect(r.promoterCount).toBe(4)
    expect(r.detractorCount).toBe(1)
  })

  it('rounds the score to an integer', () => {
    const counts = emptyNpsCounts()
    counts[0] = 1
    counts[10] = 2
    const r = computeNps(counts)
    expect(Number.isInteger(r.score)).toBe(true)
  })
})

describe('importNpsFromRows', () => {
  it('counts raw rating values across cells in rows', () => {
    const rows = [[10, 9, 8], [7, 6, 5], [10]]
    const counts = importNpsFromRows(rows)
    expect(counts[5]).toBe(1)
    expect(counts[6]).toBe(1)
    expect(counts[10]).toBe(2)
  })

  it('ignores out-of-range and non-integer values', () => {
    const counts = importNpsFromRows([[11, -1, 'foo', 4.5, 5]])
    expect(counts[5]).toBe(1)
    expect(counts.reduce((a, b) => a + b, 0)).toBe(1)
  })
})

describe('npsScoreColor', () => {
  it('returns the promoter color for excellent scores', () => {
    expect(npsScoreColor(60)).toBe('#16a34a')
  })
  it('returns the detractor color for negative scores', () => {
    expect(npsScoreColor(-10)).toBe('#dc2626')
  })
})

describe('NPS_RATINGS', () => {
  it('has 11 ratings 0-10', () => {
    expect(NPS_RATINGS).toHaveLength(11)
    expect(NPS_RATINGS[0]).toBe(0)
    expect(NPS_RATINGS[10]).toBe(10)
  })
})
