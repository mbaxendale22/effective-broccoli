import { supabase } from '../config/supabase.js'

export const getOrders = async (statusFilter = 'all') => {
    let ordersQuery = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

    if (statusFilter !== 'all') {
        ordersQuery = ordersQuery.eq('status', statusFilter)
    }

    return ordersQuery
}

export const getOrderItemsByOrderIds = async (orderIds) =>
    supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds)
        .order('id', { ascending: true })

export const getOrderStatusById = async (orderId) =>
    supabase.from('orders').select('status').eq('id', orderId).maybeSingle()

export const updateOrderStatusById = async (orderId, status) =>
    supabase.from('orders').update({ status }).eq('id', orderId)

export const getOrderByStripeSessionId = async (stripeSessionId) =>
    supabase
        .from('orders')
        .select('id, status')
        .eq('stripe_session_id', stripeSessionId)
        .maybeSingle()

export const insertProcessingOrder = async (orderPayload) =>
    supabase.from('orders').insert([orderPayload]).select('id, status').single()

export const countOrderItemsByOrderId = async (orderId) =>
    supabase
        .from('order_items')
        .select('id', { count: 'exact', head: true })
        .eq('order_id', orderId)

export const insertOrderItems = async (orderItems) =>
    supabase.from('order_items').insert(orderItems)
