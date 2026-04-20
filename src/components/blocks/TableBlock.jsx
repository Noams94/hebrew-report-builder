import { useRef } from 'react'
import { FileSpreadsheet, Plus, X } from 'lucide-react'
import { useReportStore } from '../../store/reportStore'
import { parseExcel } from '../../lib/excel'

export default function TableBlock({ block }) {
  const updateBlock = useReportStore((s) => s.updateBlock)
  const fileInputRef = useRef(null)
  const { headers = [], rows = [] } = block.data

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const result = await parseExcel(file)
    const firstSheet = result.sheets[0]
    if (!firstSheet) return
    const { headers, rows } = result.data[firstSheet]
    updateBlock(block.id, { headers, rows })
  }

  const addColumn = () => {
    const newHeaders = [...headers, `עמודה ${headers.length + 1}`]
    const newRows = rows.map((r) => [...r, ''])
    updateBlock(block.id, { headers: newHeaders, rows: newRows })
  }

  const addRow = () => {
    const newRow = headers.length ? headers.map(() => '') : ['']
    const nextHeaders = headers.length ? headers : ['עמודה 1']
    updateBlock(block.id, { headers: nextHeaders, rows: [...rows, newRow] })
  }

  const updateHeader = (index, value) => {
    const next = headers.slice()
    next[index] = value
    updateBlock(block.id, { headers: next })
  }

  const updateCell = (rowIndex, colIndex, value) => {
    const next = rows.map((r) => r.slice())
    next[rowIndex][colIndex] = value
    updateBlock(block.id, { rows: next })
  }

  const removeColumn = (index) => {
    const newHeaders = headers.filter((_, i) => i !== index)
    const newRows = rows.map((r) => r.filter((_, i) => i !== index))
    updateBlock(block.id, { headers: newHeaders, rows: newRows })
  }

  const removeRow = (index) => {
    updateBlock(block.id, { rows: rows.filter((_, i) => i !== index) })
  }

  if (headers.length === 0 && rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-subtle py-8 text-center">
        <FileSpreadsheet size={32} strokeWidth={1.5} className="text-ink/40" />
        <p className="text-sm text-ink/60">טבלה ריקה — ייבא מ-Excel או הוסף עמודה/שורה</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-md border border-subtle bg-white px-3 py-1.5 text-xs text-ink/80 hover:bg-paper"
          >
            ייבא מ-Excel
          </button>
          <button
            type="button"
            onClick={addColumn}
            className="rounded-md border border-subtle bg-white px-3 py-1.5 text-xs text-ink/80 hover:bg-paper"
          >
            הוסף עמודה
          </button>
          <button
            type="button"
            onClick={addRow}
            className="rounded-md border border-subtle bg-white px-3 py-1.5 text-xs text-ink/80 hover:bg-paper"
          >
            הוסף שורה
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleImport}
          className="hidden"
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-lg border border-subtle bg-white">
        <table className="w-full text-sm">
          <thead className="bg-paper">
            <tr>
              {headers.map((header, i) => (
                <th key={i} className="border-b border-subtle p-2 text-right">
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={header}
                      onChange={(e) => updateHeader(i, e.target.value)}
                      className="w-full bg-transparent font-medium text-ink focus:outline-none"
                    />
                    <button
                      type="button"
                      aria-label="הסר עמודה"
                      onClick={() => removeColumn(i)}
                      className="text-ink/30 hover:text-red-600"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="group/row">
                {row.map((cell, colIndex) => (
                  <td key={colIndex} className="border-b border-subtle/50 p-2">
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                      className="w-full bg-transparent text-ink focus:outline-none"
                    />
                  </td>
                ))}
                <td className="p-2">
                  <button
                    type="button"
                    aria-label="הסר שורה"
                    onClick={() => removeRow(rowIndex)}
                    className="text-ink/20 opacity-0 hover:text-red-600 group-hover/row:opacity-100"
                  >
                    <X size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={addColumn}
          className="flex items-center gap-1 rounded border border-subtle bg-white px-2 py-1 text-xs text-ink/70 hover:bg-paper"
        >
          <Plus size={12} />
          עמודה
        </button>
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1 rounded border border-subtle bg-white px-2 py-1 text-xs text-ink/70 hover:bg-paper"
        >
          <Plus size={12} />
          שורה
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded border border-subtle bg-white px-2 py-1 text-xs text-ink/70 hover:bg-paper"
        >
          ייבא מ-Excel
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleImport}
          className="hidden"
        />
      </div>
    </div>
  )
}
