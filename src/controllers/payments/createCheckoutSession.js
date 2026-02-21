import { stripe } from '../../config/stripe.js'
import { supabase } from '../../config/supabase.js'

export const createCheckoutSession = async (req, res) => {
    const cart = req.session.cart

    if (!cart || cart.length === 0) {
        return res.redirect('/cart')
    }

    const coffeeIds = cart.map((item) => item.coffeeId)

    const { data: coffees } = await supabase
        .from('coffees')
        .select('*')
        .in('id', coffeeIds)
    const line_items = cart.map((cartItem) => {
        const coffee = coffees.find((c) => c.id === cartItem.coffeeId)

        return {
            price: coffee.stripe_price_id,
            quantity: cartItem.quantity,
        }
    })

    line_items.forEach((element) => {
        console.log(`stripe_price_id :: ${element.price}`)
    })

    const session = await stripe.checkout.sessions.create({
        line_items,
        mode: 'payment',
        shipping_address_collection: {
            allowed_countries: ['GB'],
        },
        shipping_options: [
            {
                shipping_rate_data: {
                    type: 'fixed_amount',
                    fixed_amount: {
                        amount: 500,
                        currency: 'gbp',
                    },
                    display_name: 'Standard Shipping',
                    delivery_estimate: {
                        minimum: { unit: 'business_day', value: 3 },
                        maximum: { unit: 'business_day', value: 5 },
                    },
                },
            },
        ],
        success_url: `${req.protocol}://${req.get('host')}/success`,
        cancel_url: `${req.protocol}://${req.get('host')}/cancel`,
    })

    res.redirect(303, session.url)
}
