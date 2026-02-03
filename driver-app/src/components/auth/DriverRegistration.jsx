import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { UserCheck, Mail, Phone, Award } from 'lucide-react'
import './DriverRegistration.css'

export default function DriverRegistration({ onComplete }) {
    const [searchParams] = useSearchParams()
    const [loading, setLoading] = useState(true)
    const [invitationValid, setInvitationValid] = useState(false)
    const [driverProfile, setDriverProfile] = useState(null)
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState(null)

    const invitationToken = searchParams.get('token')

    useEffect(() => {
        if (invitationToken) {
            validateInvitation()
        } else {
            setLoading(false)
            setError('No invitation token provided')
        }
    }, [invitationToken])

    const validateInvitation = async () => {
        try {
            // First, check if there's an active session
            const { data: { session } } = await supabase.auth.getSession()

            if (session) {
                // Check if the current session belongs to a different driver
                const { data: currentDriver } = await supabase
                    .from('drivers')
                    .select('invitation_token')
                    .eq('user_id', session.user.id)
                    .single()

                // If logged in as a different driver, sign out first
                if (currentDriver && currentDriver.invitation_token !== invitationToken) {
                    console.log('🔄 Different driver detected, signing out current session')
                    await supabase.auth.signOut()
                    localStorage.removeItem('driver_cache')
                    // Show a message to the user
                    setError('You were logged in as a different driver. Please complete registration for this driver.')
                }
            }

            // Now validate the invitation token
            const { data, error } = await supabase
                .from('drivers')
                .select('*')
                .eq('invitation_token', invitationToken)
                .is('token_used_at', null)
                .single()

            if (error || !data) {
                setError('Invalid or expired invitation link')
                setInvitationValid(false)
            } else {
                setDriverProfile(data)
                setInvitationValid(true)
            }
        } catch (err) {
            setError('Failed to validate invitation')
            setInvitationValid(false)
        } finally {
            setLoading(false)
        }
    }

    const handleRegister = async (e) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        setLoading(true)
        setError(null)

        try {
            // Create auth account
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: driverProfile.email,
                password: password
            })

            if (authError) throw authError

            // Update driver with user_id and mark token as used
            const { error: updateError } = await supabase
                .from('drivers')
                .update({
                    user_id: authData.user.id,
                    token_used_at: new Date().toISOString()
                })
                .eq('id', driverProfile.id)

            if (updateError) throw updateError

            alert('Registration successful! Welcome aboard!')
            onComplete()
        } catch (err) {
            console.error('Registration error:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        )
    }

    if (!invitationValid) {
        return (
            <div className="registration-page">
                <div className="error-card">
                    <h2>Invalid Invitation</h2>
                    <p>{error || 'This invitation link is invalid or has already been used.'}</p>
                    <p className="text-sm text-gray">Please contact your transport company for a valid invitation link.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="registration-page">
            <div className="registration-container">
                <div className="registration-header">
                    <div className="logo">
                        <UserCheck size={40} />
                    </div>
                    <h1>Driver Registration</h1>
                    <p>Complete your registration to start accepting emergency requests</p>
                </div>

                <div className="profile-preview">
                    <h3>Your Profile Details</h3>
                    <div className="profile-info">
                        <div className="info-item">
                            <UserCheck size={20} />
                            <span>{driverProfile.full_name}</span>
                        </div>
                        <div className="info-item">
                            <Mail size={20} />
                            <span>{driverProfile.email}</span>
                        </div>
                        <div className="info-item">
                            <Phone size={20} />
                            <span>{driverProfile.phone_number}</span>
                        </div>
                        <div className="info-item">
                            <Award size={20} />
                            <span>License: {driverProfile.license_number}</span>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="registration-form">
                    <div className="form-group">
                        <label htmlFor="password">Create Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Minimum 6 characters"
                            required
                            minLength={6}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter your password"
                            required
                        />
                    </div>

                    <button type="submit" className="btn-primary btn-full" disabled={loading}>
                        {loading ? 'Registering...' : 'Complete Registration'}
                    </button>
                </form>
            </div>
        </div>
    )
}
