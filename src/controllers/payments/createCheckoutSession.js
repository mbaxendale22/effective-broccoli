import { stripe } from '../../config/stripe.js'
import { getCoffeesByStripePriceIds } from '../../api/coffees.js'
import { getCurrentWebstoreStatus } from '../../api/operationalStatus.js'

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

export const renderCheckoutStockIssue = (req, res) => {
    const unavailableItems = req.session?.checkoutStockIssue || []

    if (!unavailableItems.length) {
        return res.redirect('/')
    }

    req.session.checkoutStockIssue = null

    return req.session.save(() => {
        res.render('checkout-stock-issue', {
            unavailableItems,
        })
    })
}

export const createCheckoutSession = async (req, res) => {
    const webstoreStatus = await getCurrentWebstoreStatus()

    if (webstoreStatus === 'MAINTENANCE') {
        return res.redirect('/maintenance')
    }

    const cart = req.session.cart

    if (!cart || cart.length === 0) {
        return res.redirect('/')
    }

    const aggregatedCartItems = aggregateCartForStripe(cart)

    if (!aggregatedCartItems.length) {
        return res.redirect('/')
    }

    const coffeeIds = aggregatedCartItems.map((item) => item.coffeeId)

    const { data: coffees, error: coffeesError } =
        await getCoffeesByStripePriceIds(coffeeIds)

    if (coffeesError) {
        console.error('Error loading coffees for checkout:', coffeesError)
        return res.status(500).send('Unable to create checkout session.')
    }

    const coffeesByStripePriceId = coffees.reduce((acc, coffee) => {
        acc[coffee.stripe_price_id] = coffee
        return acc
    }, {})

    const unavailableItems = aggregatedCartItems
        .map((cartItem) => {
            const coffee = coffeesByStripePriceId[cartItem.coffeeId]

            if (!coffee) {
                return {
                    coffeeId: cartItem.coffeeId,
                    coffeeName: 'Unknown coffee',
                    requested: cartItem.quantity,
                    available: 0,
                }
            }

            const availableBags = Number.isInteger(coffee.retail_available)
                ? coffee.retail_available
                : 0

            if (availableBags < cartItem.quantity) {
                return {
                    coffeeId: cartItem.coffeeId,
                    coffeeName: coffee.name,
                    requested: cartItem.quantity,
                    available: availableBags,
                }
            }

            return null
        })
        .filter(Boolean)

    if (unavailableItems.length > 0) {
        req.session.checkoutStockIssue = unavailableItems

        return req.session.save(() => {
            res.redirect('/checkout-stock-issue')
        })
    }

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
