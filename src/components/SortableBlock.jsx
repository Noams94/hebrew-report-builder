import { lazy, Suspense } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import BlockWrapper from './BlockWrapper'
import BlockErrorBoundary from './BlockErrorBoundary'
import HeadingBlock from './blocks/HeadingBlock'
import TextBlock from './blocks/TextBlock'
import ImageBlock from './blocks/ImageBlock'
import ChartBlock from './blocks/ChartBlock'
import TableBlock from './blocks/TableBlock'
import DividerBlock from './blocks/DividerBlock'
import LikertBlock from './blocks/LikertBlock'
import StatsBlock from './blocks/StatsBlock'
import CoverBlock from './blocks/CoverBlock'
import NpsBlock from './blocks/NpsBlock'
import { useReportStore } from '../store/reportStore'
import { useT } from '../i18n'

// Leaflet is heavy and most reports have no map — load it only when needed
const MapBlock = lazy(() => import('./blocks/MapBlock'))

const BLOCK_COMPONENTS = {
  heading: HeadingBlock,
  text: TextBlock,
  image: ImageBlock,
  chart: ChartBlock,
  table: TableBlock,
  divider: DividerBlock,
  likert: LikertBlock,
  stats: StatsBlock,
  map: MapBlock,
  cover: CoverBlock,
  nps: NpsBlock,
}

export default function SortableBlock({ block }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id })
  const deleteBlock = useReportStore((s) => s.deleteBlock)
  const t = useT()

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const Block = BLOCK_COMPONENTS[block.type]
  if (!Block) return null

  return (
    <BlockWrapper
      ref={setNodeRef}
      block={block}
      style={style}
      isDragging={isDragging}
      dragHandleProps={{ ...attributes, ...listeners }}
    >
      <BlockErrorBoundary
        key={block.id}
        label={block.type}
        t={t.errorBoundary}
        onDelete={() => deleteBlock(block.id)}
      >
        <Suspense fallback={null}>
          <Block block={block} />
        </Suspense>
      </BlockErrorBoundary>
    </BlockWrapper>
  )
}
