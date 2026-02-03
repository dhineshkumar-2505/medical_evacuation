import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'

// Components
import DriverLogin from './components/auth/DriverLogin'
import DriverRegistration from './components/auth/DriverRegistration'
import DriverDashboard from './components/dashboard/DriverDashboard'
import ActiveTrip from './components/trip/ActiveTrip'
import DevPanel from '../../shared-components/DevPanel'

function App() {
    const [loading, setLoading] = useState(true)
    const [driver, setDriver] = useState(null)

    // Load driver data
    const loadDriverData = async (userId) => {
        try {
            console.log('📡 Loading driver data for:', userId)
            const { data, error } = await supabase
                .from('drivers')
                .select('*, vehicles(vehicle_name)')
                .eq('user_id', userId)
                .single()

            if (error) {
                console.error('Error fetching driver:', error)
                setDriver(null)
            } else {
                console.log('✅ Driver data loaded:', data.full_name)
                localStorage.setItem('driver_cache', JSON.stringify(data))
                setDriver(data)
            }
        } catch (e) {
            console.error('Driver load exception:', e)
            setDriver(null)
        }
    }

    // Initialize app
    useEffect(() => {
        const init = async () => {
            console.log('🚀 App initializing...')

            // Check if we're on a registration page with a token
            const urlParams = new URLSearchParams(window.location.search)
            const invitationToken = urlParams.get('token')

            if (invitationToken && window.location.pathname === '/register') {
                console.log('📋 Registration link detected, checking session...')

                // Check if there's an active session
                const { data: { session } } = await supabase.auth.getSession()

                if (session) {
                    // Check if the current session belongs to a different driver
                    const { data: currentDriver } = await supabase
                        .from('drivers')
                        .select('invitation_token')
                        .eq('user_id', session.user.id)
                        .single()

                    // If logged in as a different driver, sign out
                    if (currentDriver && currentDriver.invitation_token !== invitationToken) {
                        console.log('🔄 Different driver link detected, clearing session')
                        await supabase.auth.signOut()
                        localStorage.removeItem('driver_cache')
                        setDriver(null)
                        setLoading(false)
                        return // Let the registration page handle it
                    }
                }
            }

            // Try to load from cache first for instant UI
            try {
                const cached = localStorage.getItem('driver_cache')
                if (cached) {
                    setDriver(JSON.parse(cached))
                }
            } catch (e) {
                console.error('Cache read error', e)
            }

            // Check for active session
            const { data: { session } } = await supabase.auth.getSession()

            if (session) {
                console.log('✅ Session found:', session.user.id)
                await loadDriverData(session.user.id)
            } else {
                console.log('ℹ️ No session')
                localStorage.removeItem('driver_cache')
                setDriver(null)
            }

            setLoading(false)
        }

        init()

        // Auth listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('🔔 Auth Event:', event)

            if (event === 'SIGNED_OUT') {
                localStorage.removeItem('driver_cache')
                setDriver(null)
            }
            // Note: We don't handle SIGNED_IN here - DriverLogin does it directly
        })

        return () => subscription.unsubscribe()
    }, [])

    // Loading screen
    if (loading) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                background: '#f8fafc',
                gap: '20px'
            }}>
                <div className="spinner"></div>
                <p style={{ color: '#64748b', fontSize: '14px' }}>Loading...</p>
            </div>
        )
    }

    // Main app
    return (
        <Router>
            <DevPanel />
            <Routes>
                {!driver ? (
                    <>
                        <Route path="/login" element={
                            <DriverLogin onLogin={(data) => {
                                console.log('🎉 Login success!')
                                localStorage.setItem('driver_cache', JSON.stringify(data))
                                setDriver(data)
                            }} />
                        } />
                        <Route path="/register" element={
                            <DriverRegistration onComplete={async () => {
                                const { data: { session } } = await supabase.auth.getSession()
                                if (session) await loadDriverData(session.user.id)
                            }} />
                        } />
                        <Route path="*" element={<Navigate to="/login" replace />} />
                    </>
                ) : (
                    <>
                        <Route path="/" element={
                            <DriverDashboard driver={driver} onUpdate={loadDriverData} />
                        } />
                        <Route path="/trip/:tripId" element={<ActiveTrip driver={driver} />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </>
                )}
            </Routes>
        </Router>
    )
}

export default App
