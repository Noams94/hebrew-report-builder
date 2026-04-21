import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useT, useDir } from '../i18n'

export default function HubBar() {
  const t = useT()
  const dir = useDir()
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight
  return (
    <div className="flex items-center justify-between border-b border-subtle bg-white px-6 py-1.5 text-xs">
      <div className="flex items-center gap-2 font-medium text-ink/80">
        <span>📄</span>
        <span>{t.app.name}</span>
      </div>
      <a
        href="https://tools.noamkeshet.com"
        className="flex items-center gap-1 text-ink/60 transition hover:text-accent"
      >
        <Arrow size={12} />
        <span>{t.app.allTools}</span>
      </a>
    </div>
  )
}
