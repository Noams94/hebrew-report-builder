import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import BlockWrapper from './BlockWrapper'
import HeadingBlock from './blocks/HeadingBlock'
import TextBlock from './blocks/TextBlock'
import ImageBlock from './blocks/ImageBlock'
import ChartBlock from './blocks/ChartBlock'
import TableBlock from './blocks/TableBlock'
import DividerBlock from './blocks/DividerBlock'

const BLOCK_COMPONENTS = {
  heading: HeadingBlock,
  text: TextBlock,
  image: ImageBlock,
  chart: ChartBlock,
  table: TableBlock,
  divider: DividerBlock,
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
      <Block block={block} />
    </BlockWrapper>
  )
}
