import * as XLSX from 'xlsx'

export async function parseExcel(file) {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheets = workbook.SheetNames
  const data = {}

  for (const name of sheets) {
    const sheet = workbook.Sheets[name]
    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: '',
      blankrows: false,
    })
    const headers = (rows[0] ?? []).map((h, i) =>
      h === '' || h == null ? `עמודה ${i + 1}` : String(h),
    )
    const dataRows = rows.slice(1).map((row) =>
      headers.map((_, i) => (row[i] ?? '').toString()),
    )
    data[name] = { headers, rows: dataRows }
  }

  return { fileName: file.name, sheets, data }
}
