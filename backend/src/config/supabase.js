import { createClient } from '@supabase/supabase-js';

let supabaseInstance = null;

/**
 * Get Supabase client (lazy initialization)
 * Uses native Node.js fetch (v18+)
 */
export function getSupabase() {
    if (!supabaseInstance) {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('Supabase config error:', {
                hasUrl: !!supabaseUrl,
                hasKey: !!supabaseKey
            });
            throw new Error('Missing Supabase environment variables. Check .env file.');
        }

        console.log('Initializing Supabase client for:', supabaseUrl);

        supabaseInstance = createClient(supabaseUrl, supabaseKey);
    }
    return supabaseInstance;
}

// Proxy for backwards compatibility with route imports
export const supabase = {
    from: (...args) => getSupabase().from(...args),
    auth: {
        getUser: (...args) => getSupabase().auth.getUser(...args)
    }
};
