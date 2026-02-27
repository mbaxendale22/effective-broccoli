import { supabase } from '../config/supabase.js'

const ALLOWED_STATUSES = [
    'pending',
    'paid',
    'processing',
    'shipped',
    'cancelled',
]

const DASHBOARD_FILTERS = ['all', 'paid', 'shipped']

const normalizeDashboardFilter = (filter) => {
    if (!filter) {
        return 'all'
    }

    const normalizedFilter = String(filter).toLowerCase()
    return DASHBOARD_FILTERS.includes(normalizedFilter)
        ? normalizedFilter
        : 'all'
}

const getOrdersAndItems = async (statusFilter = 'all') => {
    let ordersQuery = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

    if (statusFilter !== 'all') {
        ordersQuery = ordersQuery.eq('status', statusFilter)
    }

    const { data: orders, error: ordersError } = await ordersQuery

    if (ordersError) {
        throw ordersError
    }

    const orderIds = orders.map((order) => order.id)
    let itemsByOrderId = {}

    if (orderIds.length > 0) {
        const { data: orderItems, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .in('order_id', orderIds)
            .order('id', { ascending: true })

        if (itemsError) {
            throw itemsError
        }

        itemsByOrderId = orderItems.reduce((acc, item) => {
            if (!acc[item.order_id]) {
                acc[item.order_id] = []
            }

            acc[item.order_id].push(item)
            return acc
        }, {})
    }

    return { orders, itemsByOrderId }
}

export const renderOrdersDashboard = async (req, res) => {
    const selectedFilter = normalizeDashboardFilter(req.query.filter)

    try {
        const { orders, itemsByOrderId } =
            await getOrdersAndItems(selectedFilter)

        return res.render('orders-dashboard', {
            orders,
            itemsByOrderId,
            allowedStatuses: ALLOWED_STATUSES,
            filters: DASHBOARD_FILTERS,
            selectedFilter,
            error: null,
        })
    } catch (error) {
        console.error('Error loading orders dashboard:', error)
        return res.status(500).render('orders-dashboard', {
            orders: [],
            itemsByOrderId: {},
            allowedStatuses: ALLOWED_STATUSES,
            filters: DASHBOARD_FILTERS,
            selectedFilter,
            error: 'Unable to load orders right now.',
        })
    }
}

export const getFilteredOrders = async (req, res) => {
    const selectedFilter = normalizeDashboardFilter(req.query.filter)

    try {
        const { orders, itemsByOrderId } =
            await getOrdersAndItems(selectedFilter)

        return res.json({
            orders,
            itemsByOrderId,
            selectedFilter,
            filters: DASHBOARD_FILTERS,
            allowedStatuses: ALLOWED_STATUSES,
        })
    } catch (error) {
        console.error('Error loading filtered orders:', error)
        return res.status(500).json({
            error: 'Unable to load filtered orders right now.',
        })
    }
}

export const updateOrderStatus = async (req, res) => {
    const orderId = Number(req.params.orderId)
    const { status, filter } = req.body
    const selectedFilter = normalizeDashboardFilter(filter)

    if (!Number.isInteger(orderId)) {
        return res.status(400).send('Invalid order id')
    }

    if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).send('Invalid order status')
    }

    const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)

    if (error) {
        console.error('Error updating order status:', error)
        return res.status(500).send('Unable to update order status')
    }

    return res.redirect(`/admin/orders?filter=${selectedFilter}`)
}
