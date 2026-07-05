import Anthropic from '@anthropic-ai/sdk'

// ─── In-memory rate limiter (per serverless instance) ───────────────────────
const rateLimitMap = new Map()
const RATE_LIMIT_MAX = 30
const RATE_LIMIT_WINDOW = 3600000 // 1 hour

function isRateLimited(ip) {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return false
  }
  entry.count++
  return entry.count > RATE_LIMIT_MAX
}

// Only the models the report builder actually offers — keeps a leaked endpoint
// from being used as a general-purpose relay to expensive models.
const ALLOWED_MODELS = new Set([
  'claude-haiku-4-5-20251001',
  'claude-haiku-4-5',
  'claude-sonnet-4-6',
  'claude-opus-4-7',
])

const MAX_SYSTEM_LENGTH = 5000
const MAX_PROMPT_LENGTH = 60000

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'AI proxy is not configured on the server' })
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests' })
  }

  const { model, systemPrompt, userPrompt } = req.body ?? {}
  if (typeof systemPrompt !== 'string' || typeof userPrompt !== 'string' || !userPrompt.trim()) {
    return res.status(400).json({ error: 'Invalid request body' })
  }
  if (systemPrompt.length > MAX_SYSTEM_LENGTH || userPrompt.length > MAX_PROMPT_LENGTH) {
    return res.status(400).json({ error: 'Prompt too long' })
  }
  const effectiveModel = typeof model === 'string' && model ? model : 'claude-haiku-4-5-20251001'
  if (!ALLOWED_MODELS.has(effectiveModel)) {
    return res.status(400).json({ error: 'Model not allowed' })
  }

  try {
    const client = new Anthropic()
    const message = await client.messages.create({
      model: effectiveModel,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })
    if (message.stop_reason === 'refusal') {
      return res.status(422).json({ error: 'The model declined this request' })
    }
    const text = message.content.find((b) => b.type === 'text')?.text ?? ''
    if (!text) {
      return res.status(502).json({ error: 'Empty response from model' })
    }
    return res.status(200).json({ text: text.trim() })
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ error: 'Upstream rate limit — try again shortly' })
    }
    if (err instanceof Anthropic.APIError) {
      console.error('[generate] Anthropic API error:', err.status, err.message)
      return res.status(502).json({ error: 'AI request failed' })
    }
    console.error('[generate] Unexpected error:', err)
    return res.status(500).json({ error: 'AI request failed' })
  }
}
