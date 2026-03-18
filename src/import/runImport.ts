import { importProducts } from "./importProducts"

async function run() {

  console.log("Starting product import...")

  await importProducts()

  console.log("Import finished")

  process.exit(0)

}

run()