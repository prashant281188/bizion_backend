import xlsx from "xlsx"


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

export function parseExcel(filePath: string) {

  const workbook = xlsx.readFile(filePath)

  const sheet = workbook.Sheets[workbook.SheetNames[0]]

  return xlsx.utils.sheet_to_json(sheet) as productData[]

}