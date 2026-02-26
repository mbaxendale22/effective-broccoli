const cartCountElement = document.getElementById('cart-count')
const cartToggle = document.getElementById('cart-toggle')
const cartDrawer = document.getElementById('cart-drawer')
const cartOverlay = document.getElementById('cart-overlay')
const closeCartBtn = document.getElementById('close-cart')

const navLinks = Array.from(document.querySelectorAll('[data-nav-route]'))
const currentPath = window.location.pathname

navLinks.forEach((link) => {
    if (link.dataset.navRoute === currentPath) {
        link.classList.add('site-nav__link--active')
    }
})

function toggleCart() {
    if (!cartDrawer || !cartOverlay) return

    cartDrawer.classList.toggle('open')
    cartOverlay.classList.toggle('active')

    if (cartDrawer.classList.contains('open')) {
        fetchCartData()
    }
}

async function fetchCartData() {
    if (!cartDrawer) return

    try {
        const response = await fetch('/cart/data')
        const data = await response.json()
        updateCartDisplay(data)
    } catch (error) {
        console.error('Error fetching cart data:', error)
    }
}

function updateCartDisplay(data) {
    const cartContent = document.getElementById('cart-content')
    const cartFooter = document.querySelector('.cart-footer')

    if (!cartContent || !cartFooter) return

    if (data.items.length === 0) {
        cartContent.innerHTML = '<p>Your cart is empty.</p>'
        cartFooter.style.display = 'none'
    } else {
        let html = '<ul class="cart-items">'

        data.items.forEach((item) => {
            html += `
				<li class="cart-item">
					<div class="item-details">
						<span class="item-name">${item.name}</span>
						<span class="item-price">£${(item.price_250 / 100).toFixed(2)} each</span>
					</div>
					<div class="item-controls">
						<button class="qty-btn decrease-btn" data-id="${item.stripe_price_id}">−</button>
						<span class="item-qty">${item.quantity}</span>
						<button class="qty-btn increase-btn" data-id="${item.stripe_price_id}">+</button>
					</div>
					<div class="item-actions">
						<span class="item-total">£${(item.lineTotal / 100).toFixed(2)}</span>
						<button class="remove-btn" data-id="${item.stripe_price_id}">✕</button>
					</div>
				</li>
			`
        })

        html += '</ul>'
        html += `<div class="cart-total"><h3>Total: £${(data.total / 100).toFixed(2)}</h3></div>`
        cartContent.innerHTML = html
        cartFooter.style.display = 'block'
    }
}

async function initializeCartCount() {
    if (!cartCountElement) return

    try {
        const response = await fetch('/cart/count')
        const data = await response.json()
        cartCountElement.textContent = data.cartCount
    } catch (error) {
        console.error('Error fetching cart count:', error)
    }
}

initializeCartCount()

if (cartToggle) {
    cartToggle.addEventListener('click', toggleCart)
}

if (closeCartBtn) {
    closeCartBtn.addEventListener('click', toggleCart)
}

if (cartOverlay) {
    cartOverlay.addEventListener('click', toggleCart)
}

document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('add-to-cart-btn')) {
        const coffeeId = e.target.dataset.id

        try {
            const response = await fetch('/cart/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ coffeeId }),
            })

            const data = await response.json()

            if (data.success && cartCountElement) {
                cartCountElement.textContent = data.cartCount
            }
        } catch (error) {
            console.error('Error adding to cart:', error)
        }
    }

    if (e.target.classList.contains('increase-btn')) {
        const coffeeId = e.target.dataset.id

        try {
            const response = await fetch('/cart/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ coffeeId, action: 'increase' }),
            })

            const data = await response.json()

            if (data.success && cartCountElement) {
                cartCountElement.textContent = data.cartCount
                fetchCartData()
            }
        } catch (error) {
            console.error('Error updating cart:', error)
        }
    }

    if (e.target.classList.contains('decrease-btn')) {
        const coffeeId = e.target.dataset.id

        try {
            const response = await fetch('/cart/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ coffeeId, action: 'decrease' }),
            })

            const data = await response.json()

            if (data.success && cartCountElement) {
                cartCountElement.textContent = data.cartCount
                fetchCartData()
            }
        } catch (error) {
            console.error('Error updating cart:', error)
        }
    }

    if (e.target.classList.contains('remove-btn')) {
        const coffeeId = e.target.dataset.id

        try {
            const response = await fetch('/cart/remove', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ coffeeId }),
            })

            const data = await response.json()

            if (data.success && cartCountElement) {
                cartCountElement.textContent = data.cartCount
                fetchCartData()
            }
        } catch (error) {
            console.error('Error removing from cart:', error)
        }
    }
})
