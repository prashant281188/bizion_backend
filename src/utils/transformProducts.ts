export function transformProduct(product: any) {

    const optionsMap: Record<string, Set<string>> = {}
    const variants = []

    for (const variant of product.variants) {

        const optionObj: Record<string, string> = {}

        for (const ov of variant.optionValues) {

            const name = ov.optionValue.option.name
            const value = ov.optionValue.value

            optionObj[name] = value

            if (!optionsMap[name]) {
                optionsMap[name] = new Set()
            }

            optionsMap[name].add(value)
        }

        variants.push({
            sku: variant.sku,
            packing: String(variant.packing),
        })
    }

    const options = Object.entries(optionsMap).map(
        ([name, values]) => ({
            name,
            values: Array.from(values)
        })
    )

    return {
        product: {
            id: product.id,
            model: product.model,
            brand: product.brand.name,
            category: product.category.name
        },
        options,
        variants
    }
}