import { describe, it, expect } from 'vitest'
import { computeStats, formatMetric, getMetricLabels } from './stats'

describe('computeStats', () => {
  it('returns zero count and null aggregates for empty input', () => {
    const r = computeStats([])
    expect(r.n).toBe(0)
    expect(r.mean).toBeNull()
    expect(r.median).toBeNull()
    expect(r.std).toBeNull()
  })

  it('skips non-numeric values when counting n', () => {
    const r = computeStats([1, 2, '', null, 'foo', 3])
    expect(r.n).toBe(3)
  })

  it('computes mean and sum correctly', () => {
    const r = computeStats([1, 2, 3, 4, 5], ['mean', 'sum'])
    expect(r.mean).toBe(3)
    expect(r.sum).toBe(15)
  })

  it('computes median for odd and even lengths', () => {
    expect(computeStats([1, 2, 3], ['median']).median).toBe(2)
    expect(computeStats([1, 2, 3, 4], ['median']).median).toBe(2.5)
  })

  it('computes population standard deviation', () => {
    const r = computeStats([2, 4, 4, 4, 5, 5, 7, 9], ['std'])
    expect(r.std).toBeCloseTo(2, 5)
  })

  it('handles min and max', () => {
    const r = computeStats([5, -2, 7, 3], ['min', 'max'])
    expect(r.min).toBe(-2)
    expect(r.max).toBe(7)
  })
})

describe('formatMetric', () => {
  it('renders em dash for null', () => {
    expect(formatMetric(null, 'mean')).toBe('—')
  })

  it('renders n as integer string', () => {
    expect(formatMetric(42, 'n')).toBe('42')
  })

  it('uses 3 digits below 10', () => {
    expect(formatMetric(1.23456, 'mean')).toBe('1.235')
  })

  it('uses 1 digit at or above 100', () => {
    expect(formatMetric(123.45, 'mean')).toBe('123.5')
  })
})

describe('getMetricLabels', () => {
  it('returns Hebrew labels by default', () => {
    expect(getMetricLabels().mean).toBe('ממוצע')
  })
  it('returns English labels when asked', () => {
    expect(getMetricLabels('en').mean).toBe('Mean')
  })
  it('falls back to Hebrew on unknown lang', () => {
    expect(getMetricLabels('xx').mean).toBe('ממוצע')
  })
})
