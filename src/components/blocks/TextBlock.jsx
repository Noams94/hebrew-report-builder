import { useEffect, useRef, useState } from 'react'
import { Sparkles, Check, X, Loader2, PenLine } from 'lucide-react'
import { useReportStore } from '../../store/reportStore'
import { useSettingsStore } from '../../store/settingsStore'
import { polishText, composeText, POLISH_LABELS } from '../../lib/ai'
import { useT, useDir } from '../../i18n'

const EXTRA = {
  he: {
    emptyText: 'אין טקסט לעריכה',
    aiError: 'שגיאה ב-AI',
    composeEmpty: 'כתוב קודם מה אתה רוצה שינוסח',
    composedLabel: 'נוסח מרעיון',
    proposalTitle: 'הצעת AI',
    aiMenuLabel: 'עוזר AI',
    composeTitle: 'נסח מרעיון',
    composePlaceholder: 'נקודות, בולטים, מחשבות — ה-AI ינסח מהם פסקה...',
    composeHint: 'Cmd+Enter לשליחה',
    composeSend: 'נסח',
    apply: 'החל',
    reject: 'דחה',
    close: 'סגור',
  },
  en: {
    emptyText: 'No text to edit',
    aiError: 'AI error',
    composeEmpty: 'Describe what you want drafted first',
    composedLabel: 'Drafted from brief',
    proposalTitle: 'AI suggestion',
    aiMenuLabel: 'AI assistant',
    composeTitle: 'Draft from brief',
    composePlaceholder: 'Notes, bullets, thoughts — AI will turn them into a paragraph...',
    composeHint: 'Cmd+Enter to send',
    composeSend: 'Draft',
    apply: 'Apply',
    reject: 'Reject',
    close: 'Close',
  },
}

export default function TextBlock({ block }) {
  const updateBlock = useReportStore((s) => s.updateBlock)
  const aiMode = useSettingsStore((s) => s.aiMode)
  const t = useT()
  const dir = useDir()
  const lang = useReportStore((s) => s.lang || 'he')
  const L = EXTRA[lang] || EXTRA.he
  const aiPanelPos = dir === 'rtl' ? '-left-1' : '-right-1'
  const aiMenuPos = dir === 'rtl' ? 'left-0' : 'right-0'
  const markdown = block.data.markdown ?? ''
  const ref = useRef(null)
  const menuRef = useRef(null)
  const briefRef = useRef(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [proposal, setProposal] = useState(null)
  const [error, setError] = useState(null)
  const [composeOpen, setComposeOpen] = useState(false)
  const [brief, setBrief] = useState('')

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [markdown])

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  useEffect(() => {
    if (composeOpen) {
      setTimeout(() => briefRef.current?.focus(), 50)
    }
  }, [composeOpen])

  const runPolish = async (instructionKey) => {
    setMenuOpen(false)
    setError(null)
    if (!markdown.trim()) {
      setError(L.emptyText)
      return
    }
    setBusy(true)
    try {
      const result = await polishText(markdown, instructionKey)
      setProposal({ text: result, label: POLISH_LABELS[instructionKey] })
    } catch (err) {
      setError(err.message || L.aiError)
    } finally {
      setBusy(false)
    }
  }

  const runCompose = async () => {
    setError(null)
    if (!brief.trim()) {
      setError(L.composeEmpty)
      return
    }
    setBusy(true)
    try {
      const result = await composeText(brief, markdown)
      setProposal({ text: result, label: L.composedLabel })
      setComposeOpen(false)
      setBrief('')
    } catch (err) {
      setError(err.message || L.aiError)
    } finally {
      setBusy(false)
    }
  }

  const openCompose = () => {
    setMenuOpen(false)
    setComposeOpen(true)
    setError(null)
  }

  const acceptProposal = () => {
    if (!proposal) return
    updateBlock(block.id, { markdown: proposal.text })
    setProposal(null)
  }

  const rejectProposal = () => setProposal(null)

  return (
    <div className="relative">
      <textarea
        ref={ref}
        value={markdown}
        onChange={(e) => updateBlock(block.id, { markdown: e.target.value })}
        placeholder={t.blocks.text.placeholder}
        rows={1}
        className="w-full resize-none bg-transparent font-sans text-base leading-relaxed text-ink placeholder:text-ink/30 focus:outline-none"
      />

      {aiMode !== 'off' && !proposal && !composeOpen && (
        <div
          ref={menuRef}
          className={`absolute ${aiPanelPos} top-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100`}
        >
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            disabled={busy}
            aria-label={L.aiMenuLabel}
            title={L.aiMenuLabel}
            className="flex items-center gap-1 rounded-full border border-subtle bg-white px-2 py-1 text-xs text-ink/70 shadow-sm hover:bg-paper disabled:opacity-50"
          >
            {busy ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Sparkles size={12} />
            )}
            {!busy && 'AI'}
          </button>
          {menuOpen && (
            <div
              role="menu"
              className={`absolute ${aiMenuPos} top-full z-10 mt-1 w-40 overflow-hidden rounded-md border border-subtle bg-white text-xs shadow-lg`}
            >
              <button
                type="button"
                role="menuitem"
                onClick={openCompose}
                className="flex w-full items-center gap-2 border-b border-subtle px-3 py-2 text-start font-medium text-accent hover:bg-paper"
              >
                <PenLine size={12} /> {L.composeTitle}
              </button>
              {Object.entries(POLISH_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="menuitem"
                  onClick={() => runPolish(key)}
                  className="block w-full px-3 py-2 text-start hover:bg-paper"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {composeOpen && (
        <div className="mt-2 rounded-lg border border-accent bg-blue-50/50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1 text-xs font-medium text-accent">
              <PenLine size={12} /> {L.composeTitle}
            </span>
            <button
              type="button"
              onClick={() => {
                setComposeOpen(false)
                setBrief('')
              }}
              aria-label={L.close}
              className="rounded p-1 text-ink/50 hover:bg-white"
            >
              <X size={14} />
            </button>
          </div>
          <textarea
            ref={briefRef}
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder={L.composePlaceholder}
            rows={4}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') runCompose()
            }}
            className="w-full rounded border border-subtle bg-white p-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-ink/50">{L.composeHint}</span>
            <button
              type="button"
              onClick={runCompose}
              disabled={busy || !brief.trim()}
              className="flex items-center gap-1 rounded bg-accent px-3 py-1 text-xs text-white hover:opacity-90 disabled:opacity-50"
            >
              {busy ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Sparkles size={12} />
              )}
              {L.composeSend}
            </button>
          </div>
        </div>
      )}

      {proposal && (
        <div className="mt-2 rounded-lg border border-accent bg-blue-50/50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-accent">
              {L.proposalTitle}: {proposal.label}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={acceptProposal}
                className="flex items-center gap-1 rounded bg-accent px-2 py-1 text-xs text-white hover:opacity-90"
              >
                <Check size={12} /> {L.apply}
              </button>
              <button
                type="button"
                onClick={rejectProposal}
                className="flex items-center gap-1 rounded border border-subtle bg-white px-2 py-1 text-xs text-ink/70 hover:bg-paper"
              >
                <X size={12} /> {L.reject}
              </button>
            </div>
          </div>
          <div className="whitespace-pre-wrap text-sm text-ink/90">
            {proposal.text}
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-2 rounded border border-red-300 bg-red-50 px-2 py-1 text-xs text-red-700"
        >
          {error}
        </div>
      )}
    </div>
  )
}
