import { describe, it, expect, beforeEach } from 'vitest'
import { useReportStore } from './reportStore'

const get = () => useReportStore.getState()

const resetStore = () => {
  localStorage.clear()
  const state = get()
  state.setDefaultLang('he')
  state.setLang('he')
  const ids = Object.keys(state.reports)
  ids.forEach((id) => state.deleteReport(id))
}

describe('reportStore', () => {
  beforeEach(() => {
    resetStore()
  })

  it('starts with no blocks', () => {
    expect(get().blocks).toEqual([])
  })

  it('addBlock appends a block of the given type', () => {
    const id = get().addBlock('heading')
    expect(get().blocks).toHaveLength(1)
    expect(get().blocks[0].id).toBe(id)
    expect(get().blocks[0].type).toBe('heading')
    expect(get().blocks[0].data).toMatchObject({ level: 2, text: '' })
  })

  it('addBlock with afterId inserts in place', () => {
    const a = get().addBlock('heading')
    const b = get().addBlock('text')
    const middle = get().addBlock('image', a)
    const types = get().blocks.map((x) => x.id)
    expect(types).toEqual([a, middle, b])
  })

  it('updateBlock merges into block.data', () => {
    const id = get().addBlock('heading')
    get().updateBlock(id, { text: 'hello', level: 1 })
    expect(get().blocks[0].data).toMatchObject({ text: 'hello', level: 1 })
  })

  it('deleteBlock removes the block', () => {
    const id = get().addBlock('heading')
    get().addBlock('text')
    get().deleteBlock(id)
    expect(get().blocks).toHaveLength(1)
    expect(get().blocks.find((b) => b.id === id)).toBeUndefined()
  })

  it('duplicateBlock inserts a deep copy after the original', () => {
    const id = get().addBlock('heading')
    get().updateBlock(id, { text: 'original' })
    get().duplicateBlock(id)
    const blocks = get().blocks
    expect(blocks).toHaveLength(2)
    expect(blocks[1].id).not.toBe(blocks[0].id)
    expect(blocks[1].data.text).toBe('original')
    blocks[1].data.text = 'changed'
    expect(blocks[0].data.text).toBe('original')
  })

  it('moveBlock reorders without losing references', () => {
    const a = get().addBlock('heading')
    const b = get().addBlock('text')
    const c = get().addBlock('divider')
    get().moveBlock(0, 2)
    expect(get().blocks.map((x) => x.id)).toEqual([b, c, a])
  })

  it('moveBlock is a no-op for invalid indices', () => {
    const a = get().addBlock('heading')
    const b = get().addBlock('text')
    get().moveBlock(0, 99)
    expect(get().blocks.map((x) => x.id)).toEqual([a, b])
  })

  it('NPS block has the expected default counts', () => {
    const id = get().addBlock('nps')
    const block = get().blocks.find((b) => b.id === id)
    expect(block.data.counts).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
  })

  it('setLang switches the language', () => {
    expect(get().lang).toBe('he')
    get().setLang('en')
    expect(get().lang).toBe('en')
  })

  it('setLang renames the title only when it is the localized default', () => {
    expect(get().lang).toBe('he')
    get().setLang('en')
    expect(get().title).toBe('New report')
    get().setTitle('My custom report')
    get().setLang('he')
    expect(get().title).toBe('My custom report')
  })

  it('createReport switches to a new report and keeps the prior one in the library', () => {
    const original = get().currentReportId
    get().createReport({ title: 'Second' })
    expect(get().title).toBe('Second')
    expect(get().currentReportId).not.toBe(original)
    expect(Object.keys(get().reports)).toHaveLength(2)
  })

  it('switchReport restores blocks from the persisted report', () => {
    const first = get().currentReportId
    get().addBlock('heading')
    expect(get().blocks).toHaveLength(1)
    get().createReport({ title: 'Empty' })
    expect(get().blocks).toHaveLength(0)
    get().switchReport(first)
    expect(get().blocks).toHaveLength(1)
  })

  it('deleteReport falls back to a fresh report when the last one is removed', () => {
    const id = get().currentReportId
    get().deleteReport(id)
    expect(Object.keys(get().reports)).toHaveLength(1)
    expect(get().blocks).toEqual([])
  })
})
