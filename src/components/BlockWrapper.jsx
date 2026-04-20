import { forwardRef } from 'react'
import { GripVertical, Copy, Trash2 } from 'lucide-react'
import { useReportStore } from '../store/reportStore'

const BlockWrapper = forwardRef(function BlockWrapper(
  {
    block,
    children,
    dragHandleProps = {},
    style,
    isDragging = false,
    ...rest
  },
  ref,
) {
  const duplicateBlock = useReportStore((s) => s.duplicateBlock)
  const deleteBlock = useReportStore((s) => s.deleteBlock)

  return (
    <div
      ref={ref}
      style={style}
      className={`group relative rounded-lg border border-transparent px-3 py-2 transition hover:border-subtle ${
        isDragging ? 'opacity-50' : ''
      }`}
      {...rest}
    >
      <div className="absolute top-1/2 left-full ml-1 flex -translate-y-1/2 flex-col gap-1 opacity-0 transition group-hover:opacity-100">
        <button
          type="button"
          aria-label="גרור לסידור מחדש"
          className="rounded p-1 text-ink/60 hover:bg-subtle hover:text-ink"
          {...dragHandleProps}
        >
          <GripVertical size={14} />
        </button>
        <button
          type="button"
          aria-label="שכפל בלוק"
          onClick={() => duplicateBlock(block.id)}
          className="rounded p-1 text-ink/60 hover:bg-subtle hover:text-ink"
        >
          <Copy size={14} />
        </button>
        <button
          type="button"
          aria-label="מחק בלוק"
          onClick={() => {
            if (window.confirm('למחוק את הבלוק?')) {
              deleteBlock(block.id)
            }
          }}
          className="rounded p-1 text-ink/60 hover:bg-red-100 hover:text-red-700"
        >
          <Trash2 size={14} />
        </button>
      </div>
      {children}
    </div>
  )
})

export default BlockWrapper
