import { supabase } from '../config/supabase.js'

export const addToCart = (req, res) => {
    const { coffeeId, quantity } = req.body

    if (!req.session.cart) {
        req.session.cart = []
    }

    const existingItem = req.session.cart.find(
        (item) => item.coffeeId === parseInt(coffeeId)
    )

    if (existingItem) {
        existingItem.quantity += parseInt(quantity)
    } else {
        req.session.cart.push({
            coffeeId: parseInt(coffeeId),
            quantity: parseInt(quantity),
        })
    }

    res.redirect('/cart')
}

export const renderCart = async (req, res) => {
    const cart = req.session.cart || []

    if (cart.length === 0) {
        return res.render('cart', { items: [], total: 0 })
    }

    // const coffeeIds = cart.map((item) => item.coffeeId)
    // test
    const coffeeIds = [2]

    const { data: coffees } = await supabase
        .from('coffees')
        .select('*')
        .in('id', coffeeIds)

    const items = cart.map((cartItem) => {
        const coffee = coffees.find((c) => c.id === cartItem.coffeeId)

        return {
            ...coffee,
            quantity: cartItem.quantity,
            lineTotal: coffee.price_250 * cartItem.quantity,
        }
    })

    const total = items.reduce((sum, item) => sum + item.lineTotal, 0)

    res.render('cart', { items, total })
}
