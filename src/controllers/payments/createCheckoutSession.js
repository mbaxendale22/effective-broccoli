import { stripe } from '../../config/stripe.js'
import { supabase } from '../../config/supabase.js'

const serializeCartSnapshot = (cart) =>
    cart
        .map((item) => {
            const safeCoffeeId = encodeURIComponent(item.coffeeId)
            const safeQuantity = Number(item.quantity) || 0
            const safeGrind = item.grind || 'whole_beans'
            return `${safeCoffeeId}:${safeQuantity}:${safeGrind}`
        })
        .join('|')

const aggregateCartForStripe = (cart) => {
    const aggregatedItemsByCoffeeId = cart.reduce((acc, item) => {
        const coffeeId = item.coffeeId
        const quantity = Number(item.quantity) || 0

        if (!coffeeId || quantity <= 0) {
            return acc
        }

        acc[coffeeId] = (acc[coffeeId] || 0) + quantity
        return acc
    }, {})

    return Object.entries(aggregatedItemsByCoffeeId).map(
        ([coffeeId, quantity]) => ({
            coffeeId,
            quantity,
        })
    )
}

export const createCheckoutSession = async (req, res) => {
    const cart = req.session.cart

    if (!cart || cart.length === 0) {
        return res.redirect('/')
    }

    const aggregatedCartItems = aggregateCartForStripe(cart)

    if (!aggregatedCartItems.length) {
        return res.redirect('/')
    }

    const coffeeIds = aggregatedCartItems.map((item) => item.coffeeId)

    const { data: coffees, error: coffeesError } = await supabase
        .from('coffees')
        .select('*')
        .in('stripe_price_id', coffeeIds)

    if (coffeesError) {
        console.error('Error loading coffees for checkout:', coffeesError)
        return res.status(500).send('Unable to create checkout session.')
    }

    const coffeesByStripePriceId = coffees.reduce((acc, coffee) => {
        acc[coffee.stripe_price_id] = coffee
        return acc
    }, {})

    const line_items = aggregatedCartItems
        .map((cartItem) => {
            const coffee = coffeesByStripePriceId[cartItem.coffeeId]

            if (!coffee) {
                return null
            }

            return {
                price: coffee.stripe_price_id,
                quantity: cartItem.quantity,
            }
        })
        .filter(Boolean)

    if (!line_items.length) {
        return res
            .status(400)
            .send('Unable to create checkout for current cart.')
    }

    const cartSnapshot = serializeCartSnapshot(cart)

    if (cartSnapshot.length > 500) {
        return res
            .status(400)
            .send(
                'Cart has too many grind selections to process in one checkout.'
            )
    }

    const session = await stripe.checkout.sessions.create({
        line_items,
        mode: 'payment',
        metadata: {
            cart_snapshot: cartSnapshot,
        },
        shipping_address_collection: {
            allowed_countries: ['GB'],
        },
        shipping_options: [
            {
                shipping_rate_data: {
                    type: 'fixed_amount',
                    fixed_amount: {
                        amount: 355,
                        currency: 'gbp',
                    },
                    display_name: 'Royal Mail Tracked 48',
                    delivery_estimate: {
                        minimum: { unit: 'business_day', value: 3 },
                        maximum: { unit: 'business_day', value: 5 },
                    },
                },
            },
        ],
        success_url: `${req.protocol}://${req.get('host')}/success`,
        cancel_url: `${req.protocol}://${req.get('host')}/`,
    })

    return res.redirect(303, session.url)
}
