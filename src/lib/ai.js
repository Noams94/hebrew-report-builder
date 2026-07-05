import { useSettingsStore } from '../store/settingsStore'
import { useReportStore } from '../store/reportStore'

const LOCALIZED = {
  he: {
    polishInstructions: {
      improve: 'שפר את הניסוח והבהירות של הטקסט מבלי לשנות את המשמעות.',
      shorten: 'קצר את הטקסט. שמור על הטענות המרכזיות.',
      formal: 'הפוך את הסגנון לרשמי יותר, מקצועי ונייטרלי.',
      translate_en: 'תרגם את הטקסט לאנגלית תוך שמירה על הסגנון והמבנה.',
      expand: 'הרחב את הטקסט: הוסף דוגמאות ומידע תומך אם מתאים.',
    },
    polishLabels: {
      improve: 'שפר',
      shorten: 'קצר',
      formal: 'רשמי יותר',
      translate_en: 'תרגם לאנגלית',
      expand: 'הרחב',
    },
    systemPolish:
      'אתה עוזר כתיבה מקצועי לדוחות בעברית. משתמש יזין לך טקסט ב-Markdown פשוט (עם **הדגשה**, *נטייה*, [קישור](url), ורשימות בתחילית "- "). החזר טקסט ב-Markdown באותו פורמט. אל תוסיף הסברים, התנצלויות או הערות — רק את הטקסט המתוקן.',
    systemCompose:
      'אתה עוזר כתיבה לדוחות בעברית. קלט: רעיונות גולמיים / נקודות / מחשבות של המשתמש. פלט: פסקה מקצועית ב-Markdown.',
    systemInsights: 'אתה אנליסט נתונים. תתרכז בתובנות שימושיות וברורות. ענה בעברית.',
    composeUser: (brief, context) =>
      `נסח פסקה מקצועית בעברית ב-Markdown על סמך הרעיונות הבאים. אורך טבעי (1-3 פסקאות), סגנון רשמי ובהיר לדוח. השתמש ב-**הדגשה** לנקודות מפתח.\n\n--- רעיונות/נקודות גולמיות ---\n${brief}\n--- סוף ---${context}\n\nהחזר רק את הטקסט המנוסח, בלי הסברים.`,
    composeContext: (text) => `\n\n--- טקסט קיים (לרקע, אל תכלול אותו בתשובה) ---\n${text}\n--- סוף ---`,
    polishUser: (instruction, text) =>
      `${instruction}\n\n--- הטקסט ---\n${text}\n--- סוף ---\n\nהחזר רק את הטקסט המתוקן, בלי שום מלל נוסף.`,
    insightsUser: (context, data) =>
      `נתח את הטבלה הבאה וכתוב 3-5 תובנות קצרות וקונקרטיות ב-Markdown, עם בולטים. אם ההקשר רלוונטי, קח אותו בחשבון.${context ? `\nהקשר: ${context}\n` : ''}\nנתונים:\n${data}`,
    errors: {
      aiOff: 'AI כבוי. הפעל בהגדרות.',
      noKey: 'חסר API key של Claude',
      proxyUnavailable: 'שירות ה-AI של האתר אינו זמין כרגע. אפשר להזין API key אישי בהגדרות.',
      empty: 'תגובה ריקה מ-Claude',
      ollamaUnreachable: (url) =>
        `לא הצלחתי להתחבר ל-Ollama ב-${url}. ודא ש-\`ollama serve\` רץ.`,
      ollamaCorsHttps: (origin) =>
        `ב-HTTPS צריך לאפשר את המקור הזה ב-Ollama. ב-macOS עם אפליקציית Ollama: \`launchctl setenv OLLAMA_ORIGINS "${origin}"\`, ואז Quit ופתיחה מחדש של Ollama משורת התפריטים.`,
      ollamaModelMissing: (model) =>
        `המודל "${model}" לא נמצא ב-Ollama. הרץ \`ollama pull ${model}\` או בחר מודל אחר בהגדרות.`,
      ollamaCorsBlocked: (origin) =>
        `Ollama דחתה את הבקשה (CORS). ב-macOS עם אפליקציית Ollama: \`launchctl setenv OLLAMA_ORIGINS "${origin}"\`, ואז Quit ופתיחה מחדש של Ollama.`,
      ollamaGeneric: (status, body) =>
        `שגיאה מ-Ollama (${status})${body ? `: ${body}` : ''}`,
    },
  },
  en: {
    polishInstructions: {
      improve: 'Improve the wording and clarity of the text without changing its meaning.',
      shorten: 'Shorten the text. Keep the main claims.',
      formal: 'Make the style more formal, professional, and neutral.',
      translate_en: 'Translate the text to Hebrew while preserving style and structure.',
      expand: 'Expand the text: add examples and supporting information where appropriate.',
    },
    polishLabels: {
      improve: 'Polish',
      shorten: 'Shorten',
      formal: 'More formal',
      translate_en: 'Translate to Hebrew',
      expand: 'Expand',
    },
    systemPolish:
      'You are a professional writing assistant for English-language reports. The user will provide text in simple Markdown (with **bold**, *italic*, [link](url), and "- " bullets). Return Markdown in the same format. Do not add explanations, apologies, or notes — only the edited text.',
    systemCompose:
      'You are a writing assistant for reports. Input: raw ideas / bullets / thoughts from the user. Output: a professional paragraph in Markdown.',
    systemInsights: 'You are a data analyst. Focus on useful, clear insights. Respond in English.',
    composeUser: (brief, context) =>
      `Draft a professional paragraph in English Markdown based on the following ideas. Natural length (1-3 paragraphs), formal and clear report style. Use **bold** for key points.\n\n--- Raw ideas / notes ---\n${brief}\n--- End ---${context}\n\nReturn only the drafted text, no explanations.`,
    composeContext: (text) => `\n\n--- Existing text (for context, do not include in the answer) ---\n${text}\n--- End ---`,
    polishUser: (instruction, text) =>
      `${instruction}\n\n--- Text ---\n${text}\n--- End ---\n\nReturn only the edited text, with no additional prose.`,
    insightsUser: (context, data) =>
      `Analyze the following table and write 3-5 short, concrete insights in Markdown with bullets. If the context is relevant, take it into account.${context ? `\nContext: ${context}\n` : ''}\nData:\n${data}`,
    errors: {
      aiOff: 'AI is off. Enable it in Settings.',
      noKey: 'Missing Claude API key',
      proxyUnavailable: "The site's AI service is currently unavailable. You can enter a personal API key in Settings.",
      empty: 'Empty response from Claude',
      ollamaUnreachable: (url) =>
        `Couldn't connect to Ollama at ${url}. Make sure \`ollama serve\` is running.`,
      ollamaCorsHttps: (origin) =>
        `Over HTTPS, Ollama must allow this origin. On macOS with the Ollama app: \`launchctl setenv OLLAMA_ORIGINS "${origin}"\`, then Quit and reopen Ollama from the menu bar.`,
      ollamaModelMissing: (model) =>
        `Model "${model}" not found in Ollama. Run \`ollama pull ${model}\` or pick another model in Settings.`,
      ollamaCorsBlocked: (origin) =>
        `Ollama rejected the request (CORS). On macOS with the Ollama app: \`launchctl setenv OLLAMA_ORIGINS "${origin}"\`, then Quit and reopen Ollama.`,
      ollamaGeneric: (status, body) =>
        `Ollama error (${status})${body ? `: ${body}` : ''}`,
    },
  },
}

