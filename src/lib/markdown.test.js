import { describe, it, expect } from 'vitest'
import { parseMarkdown } from './markdown'

describe('parseMarkdown', () => {
  it('returns empty string for empty input', () => {
    expect(parseMarkdown('')).toBe('')
    expect(parseMarkdown(undefined)).toBe('')
  })

  it('wraps a line in a paragraph', () => {
    expect(parseMarkdown('hello')).toBe('<p>hello</p>')
  })

  it('parses bold and italic', () => {
    const out = parseMarkdown('**bold** and *italic*')
    expect(out).toContain('<strong>bold</strong>')
    expect(out).toContain('<em>italic</em>')
  })

  it('parses links with rel attributes', () => {
    const out = parseMarkdown('see [docs](https://example.com)')
    expect(out).toContain('<a href="https://example.com"')
    expect(out).toContain('rel="noopener noreferrer"')
    expect(out).toContain('>docs</a>')
  })

  it('builds an unordered list from "- " lines', () => {
    const out = parseMarkdown('- a\n- b\n- c')
    expect(out).toBe('<ul><li>a</li><li>b</li><li>c</li></ul>')
  })

  it('escapes HTML in plain text to prevent injection', () => {
    const out = parseMarkdown('<script>alert(1)</script>')
    expect(out).not.toContain('<script>')
    expect(out).toContain('&lt;script&gt;')
  })

  it('separates paragraphs by blank lines', () => {
    const out = parseMarkdown('first\n\nsecond')
    expect(out).toContain('<p>first</p>')
    expect(out).toContain('<p>second</p>')
  })

  it('preserves Hebrew text', () => {
    const out = parseMarkdown('שלום **עולם**')
    expect(out).toContain('שלום')
    expect(out).toContain('<strong>עולם</strong>')
  })
})
