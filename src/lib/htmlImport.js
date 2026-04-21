const BLOCK_SELECTOR =
  'h1, h2, h3, p, ul, ol, figure, img, table, hr, div.chart-wrapper'

function htmlToMarkdown(node) {
  let out = ''
  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      out += child.textContent
      return
    }
    if (child.nodeType !== Node.ELEMENT_NODE) return
    const tag = child.tagName.toLowerCase()
    const inner = htmlToMarkdown(child).trim()
    if (tag === 'strong' || tag === 'b') out += `**${inner}**`
    else if (tag === 'em' || tag === 'i') out += `*${inner}*`
    else if (tag === 'a') {
      const href = child.getAttribute('href') || ''
      out += `[${inner}](${href})`
    } else if (tag === 'br') out += '\n'
    else out += inner
  })
  return out
}

function listToMarkdown(ul) {
  const items = Array.from(ul.querySelectorAll(':scope > li'))
  return items.map((li) => `- ${htmlToMarkdown(li).trim()}`).join('\n')
}

function extractTitle(doc) {
  const reportTitle = doc.querySelector('.report-title')
  if (reportTitle?.textContent) return reportTitle.textContent.trim()
  const h1 = doc.querySelector('h1')
  if (h1?.textContent) return h1.textContent.trim()
  const title = doc.querySelector('title')
  if (title?.textContent) return title.textContent.trim()
  return 'דוח מיובא'
}

function blockFromElement(el) {
  const tag = el.tagName.toLowerCase()

  if (tag === 'h1' || tag === 'h2' || tag === 'h3') {
    if (el.classList.contains('report-title')) return null
    return {
      id: crypto.randomUUID(),
      type: 'heading',
      data: {
        level: parseInt(tag[1], 10),
        text: el.textContent.trim(),
      },
    }
  }

  if (tag === 'p') {
    const markdown = htmlToMarkdown(el).trim()
    if (!markdown) return null
    return {
      id: crypto.randomUUID(),
      type: 'text',
      data: { markdown },
    }
  }

  if (tag === 'ul' || tag === 'ol') {
    const markdown = listToMarkdown(el)
    if (!markdown) return null
    return {
      id: crypto.randomUUID(),
      type: 'text',
      data: { markdown },
    }
  }

  if (tag === 'figure') {
    const img = el.querySelector('img')
    if (!img) return null
    const src = img.getAttribute('src')
    if (!src) return null
    const alt = img.getAttribute('alt') || ''
    const figcaption = el.querySelector('figcaption')
    const caption = figcaption ? figcaption.textContent.trim() : ''
    return {
      id: crypto.randomUUID(),
      type: 'image',
      data: { src, caption, alt },
    }
  }

  if (tag === 'img') {
    const src = el.getAttribute('src')
    if (!src) return null
    return {
      id: crypto.randomUUID(),
      type: 'image',
      data: {
        src,
        alt: el.getAttribute('alt') || '',
        caption: '',
      },
    }
  }

  if (tag === 'table') {
    const headerCells = Array.from(el.querySelectorAll('thead th'))
    const headers = headerCells.length
      ? headerCells.map((th) => th.textContent.trim())
      : Array.from(el.querySelectorAll('tr:first-child > *')).map((c) =>
          c.textContent.trim(),
        )
    const bodyRows = el.querySelector('tbody')
      ? Array.from(el.querySelectorAll('tbody tr'))
      : Array.from(el.querySelectorAll('tr')).slice(headerCells.length ? 0 : 1)
    const rows = bodyRows.map((tr) =>
      Array.from(tr.children).map((td) => td.textContent.trim()),
    )
    if (headers.length === 0) return null
    return {
      id: crypto.randomUUID(),
      type: 'table',
      data: { headers, rows },
    }
  }

  if (tag === 'hr') {
    return { id: crypto.randomUUID(), type: 'divider', data: {} }
  }

  if (tag === 'div' && el.classList.contains('chart-wrapper')) {
    const svg = el.querySelector('svg')
    if (!svg) return null
    const titleEl = el.querySelector('.chart-title')
    const title = titleEl ? titleEl.textContent.trim() : ''
    const svgHTML = svg.outerHTML
    return {
      id: crypto.randomUUID(),
      type: 'chart',
      data: {
        source: null,
        sheet: null,
        xColumn: null,
        yColumns: [],
        chartType: 'imported',
        title,
        importedSvg: svgHTML,
      },
    }
  }

  return null
}

function walkForBlocks(container) {
  const blocks = []
  const processed = new WeakSet()

  const directChildren = Array.from(container.children)
  for (const child of directChildren) {
    if (processed.has(child)) continue

    if (child.matches(BLOCK_SELECTOR)) {
      const block = blockFromElement(child)
      if (block) blocks.push(block)
      processed.add(child)
      continue
    }

    const nested = child.querySelectorAll(BLOCK_SELECTOR)
    if (nested.length > 0) {
      nested.forEach((n) => {
        if (processed.has(n)) return
        const block = blockFromElement(n)
        if (block) blocks.push(block)
        processed.add(n)
      })
      continue
    }

    const text = child.textContent.trim()
    if (text) {
      blocks.push({
        id: crypto.randomUUID(),
        type: 'text',
        data: { markdown: text },
      })
    }
  }
  return blocks
}

export function parseReportHTML(htmlString) {
  if (!htmlString || typeof htmlString !== 'string') {
    throw new Error('HTML ריק')
  }
  const doc = new DOMParser().parseFromString(htmlString, 'text/html')
  if (!doc || !doc.body) throw new Error('HTML לא תקין')

  const title = extractTitle(doc)

  const container =
    doc.querySelector('article.article') ||
    doc.querySelector('article') ||
    doc.querySelector('.container') ||
    doc.body

  const blocks = walkForBlocks(container)

  return {
    title,
    blocks,
    theme: {},
  }
}
