import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useReportStore } from '../store/reportStore'
import BlockMenu from './BlockMenu'
import SortableBlock from './SortableBlock'

export default function Editor() {
  const blocks = useReportStore((s) => s.blocks)
  const moveBlock = useReportStore((s) => s.moveBlock)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const fromIndex = blocks.findIndex((b) => b.id === active.id)
    const toIndex = blocks.findIndex((b) => b.id === over.id)
    if (fromIndex === -1 || toIndex === -1) return
    moveBlock(fromIndex, toIndex)
  }

  return (
    <section
      aria-label="עורך"
      className="flex h-full w-1/2 flex-col overflow-y-auto border-l border-subtle bg-paper"
    >
      <div className="mx-auto w-full max-w-2xl p-8">
        {blocks.length === 0 ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <BlockMenu afterId={null} large />
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={blocks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              {blocks.map((block) => (
                <div key={block.id}>
                  <SortableBlock block={block} />
                  <BlockMenu afterId={block.id} />
                </div>
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </section>
  )
}
