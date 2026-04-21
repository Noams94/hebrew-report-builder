import { useReportStore } from '../../store/reportStore'
import { useT } from '../../i18n'

const SIZE_BY_LEVEL = {
  1: 'text-3xl font-bold',
  2: 'text-2xl font-semibold',
  3: 'text-xl font-semibold',
}

export default function HeadingBlock({ block }) {
  const updateBlock = useReportStore((s) => s.updateBlock)
  const t = useT()
  const { level = 2, text = '' } = block.data

  return (
    <div className="flex items-center gap-3">
      <select
        value={level}
        onChange={(e) => updateBlock(block.id, { level: Number(e.target.value) })}
        aria-label={t.blocks.heading.placeholder}
        className="rounded border border-subtle bg-white px-2 py-1 text-xs text-ink/70"
      >
        <option value={1}>H1</option>
        <option value={2}>H2</option>
        <option value={3}>H3</option>
      </select>
      <input
        type="text"
        value={text}
        onChange={(e) => updateBlock(block.id, { text: e.target.value })}
        placeholder={`${t.blocks.heading.placeholder}...`}
        className={`flex-1 bg-transparent text-ink placeholder:text-ink/30 focus:outline-none ${SIZE_BY_LEVEL[level]}`}
      />
    </div>
  )
}
