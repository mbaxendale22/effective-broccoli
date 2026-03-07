import { supabase } from '../config/supabase.js'

export const getInventoryWithCoffeeDetails = async () =>
    supabase
        .from('inventory')
        .select(
            `
            id,
            created_at,
            coffee,
            green_inventory,
            roasted_inventory,
            coffees:coffees!inventory_coffee_fkey (
                id,
                name
            )
        `
        )
        .order('green_inventory', { ascending: false })

export const getInventoryByIds = async (inventoryIds) =>
    supabase
        .from('inventory')
        .select('id, green_inventory, roasted_inventory')
        .in('id', inventoryIds)

export const updateInventoryById = async (inventoryId, updates) =>
    supabase.from('inventory').update(updates).eq('id', inventoryId)
