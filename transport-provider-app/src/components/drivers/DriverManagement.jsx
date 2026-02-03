import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, getCurrentUser, signOut } from '../../lib/supabase'
import { Truck, Users, Plus, Copy, Check, LogOut, Menu, Car, AlertCircle, Trash2 } from 'lucide-react'
import { generateInvitationLink } from '../../lib/utils'
import '../dashboard/Dashboard.css'
import '../vehicles/VehicleManagement.css'
import './DriverManagement.css'

export default function DriverManagement() {
    const navigate = useNavigate()
    const [company, setCompany] = useState(null)
    const [drivers, setDrivers] = useState([])
    const [vehicles, setVehicles] = useState([])
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [copiedToken, setCopiedToken] = useState(null)
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone_number: '',
        license_number: '',
        license_expiry_date: '',
        assigned_vehicle_id: ''
    })

    useEffect(() => {
        loadData()

        // Subscribe to real-time driver updates
        const channel = supabase
            .channel('drivers_realtime')
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'drivers'
                },
                (payload) => {
                    console.log('Driver data changed:', payload)
                    loadData() // Reload all drivers when any change happens
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const loadData = async () => {
        try {
            const user = await getCurrentUser()

            const { data: companyData } = await supabase
                .from('transport_companies')
                .select('*')
                .eq('user_id', user.id)
                .single()

            setCompany(companyData)

            if (companyData) {
                // Load drivers
                const { data: driversData, error: driversError } = await supabase
                    .from('drivers')
                    .select('*, vehicles(vehicle_name)')
                    .eq('company_id', companyData.id)
                    .order('created_at', { ascending: false })

                if (driversError) throw driversError
                setDrivers(driversData || [])

                // Load vehicles
                const { data: vehiclesData, error: vehiclesError } = await supabase
                    .from('vehicles')
                    .select('*')
                    .eq('company_id', companyData.id)

                if (vehiclesError) throw vehiclesError
                setVehicles(vehiclesData || [])
            }
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddDriver = async (e) => {
        e.preventDefault()
        try {
            const { error } = await supabase
                .from('drivers')
                .insert([
                    {
                        company_id: company.id,
                        ...formData,
                        assigned_vehicle_id: formData.assigned_vehicle_id || null
                    }
                ])

            if (error) throw error

            alert('Driver added successfully! Share the invitation link with them.')
            setShowAddModal(false)
            setFormData({
                full_name: '',
                email: '',
                phone_number: '',
                license_number: '',
                license_expiry_date: '',
                assigned_vehicle_id: ''
            })
            loadData()
        } catch (error) {
            console.error('Error adding driver:', error)
            alert('Error: ' + error.message)
        }
    }

    const copyInvitationLink = (token) => {
        const link = generateInvitationLink(token)
        navigator.clipboard.writeText(link)
        setCopiedToken(token)
        setTimeout(() => setCopiedToken(null), 2000)
    }

    const handleDeleteDriver = async (driverId, driverName) => {
        if (!confirm(`Are you sure you want to delete driver "${driverName}"? This action cannot be undone.`)) {
            return
        }

        try {
            const { error } = await supabase
                .from('drivers')
                .delete()
                .eq('id', driverId)

            if (error) throw error

            alert('Driver deleted successfully')
            loadData()
        } catch (error) {
            console.error('Error deleting driver:', error)
            alert('Error deleting driver: ' + error.message)
        }
    }

    const handleAssignVehicle = async (driverId, vehicleId) => {
        try {
            const { error } = await supabase
                .from('drivers')
                .update({ assigned_vehicle_id: vehicleId || null })
                .eq('id', driverId)

            if (error) throw error

            loadData() // Refresh to show updated assignment
        } catch (error) {
            console.error('Error assigning vehicle:', error)
            alert('Error assigning vehicle: ' + error.message)
        }
    }

    const getStatusBadge = (status) => {
        const badges = {
            available: 'badge-success',
            on_trip: 'badge-warning',
            off_duty: 'badge-gray'
        }
        return badges[status] || 'badge-gray'
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
                    <button className="nav-item" onClick={() => navigate('/')}>
                        <Menu size={20} />
                        Dashboard
                    </button>
                    <button className="nav-item" onClick={() => navigate('/vehicles')}>
                        <Car size={20} />
                        Vehicles
                    </button>
                    <button className="nav-item active" onClick={() => navigate('/drivers')}>
                        <Users size={20} />
                        Drivers
                    </button>
                    <button className="nav-item" onClick={() => navigate('/requests')}>
                        <AlertCircle size={20} />
                        Requests
                    </button>
                </div>

                <button className="nav-item signout-btn" onClick={signOut}>
                    <LogOut size={20} />
                    Sign Out
                </button>
            </nav>

            <main className="main-content">
                <div className="page-header">
                    <div>
                        <h1>Driver Management</h1>
                        <p>Invite and manage your fleet drivers</p>
                    </div>
                    <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                        <Plus size={20} />
                        Add Driver
                    </button>
                </div>

                {drivers.length === 0 ? (
                    <div className="empty-state">
                        <Users size={64} />
                        <h3>No drivers yet</h3>
                        <p>Add your first driver and share the invitation link with them</p>
                        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                            <Plus size={20} />
                            Add Driver
                        </button>
                    </div>
                ) : (
                    <div className="driver-list">
                        {drivers.map((driver) => (
                            <div key={driver.id} className="driver-card">
                                <div className="driver-header">
                                    <div className="driver-info">
                                        <div className="driver-avatar">
                                            {driver.full_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3>{driver.full_name}</h3>
                                            <p className="driver-email">{driver.email}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <span className={`badge ${getStatusBadge(driver.current_status)}`}>
                                            {driver.current_status}
                                        </span>
                                        <button
                                            className="btn-delete-icon"
                                            onClick={() => handleDeleteDriver(driver.id, driver.full_name)}
                                            title="Delete driver"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="driver-details">
                                    <div className="detail-row">
                                        <span className="label">Phone:</span>
                                        <span className="value">{driver.phone_number}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">License:</span>
                                        <span className="value">{driver.license_number}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">Assigned Vehicle:</span>
                                        <select
                                            className="vehicle-select"
                                            value={driver.assigned_vehicle_id || ''}
                                            onChange={(e) => handleAssignVehicle(driver.id, e.target.value)}
                                        >
                                            <option value="">Not assigned</option>
                                            {vehicles
                                                .filter(vehicle => {
                                                    // Show this driver's current vehicle OR unassigned vehicles
                                                    const isCurrentDriversVehicle = vehicle.id === driver.assigned_vehicle_id
                                                    const isUnassigned = !drivers.some(
                                                        d => d.assigned_vehicle_id === vehicle.id
                                                    )
                                                    return isCurrentDriversVehicle || isUnassigned
                                                })
                                                .map((vehicle) => (
                                                    <option key={vehicle.id} value={vehicle.id}>
                                                        {vehicle.vehicle_name} ({vehicle.registration_number})
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">Registration Status:</span>
                                        <span className="value">
                                            {driver.token_used_at ? (
                                                <span className="text-success">✓ Registered</span>
                                            ) : (
                                                <span className="text-warning">⏳ Pending</span>
                                            )}
                                        </span>
                                    </div>
                                </div>

                                {!driver.token_used_at && (
                                    <div className="invitation-section">
                                        <div className="invitation-link">
                                            <code>{generateInvitationLink(driver.invitation_token)}</code>
                                        </div>
                                        <button
                                            className={`btn-secondary btn-sm ${copiedToken === driver.invitation_token ? 'copied' : ''}`}
                                            onClick={() => copyInvitationLink(driver.invitation_token)}
                                        >
                                            {copiedToken === driver.invitation_token ? (
                                                <>
                                                    <Check size={16} />
                                                    Copied!
                                                </>
                                            ) : (
                                                <>
                                                    <Copy size={16} />
                                                    Copy Link
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {showAddModal && (
                    <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h2>Add New Driver</h2>
                            <form onSubmit={handleAddDriver}>
                                <div className="form-group">
                                    <label htmlFor="fullName">Full Name *</label>
                                    <input
                                        id="fullName"
                                        type="text"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="email">Email *</label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="john@example.com"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="phone">Phone Number *</label>
                                    <input
                                        id="phone"
                                        type="tel"
                                        value={formData.phone_number}
                                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                        placeholder="+91 1234567890"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="license">License Number *</label>
                                    <input
                                        id="license"
                                        type="text"
                                        value={formData.license_number}
                                        onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                                        placeholder="DL-1234567890"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="expiry">License Expiry Date *</label>
                                    <input
                                        id="expiry"
                                        type="date"
                                        value={formData.license_expiry_date}
                                        onChange={(e) => setFormData({ ...formData, license_expiry_date: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="vehicle">Assign Vehicle (Optional)</label>
                                    <select
                                        id="vehicle"
                                        value={formData.assigned_vehicle_id}
                                        onChange={(e) => setFormData({ ...formData, assigned_vehicle_id: e.target.value })}
                                    >
                                        <option value="">Not assigned</option>
                                        {vehicles
                                            .filter(vehicle => {
                                                // Only show vehicles that are NOT assigned to any driver
                                                const isAssigned = drivers.some(
                                                    driver => driver.assigned_vehicle_id === vehicle.id
                                                )
                                                return !isAssigned
                                            })
                                            .map((vehicle) => (
                                                <option key={vehicle.id} value={vehicle.id}>
                                                    {vehicle.vehicle_name} ({vehicle.registration_number})
                                                </option>
                                            ))}
                                    </select>
                                    {vehicles.filter(v => !drivers.some(d => d.assigned_vehicle_id === v.id)).length === 0 && (
                                        <p className="form-help text-warning">All vehicles are currently assigned to drivers</p>
                                    )}
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary">
                                        Add Driver
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
