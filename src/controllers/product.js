import { getCoffeeByStripePriceId } from '../api/coffees.js'

const toMetaDescription = (value, fallback) => {
    if (!value || typeof value !== 'string') {
        return fallback
    }

    const normalized = value.replace(/\s+/g, ' ').trim()

    if (!normalized) {
        return fallback
    }

    if (normalized.length <= 155) {
        return normalized
    }

    return `${normalized.slice(0, 152).trim()}...`
}

export const renderProductDetails = async (req, res) => {
    try {
        const { productId } = req.params

        if (typeof productId !== 'string' || !productId.trim()) {
            return res
                .status(400)
                .send('Invalid product id. Please provide a valid product.')
        }

        const normalizedProductId = productId.trim()

        const { data: item, error } =
            await getCoffeeByStripePriceId(normalizedProductId)

        if (error) {
            console.error('Error fetching product details from Supabase:', {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint,
                productId: normalizedProductId,
            })

            return res
                .status(500)
                .send('Unable to load product details right now.')
        }

        if (!item) {
            return res
                .status(404)
                .send('Product not found. It may have been removed.')
        }

        const fallbackDescription =
            'Small-batch specialty coffee from Fourways with detailed producer, process, and cultivar information.'

        return res.render('product-details', {
            item,
            seo: {
                ...res.locals.seo,
                title: `${item.origin} | Fourways Coffee Roasters`,
                description: toMetaDescription(
                    item.description_summary,
                    fallbackDescription
                ),
            },
        })
    } catch (error) {
        console.error('Unexpected error in renderProductDetails:', {
            message: error?.message,
            stack: error?.stack,
            productId: req.params?.productId,
        })

        return res.status(500).send('Unexpected error loading product details.')
    }
}
