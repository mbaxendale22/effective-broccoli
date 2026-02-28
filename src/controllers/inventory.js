import { supabase } from '../config/supabase.js'

const ROAST_YIELD_FACTOR = 0.85

const parseId = (value) => {
    const parsedValue = Number(value)
    return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null
}

const parseGrams = (value) => {
    if (value === undefined || value === null || value === '') {
        return null
    }

    const grams = Number(value)
    if (!Number.isFinite(grams) || grams < 0) {
        return null
    }

    return Math.round(grams)
}

const buildInventoryRedirect = ({ success, error }) => {
    const searchParams = new URLSearchParams()

    if (success) {
        searchParams.set('success', success)
    }

    if (error) {
        searchParams.set('error', error)
    }

    const queryString = searchParams.toString()
    return queryString ? `/admin/inventory?${queryString}` : '/admin/inventory'
}

const getInventoryPageData = async () => {
    const { data: inventoryRows, error: inventoryError } = await supabase
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

    if (inventoryError) {
        throw inventoryError
    }

    return {
        rows: inventoryRows || [],
    }
}

export const renderInventory = async (req, res) => {
    try {
        const { rows } = await getInventoryPageData()

        return res.render('inventory', {
            rows,
            error: req.query.error || null,
            success: req.query.success || null,
        })
    } catch (error) {
        console.error('Error loading inventory:', error)

        return res.status(500).render('inventory', {
            rows: [],
            error: 'Unable to load inventory right now.',
            success: null,
        })
    }
}

export const logRoastSession = async (req, res) => {
    const roastEntries = Object.entries(req.body)
        .filter(([fieldName]) => fieldName.startsWith('roast_green_g_'))
        .map(([fieldName, fieldValue]) => {
            const inventoryId = parseId(fieldName.replace('roast_green_g_', ''))
            const greenUsed = parseGrams(fieldValue)

            if (!inventoryId || greenUsed === null || greenUsed <= 0) {
                return null
            }

            return { inventoryId, greenUsed }
        })
        .filter(Boolean)

    if (!roastEntries.length) {
        return res.redirect(
            buildInventoryRedirect({
                error: 'Enter at least one roast amount greater than 0 grams.',
            })
        )
    }

    const inventoryIds = roastEntries.map((entry) => entry.inventoryId)

    const { data: inventoryRows, error: loadError } = await supabase
        .from('inventory')
        .select('id, green_inventory, roasted_inventory')
        .in('id', inventoryIds)

    if (loadError) {
        console.error('Error loading inventory for roast session:', loadError)
        return res.redirect(
            buildInventoryRedirect({
                error: 'Unable to load inventory records for roast session.',
            })
        )
    }

    const inventoryById = (inventoryRows || []).reduce((acc, row) => {
        acc[row.id] = row
        return acc
    }, {})

    for (const entry of roastEntries) {
        const inventoryRow = inventoryById[entry.inventoryId]

        if (!inventoryRow) {
            return res.redirect(
                buildInventoryRedirect({
                    error: `Inventory item ${entry.inventoryId} was not found.`,
                })
            )
        }

        const availableGreen = Number(inventoryRow.green_inventory || 0)
        if (entry.greenUsed > availableGreen) {
            return res.redirect(
                buildInventoryRedirect({
                    error: `Not enough green inventory for item ${entry.inventoryId}.`,
                })
            )
        }
    }

    for (const entry of roastEntries) {
        const inventoryRow = inventoryById[entry.inventoryId]
        const currentGreen = Number(inventoryRow.green_inventory || 0)
        const currentRoasted = Number(inventoryRow.roasted_inventory || 0)
        const roastedAdded = Math.round(entry.greenUsed * ROAST_YIELD_FACTOR)

        const { error: updateError } = await supabase
            .from('inventory')
            .update({
                green_inventory: currentGreen - entry.greenUsed,
                roasted_inventory: currentRoasted + roastedAdded,
            })
            .eq('id', entry.inventoryId)

        if (updateError) {
            console.error(
                'Error updating inventory from roast session:',
                updateError
            )
            return res.redirect(
                buildInventoryRedirect({
                    error: 'Unable to complete roast session update.',
                })
            )
        }
    }

    return res.redirect(
        buildInventoryRedirect({
            success: 'Roast session logged and inventory updated.',
        })
    )
}
