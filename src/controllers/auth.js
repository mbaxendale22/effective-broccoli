import { supabaseAuth } from '../config/supabase.js'

export const renderLogin = (req, res) => {
    if (req.session?.isAdminAuthenticated) {
        return res.redirect('/admin/orders')
    }

    res.render('login', { error: null })
}

export const login = async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
        return res.status(400).render('login', {
            error: 'Email and password are required.',
        })
    }

    const { data, error } = await supabaseAuth.auth.signInWithPassword({
        email,
        password,
    })

    if (error || !data?.user) {
        return res.status(401).render('login', {
            error: 'Invalid email or password.',
        })
    }

    const userRole = data.user.user_metadata?.role

    if (userRole !== 'admin') {
        await supabaseAuth.auth.signOut()
        return res.status(403).render('login', {
            error: 'This user is not authorized for the admin dashboard.',
        })
    }

    return req.session.regenerate((sessionError) => {
        if (sessionError) {
            return res.status(500).render('login', {
                error: 'Unable to start session. Please try again.',
            })
        }

        req.session.isAdminAuthenticated = true
        req.session.adminUser = {
            id: data.user.id,
            email: data.user.email,
            role: userRole,
        }

        return res.redirect('/admin/orders')
    })
}

export const logout = (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            return res.status(500).send('Unable to log out right now.')
        }

        res.clearCookie('connect.sid')
        return res.redirect('/admin/login')
    })
}
