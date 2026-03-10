import { getAllActiveCoffees } from '../api/coffees.js'

export const renderHome = async (req, res) => {
    const coffees = await getAllActiveCoffees()
    res.render('home', {
        coffees,
        seo: {
            ...res.locals.seo,
            title: 'Fourways Coffee Roasters | Small-Batch Specialty Coffee',
            description:
                'Explore Fourways coffee releases roasted in small batches, with producer and process details for each lot.',
        },
    })
}
