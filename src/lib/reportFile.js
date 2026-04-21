import heDict from '../i18n/he'
import enDict from '../i18n/en'

const SCHEMA = 'hebrew-report-builder'
const SCHEMA_VERSION = 3

const dictFor = (lang) => (lang === 'en' ? enDict : heDict)

const sanitizeFilename = (name, lang = 'he') => {
  const fallback = dictFor(lang).export.fallbackTitle
  return String(name || fallback)
    .trim()
    .replace(/[\\/:*?"<>|]/g, '-')
    .slice(0, 120) || fallback
}

export function serializeReport(report) {
  const lang = report.lang || 'he'
  const dict = dictFor(lang)
  return {
    schema: SCHEMA,
    version: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    report: {
      id: report.id,
      title: report.title ?? dict.common.newReport,
      blocks: report.blocks ?? [],
      theme: report.theme ?? {},
      lang,
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
  a.download = `${sanitizeFilename(report.title, report.lang)}.hrb.json`
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

const PARSE_ERRORS = {
  he: {
    invalidBlock: 'בלוק לא תקין',
    unknownType: (t) => `סוג בלוק לא מוכר: ${t}`,
    noId: 'בלוק חסר מזהה',
    noData: (t) => `לבלוק ${t} אין נתונים`,
    notJson: 'הקובץ אינו JSON תקין',
    empty: 'הקובץ ריק או פגום',
    wrongSchema: 'הקובץ אינו בפורמט Hebrew Report Builder',
    wrongVersion: (v) => `גרסת הקובץ (${v}) אינה נתמכת`,
    noReport: 'הקובץ לא מכיל דוח',
    defaultTitle: 'דוח מיובא',
    fileReadFail: 'כשל בקריאת הקובץ',
  },
  en: {
    invalidBlock: 'Invalid block',
    unknownType: (t) => `Unknown block type: ${t}`,
    noId: 'Block is missing an id',
    noData: (t) => `Block ${t} has no data`,
    notJson: 'The file is not valid JSON',
    empty: 'The file is empty or corrupt',
    wrongSchema: 'File is not in Hebrew Report Builder format',
    wrongVersion: (v) => `File version (${v}) is not supported`,
    noReport: 'File does not contain a report',
    defaultTitle: 'Imported report',
    fileReadFail: 'Failed to read file',
  },
}

function errorsFor(lang) {
  return PARSE_ERRORS[lang] || PARSE_ERRORS.he
}

function validateBlock(block, lang) {
  const E = errorsFor(lang)
  if (!block || typeof block !== 'object') {
    throw new Error(E.invalidBlock)
  }
  if (!ALLOWED_BLOCK_TYPES.has(block.type)) {
    throw new Error(E.unknownType(block.type))
  }
  if (typeof block.id !== 'string' || !block.id) {
    throw new Error(E.noId)
  }
  if (!block.data || typeof block.data !== 'object') {
    throw new Error(E.noData(block.type))
  }
}

export function parseReportJSON(text, hintLang = 'he') {
  const E = errorsFor(hintLang)
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error(E.notJson)
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error(E.empty)
  }
  if (parsed.schema !== SCHEMA) {
    throw new Error(E.wrongSchema)
  }
  if (typeof parsed.version !== 'number' || parsed.version > SCHEMA_VERSION) {
    throw new Error(E.wrongVersion(parsed.version))
  }
  const r = parsed.report
  if (!r || typeof r !== 'object') {
    throw new Error(E.noReport)
  }
  const lang = r.lang === 'en' ? 'en' : 'he'
  const blocks = Array.isArray(r.blocks) ? r.blocks : []
  blocks.forEach((b) => validateBlock(b, lang))
  return {
    id: typeof r.id === 'string' ? r.id : undefined,
    title: typeof r.title === 'string' ? r.title : errorsFor(lang).defaultTitle,
    blocks,
    theme: r.theme && typeof r.theme === 'object' ? r.theme : {},
    lang,
    createdAt: typeof r.createdAt === 'number' ? r.createdAt : undefined,
    updatedAt: typeof r.updatedAt === 'number' ? r.updatedAt : undefined,
  }
}

export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file, 'utf-8')
  })
}
