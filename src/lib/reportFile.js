const SCHEMA = 'hebrew-report-builder'
const SCHEMA_VERSION = 2

const sanitizeFilename = (name) =>
  String(name || 'דוח')
    .trim()
    .replace(/[\\/:*?"<>|]/g, '-')
    .slice(0, 120) || 'דוח'

export function serializeReport(report) {
  return {
    schema: SCHEMA,
    version: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    report: {
      id: report.id,
      title: report.title ?? 'דוח חדש',
      blocks: report.blocks ?? [],
      theme: report.theme ?? {},
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    },
  }
}

export function downloadReportJSON(report) {
  const payload = serializeReport(report)
  const json = JSON.stringify(payload, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${sanitizeFilename(report.title)}.hrb.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const ALLOWED_BLOCK_TYPES = new Set([
  'heading',
  'text',
  'image',
  'chart',
  'table',
  'divider',
  'likert',
  'stats',
  'map',
  'cover',
])

function validateBlock(block) {
  if (!block || typeof block !== 'object') {
    throw new Error('בלוק לא תקין')
  }
  if (!ALLOWED_BLOCK_TYPES.has(block.type)) {
    throw new Error(`סוג בלוק לא מוכר: ${block.type}`)
  }
  if (typeof block.id !== 'string' || !block.id) {
    throw new Error('בלוק חסר מזהה')
  }
  if (!block.data || typeof block.data !== 'object') {
    throw new Error(`לבלוק ${block.type} אין נתונים`)
  }
}

export function parseReportJSON(text) {
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('הקובץ אינו JSON תקין')
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('הקובץ ריק או פגום')
  }
  if (parsed.schema !== SCHEMA) {
    throw new Error('הקובץ אינו בפורמט Hebrew Report Builder')
  }
  if (typeof parsed.version !== 'number' || parsed.version > SCHEMA_VERSION) {
    throw new Error(`גרסת הקובץ (${parsed.version}) אינה נתמכת`)
  }
  const r = parsed.report
  if (!r || typeof r !== 'object') {
    throw new Error('הקובץ לא מכיל דוח')
  }
  const blocks = Array.isArray(r.blocks) ? r.blocks : []
  blocks.forEach(validateBlock)
  return {
    id: typeof r.id === 'string' ? r.id : undefined,
    title: typeof r.title === 'string' ? r.title : 'דוח מיובא',
    blocks,
    theme: r.theme && typeof r.theme === 'object' ? r.theme : {},
    createdAt: typeof r.createdAt === 'number' ? r.createdAt : undefined,
    updatedAt: typeof r.updatedAt === 'number' ? r.updatedAt : undefined,
  }
}

export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('כשל בקריאת הקובץ'))
    reader.readAsText(file, 'utf-8')
  })
}
