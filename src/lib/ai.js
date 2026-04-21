import { useSettingsStore } from '../store/settingsStore'

export const POLISH_INSTRUCTIONS = {
  improve: 'שפר את הניסוח והבהירות של הטקסט מבלי לשנות את המשמעות.',
  shorten: 'קצר את הטקסט. שמור על הטענות המרכזיות.',
  formal: 'הפוך את הסגנון לרשמי יותר, מקצועי ונייטרלי.',
  translate_en: 'תרגם את הטקסט לאנגלית תוך שמירה על הסגנון והמבנה.',
  expand: 'הרחב את הטקסט: הוסף דוגמאות ומידע תומך אם מתאים.',
}

export const POLISH_LABELS = {
  improve: 'שפר',
  shorten: 'קצר',
  formal: 'רשמי יותר',
  translate_en: 'תרגם לאנגלית',
  expand: 'הרחב',
}

const SYSTEM_PROMPT = `אתה עוזר כתיבה מקצועי לדוחות בעברית. משתמש יזין לך טקסט ב-Markdown פשוט (עם **הדגשה**, *נטייה*, [קישור](url), ורשימות בתחילית "- "). החזר טקסט ב-Markdown באותו פורמט. אל תוסיף הסברים, התנצלויות או הערות — רק את הטקסט המתוקן.`

async function callClaude({ apiKey, model, systemPrompt, userPrompt }) {
  if (!apiKey) throw new Error('חסר API key של Claude')
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: model || 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`Claude API ${res.status}: ${txt.slice(0, 200)}`)
  }
  const data = await res.json()
  const content = data?.content?.[0]?.text
  if (!content) throw new Error('תגובה ריקה מ-Claude')
  return content.trim()
}

async function callOllama({ url, model, systemPrompt, userPrompt }) {
  const res = await fetch(`${url.replace(/\/$/, '')}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model || 'llama3',
      prompt: `${systemPrompt}\n\n${userPrompt}`,
      stream: false,
    }),
  })
  if (!res.ok) {
    throw new Error(`Ollama ${res.status}`)
  }
  const data = await res.json()
  return (data?.response || '').trim()
}

export function aiEnabled() {
  return useSettingsStore.getState().aiMode !== 'off'
}

export async function composeText(brief, existingText = '') {
  const settings = useSettingsStore.getState()
  if (settings.aiMode === 'off') {
    throw new Error('AI כבוי. הפעל בהגדרות.')
  }
  const contextPart = existingText
    ? `\n\n--- טקסט קיים (לרקע, אל תכלול אותו בתשובה) ---\n${existingText}\n--- סוף ---`
    : ''
  const userPrompt = `נסח פסקה מקצועית בעברית ב-Markdown על סמך הרעיונות הבאים. אורך טבעי (1-3 פסקאות), סגנון רשמי ובהיר לדוח. השתמש ב-**הדגשה** לנקודות מפתח.

--- רעיונות/נקודות גולמיות ---
${brief}
--- סוף ---${contextPart}

החזר רק את הטקסט המנוסח, בלי הסברים.`

  const systemPrompt = `אתה עוזר כתיבה לדוחות בעברית. קלט: רעיונות גולמיים / נקודות / מחשבות של המשתמש. פלט: פסקה מקצועית ב-Markdown.`

  if (settings.aiMode === 'claude') {
    return callClaude({
      apiKey: settings.claudeApiKey,
      model: settings.claudeModel,
      systemPrompt,
      userPrompt,
    })
  }
  return callOllama({
    url: settings.ollamaUrl,
    model: settings.ollamaModel,
    systemPrompt,
    userPrompt,
  })
}

export async function polishText(text, instructionKey) {
  const settings = useSettingsStore.getState()
  if (settings.aiMode === 'off') {
    throw new Error('AI כבוי. הפעל בהגדרות.')
  }
  const instruction =
    POLISH_INSTRUCTIONS[instructionKey] || POLISH_INSTRUCTIONS.improve
  const userPrompt = `${instruction}\n\n--- הטקסט ---\n${text}\n--- סוף ---\n\nהחזר רק את הטקסט המתוקן, בלי שום מלל נוסף.`

  if (settings.aiMode === 'claude') {
    return callClaude({
      apiKey: settings.claudeApiKey,
      model: settings.claudeModel,
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
    })
  }
  return callOllama({
    url: settings.ollamaUrl,
    model: settings.ollamaModel,
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
  })
}

export async function dataInsights(rows, headers, context = '') {
  const settings = useSettingsStore.getState()
  if (settings.aiMode === 'off') {
    throw new Error('AI כבוי. הפעל בהגדרות.')
  }
  const sample = rows.slice(0, 30)
  const dataBlock = [headers.join('\t'), ...sample.map((r) => r.join('\t'))].join('\n')
  const userPrompt = `נתח את הטבלה הבאה וכתוב 3-5 תובנות קצרות וקונקרטיות ב-Markdown, עם בולטים. אם ההקשר רלוונטי, קח אותו בחשבון.
${context ? `\nהקשר: ${context}\n` : ''}
נתונים:
${dataBlock}`

  const systemPrompt = `אתה אנליסט נתונים. תתרכז בתובנות שימושיות וברורות. ענה בעברית.`

  if (settings.aiMode === 'claude') {
    return callClaude({
      apiKey: settings.claudeApiKey,
      model: settings.claudeModel,
      systemPrompt,
      userPrompt,
    })
  }
  return callOllama({
    url: settings.ollamaUrl,
    model: settings.ollamaModel,
    systemPrompt,
    userPrompt,
  })
}
