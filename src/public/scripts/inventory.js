const openRoastModalButton = document.getElementById('open-roast-modal')
const closeRoastModalButton = document.getElementById('close-roast-modal')
const roastSessionModal = document.getElementById('roast-session-modal')

if (openRoastModalButton && closeRoastModalButton && roastSessionModal) {
    openRoastModalButton.addEventListener('click', () => {
        roastSessionModal.showModal()
    })

    closeRoastModalButton.addEventListener('click', () => {
        roastSessionModal.close()
    })
}
