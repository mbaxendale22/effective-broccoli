const formatProductCards = () => {
    const productCards = Array.from(
        document.getElementsByClassName('product-card__right')
    )
    productCards.forEach((card) => {
        const textContainer = card.children[0]
        const text = Array.from(textContainer.children)
        text.forEach((element) => {
            const isOriginText = element.classList.contains(
                'product-card__origin'
            )
            const splitText = Array.from(element.textContent.trim().split(''))
            element.textContent = ''
            splitText.map((char) => {
                const span = document.createElement('span')
                span.textContent = isOriginText ? char.toUpperCase() : char
                element.appendChild(span)
            })
        })
    })
}

// export const formatProductCard = () => {

//     const productCardRight = document.querySelector('.product-card__right');
//     const textContainer = productCardRight.children[0]
//     const text = Array.from(textContainer.children)
//     text.forEach(element => {
//         const isOriginText = element.classList.contains('product-card__origin')
//         const splitText = Array.from(element.textContent.trim().split(''))
//         element.textContent = ''
//         splitText.map(char => {
//             const span = document.createElement('span')
//             span.textContent = isOriginText ? char.toUpperCase() : char
//             element.appendChild(span)
//         })

//     })

// }

formatProductCards()
