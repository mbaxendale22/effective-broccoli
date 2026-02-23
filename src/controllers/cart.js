import { supabase } from '../config/supabase.js'

export const addToCart = (req, res) => {
    const { coffeeId } = req.body

    if (!req.session.cart) {
        req.session.cart = []
    }

    const existingItem = req.session.cart.find(
        (item) => item.coffeeId === coffeeId
    )

    if (existingItem) {
        existingItem.quantity += 1
    } else {
        req.session.cart.push({
            coffeeId: coffeeId,
            quantity: 1,
        })
    }

    const cartCount = req.session.cart.reduce(
        (sum, item) => sum + item.quantity,
        0
    )

    req.session.cart.forEach((cartItem) => {
        console.log('id', cartItem.coffeeId)
        console.log('quantity', cartItem.quantity)
    })

    res.json({
        success: true,
        cartCount,
    })
}

export const renderCart = async (req, res) => {
    const cart = req.session.cart || []

    if (cart.length === 0) {
        return res.render('cart', { items: [], total: 0 })
    }

    const coffeeIds = cart.map((item) => item.coffeeId)

    const { data: coffees, error } = await supabase
        .from('coffees')
        .select('*')
        .in('stripe_price_id', coffeeIds)

    if (error) {
        console.error(error)
        return res.status(500).send('Database error')
    }

    const items = cart
        .map((cartItem) => {
            const coffee = coffees.find(
                (c) => c.stripe_price_id === cartItem.coffeeId
            )

            if (!coffee) return null

            return {
                ...coffee,
                quantity: cartItem.quantity,
                lineTotal: coffee.price_250 * cartItem.quantity,
            }
        })
        .filter(Boolean)

    const total = items.reduce((sum, item) => sum + item.lineTotal, 0)

    res.render('cart', { items, total })
}

export const getCartData = async (req, res) => {
    const cart = req.session.cart || []

    if (cart.length === 0) {
        return res.json({ items: [], total: 0 })
    }

    const coffeeIds = cart.map((item) => item.coffeeId)

    const { data: coffees, error } = await supabase
        .from('coffees')
        .select('*')
        .in('stripe_price_id', coffeeIds)

    if (error) {
        console.error(error)
        return res.status(500).json({ error: 'Database error' })
    }

    const items = cart
        .map((cartItem) => {
            const coffee = coffees.find(
                (c) => c.stripe_price_id === cartItem.coffeeId
            )

            if (!coffee) return null

            return {
                ...coffee,
                quantity: cartItem.quantity,
                lineTotal: coffee.price_250 * cartItem.quantity,
            }
        })
        .filter(Boolean)

    const total = items.reduce((sum, item) => sum + item.lineTotal, 0)

    res.json({ items, total })
}

export const getCartCount = (req, res) => {
    const cart = req.session.cart || []
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
    res.json({ cartCount })
}

export const updateCartItem = (req, res) => {
    const { coffeeId, action } = req.body

    if (!req.session.cart) {
        req.session.cart = []
    }

    const existingItem = req.session.cart.find(
        (item) => item.coffeeId === coffeeId
    )

    if (!existingItem) {
        return res
            .status(404)
            .json({ success: false, error: 'Item not found in cart' })
    }

    if (action === 'increase') {
        existingItem.quantity += 1
    } else if (action === 'decrease') {
        existingItem.quantity -= 1
        // Remove item if quantity reaches 0
        if (existingItem.quantity <= 0) {
            req.session.cart = req.session.cart.filter(
                (item) => item.coffeeId !== coffeeId
            )
        }
    } else {
        return res.status(400).json({ success: false, error: 'Invalid action' })
    }

    const cartCount = req.session.cart.reduce(
        (sum, item) => sum + item.quantity,
        0
    )

    res.json({
        success: true,
        cartCount,
    })
}

export const removeFromCart = (req, res) => {
    const { coffeeId } = req.body

    if (!req.session.cart) {
        req.session.cart = []
    }

    req.session.cart = req.session.cart.filter(
        (item) => item.coffeeId !== coffeeId
    )

    const cartCount = req.session.cart.reduce(
        (sum, item) => sum + item.quantity,
        0
    )

    res.json({
        success: true,
        cartCount,
    })
}
