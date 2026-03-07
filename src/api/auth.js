import { supabaseAuth } from '../config/supabase.js'

export const signInAdminWithPassword = async ({ email, password }) =>
    supabaseAuth.auth.signInWithPassword({ email, password })

export const signOutAdminAuthClient = async () => supabaseAuth.auth.signOut()
