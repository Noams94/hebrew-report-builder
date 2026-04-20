const escapeHTML = (text) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const applyInline = (text) =>
  text
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
    .replace(
      /\[([^\]]+)\]\(([^)\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
    )

export function parseMarkdown(input) {
  if (!input) return ''
  const escaped = escapeHTML(input)
  const lines = escaped.split('\n')
  const html = []
  let paragraph = []
  let list = []

  const flushParagraph = () => {
    if (paragraph.length) {
      html.push('<p>' + applyInline(paragraph.join(' ')) + '</p>')
      paragraph = []
    }
  }
  const flushList = () => {
    if (list.length) {
      html.push(
        '<ul>' +
          list.map((item) => '<li>' + applyInline(item) + '</li>').join('') +
          '</ul>',
      )
      list = []
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    const listMatch = line.match(/^[-*]\s+(.*)$/)
    if (listMatch) {
      flushParagraph()
      list.push(listMatch[1])
      continue
    }
    if (line === '') {
      flushParagraph()
      flushList()
      continue
    }
    flushList()
    paragraph.push(line)
  }
  flushParagraph()
  flushList()

  return html.join('\n')
}
