import { getAllActiveCoffees } from '../api/coffees.js'

const renderCoffeesPage = async ({ res, view, seoTitle, seoDescription }) => {
    const coffees = await getAllActiveCoffees()

    return res.render(view, {
        coffees,
        seo: {
            ...res.locals.seo,
            title: seoTitle,
            description: seoDescription,
        },
    })
}

export const renderHome = async (req, res) => {
    return renderCoffeesPage({
        res,
        view: 'home',
        seoTitle: 'Fourways Coffee Roasters | Small-Batch Specialty Coffee',
        seoDescription:
            'Explore Fourways coffee releases roasted in small batches, with producer and process details for each lot.',
    })
}

export const renderAllCoffees = async (req, res) => {
    return renderCoffeesPage({
        res,
        view: 'all-coffees',
        seoTitle: 'All Coffees | Fourways Coffee Roasters',
        seoDescription:
            'Browse all current Fourways coffee releases, with origin, process, producer, and variety details.',
    })
}
