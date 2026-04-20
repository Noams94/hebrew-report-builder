import { useEffect, useRef } from 'react'
import { useReportStore } from '../../store/reportStore'

export default function TextBlock({ block }) {
  const updateBlock = useReportStore((s) => s.updateBlock)
  const markdown = block.data.markdown ?? ''
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [markdown])

  return (
    <textarea
      ref={ref}
      value={markdown}
      onChange={(e) => updateBlock(block.id, { markdown: e.target.value })}
      placeholder="כתוב כאן... תומך ב-**bold** ו-*italic*"
      rows={1}
      className="w-full resize-none bg-transparent font-sans text-base leading-relaxed text-ink placeholder:text-ink/30 focus:outline-none"
    />
  )
}
