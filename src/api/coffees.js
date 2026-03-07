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
        return []
    }
}

export const getCoffeeByStripePriceId = async (stripePriceId) =>
    supabase
        .from('coffees')
        .select('*')
        .eq('stripe_price_id', stripePriceId)
        .maybeSingle()

export const getCoffeesByStripePriceIds = async (stripePriceIds) =>
    supabase.from('coffees').select('*').in('stripe_price_id', stripePriceIds)

export const getCoffeesForWebhookByStripeIds = async (stripePriceIds) =>
    supabase
        .from('coffees')
        .select('stripe_price_id,name,price_250')
        .in('stripe_price_id', stripePriceIds)

export const getCoffeeRetailAvailabilityByStripeId = async (stripePriceId) =>
    supabase
        .from('coffees')
        .select('stripe_price_id, retail_available, name')
        .eq('stripe_price_id', stripePriceId)
        .maybeSingle()

export const updateCoffeeRetailAvailability = async ({
    stripePriceId,
    nextAvailable,
    currentAvailable,
}) =>
    supabase
        .from('coffees')
        .update({ retail_available: nextAvailable })
        .eq('stripe_price_id', stripePriceId)
        .eq('retail_available', currentAvailable)
        .select('stripe_price_id')
