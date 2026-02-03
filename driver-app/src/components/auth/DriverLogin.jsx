import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { LogIn, Mail, Lock } from 'lucide-react'
import './DriverLogin.css'

export default function DriverLogin({ onLogin }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            console.time('⏱️ Total Login')
            console.time('⏱️ Auth SignIn')

            const { data, error: loginError } = await supabase.auth.signInWithPassword({
                email,
                password
            })

            console.timeEnd('⏱️ Auth SignIn')

            if (loginError) throw loginError

            console.time('⏱️ Fetch Driver Data')

            // Check if this user is a driver
            const { data: driverData, error: driverError } = await supabase
                .from('drivers')
                .select('*, vehicles(vehicle_name)')
                .eq('user_id', data.user.id)
                .single()

            console.timeEnd('⏱️ Fetch Driver Data')
            console.timeEnd('⏱️ Total Login')

            if (driverError) {
                await supabase.auth.signOut()
                if (driverError.code === 'PGRST116') {
                    throw new Error('This account is not registered as a driver. Please use an invitation link to register.')
                }
                throw new Error(`Failed to load driver profile: ${driverError.message}`)
            }

            if (!driverData) {
                await supabase.auth.signOut()
                throw new Error('This account is not registered as a driver')
            }

            setLoading(false)
            onLogin(driverData)
        } catch (err) {
            console.error('Login error:', err)
            setError(err.message)
            setLoading(false)
        }
    }

    return (
        <div className="login-container">
            <div className="login-logo">
                <LogIn size={48} />
            </div>

            <div className="login-card">
                <h2>Driver Login</h2>
                <p>Sign in to access your driver dashboard</p>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="login-form">
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <div className="input-with-icon">
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="driver@example.com"
                                required
                                autoComplete="email"
                            />
                            <Mail className="input-icon" size={20} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <div className="input-with-icon">
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                                autoComplete="current-password"
                            />
                            <Lock className="input-icon" size={20} />
                        </div>
                    </div>

                    <button type="submit" className="btn-login" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="register-link">
                    Don't have an account?
                    <a href="#">Contact your transport company for an invitation link.</a>
                </div>
            </div>
        </div>
    )
}
