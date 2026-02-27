import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

// Create a single supabase client for interacting with your database
export const supabase = createClient(
    process.env.SUPABASE_URL,
    // need to use the server secret key for server-side operations, gives full access to DB which we need for stripe webhooks
    process.env.SUPABASE_SERVER_SECRET_KEY
)

// Separate auth client for user sign-in flows.
// Prefer SUPABASE_ANON_KEY; fallback avoids local breakage if anon key is not set yet.
export const supabaseAuth = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVER_SECRET_KEY,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        },
    }
)
