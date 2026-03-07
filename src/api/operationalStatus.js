import { supabase } from '../config/supabase.js'

const ALLOWED_WEBSTORE_STATUSES = new Set(['UP', 'MAINTENANCE', 'BREAK'])

export const getCurrentWebstoreStatus = async () => {
    try {
        const { data, error } = await supabase
            .from('operational_status')
            .select('webstore_status')
            .limit(1)

        if (error) {
            throw error
        }

        const status = data?.[0]?.webstore_status

        if (!ALLOWED_WEBSTORE_STATUSES.has(status)) {
            return 'UP'
        }

        return status
    } catch (error) {
        console.error('Unable to load operational status:', error)
        return 'UP'
    }
}
