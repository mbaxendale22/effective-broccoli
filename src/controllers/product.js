import { supabase } from '../config/supabase.js'

export const renderProductDetails = async (req, res) => {
    const { productId } = req.params

    // TODO: Make Supabase call to fetch product details by stripe_price_id or other identifier
    const { data: item, error } = await supabase
        .from('coffees')
        .select('*')
        .eq('stripe_price_id', productId)
        .single()

    try {
        // Scaffold for Supabase call - to be implemented
        // if (error) throw error

        // For now, pass productId to view
        res.render('product-details', { item })
    } catch (error) {
        console.error('Error fetching product details:', error)
        res.status(500).send('Error loading product details')
    }
}
