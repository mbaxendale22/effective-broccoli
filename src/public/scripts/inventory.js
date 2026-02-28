const openRoastModalButton = document.getElementById('open-roast-modal')
const closeRoastModalButton = document.getElementById('close-roast-modal')
const roastSessionModal = document.getElementById('roast-session-modal')
const openStocktakeModalButton = document.getElementById('open-stocktake-modal')
const closeStocktakeModalButton = document.getElementById(
    'close-stocktake-modal'
)
const stocktakeModal = document.getElementById('stocktake-modal')

if (openRoastModalButton && closeRoastModalButton && roastSessionModal) {
    openRoastModalButton.addEventListener('click', () => {
        roastSessionModal.showModal()
    })

    closeRoastModalButton.addEventListener('click', () => {
        roastSessionModal.close()
    })
}

if (openStocktakeModalButton && closeStocktakeModalButton && stocktakeModal) {
    openStocktakeModalButton.addEventListener('click', () => {
        stocktakeModal.showModal()
    })

    closeStocktakeModalButton.addEventListener('click', () => {
        stocktakeModal.close()
    })
}
