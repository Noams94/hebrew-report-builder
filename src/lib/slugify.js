export function slugify(text, fallback = 'section') {
  if (!text) return fallback
  const slug = String(text)
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return slug || fallback
}
