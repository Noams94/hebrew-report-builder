import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ImageRun,
  BorderStyle,
} from 'docx'

const RTL_ALIGN = AlignmentType.RIGHT

function parseInlineToRuns(text) {
  const runs = []
  let i = 0
  while (i < text.length) {
    const boldStart = text.indexOf('**', i)
    const italicStart = text.indexOf('*', i)
    const linkStart = text.indexOf('[', i)

    let nextIdx = Math.min(
      ...[boldStart, italicStart, linkStart]
        .filter((x) => x !== -1)
        .concat([text.length]),
    )

    if (nextIdx > i) {
      runs.push(
        new TextRun({ text: text.slice(i, nextIdx), rightToLeft: true }),
      )
      i = nextIdx
    }
    if (i >= text.length) break

    if (text.slice(i, i + 2) === '**') {
      const end = text.indexOf('**', i + 2)
      if (end === -1) {
        runs.push(new TextRun({ text: text.slice(i), rightToLeft: true }))
        break
      }
      runs.push(
        new TextRun({
          text: text.slice(i + 2, end),
          bold: true,
          rightToLeft: true,
        }),
      )
      i = end + 2
    } else if (text[i] === '*') {
      const end = text.indexOf('*', i + 1)
      if (end === -1) {
        runs.push(new TextRun({ text: text.slice(i), rightToLeft: true }))
        break
      }
      runs.push(
        new TextRun({
          text: text.slice(i + 1, end),
          italics: true,
          rightToLeft: true,
        }),
      )
      i = end + 1
    } else if (text[i] === '[') {
      const close = text.indexOf(']', i + 1)
      if (close === -1 || text[close + 1] !== '(') {
        runs.push(new TextRun({ text: text.slice(i), rightToLeft: true }))
        break
      }
      const paren = text.indexOf(')', close + 2)
      if (paren === -1) {
        runs.push(new TextRun({ text: text.slice(i), rightToLeft: true }))
        break
      }
      const label = text.slice(i + 1, close)
      runs.push(
        new TextRun({
          text: label,
          style: 'Hyperlink',
          rightToLeft: true,
        }),
      )
      i = paren + 1
    }
  }
  return runs.length ? runs : [new TextRun({ text: '', rightToLeft: true })]
}

function textBlockToParagraphs(markdown) {
  const lines = (markdown || '').split(/\r?\n/)
  const paragraphs = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (trimmed.startsWith('- ')) {
      paragraphs.push(
        new Paragraph({
          children: parseInlineToRuns(trimmed.slice(2)),
          alignment: RTL_ALIGN,
          bidirectional: true,
          bullet: { level: 0 },
        }),
      )
    } else {
      paragraphs.push(
        new Paragraph({
          children: parseInlineToRuns(trimmed),
          alignment: RTL_ALIGN,
          bidirectional: true,
        }),
      )
    }
  }
  return paragraphs
}

function headingBlockToParagraph(block) {
  const level = block.data.level ?? 2
  const levelMap = {
    1: HeadingLevel.HEADING_1,
    2: HeadingLevel.HEADING_2,
    3: HeadingLevel.HEADING_3,
  }
  return new Paragraph({
    heading: levelMap[level] || HeadingLevel.HEADING_2,
    alignment: RTL_ALIGN,
    bidirectional: true,
    children: [
      new TextRun({
        text: block.data.text || '',
        bold: true,
        rightToLeft: true,
      }),
    ],
  })
}

function tableBlockToTable(block) {
  const { headers = [], rows = [] } = block.data
  if (headers.length === 0) return null
  const headerRow = new TableRow({
    children: headers.map(
      (h) =>
        new TableCell({
          children: [
            new Paragraph({
              alignment: RTL_ALIGN,
              bidirectional: true,
              children: [
                new TextRun({ text: String(h), bold: true, rightToLeft: true }),
              ],
            }),
          ],
          width: { size: 100 / headers.length, type: WidthType.PERCENTAGE },
        }),
    ),
  })
  const bodyRows = rows.map(
    (row) =>
      new TableRow({
        children: headers.map(
          (_, i) =>
            new TableCell({
              children: [
                new Paragraph({
                  alignment: RTL_ALIGN,
                  bidirectional: true,
                  children: [
                    new TextRun({
                      text: String(row[i] ?? ''),
                      rightToLeft: true,
                    }),
                  ],
                }),
              ],
            }),
        ),
      }),
  )
  return new Table({
    rows: [headerRow, ...bodyRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  })
}

function dataUrlToImageRun(dataUrl, maxWidth = 500) {
  const match = /^data:image\/(\w+);base64,(.+)$/i.exec(dataUrl || '')
  if (!match) return null
  const [, ext, b64] = match
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
  const typeMap = { jpg: 'jpg', jpeg: 'jpg', png: 'png', gif: 'gif', bmp: 'bmp' }
  const type = typeMap[ext.toLowerCase()] || 'png'
  return new ImageRun({
    data: bytes,
    type,
    transformation: { width: maxWidth, height: Math.round(maxWidth * 0.6) },
  })
}

function imageBlockToParagraph(block) {
  const { src, caption } = block.data
  if (!src) return []
  const imageRun = src.startsWith('data:')
    ? dataUrlToImageRun(src)
    : null
  if (!imageRun) {
    return [
      new Paragraph({
        alignment: RTL_ALIGN,
        bidirectional: true,
        children: [
          new TextRun({
            text: `[תמונה: ${src}]`,
            italics: true,
            rightToLeft: true,
          }),
        ],
      }),
    ]
  }
  const out = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [imageRun],
    }),
  ]
  if (caption) {
    out.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        bidirectional: true,
        children: [
          new TextRun({
            text: caption,
            italics: true,
            size: 20,
            rightToLeft: true,
          }),
        ],
      }),
    )
  }
  return out
}

function dividerParagraph() {
  return new Paragraph({
    alignment: RTL_ALIGN,
    border: {
      bottom: {
        color: '999999',
        size: 6,
        space: 1,
        style: BorderStyle.SINGLE,
      },
    },
    children: [new TextRun({ text: '', rightToLeft: true })],
  })
}

function blockToDocxNodes(block) {
  switch (block.type) {
    case 'heading':
      return [headingBlockToParagraph(block)]
    case 'text':
      return textBlockToParagraphs(block.data.markdown)
    case 'divider':
      return [dividerParagraph()]
    case 'image':
      return imageBlockToParagraph(block)
    case 'table': {
      const t = tableBlockToTable(block)
      return t ? [t, new Paragraph({ children: [] })] : []
    }
    case 'chart':
      return [
        new Paragraph({
          alignment: RTL_ALIGN,
          bidirectional: true,
          children: [
            new TextRun({
              text: `[גרף: ${block.data.title || 'ללא כותרת'} — גרפים אינם נכללים בייצוא Word בגרסה זו]`,
              italics: true,
              rightToLeft: true,
            }),
          ],
        }),
      ]
    default:
      return []
  }
}

export async function exportReportDOCX(title, blocks) {
  const titleParagraph = new Paragraph({
    alignment: RTL_ALIGN,
    bidirectional: true,
    spacing: { after: 400 },
    children: [
      new TextRun({
        text: title || 'דוח',
        bold: true,
        size: 48,
        rightToLeft: true,
      }),
    ],
  })

  const body = blocks.flatMap((b) => blockToDocxNodes(b))

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Arial', rightToLeft: true },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: [titleParagraph, ...body],
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title || 'דוח'}.docx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
