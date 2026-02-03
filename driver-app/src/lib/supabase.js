import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
})

// Helper function to get current user
export const getCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
}

// Helper function to sign out
export const signOut = async () => {
    try {
        // Clear local cache before signing out
        localStorage.removeItem('driver_cache')

        const { error } = await supabase.auth.signOut()
        if (error) throw error

        // Force page reload to reset app state
        window.location.href = '/login'
    } catch (error) {
        console.error('Sign out error:', error)
        // Even if error, clear cache and reload
        localStorage.clear()
        window.location.href = '/login'
    }
}
