import express from 'express'
import { handleStripeWebhook } from './controllers/payments/stripe-webhook.js'
import { createCheckoutSession } from './controllers/payments/createCheckoutSession.js'
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

router.route('/').get(renderHome)
router.route('/about').get((req, res) => res.render('about'))
router.route('/product/:productId').get(renderProductDetails)
router.route('/success').get((req, res) => {
    // empty cart after successful checkout
    req.session.cart = []
    res.render('success')
})
router.route('/cancel').get((req, res) => res.render('cancel'))

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
