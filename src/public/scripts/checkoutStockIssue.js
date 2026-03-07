const openCartButton = document.getElementById('open-cart-btn')
const cartToggleButton = document.getElementById('cart-toggle')

if (openCartButton && cartToggleButton) {
    openCartButton.addEventListener('click', () => {
        cartToggleButton.click()
    })
}
