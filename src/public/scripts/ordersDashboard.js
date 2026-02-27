const dataElement = document.getElementById('orders-dashboard-data')
const ordersListElement = document.getElementById('orders-list')
const filterButtons = Array.from(document.querySelectorAll('.filter-btn'))

const initialData = dataElement ? JSON.parse(dataElement.textContent) : null

let allowedStatuses = initialData?.allowedStatuses || []
let activeFilter = initialData?.selectedFilter || 'all'

const formatCurrency = (amountPence) =>
    `£${((amountPence || 0) / 100).toFixed(2)}`

const formatAddress = (address) => {
    if (!address || typeof address !== 'object') {
        return 'N/A'
    }

    const parts = [
        address.line1,
        address.line2,
        address.city,
        address.state,
        address.postal_code,
        address.country,
    ].filter(Boolean)

    return parts.length ? parts.join(', ') : 'N/A'
}

const formatGrind = (grind) => {
    if (grind === 'filter') return 'Filter Grind'
    if (grind === 'espresso') return 'Espresso Grind'
    if (grind === 'whole_beans') return 'Whole Beans'
    return 'N/A'
}

const createOrderItemsMarkup = (items) => {
    if (!items.length) {
        return '<p class="item-empty">No items found for this order.</p>'
    }

    const rows = items
        .map(
            (item) => `
                <tr>
                    <td>${item.name || 'N/A'}</td>
                    <td>${formatGrind(item.grind)}</td>
                    <td>${formatCurrency(item.unit_price)}</td>
                    <td>${item.quantity || 0}</td>
                    <td>${formatCurrency(item.line_total)}</td>
                </tr>
            `
        )
        .join('')

    return `
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Grind</th>
                    <th>Unit Price</th>
                    <th>Qty</th>
                    <th>Line Total</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `
}

const createStatusOptionsMarkup = (currentStatus) => {
    return allowedStatuses
        .map((statusOption) => {
            const selected = currentStatus === statusOption ? 'selected' : ''
            return `<option value="${statusOption}" ${selected}>${statusOption}</option>`
        })
        .join('')
}

const renderOrders = (orders, itemsByOrderId) => {
    if (!ordersListElement) {
        return
    }

    if (!orders?.length) {
        ordersListElement.innerHTML = `
            <section class="empty-state">
                <p>No orders found.</p>
            </section>
        `
        return
    }

    console.log('Rendering orders:', JSON.stringify(orders.at(0), null, 2))

    const cardsMarkup = orders
        .map((order) => {
            const items = itemsByOrderId?.[order.id] || []
            return `
                <section class="order-card">
                    <div class="order-card__top">
                        <div>
                            <h2>Order #${order.id}</h2>
                            <p><strong>Created:</strong> ${new Date(order.created_at).toLocaleString()}</p>
                            <p><strong>Customer:</strong> ${order.customer_email || 'N/A'}</p>
                            <p><strong>Shipping Name:</strong> ${order.shipping_name || 'N/A'}</p>
                            <p><strong>Shipping Address:</strong> ${formatAddress(order.shipping_address)}</p>
                            <p><strong>Total:</strong> ${formatCurrency(order.amount_total)}</p>
                        </div>
                        <form action="/admin/orders/${order.id}/status" method="POST" class="status-form">
                            <label for="status-${order.id}">Status</label>
                            <select id="status-${order.id}" name="status" required>
                                ${createStatusOptionsMarkup(order.status)}
                            </select>
                            <input type="hidden" name="filter" value="${activeFilter}">
                            <button type="submit">Update</button>
                        </form>
                    </div>
                    <div class="order-items">
                        <h3>Line Items</h3>
                        ${createOrderItemsMarkup(items)}
                    </div>
                </section>
            `
        })
        .join('')

    ordersListElement.innerHTML = cardsMarkup
}

const setActiveFilter = (filter) => {
    activeFilter = filter

    filterButtons.forEach((button) => {
        const isActive = button.dataset.filter === filter
        button.classList.toggle('is-active', isActive)
    })
}

const fetchFilteredOrders = async (filter) => {
    const response = await fetch(
        `/admin/api/orders?filter=${encodeURIComponent(filter)}`,
        {
            method: 'GET',
            headers: {
                Accept: 'application/json',
            },
        }
    )

    if (!response.ok) {
        throw new Error('Failed to fetch filtered orders')
    }

    return response.json()
}

const initializeFilters = () => {
    filterButtons.forEach((button) => {
        button.addEventListener('click', async () => {
            const selectedFilter = button.dataset.filter
            setActiveFilter(selectedFilter)

            try {
                const responseData = await fetchFilteredOrders(selectedFilter)
                allowedStatuses =
                    responseData.allowedStatuses || allowedStatuses
                const normalizedFilter =
                    responseData.selectedFilter || selectedFilter
                setActiveFilter(normalizedFilter)
                window.history.replaceState(
                    {},
                    '',
                    `/admin/orders?filter=${encodeURIComponent(normalizedFilter)}`
                )
                renderOrders(
                    responseData.orders || [],
                    responseData.itemsByOrderId || {}
                )
            } catch (_error) {
                ordersListElement.innerHTML =
                    '<p class="orders-error">Unable to load filtered orders right now.</p>'
            }
        })
    })
}

if (initialData) {
    setActiveFilter(initialData.selectedFilter || 'all')
    renderOrders(initialData.orders || [], initialData.itemsByOrderId || {})
    initializeFilters()
}