function localized() {
  const lang = useReportStore.getState().lang || 'he'
  return LOCALIZED[lang] || LOCALIZED.he
}

export const POLISH_INSTRUCTIONS = new Proxy(
  {},
  {
    get: (_, key) => localized().polishInstructions[key],
    ownKeys: () => Object.keys(LOCALIZED.he.polishInstructions),
    getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
  },
)

export const POLISH_LABELS = new Proxy(
  {},
  {
    get: (_, key) => localized().polishLabels[key],
    ownKeys: () => Object.keys(LOCALIZED.he.polishLabels),
    getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
  },
)

// Server-side proxy — the deployed site holds the API key in a Vercel env var,
// so users don't need to paste a key. A user-supplied key (fully local usage)
// still takes the direct-call path below.
async function callClaudeProxy({ model, systemPrompt, userPrompt }) {
  const L = localized()
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, systemPrompt, userPrompt }),
  })
  if (!res.ok) {
    if (res.status === 503) throw new Error(L.errors.proxyUnavailable)
    const data = await res.json().catch(() => null)
    throw new Error(`Claude API ${res.status}: ${data?.error ?? ''}`)
  }
  const data = await res.json()
  if (!data?.text) throw new Error(L.errors.empty)
  return data.text
}

async function callClaude({ apiKey, model, systemPrompt, userPrompt }) {
  const L = localized()
  if (!apiKey) return callClaudeProxy({ model, systemPrompt, userPrompt })
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
  if (!content) throw new Error(L.errors.empty)
  return content.trim()
}

