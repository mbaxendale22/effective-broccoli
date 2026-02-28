import { supabase } from '../config/supabase.js'

export const getAllActiveCoffees = async () => {
    try {
        const { data: coffees } = await supabase
            .from('coffees')
            .select('*')
            .order('price_250', { ascending: false })
        return coffees.filter(
            (coffee) => !!coffee.stripe_price_id && !!coffee.retail_available
        )
    } catch (error) {
        console.log(`error fetching all coffees --> ${error}`)
    }
}
