import {
    getOrderItemsByOrderIds,
    getOrders,
    getOrderStatusById,
    updateOrderStatusById,
} from '../api/orders.js'

const ALLOWED_TRANSITIONS = ['shipped', 'cancelled']

const DASHBOARD_FILTERS = ['all', 'processing', 'shipped', 'cancelled']

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
    const { data: orders, error: ordersError } = await getOrders(statusFilter)

    if (ordersError) {
        throw ordersError
    }

    const orderIds = orders.map((order) => order.id)
    let itemsByOrderId = {}

    if (orderIds.length > 0) {
        const { data: orderItems, error: itemsError } =
            await getOrderItemsByOrderIds(orderIds)

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
            filters: DASHBOARD_FILTERS,
            selectedFilter,
            error: null,
        })
    } catch (error) {
        console.error('Error loading orders dashboard:', error)
        return res.status(500).render('orders-dashboard', {
            orders: [],
            itemsByOrderId: {},
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

    if (!ALLOWED_TRANSITIONS.includes(status)) {
        return res.status(400).send('Invalid order status')
    }

    const { data: currentOrder, error: currentOrderError } =
        await getOrderStatusById(orderId)

    if (currentOrderError) {
        console.error('Error loading current order status:', currentOrderError)
        return res.status(500).send('Unable to validate current order status')
    }

    if (!currentOrder) {
        return res.status(404).send('Order not found')
    }

    const currentStatus = currentOrder.status

    if (currentStatus === 'cancelled') {
        return res.status(409).send('Cancelled orders cannot be updated')
    }

    if (currentStatus === 'shipped' && status === 'shipped') {
        return res.status(409).send('Order is already marked as shipped')
    }

    const { error } = await updateOrderStatusById(orderId, status)

    if (error) {
        console.error('Error updating order status:', error)
        return res.status(500).send('Unable to update order status')
    }

    return res.redirect(`/admin/orders?filter=${selectedFilter}`)
}
