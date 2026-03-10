import { supabase } from '../config/supabase.js'

const ALLOWED_WEBSTORE_STATUSES = new Set(['UP', 'MAINTENANCE', 'BREAK'])

export const getCurrentWebstoreOperationalState = async () => {
    try {
        const { data, error } = await supabase
            .from('operational_status')
            .select('webstore_status, webstore_message')
            .limit(1)

        if (error) {
            throw error
        }

        const status = data?.[0]?.webstore_status
        const message = data?.[0]?.webstore_message ?? null

        if (!ALLOWED_WEBSTORE_STATUSES.has(status)) {
            return {
                status: 'UP',
                message,
            }
        }

        return {
            status,
            message,
        }
    } catch (error) {
        console.error('Unable to load operational status:', error)
        return {
            status: 'UP',
            message: null,
        }
    }
}

export const getCurrentWebstoreStatus = async () => {
    const { status } = await getCurrentWebstoreOperationalState()
    return status
}
