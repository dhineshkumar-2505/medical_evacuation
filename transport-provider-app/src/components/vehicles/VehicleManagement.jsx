import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, getCurrentUser, signOut } from '../../lib/supabase'
import { Truck, Car, Plus, Edit, Trash2, LogOut, Menu, Users, AlertCircle } from 'lucide-react'
import '../dashboard/Dashboard.css'
import './VehicleManagement.css'

// Vehicle type configuration based on region
const VEHICLE_TYPES = {
    mainland: [
        { value: 'ambulance', label: 'Ambulance' },
        { value: 'helicopter', label: 'Helicopter' }
    ],
    island: [
        { value: 'ambulance', label: 'Ambulance' },
        { value: 'helicopter', label: 'Helicopter' },
        { value: 'ship', label: 'Ship' }
    ]
}

// Determine region type based on location
const getRegionType = (location) => {
    const islandLocations = ['Andaman & Nicobar', 'Lakshadweep']
    return islandLocations.includes(location) ? 'island' : 'mainland'
}

export default function VehicleManagement() {
    const navigate = useNavigate()
    const [company, setCompany] = useState(null)
    const [vehicles, setVehicles] = useState([])
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [availableVehicleTypes, setAvailableVehicleTypes] = useState([])
    const [formData, setFormData] = useState({
        vehicle_type: 'ambulance',
        vehicle_name: '',
        registration_number: '',
        capacity: 1,
        medical_equipment_level: 'basic'
    })

    useEffect(() => {
        loadData()
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

            // Set available vehicle types based on company location
            if (companyData?.operating_location) {
                const regionType = getRegionType(companyData.operating_location)
                setAvailableVehicleTypes(VEHICLE_TYPES[regionType])
            }

            if (companyData) {
                const { data: vehiclesData, error } = await supabase
                    .from('vehicles')
                    .select('*')
                    .eq('company_id', companyData.id)
                    .order('created_at', { ascending: false })

                if (error) throw error
                setVehicles(vehiclesData || [])
            }
        } catch (error) {
            console.error('Error loading vehicles:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddVehicle = async (e) => {
        e.preventDefault()
        try {
            const { error } = await supabase
                .from('vehicles')
                .insert([
                    {
                        company_id: company.id,
                        ...formData
                    }
                ])

            if (error) throw error

            alert('Vehicle added successfully!')
            setShowAddModal(false)
            setFormData({
                vehicle_type: 'ambulance',
                vehicle_name: '',
                registration_number: '',
                capacity: 1,
                medical_equipment_level: 'basic'
            })
            loadData()
        } catch (error) {
            console.error('Error adding vehicle:', error)
            alert('Error: ' + error.message)
        }
    }

    const handleDeleteVehicle = async (id) => {
        if (!confirm('Are you sure you want to delete this vehicle?')) return

        try {
            const { error } = await supabase
                .from('vehicles')
                .delete()
                .eq('id', id)

            if (error) throw error
            alert('Vehicle deleted successfully!')
            loadData()
        } catch (error) {
            console.error('Error deleting vehicle:', error)
            alert('Error: ' + error.message)
        }
    }

    const getStatusBadge = (status) => {
        const badges = {
            available: 'badge-success',
            assigned: 'badge-warning',
            maintenance: 'badge-danger',
            offline: 'badge-gray'
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
                    <button className="nav-item active" onClick={() => navigate('/vehicles')}>
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

                <button className="nav-item signout-btn" onClick={signOut}>
                    <LogOut size={20} />
                    Sign Out
                </button>
            </nav>

            <main className="main-content">
                <div className="page-header">
                    <div>
                        <h1>Vehicle Management</h1>
                        <p>Manage your fleet of emergency transport vehicles</p>
                    </div>
                    <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                        <Plus size={20} />
                        Add Vehicle
                    </button>
                </div>

                {vehicles.length === 0 ? (
                    <div className="empty-state">
                        <Car size={64} />
                        <h3>No vehicles yet</h3>
                        <p>Add your first vehicle to start accepting emergency requests</p>
                        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                            <Plus size={20} />
                            Add Vehicle
                        </button>
                    </div>
                ) : (
                    <div className="vehicle-grid">
                        {vehicles.map((vehicle) => (
                            <div key={vehicle.id} className="vehicle-card">
                                <div className="vehicle-header">
                                    <div className="vehicle-icon">
                                        <Car size={24} />
                                    </div>
                                    <span className={`badge ${getStatusBadge(vehicle.current_status)}`}>
                                        {vehicle.current_status}
                                    </span>
                                </div>
                                <h3>{vehicle.vehicle_name}</h3>
                                <div className="vehicle-details">
                                    <div className="detail-row">
                                        <span className="label">Type:</span>
                                        <span className="value">{vehicle.vehicle_type}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">Registration:</span>
                                        <span className="value">{vehicle.registration_number}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">Capacity:</span>
                                        <span className="value">{vehicle.capacity} patient(s)</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">Equipment:</span>
                                        <span className="value">{vehicle.medical_equipment_level}</span>
                                    </div>
                                </div>
                                <div className="vehicle-actions">
                                    <button className="btn-danger btn-sm" onClick={() => handleDeleteVehicle(vehicle.id)}>
                                        <Trash2 size={16} />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {showAddModal && (
                    <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h2>Add New Vehicle</h2>
                            <form onSubmit={handleAddVehicle}>
                                <div className="form-group">
                                    <label htmlFor="vehicleName">Vehicle Name *</label>
                                    <input
                                        id="vehicleName"
                                        type="text"
                                        value={formData.vehicle_name}
                                        onChange={(e) => setFormData({ ...formData, vehicle_name: e.target.value })}
                                        placeholder="Ambulance 1"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="vehicleType">Vehicle Type *</label>
                                    <select
                                        id="vehicleType"
                                        value={formData.vehicle_type}
                                        onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                                        required
                                    >
                                        {availableVehicleTypes.length > 0 ? (
                                            availableVehicleTypes.map((type) => (
                                                <option key={type.value} value={type.value}>
                                                    {type.label}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="ambulance">Ambulance</option>
                                        )}
                                    </select>
                                    {company?.operating_location && (
                                        <p className="form-help" style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                                            Available for {company.operating_location}: {availableVehicleTypes.map(t => t.label).join(', ')}
                                        </p>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="registration">Registration Number *</label>
                                    <input
                                        id="registration"
                                        type="text"
                                        value={formData.registration_number}
                                        onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                                        placeholder="ABC-1234"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="capacity">Patient Capacity *</label>
                                    <input
                                        id="capacity"
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={formData.capacity}
                                        onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="equipment">Medical Equipment Level *</label>
                                    <select
                                        id="equipment"
                                        value={formData.medical_equipment_level}
                                        onChange={(e) => setFormData({ ...formData, medical_equipment_level: e.target.value })}
                                        required
                                    >
                                        <option value="basic">Basic</option>
                                        <option value="advanced">Advanced</option>
                                        <option value="icu">ICU</option>
                                        <option value="air_ambulance">Air Ambulance</option>
                                    </select>
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary">
                                        Add Vehicle
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
