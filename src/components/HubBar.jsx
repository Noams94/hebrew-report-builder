import { ArrowLeft } from 'lucide-react'

export default function HubBar() {
  return (
    <div className="flex items-center justify-between border-b border-subtle bg-white px-6 py-1.5 text-xs">
      <div className="flex items-center gap-2 font-medium text-ink/80">
        <span>📄</span>
        <span>בונה דוחות</span>
      </div>
      <a
        href="https://tools.noamkeshet.com"
        className="flex items-center gap-1 text-ink/60 transition hover:text-accent"
      >
        <ArrowLeft size={12} />
        <span>כל הכלים</span>
      </a>
    </div>
  )
}
