import xlsx from "xlsx"


type productData = {
  model: string,
  brand:string,
  category: string,
  size?:string,
  size_type?:string,
  finish?:string,
  packing: number,
  unit:string,
  metal?:string,
  manufacure?:string,
  mrp?:string;
  purchase?:string
  sale?:string;
}

export function parseExcel(filePath: string) {

  const workbook = xlsx.readFile(filePath)

  const sheet = workbook.Sheets[workbook.SheetNames[0]]

  return xlsx.utils.sheet_to_json(sheet) as productData[]

}