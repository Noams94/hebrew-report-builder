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
import heDict from '../i18n/he'
import enDict from '../i18n/en'

const dictFor = (lang) => (lang === 'en' ? enDict : heDict)
const alignFor = (lang) =>
  lang === 'en' ? AlignmentType.LEFT : AlignmentType.RIGHT
const isRTL = (lang) => lang !== 'en'
const defaultFont = (lang) => (lang === 'en' ? 'Calibri' : 'Arial')

function parseInlineToRuns(text, lang) {
  const rtl = isRTL(lang)
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
        new TextRun({ text: text.slice(i, nextIdx), rightToLeft: rtl }),
      )
      i = nextIdx
    }
    if (i >= text.length) break

    if (text.slice(i, i + 2) === '**') {
      const end = text.indexOf('**', i + 2)
      if (end === -1) {
        runs.push(new TextRun({ text: text.slice(i), rightToLeft: rtl }))
        break
      }
      runs.push(
        new TextRun({
          text: text.slice(i + 2, end),
          bold: true,
          rightToLeft: rtl,
        }),
      )
      i = end + 2
    } else if (text[i] === '*') {
      const end = text.indexOf('*', i + 1)
      if (end === -1) {
        runs.push(new TextRun({ text: text.slice(i), rightToLeft: rtl }))
        break
      }
      runs.push(
        new TextRun({
          text: text.slice(i + 1, end),
          italics: true,
          rightToLeft: rtl,
        }),
      )
      i = end + 1
    } else if (text[i] === '[') {
      const close = text.indexOf(']', i + 1)
      if (close === -1 || text[close + 1] !== '(') {
        runs.push(new TextRun({ text: text.slice(i), rightToLeft: rtl }))
        break
      }
      const paren = text.indexOf(')', close + 2)
      if (paren === -1) {
        runs.push(new TextRun({ text: text.slice(i), rightToLeft: rtl }))
        break
      }
      const label = text.slice(i + 1, close)
      runs.push(
        new TextRun({
          text: label,
          style: 'Hyperlink',
          rightToLeft: rtl,
        }),
      )
      i = paren + 1
    }
  }
  return runs.length ? runs : [new TextRun({ text: '', rightToLeft: rtl })]
}

function textBlockToParagraphs(markdown, lang) {
  const lines = (markdown || '').split(/\r?\n/)
  const paragraphs = []
  const align = alignFor(lang)
  const rtl = isRTL(lang)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (trimmed.startsWith('- ')) {
      paragraphs.push(
        new Paragraph({
          children: parseInlineToRuns(trimmed.slice(2), lang),
          alignment: align,
          bidirectional: rtl,
          bullet: { level: 0 },
        }),
      )
    } else {
      paragraphs.push(
        new Paragraph({
          children: parseInlineToRuns(trimmed, lang),
          alignment: align,
          bidirectional: rtl,
        }),
      )
    }
  }
  return paragraphs
}

function headingBlockToParagraph(block, lang) {
  const level = block.data.level ?? 2
  const levelMap = {
    1: HeadingLevel.HEADING_1,
    2: HeadingLevel.HEADING_2,
    3: HeadingLevel.HEADING_3,
  }
  return new Paragraph({
    heading: levelMap[level] || HeadingLevel.HEADING_2,
    alignment: alignFor(lang),
    bidirectional: isRTL(lang),
    children: [
      new TextRun({
        text: block.data.text || '',
        bold: true,
        rightToLeft: isRTL(lang),
      }),
    ],
  })
}

function tableBlockToTable(block, lang) {
  const { headers = [], rows = [] } = block.data
  if (headers.length === 0) return null
  const align = alignFor(lang)
  const rtl = isRTL(lang)
  const headerRow = new TableRow({
    children: headers.map(
      (h) =>
        new TableCell({
          children: [
            new Paragraph({
              alignment: align,
              bidirectional: rtl,
              children: [
                new TextRun({ text: String(h), bold: true, rightToLeft: rtl }),
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
                  alignment: align,
                  bidirectional: rtl,
                  children: [
                    new TextRun({
                      text: String(row[i] ?? ''),
                      rightToLeft: rtl,
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

function imageBlockToParagraph(block, lang) {
  const { src, caption } = block.data
  const dict = dictFor(lang)
  const align = alignFor(lang)
  const rtl = isRTL(lang)
  if (!src) return []
  const imageRun = src.startsWith('data:') ? dataUrlToImageRun(src) : null
  if (!imageRun) {
    return [
      new Paragraph({
        alignment: align,
        bidirectional: rtl,
        children: [
          new TextRun({
            text: dict.export.imageFallback(src),
            italics: true,
            rightToLeft: rtl,
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
        bidirectional: rtl,
        children: [
          new TextRun({
            text: caption,
            italics: true,
            size: 20,
            rightToLeft: rtl,
          }),
        ],
      }),
    )
  }
  return out
}

function dividerParagraph(lang) {
  return new Paragraph({
    alignment: alignFor(lang),
    border: {
      bottom: {
        color: '999999',
        size: 6,
        space: 1,
        style: BorderStyle.SINGLE,
      },
    },
    children: [new TextRun({ text: '', rightToLeft: isRTL(lang) })],
  })
}

function blockToDocxNodes(block, lang) {
  const dict = dictFor(lang)
  switch (block.type) {
    case 'heading':
      return [headingBlockToParagraph(block, lang)]
    case 'text':
      return textBlockToParagraphs(block.data.markdown, lang)
    case 'divider':
      return [dividerParagraph(lang)]
    case 'image':
      return imageBlockToParagraph(block, lang)
    case 'table': {
      const t = tableBlockToTable(block, lang)
      return t ? [t, new Paragraph({ children: [] })] : []
    }
    case 'chart':
      return [
        new Paragraph({
          alignment: alignFor(lang),
          bidirectional: isRTL(lang),
          children: [
            new TextRun({
              text: dict.export.chartNotIncluded(block.data.title),
              italics: true,
              rightToLeft: isRTL(lang),
            }),
          ],
        }),
      ]
    default:
      return []
  }
}

export async function exportReportDOCX(title, blocks, lang = 'he') {
  const dict = dictFor(lang)
  const rtl = isRTL(lang)
  const titleParagraph = new Paragraph({
    alignment: alignFor(lang),
    bidirectional: rtl,
    spacing: { after: 400 },
    children: [
      new TextRun({
        text: title || dict.export.fallbackTitle,
        bold: true,
        size: 48,
        rightToLeft: rtl,
      }),
    ],
  })

  const body = blocks.flatMap((b) => blockToDocxNodes(b, lang))

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: defaultFont(lang), rightToLeft: rtl },
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
  a.download = `${title || dict.export.fallbackTitle}.docx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
