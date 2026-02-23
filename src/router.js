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

const router = express.Router()

router.route('/').get(renderHome)
router.route('/product/:productId').get(renderProductDetails)
router.route('/success').get((req, res) => {
    // empty cart after successful checkout
    req.session.cart = []
    res.render('success')
})
router.route('/cancel').get((req, res) => res.render('cancel'))

router.route('/create-checkout-session').post(createCheckoutSession)
router.route('/cart/add').post(addToCart)
router.route('/cart/update').post(updateCartItem)
router.route('/cart/remove').post(removeFromCart)
router.route('/cart').get(renderCart)
router.route('/cart/data').get(getCartData)
router.route('/cart/count').get(getCartCount)

router.route('/stripe-webhook').post(handleStripeWebhook)

export default router
