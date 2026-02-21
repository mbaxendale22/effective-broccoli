import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Create a single supabase client for interacting with your database
export const supabase = createClient(
    process.env.SUPABASE_URL,
    // need to use the server secret key for server-side operations, gives full access to DB which we need for stripe webhooks
    process.env.SUPABASE_SERVER_SECRET_KEY,
);
