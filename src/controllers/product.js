import { supabase } from '../config/supabase.js'

export const renderProductDetails = async (req, res) => {
    try {
        const { productId } = req.params

        if (typeof productId !== 'string' || !productId.trim()) {
            return res
                .status(400)
                .send('Invalid product id. Please provide a valid product.')
        }

        const normalizedProductId = productId.trim()

        const { data: item, error } = await supabase
            .from('coffees')
            .select('*')
            .eq('stripe_price_id', normalizedProductId)
            .maybeSingle()

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

        return res.render('product-details', { item })
    } catch (error) {
        console.error('Unexpected error in renderProductDetails:', {
            message: error?.message,
            stack: error?.stack,
            productId: req.params?.productId,
        })

        return res.status(500).send('Unexpected error loading product details.')
    }
}
