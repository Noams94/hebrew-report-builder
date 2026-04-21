import { useEffect, useRef, useState } from 'react'
import {
  Plus,
  Type,
  AlignRight,
  Image as ImageIcon,
  BarChart3,
  Table,
  Minus,
  ListChecks,
  Calculator,
  Map as MapIcon,
  FileText,
} from 'lucide-react'
import { useReportStore } from '../store/reportStore'

const BLOCK_TYPES = [
  { type: 'heading', label: 'כותרת', Icon: Type },
  { type: 'text', label: 'טקסט', Icon: AlignRight },
  { type: 'image', label: 'תמונה', Icon: ImageIcon },
  { type: 'chart', label: 'גרף', Icon: BarChart3 },
  { type: 'table', label: 'טבלה', Icon: Table },
  { type: 'likert', label: 'Likert', Icon: ListChecks },
  { type: 'stats', label: 'סטטיסטיקה', Icon: Calculator },
  { type: 'map', label: 'מפה', Icon: MapIcon },
  { type: 'cover', label: 'עמוד שער', Icon: FileText },
  { type: 'divider', label: 'מפריד', Icon: Minus },
]

export default function BlockMenu({ afterId = null, large = false }) {
  const addBlock = useReportStore((s) => s.addBlock)
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

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
            <span className="text-base font-medium">
              התחל לכתוב — בחר סוג בלוק
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="הוסף בלוק"
            className="flex h-7 items-center gap-1 rounded-full border border-subtle bg-white px-3 text-xs text-ink/50 transition hover:border-accent hover:text-accent"
          >
            <Plus size={14} />
            <span>הוסף בלוק</span>
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
