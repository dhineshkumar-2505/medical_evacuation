import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, signOut, getCurrentUser } from '../../lib/supabase'
import { Truck, Users, Car, AlertCircle, LogOut, Menu, MapPin } from 'lucide-react'
import './Dashboard.css'

export default function Dashboard() {
    const navigate = useNavigate()
    const [company, setCompany] = useState(null)
    const [stats, setStats] = useState({
        totalVehicles: 0,
        availableVehicles: 0,
        totalDrivers: 0,
        availableDrivers: 0,
        activeRequests: 0,
        completedToday: 0
    })
    const [loading, setLoading] = useState(true)
    const [companyLocation, setCompanyLocation] = useState('')

    useEffect(() => {
        loadDashboardData()
    }, [])

    const loadDashboardData = async () => {
        try {
            const user = await getCurrentUser()

            // Get company info
            const { data: companyData } = await supabase
                .from('transport_companies')
                .select('*')
                .eq('user_id', user.id)
                .single()

            setCompany(companyData)

            if (companyData?.operating_location) {
                setCompanyLocation(companyData.operating_location)
            }

            if (!companyData) return

            // Get vehicles count
            const { count: totalVehicles } = await supabase
                .from('vehicles')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', companyData.id)

            const { count: availableVehicles } = await supabase
                .from('vehicles')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', companyData.id)
                .eq('current_status', 'available')

            // Get drivers count
            const { count: totalDrivers } = await supabase
                .from('drivers')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', companyData.id)

            const { count: availableDrivers } = await supabase
                .from('drivers')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', companyData.id)
                .eq('current_status', 'available')

            // Get active assignments
            const { count: activeRequests } = await supabase
                .from('transport_assignments')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', companyData.id)
                .in('current_status', ['accepted', 'en_route_pickup', 'patient_loaded', 'en_route_hospital'])

            // Get completed today
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            const { count: completedToday } = await supabase
                .from('transport_assignments')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', companyData.id)
                .eq('current_status', 'delivered')
                .gte('completed_at', today.toISOString())

            setStats({
                totalVehicles: totalVehicles || 0,
                availableVehicles: availableVehicles || 0,
                totalDrivers: totalDrivers || 0,
                availableDrivers: availableDrivers || 0,
                activeRequests: activeRequests || 0,
                completedToday: completedToday || 0
            })

        } catch (error) {
            console.error('Error loading dashboard:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSignOut = async () => {
        try {
            await signOut()
        } catch (error) {
            console.error('Error signing out:', error)
        }
    }

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        )
    }

    return (
        <div className="dashboard-layout">
            <nav className="sidebar">
                <div className="sidebar-header">
                    <Truck size={32} />
                    <h2>{company?.company_name || 'Transport'}</h2>
                </div>

                <div className="nav-menu">
                    <button className="nav-item active" onClick={() => navigate('/')}>
                        <Menu size={20} />
                        Dashboard
                    </button>
                    <button className="nav-item" onClick={() => navigate('/vehicles')}>
                        <Car size={20} />
                        Vehicles
                    </button>
                    <button className="nav-item" onClick={() => navigate('/drivers')}>
                        <Users size={20} />
                        Drivers
                    </button>
                    <button className="nav-item" onClick={() => navigate('/requests')}>
                        <AlertCircle size={20} />
                        Requests
                    </button>
                </div>

                <button className="nav-item signout-btn" onClick={handleSignOut}>
                    <LogOut size={20} />
                    Sign Out
                </button>
            </nav>

            <main className="main-content">
                <div className="page-header">
                    <div>
                        <h1>Dashboard</h1>
                        <p>Welcome back! Here's your fleet overview</p>
                    </div>
                    {companyLocation && (
                        <div className="location-badge">
                            <MapPin size={14} />
                            <span>{companyLocation}</span>
                        </div>
                    )}
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon vehicles">
                            <Car size={24} />
                        </div>
                        <div className="stat-content">
                            <p className="stat-label">Vehicles</p>
                            <h3 className="stat-value">{stats.availableVehicles}/{stats.totalVehicles}</h3>
                            <p className="stat-subtitle">Available</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon drivers">
                            <Users size={24} />
                        </div>
                        <div className="stat-content">
                            <p className="stat-label">Drivers</p>
                            <h3 className="stat-value">{stats.availableDrivers}/{stats.totalDrivers}</h3>
                            <p className="stat-subtitle">On Duty</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon active">
                            <AlertCircle size={24} />
                        </div>
                        <div className="stat-content">
                            <p className="stat-label">Active Trips</p>
                            <h3 className="stat-value">{stats.activeRequests}</h3>
                            <p className="stat-subtitle">In Progress</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon completed">
                            <Truck size={24} />
                        </div>
                        <div className="stat-content">
                            <p className="stat-label">Completed Today</p>
                            <h3 className="stat-value">{stats.completedToday}</h3>
                            <p className="stat-subtitle">Deliveries</p>
                        </div>
                    </div>
                </div>

                <div className="quick-actions">
                    <h2>Quick Actions</h2>
                    <div className="action-buttons">
                        <button className="action-card" onClick={() => navigate('/vehicles')}>
                            <Car size={32} />
                            <h3>Manage Fleet</h3>
                            <p>Add or edit vehicles</p>
                        </button>
                        <button className="action-card" onClick={() => navigate('/drivers')}>
                            <Users size={32} />
                            <h3>Invite Drivers</h3>
                            <p>Add drivers to your team</p>
                        </button>
                        <button className="action-card" onClick={() => navigate('/requests')}>
                            <AlertCircle size={32} />
                            <h3>View Requests</h3>
                            <p>Monitor active transports</p>
                        </button>
                    </div>
                </div>
            </main>
        </div>
    )
}
