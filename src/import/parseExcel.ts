import ExcelJS from "exceljs"


export type productData = {
  brand: string,
  model: string,
  category: string,
  finish?: string,
  hsn?: string,
  taxt_rate?: number,
  tax_group?: string,
  size?: string,
  size_type?: string,
  packing: number,
  unit_symbol: string,
  unit: string,
  metal?: string,
  manufacure?: string,
  mrp?: string;
  discount?: number,
  sale?: string;
  purchase?: string
}

export async function parseExcel(filePath: string): Promise<productData[]> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(filePath)

  const worksheet = workbook.worksheets[0]
  const headers: string[] = []
  const rows: productData[] = []
  let isFirstRow = true

  worksheet.eachRow({ includeEmpty: false }, (row) => {
    const values = row.values as ExcelJS.CellValue[]
    // row.values is 1-indexed; index 0 is always undefined
    if (isFirstRow) {
      isFirstRow = false
      for (let i = 1; i < values.length; i++) {
        headers.push(String(values[i] ?? ""))
      }
      return
    }
    const obj: Record<string, any> = {}
    for (let i = 1; i < values.length; i++) {
      if (headers[i - 1]) {
        obj[headers[i - 1]] = values[i] ?? undefined
      }
    }
    rows.push(obj as productData)
  })

  return rows
}
