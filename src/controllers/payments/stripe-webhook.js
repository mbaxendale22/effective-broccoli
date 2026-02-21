import { stripe } from '../../config/stripe.js'
import { supabase } from '../../config/supabase.js'

export const handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature']

    let event

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        )
    } catch (err) {
        console.log('Webhook signature verification failed.', err.message)
        return res.sendStatus(400)
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object

        // ✅ Fulfill order here
        // Save to database
        try {
            // 1️⃣ Insert order (idempotent)
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert([
                    {
                        stripe_session_id: session.id,
                        stripe_payment_intent_id: session.payment_intent,
                        customer_email: session.customer_details?.email,
                        shipping_name:
                            session.collected_information.shipping_details.name,
                        shipping_address:
                            session.collected_information.shipping_details
                                .address,
                        amount_subtotal: session.amount_subtotal,
                        amount_shipping: session.total_details?.amount_shipping,
                        amount_total: session.amount_total,
                        currency: session.currency,
                        status: 'paid',
                    },
                ])
                .select()
                .single()

            // If duplicate (webhook retry)
            if (orderError && orderError.code === '23505') {
                return res.json({ received: true })
            }

            if (orderError) {
                throw orderError
            }

            // 2️⃣ Get Stripe line items
            const lineItems = await stripe.checkout.sessions.listLineItems(
                session.id,
                { limit: 100 }
            )

            // 3️⃣ Insert order_items
            const orderItemsToInsert = lineItems.data.map((item) => ({
                order_id: order.id,
                stripe_price_id: item.price.id,
                name: item.description,
                unit_price: item.price.unit_amount,
                quantity: item.quantity,
                line_total: item.amount_total,
            }))

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItemsToInsert)

            if (itemsError) {
                console.log('error saving line items to db')
                throw itemsError
            }

            console.log('Order saved to Supabase ☕')
        } catch (err) {
            console.error('DB Error:', err)
            return res.sendStatus(500)
        }
    }
    // Send confirmation email
    // Ship product

    res.json({ received: true })
}
// session object returned from stripe.checkout.sessions.create
// {
//   id: 'cs_test_a1VYs2TTzFkWosOAk5xQorMg8yc53im66w3wUZOKSPJ9Uh2N0OfzKOU6IF',
//   object: 'checkout.session',
//   adaptive_pricing: null,
//   after_expiration: null,
//   allow_promotion_codes: null,
//   amount_subtotal: 5000,
//   amount_total: 5000,
//   automatic_tax: { enabled: false, liability: null, provider: null, status: null },
//   billing_address_collection: null,
//   cancel_url: 'http://localhost:5173/',
//   client_reference_id: null,
//   client_secret: null,
//   collected_information: {
//     shipping_details: { address: [Object], name: 'Matthew Baxendale' }
//   },
//   consent: null,
//   consent_collection: null,
//   created: 1754206143,
//   currency: 'gbp',
//   currency_conversion: null,
//   custom_fields: [],
//   custom_text: {
//     after_submit: null,
//     shipping_address: null,
//     submit: null,
//     terms_of_service_acceptance: null
//   },
//   customer: 'cus_SnXRnUFmttlKpm',
//   customer_creation: 'always',
//   customer_details: {
//     address: {
//       city: 'Birmingham',
//       country: 'GB',
//       line1: '40 Verbena Road',
//       line2: null,
//       postal_code: 'B31 1NG',
//       state: null
//     },
//     email: 'mbaxendale21@gmail.com',
//     name: 'Matthew Baxendale',
//     phone: null,
//     tax_exempt: 'none',
//     tax_ids: []
//   },
//   customer_email: 'mbaxendale21@gmail.com',
//   discounts: [],
//   expires_at: 1754292543,
//   invoice: 'in_1RrwMCJTYSs2cASf0y4H4E57',
//   invoice_creation: null,
//   livemode: false,
//   locale: null,
//   metadata: { user_id: '54209530-931f-40f9-8e08-3be887a45cfc' },
//   mode: 'subscription',
//   origin_context: null,
//   payment_intent: null,
//   payment_link: null,
//   payment_method_collection: 'always',
//   payment_method_configuration_details: null,
//   payment_method_options: { card: { request_three_d_secure: 'automatic' } },
//   payment_method_types: [ 'card' ],
//   payment_status: 'paid',
//   permissions: null,
//   phone_number_collection: { enabled: false },
//   recovered_from: null,
//   saved_payment_method_options: {
//     allow_redisplay_filters: [ 'always' ],
//     payment_method_remove: 'disabled',
//     payment_method_save: null
//   },
//   setup_intent: null,
//   shipping_address_collection: { allowed_countries: [ 'GB' ] },
//   shipping_cost: null,
//   shipping_options: [],
//   status: 'complete',
//   submit_type: null,
//   subscription: 'sub_1RrwMDJTYSs2cASfRhXZLuXf',
//   success_url: 'http://localhost:5173/',
//   total_details: { amount_discount: 0, amount_shipping: 0, amount_tax: 0 },
//   ui_mode: 'hosted',
//   url: null,
//   wallet_options: null
// }