async function callOllama({ url, model, systemPrompt, userPrompt }) {
  const L = localized()
  const base = url.replace(/\/$/, '')
  const effectiveModel = model || 'llama3'
  const origin =
    typeof window !== 'undefined' ? window.location.origin : ''
  const isHttps =
    typeof window !== 'undefined' && window.location.protocol === 'https:'

  let res
  try {
    res = await fetch(`${base}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: effectiveModel,
        prompt: `${systemPrompt}\n\n${userPrompt}`,
        stream: false,
      }),
    })
  } catch {
    const hint = isHttps ? ` ${L.errors.ollamaCorsHttps(origin)}` : ''
    throw new Error(`${L.errors.ollamaUnreachable(base)}${hint}`)
  }

  if (res.status === 404) {
    throw new Error(L.errors.ollamaModelMissing(effectiveModel))
  }
  if (res.status === 403) {
    throw new Error(L.errors.ollamaCorsBlocked(origin))
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(L.errors.ollamaGeneric(res.status, body.slice(0, 200)))
  }
  const data = await res.json()
  return (data?.response || '').trim()
}

export function aiEnabled() {
  return useSettingsStore.getState().aiMode !== 'off'
}

export async function composeText(brief, existingText = '') {
  const L = localized()
  const settings = useSettingsStore.getState()
  if (settings.aiMode === 'off') throw new Error(L.errors.aiOff)
  const contextPart = existingText ? L.composeContext(existingText) : ''
  const userPrompt = L.composeUser(brief, contextPart)
  const systemPrompt = L.systemCompose

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
  const L = localized()
  const settings = useSettingsStore.getState()
  if (settings.aiMode === 'off') throw new Error(L.errors.aiOff)
  const instruction =
    L.polishInstructions[instructionKey] || L.polishInstructions.improve
  const userPrompt = L.polishUser(instruction, text)

  if (settings.aiMode === 'claude') {
    return callClaude({
      apiKey: settings.claudeApiKey,
      model: settings.claudeModel,
      systemPrompt: L.systemPolish,
      userPrompt,
    })
  }
  return callOllama({
    url: settings.ollamaUrl,
    model: settings.ollamaModel,
    systemPrompt: L.systemPolish,
    userPrompt,
  })
}

export async function dataInsights(rows, headers, context = '') {
  const L = localized()
  const settings = useSettingsStore.getState()
  if (settings.aiMode === 'off') throw new Error(L.errors.aiOff)
  const sample = rows.slice(0, 30)
  const dataBlock = [headers.join('\t'), ...sample.map((r) => r.join('\t'))].join('\n')
  const userPrompt = L.insightsUser(context, dataBlock)

  if (settings.aiMode === 'claude') {
    return callClaude({
      apiKey: settings.claudeApiKey,
      model: settings.claudeModel,
      systemPrompt: L.systemInsights,
      userPrompt,
    })
  }
  return callOllama({
    url: settings.ollamaUrl,
    model: settings.ollamaModel,
    systemPrompt: L.systemInsights,
    userPrompt,
  })
}
