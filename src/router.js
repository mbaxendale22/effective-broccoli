import express from 'express'
import { handleStripeWebhook } from './controllers/payments/stripe-webhook.js'
import { getAllActiveCoffees } from './api/coffees.js'
import {
    createCheckoutSession,
    renderCheckoutStockIssue,
} from './controllers/payments/createCheckoutSession.js'
import {
    addToCart,
    renderCart,
    getCartData,
    getCartCount,
    updateCartItem,
    removeFromCart,
} from './controllers/cart.js'
import { renderHome } from './controllers/home.js'
import { renderProductDetails } from './controllers/product.js'
import { login, logout, renderLogin } from './controllers/auth.js'
import {
    getFilteredOrders,
    renderOrdersDashboard,
    updateOrderStatus,
} from './controllers/orders.js'
import { logRoastSession, renderInventory } from './controllers/inventory.js'
import { requireAdminAuth } from './utils/auth.js'

const router = express.Router()

router.route('/robots.txt').get((req, res) => {
    const requestBaseUrl = `${req.protocol}://${req.get('host')}`
    const sitemapUrl = `${requestBaseUrl}/sitemap.xml`

    res.type('text/plain').send(`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /cart
Disallow: /create-checkout-session
Disallow: /checkout-stock-issue
Disallow: /success
Disallow: /cancel

Sitemap: ${sitemapUrl}
`)
})

router.route('/sitemap.xml').get(async (req, res, next) => {
    try {
        const requestBaseUrl = `${req.protocol}://${req.get('host')}`
        const nowIso = new Date().toISOString()
        const coffees = await getAllActiveCoffees()

        const staticPaths = ['/', '/about', '/privacy-policy']
        const productPaths = coffees.map(
            (coffee) => `/product/${encodeURIComponent(coffee.stripe_price_id)}`
        )

        const allPaths = [...staticPaths, ...productPaths]
        const urlItems = allPaths
            .map(
                (path) => `<url>
  <loc>${requestBaseUrl}${path}</loc>
  <lastmod>${nowIso}</lastmod>
</url>`
            )
            .join('\n')

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlItems}
</urlset>`

        res.type('application/xml').send(xml)
    } catch (error) {
        next(error)
    }
})

router.route('/').get(renderHome)
router.route('/about').get((req, res) => {
    res.render('about', {
        seo: {
            ...res.locals.seo,
            title: 'About Fourways Coffee Roasters',
            description:
                'Learn about Fourways Coffee Roasters, our approach to small-batch roasting, and how to get in touch.',
        },
    })
})
router.route('/privacy-policy').get((req, res) => {
    res.render('privacy-policy', {
        seo: {
            ...res.locals.seo,
            title: 'Privacy Policy | Fourways Coffee Roasters',
            description:
                'Read the Fourways Coffee Roasters privacy policy and how personal data is handled.',
        },
    })
})
router.route('/maintenance').get((req, res) => {
    res.render('maintenance', {
        seo: {
            ...res.locals.seo,
            title: 'Maintenance | Fourways Coffee Roasters',
            description:
                'Fourways Coffee Roasters webstore maintenance updates and temporary availability information.',
            robots: 'noindex,nofollow',
        },
    })
})
router.route('/product/:productId').get(renderProductDetails)
router.route('/success').get((req, res) => {
    // empty cart after successful checkout
    req.session.cart = []
    res.render('success', {
        seo: {
            ...res.locals.seo,
            title: 'Order Success | Fourways Coffee Roasters',
            description: 'Checkout completed successfully at Fourways.',
            robots: 'noindex,nofollow',
        },
    })
})
router.route('/cancel').get((req, res) => {
    res.render('cancel', {
        seo: {
            ...res.locals.seo,
            title: 'Checkout Canceled | Fourways Coffee Roasters',
            description: 'Checkout canceled at Fourways.',
            robots: 'noindex,nofollow',
        },
    })
})
router.route('/checkout-stock-issue').get(renderCheckoutStockIssue)

router.route('/admin/login').get(renderLogin).post(login)
router.route('/admin/logout').post(logout)

router.route('/admin/orders').get(requireAdminAuth, renderOrdersDashboard)
router.route('/admin/inventory').get(requireAdminAuth, renderInventory)
router
    .route('/admin/inventory/roast-session')
    .post(requireAdminAuth, logRoastSession)
router.route('/admin/api/orders').get(requireAdminAuth, getFilteredOrders)
router
    .route('/admin/orders/:orderId/status')
    .post(requireAdminAuth, updateOrderStatus)

router.route('/create-checkout-session').post(createCheckoutSession)
router.route('/cart/add').post(addToCart)
router.route('/cart/update').post(updateCartItem)
router.route('/cart/remove').post(removeFromCart)
router.route('/cart').get(renderCart)
router.route('/cart/data').get(getCartData)
router.route('/cart/count').get(getCartCount)

router.route('/stripe-webhook').post(handleStripeWebhook)

export default router
