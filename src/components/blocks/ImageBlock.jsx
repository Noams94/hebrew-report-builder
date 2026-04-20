import { useRef, useState } from 'react'
import { Image as ImageIcon, RefreshCw } from 'lucide-react'
import { useReportStore } from '../../store/reportStore'

const MAX_SIZE_MB = 2

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function ImageBlock({ block }) {
  const updateBlock = useReportStore((s) => s.updateBlock)
  const fileInputRef = useRef(null)
  const dropZoneRef = useRef(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [warning, setWarning] = useState('')
  const { src, caption = '', alt = '' } = block.data

  const loadFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setWarning(`הקובץ גדול מ-${MAX_SIZE_MB}MB — ההטמעה תייצר HTML כבד`)
    } else {
      setWarning('')
    }
    const dataUrl = await readAsDataURL(file)
    updateBlock(block.id, { src: dataUrl })
  }

  const handleChange = (e) => {
    const file = e.target.files?.[0]
    if (file) loadFile(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) loadFile(file)
  }

  const handlePaste = (e) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) loadFile(file)
        e.preventDefault()
        break
      }
    }
  }

  if (!src) {
    return (
      <div
        ref={dropZoneRef}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onPaste={handlePaste}
        tabIndex={0}
        role="button"
        aria-label="העלה תמונה"
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            fileInputRef.current?.click()
          }
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed py-12 text-center transition focus:outline-none focus:ring-2 focus:ring-accent ${
          isDragOver
            ? 'border-accent bg-accent/5 text-accent'
            : 'border-subtle text-ink/50 hover:border-accent/50 hover:text-ink'
        }`}
      >
        <ImageIcon size={40} strokeWidth={1.5} />
        <p className="text-sm">
          גרור תמונה לכאן, הדבק (Ctrl+V), או לחץ להעלאה
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <img src={src} alt={alt || caption || 'תמונה בדוח'} className="max-h-96 w-full rounded object-contain" />
      {warning && <p className="text-xs text-amber-700">{warning}</p>}
      <input
        type="text"
        value={caption}
        onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
        placeholder="כיתוב לתמונה (אופציונלי)"
        className="w-full bg-transparent text-sm text-ink/70 placeholder:text-ink/30 focus:outline-none"
      />
      <input
        type="text"
        value={alt}
        onChange={(e) => updateBlock(block.id, { alt: e.target.value })}
        placeholder="טקסט חלופי (alt) לנגישות"
        className="w-full bg-transparent text-xs text-ink/50 placeholder:text-ink/30 focus:outline-none"
      />
      <button
        type="button"
        onClick={() => updateBlock(block.id, { src: null })}
        className="flex items-center gap-1 self-start text-xs text-accent hover:underline"
      >
        <RefreshCw size={12} />
        החלף תמונה
      </button>
    </div>
  )
}
