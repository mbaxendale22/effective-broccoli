export const requireAdminAuth = (req, res, next) => {
    if (req.session?.isAdminAuthenticated) {
        return next()
    }

    return res.redirect('/admin/login')
}
