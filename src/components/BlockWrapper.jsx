import { forwardRef } from 'react'
import { GripVertical, Copy, Trash2 } from 'lucide-react'
import { useReportStore } from '../store/reportStore'
import { useT, useDir } from '../i18n'

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
  const t = useT()
  const dir = useDir()
  const actionsPositionClass = dir === 'rtl' ? 'left-full ml-1' : 'right-full mr-1'

  return (
    <div
      ref={ref}
      style={style}
      className={`group relative rounded-lg border border-transparent px-3 py-2 transition hover:border-subtle ${
        isDragging ? 'opacity-50' : ''
      }`}
      {...rest}
    >
      <div
        className={`absolute top-1/2 ${actionsPositionClass} flex -translate-y-1/2 flex-col gap-1 opacity-0 transition group-hover:opacity-100`}
      >
        <button
          type="button"
          aria-label={t.blockWrapper.dragAria}
          className="rounded p-1 text-ink/60 hover:bg-subtle hover:text-ink"
          {...dragHandleProps}
        >
          <GripVertical size={14} />
        </button>
        <button
          type="button"
          aria-label={t.blockWrapper.duplicateAria}
          onClick={() => duplicateBlock(block.id)}
          className="rounded p-1 text-ink/60 hover:bg-subtle hover:text-ink"
        >
          <Copy size={14} />
        </button>
        <button
          type="button"
          aria-label={t.blockWrapper.deleteAria}
          onClick={() => {
            if (window.confirm(t.blockWrapper.deleteConfirm)) {
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
