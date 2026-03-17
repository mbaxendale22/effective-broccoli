import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const toMoney = (amountPence, currency = 'gbp') => {
    const amount = Number(amountPence) || 0

    return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: (currency || 'gbp').toUpperCase(),
    }).format(amount / 100)
}

const escapeHtml = (value) =>
    String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')

const formatAddressHtml = (address) => {
    if (!address) {
        return '<p style="margin:0;color:#666;">No shipping address available.</p>'
    }

    const lines = [
        address.line1,
        address.line2,
        address.city,
        address.state,
        address.postal_code,
        address.country,
    ].filter(Boolean)

    if (!lines.length) {
        return '<p style="margin:0;color:#666;">No shipping address available.</p>'
    }

    return lines.map((line) => `<div>${escapeHtml(line)}</div>`).join('')
}

const getGrindLabel = (grind) => {
    if (grind === 'filter') return 'Filter Grind'
    if (grind === 'espresso') return 'Espresso Grind'
    return 'Whole Beans'
}

export const sendOrderNotificationEmail = async (orderDetails) => {
    const orderId = orderDetails?.orderId || 'Unknown'
    const currency = orderDetails?.currency || 'gbp'
    const amounts = orderDetails?.amounts || {}
    const items = Array.isArray(orderDetails?.lineItems)
        ? orderDetails.lineItems
        : []

    const lineItemsHtml =
        items.length > 0
            ? items
                  .map(
                      (item) => `
                    <tr>
                        <td style="padding:8px;border-bottom:1px solid #eee;">
                            <div style="font-weight:600;">${escapeHtml(item.name || 'Coffee')}</div>
                            <div style="color:#666;font-size:12px;">${escapeHtml(getGrindLabel(item.grind))}</div>
                        </td>
                        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${escapeHtml(item.quantity || 0)}</td>
                        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${escapeHtml(toMoney(item.unitPrice, currency))}</td>
                        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${escapeHtml(toMoney(item.lineTotal, currency))}</td>
                    </tr>
                `
                  )
                  .join('')
            : `
                <tr>
                    <td colspan="4" style="padding:12px;color:#666;">No line items available.</td>
                </tr>
            `

    const html = `
        <div style="font-family:Arial,sans-serif;color:#111;max-width:700px;margin:0 auto;">
            <h2 style="margin-bottom:8px;">New Order Received</h2>
            <p style="margin-top:0;color:#555;">Order <strong>#${escapeHtml(orderId)}</strong> has been paid successfully.</p>

            <table role="presentation" style="width:100%;border-collapse:collapse;margin:20px 0;background:#fafafa;border:1px solid #eee;">
                <tr>
                    <td style="padding:12px;vertical-align:top;width:50%;">
                        <div style="font-size:12px;color:#666;margin-bottom:4px;">Customer</div>
                        <div>${escapeHtml(orderDetails?.customerName || 'N/A')}</div>
                        <div style="color:#444;">${escapeHtml(orderDetails?.customerEmail || 'N/A')}</div>
                    </td>
                    <td style="padding:12px;vertical-align:top;width:50%;">
                        <div style="font-size:12px;color:#666;margin-bottom:4px;">Shipping Address</div>
                        ${formatAddressHtml(orderDetails?.shippingAddress)}
                    </td>
                </tr>
            </table>

            <h3 style="margin-bottom:8px;">Items</h3>
            <table role="presentation" style="width:100%;border-collapse:collapse;border:1px solid #eee;">
                <thead>
                    <tr style="background:#f5f5f5;">
                        <th style="padding:8px;text-align:left;">Item</th>
                        <th style="padding:8px;text-align:center;">Qty</th>
                        <th style="padding:8px;text-align:right;">Unit</th>
                        <th style="padding:8px;text-align:right;">Line Total</th>
                    </tr>
                </thead>
                <tbody>${lineItemsHtml}</tbody>
            </table>

            <table role="presentation" style="width:100%;border-collapse:collapse;margin-top:14px;">
                <tr>
                    <td style="padding:4px 0;text-align:right;color:#666;">Subtotal:</td>
                    <td style="padding:4px 0;text-align:right;width:160px;">${escapeHtml(toMoney(amounts.subtotal, currency))}</td>
                </tr>
                <tr>
                    <td style="padding:4px 0;text-align:right;color:#666;">Shipping:</td>
                    <td style="padding:4px 0;text-align:right;">${escapeHtml(toMoney(amounts.shipping, currency))}</td>
                </tr>
                <tr>
                    <td style="padding:8px 0;text-align:right;font-weight:700;border-top:1px solid #ddd;">Total:</td>
                    <td style="padding:8px 0;text-align:right;font-weight:700;border-top:1px solid #ddd;">${escapeHtml(toMoney(amounts.total, currency))}</td>
                </tr>
            </table>

            <p style="margin-top:18px;font-size:12px;color:#666;">
                Stripe session: ${escapeHtml(orderDetails?.stripeSessionId || 'N/A')}
            </p>
        </div>
    `

    const { data, error } = await resend.emails.send({
        from: 'Matthew <orders@fourways.coffee>',
        to: ['orders@fourways.coffee'],
        subject: `New Order Received #${orderId}`,
        html,
    })

    if (error) {
        return console.error({ error })
    }

    return data
    // res.status(20/0).send('Test email sent successfully.')
}
