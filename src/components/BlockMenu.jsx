import { useEffect, useRef, useState } from 'react'
import {
  Plus,
  Type,
  AlignLeft,
  AlignRight,
  Image as ImageIcon,
  BarChart3,
  Table,
  Minus,
  ListChecks,
  Calculator,
  Map as MapIcon,
  FileText,
  TrendingUp,
} from 'lucide-react'
import { useReportStore } from '../store/reportStore'
import { useT, useDir } from '../i18n'

export default function BlockMenu({ afterId = null, large = false }) {
  const addBlock = useReportStore((s) => s.addBlock)
  const t = useT()
  const dir = useDir()
  const TextAlignIcon = dir === 'rtl' ? AlignRight : AlignLeft
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  const BLOCK_TYPES = [
    { type: 'heading', label: t.blockMenu.heading, Icon: Type },
    { type: 'text', label: t.blockMenu.text, Icon: TextAlignIcon },
    { type: 'image', label: t.blockMenu.image, Icon: ImageIcon },
    { type: 'chart', label: t.blockMenu.chart, Icon: BarChart3 },
    { type: 'table', label: t.blockMenu.table, Icon: Table },
    { type: 'likert', label: t.blockMenu.likert, Icon: ListChecks },
    { type: 'nps', label: t.blockMenu.nps, Icon: TrendingUp },
    { type: 'stats', label: t.blockMenu.stats, Icon: Calculator },
    { type: 'map', label: t.blockMenu.map, Icon: MapIcon },
    { type: 'cover', label: t.blockMenu.cover, Icon: FileText },
    { type: 'divider', label: t.blockMenu.divider, Icon: Minus },
  ]

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleSelect = (type) => {
    addBlock(type, afterId)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="group/menu relative my-2 flex justify-center">
      {!open &&
        (large ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-subtle bg-white/50 px-10 py-8 text-ink/70 transition hover:border-accent hover:text-accent"
          >
            <Plus size={28} />
            <span className="text-base font-medium">{t.blockMenu.start}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={t.blockMenu.addAria}
            className="flex h-7 items-center gap-1 rounded-full border border-subtle bg-white px-3 text-xs text-ink/50 transition hover:border-accent hover:text-accent"
          >
            <Plus size={14} />
            <span>{t.blockMenu.add}</span>
          </button>
        ))}

      {open && (
        <div
          role="menu"
          className="z-10 flex flex-wrap gap-1 rounded-lg border border-subtle bg-white p-2 shadow-sm"
        >
          {BLOCK_TYPES.map(({ type, label, Icon }) => (
            <button
              key={type}
              type="button"
              role="menuitem"
              onClick={() => handleSelect(type)}
              className="flex min-w-[90px] flex-col items-center gap-1 rounded-md px-3 py-2 text-xs text-ink/80 transition hover:bg-paper hover:text-ink"
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
