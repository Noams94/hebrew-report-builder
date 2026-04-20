import { parseMarkdown } from './markdown'
import { slugify } from './slugify'

const escapeHTML = (text) =>
  String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const DOC_STYLES = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: #faf9f6;
    color: #1a1a1a;
    font-family: 'Heebo', system-ui, sans-serif;
    font-size: 17px;
    line-height: 1.75;
    -webkit-font-smoothing: antialiased;
  }
  .container {
    max-width: 960px;
    margin: 0 auto;
    padding: 48px 24px;
  }
  .article {
    background: #fff;
    border-radius: 12px;
    padding: 48px 56px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }
  .toc {
    background: #fff;
    border: 1px solid #e7e5e0;
    border-radius: 10px;
    padding: 16px 20px;
    margin-bottom: 24px;
    font-size: 14px;
  }
  .toc h2 { font-size: 15px; margin: 0 0 8px; font-family: 'Frank Ruhl Libre', serif; }
  .toc ul { list-style: none; padding: 0; margin: 0; }
  .toc li { margin: 4px 0; }
  .toc a { color: #444; text-decoration: none; }
  .toc a:hover { color: #1e3a5f; text-decoration: underline; }
  @media (min-width: 1280px) {
    .container.with-toc {
      display: grid;
      grid-template-columns: 200px 1fr;
      gap: 24px;
      max-width: 1200px;
      align-items: start;
    }
    .container.with-toc .toc {
      position: sticky;
      top: 24px;
      margin-bottom: 0;
    }
  }
  .report-title {
    font-family: 'Frank Ruhl Libre', serif;
    font-size: 40px;
    font-weight: 700;
    margin: 0 0 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e7e5e0;
  }
  h1, h2, h3 {
    font-family: 'Frank Ruhl Libre', serif;
    color: #1a1a1a;
    line-height: 1.3;
  }
  h1 { font-size: 32px; margin: 32px 0 12px; }
  h2 { font-size: 26px; margin: 28px 0 10px; }
  h3 { font-size: 22px; margin: 24px 0 8px; }
  p { margin: 12px 0; }
  strong { font-weight: 600; }
  a { color: #1e3a5f; text-decoration: underline; text-underline-offset: 2px; }
  ul { margin: 8px 0; padding-inline-start: 24px; }
  li { margin: 4px 0; }
  hr { border: 0; border-top: 1px solid #e7e5e0; margin: 32px 0; }
  figure { margin: 24px 0; text-align: center; }
  figure img { max-width: 100%; max-height: 520px; border-radius: 6px; }
  figcaption { font-size: 14px; color: #666; font-style: italic; margin-top: 8px; }
  table { width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 15px; }
  th, td { padding: 10px 12px; text-align: right; }
  th { background: #faf9f6; border-bottom: 2px solid #1a1a1a; font-weight: 600; }
  td { border-bottom: 1px solid #e7e5e0; }
  .chart-wrapper { margin: 24px 0; }
  .chart-title { text-align: center; font-family: 'Frank Ruhl Libre', serif; font-size: 18px; font-weight: 600; margin-bottom: 8px; }
  @media print {
    body { background: #fff; }
    .toc { display: none; }
    .container { display: block; padding: 0; max-width: 100%; }
    .article { box-shadow: none; padding: 20px; }
    .chart-wrapper, figure, table { page-break-inside: avoid; }
    h1, h2, h3 { page-break-after: avoid; }
  }
`

const extractChartSVG = (blockId) => {
  const container = document.querySelector(`[data-chart-id="${blockId}"]`)
  if (!container) return ''
  const svgs = Array.from(container.querySelectorAll('svg'))
  if (svgs.length === 0) return ''
  const main = svgs.reduce((largest, svg) => {
    const area = (svg.clientWidth || 0) * (svg.clientHeight || 0)
    const largestArea = (largest.clientWidth || 0) * (largest.clientHeight || 0)
    return area > largestArea ? svg : largest
  }, svgs[0])
  const clone = main.cloneNode(true)
  if (!clone.getAttribute('xmlns')) {
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  }
  const width = main.clientWidth || Number(main.getAttribute('width')) || 600
  const height = main.clientHeight || Number(main.getAttribute('height')) || 320
  if (!clone.getAttribute('viewBox')) {
    clone.setAttribute('viewBox', `0 0 ${width} ${height}`)
  }
  clone.setAttribute('width', '100%')
  clone.setAttribute('height', 'auto')
  clone.style.maxWidth = ''
  clone.style.width = '100%'
  clone.style.height = 'auto'
  return clone.outerHTML
}

const renderChartToSVG = (block) => {
  const { source, sheet, xColumn, yColumns, title } = block.data
  if (!source || !sheet || !xColumn || !yColumns?.length) return ''
  const svgHTML = extractChartSVG(block.id)
  if (!svgHTML) return ''
  const titleHTML = title
    ? `<div class="chart-title">${escapeHTML(title)}</div>`
    : ''
  return `<div class="chart-wrapper">${titleHTML}<div style="text-align:center;max-width:760px;margin:0 auto;">${svgHTML}</div></div>`
}

const renderBlock = (block, headingIds) => {
  const { type, data, id } = block

  if (type === 'heading') {
    const { level = 2, text = '' } = data
    const tag = `h${level}`
    const anchorId = headingIds[id]
    return `<${tag} id="${anchorId}">${escapeHTML(text)}</${tag}>`
  }

  if (type === 'text') {
    return parseMarkdown(data.markdown ?? '')
  }

  if (type === 'image') {
    const { src, caption, alt } = data
    if (!src) return ''
    const altText = escapeHTML(alt || caption || 'תמונה בדוח')
    const captionHTML = caption
      ? `<figcaption>${escapeHTML(caption)}</figcaption>`
      : ''
    return `<figure><img src="${src}" alt="${altText}" />${captionHTML}</figure>`
  }

  if (type === 'table') {
    const { headers = [], rows = [] } = data
    if (headers.length === 0) return ''
    const thead = headers.map((h) => `<th>${escapeHTML(h)}</th>`).join('')
    const tbody = rows
      .map(
        (row) =>
          '<tr>' +
          headers
            .map((_, i) => `<td>${escapeHTML(row[i] ?? '')}</td>`)
            .join('') +
          '</tr>',
      )
      .join('')
    return `<table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>`
  }

  if (type === 'chart') {
    return renderChartToSVG(block)
  }

  if (type === 'divider') {
    return '<hr />'
  }

  return ''
}

const SCRIPT = `
(function() {
  document.querySelectorAll('.toc a').forEach(function(a) {
    a.addEventListener('click', function(e) {
      var href = a.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      var target = document.getElementById(href.slice(1));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    });
  });
})();
`

export function buildReportHTML(title, blocks) {
  const headingIds = {}
  const seen = new Map()
  blocks.forEach((b) => {
    if (b.type !== 'heading') return
    const base = slugify(b.data.text, `section-${Object.keys(headingIds).length + 1}`)
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    headingIds[b.id] = count === 0 ? base : `${base}-${count + 1}`
  })

  const headings = blocks
    .filter((b) => b.type === 'heading')
    .map((b) => ({
      id: headingIds[b.id],
      text: b.data.text || 'כותרת ריקה',
      level: b.data.level ?? 2,
    }))
  const showTOC = headings.length >= 3

  const tocHTML = showTOC
    ? `<nav class="toc" aria-label="תוכן עניינים">
        <h2>תוכן עניינים</h2>
        <ul>${headings
          .map(
            (h) =>
              `<li style="padding-inline-start:${(h.level - 1) * 10}px"><a href="#${h.id}">${escapeHTML(h.text)}</a></li>`,
          )
          .join('')}</ul>
      </nav>`
    : ''

  const blocksHTML = blocks.map((b) => renderBlock(b, headingIds)).join('\n')

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHTML(title || 'דוח')}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700&family=Frank+Ruhl+Libre:wght@400;700&display=swap" rel="stylesheet" />
<style>${DOC_STYLES}</style>
</head>
<body>
<div class="container${showTOC ? ' with-toc' : ''}">
${tocHTML}
<article class="article">
<h1 class="report-title">${escapeHTML(title || 'דוח')}</h1>
${blocksHTML}
</article>
</div>
<script>${SCRIPT}</script>
</body>
</html>`.trim()
}

export function downloadReport(title, blocks) {
  const html = buildReportHTML(title, blocks)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title || 'דוח'}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
