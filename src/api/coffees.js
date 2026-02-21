import { supabase } from '../config/supabase.js'

export const getAllActiveCoffees = async () => {
    try {
        const { data: coffees } = await supabase.from('coffees').select('*')
        return coffees.filter((coffee) => !!coffee.stripe_price_id)
    } catch (error) {
        console.log(`error fetching all coffees --> ${error}`)
    }
}
