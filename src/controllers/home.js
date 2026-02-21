import { getAllActiveCoffees } from '../api/coffees.js'

export const renderHome = async (req, res) => {
    const coffees = await getAllActiveCoffees()
    res.render('home', { coffees })
}
