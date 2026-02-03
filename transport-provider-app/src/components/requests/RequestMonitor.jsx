import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, getCurrentUser, signOut } from '../../lib/supabase'
import { Truck, Users, Car, AlertCircle, LogOut, Menu, MapPin, Clock, User } from 'lucide-react'
import { formatDateTime, getSeverityColor } from '../../lib/utils'
import '../dashboard/Dashboard.css'
import './RequestMonitor.css'

export default function RequestMonitor() {
    const navigate = useNavigate()
    const [company, setCompany] = useState(null)
    const [activeRequests, setActiveRequests] = useState([])
    const [pendingRequests, setPendingRequests] = useState([])
    const [completedRequests, setCompletedRequests] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('active')

    useEffect(() => {
        loadData()

        // Subscribe to real-time updates
        const subscription = supabase
            .channel('transport_requests')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'transport_requests' },
                () => loadData()
            )
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'transport_assignments' },
                () => loadData()
            )
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'transport_bookings' },
                () => loadData()
            )
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    const loadData = async () => {
        try {
            const user = await getCurrentUser()

            // Try to find company by user_id first, then admin_id
            let { data: companyData } = await supabase
                .from('transport_companies')
                .select('*')
                .eq('user_id', user.id)
                .single()

            if (!companyData) {
                // Fallback to admin_id
                const { data: companyByAdmin } = await supabase
                    .from('transport_companies')
                    .select('*')
                    .eq('admin_id', user.id)
                    .single()
                companyData = companyByAdmin
            }

            setCompany(companyData)

            if (!companyData) return

            // Get active assignments (in progress)
            const { data: activeData } = await supabase
                .from('transport_assignments')
                .select(`
          *,
          transport_requests(*),
          transport_bookings(*),
          drivers(full_name),
          vehicles(vehicle_name, registration_number)
        `)
                .eq('company_id', companyData.id)
                .in('current_status', ['accepted', 'en_route_pickup', 'patient_loaded', 'en_route_hospital'])
                .order('accepted_at', { ascending: false })

            setActiveRequests(activeData || [])

            // Get pending requests from transport_requests table
            const { data: pendingData } = await supabase
                .from('transport_requests')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false })

            // Also get pending bookings from transport_bookings table
            const { data: pendingBookings } = await supabase
                .from('transport_bookings')
                .select(`
                    *,
                    patient:patients(id, name, patient_id, risk_score),
                    clinic:clinics(id, name, location_name),
                    vehicle:vehicles(id, vehicle_name, vehicle_type)
                `)
                .eq('company_id', companyData.id)
                .eq('booking_status', 'pending')
                .order('created_at', { ascending: false })

            // Combine both pending lists, formatting bookings to match request structure
            const formattedBookings = (pendingBookings || []).map(b => ({
                id: b.id,
                status: 'pending',
                severity_level: b.urgency_level || 'routine',
                required_transport_type: b.recommended_vehicle_type || 'ambulance',
                pickup_address: b.pickup_location,
                destination_address: b.destination_location,
                created_at: b.created_at,
                patient_name: b.patient?.name,
                clinic_name: b.clinic?.name,
                isBooking: true
            }))

            setPendingRequests([...(pendingData || []), ...formattedBookings])

            // Get completed today
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            const { data: completedData } = await supabase
                .from('transport_assignments')
                .select(`
          *,
          transport_requests(*),
          drivers(full_name),
          vehicles(vehicle_name)
        `)
                .eq('company_id', companyData.id)
                .eq('current_status', 'delivered')
                .gte('completed_at', today.toISOString())
                .order('completed_at', { ascending: false })

            setCompletedRequests(completedData || [])

        } catch (error) {
            console.error('Error loading requests:', error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status) => {
        const badges = {
            pending: 'badge-warning',
            assigned: 'badge-info',
            accepted: 'badge-info',
            en_route_pickup: 'badge-info',
            patient_loaded: 'badge-warning',
            en_route_hospital: 'badge-warning',
            delivered: 'badge-success',
            cancelled: 'badge-danger'
        }
        return badges[status] || 'badge-gray'
    }

    const getStatusText = (status) => {
        return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
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
                    <button className="nav-item" onClick={() => navigate('/drivers')}>
                        <Users size={20} />
                        Drivers
                    </button>
                    <button className="nav-item active" onClick={() => navigate('/requests')}>
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
                        <h1>Request Monitor</h1>
                        <p>Track emergency transport requests in real-time</p>
                    </div>
                </div>

                <div className="tabs">
                    <button
                        className={`tab ${activeTab === 'active' ? 'active' : ''}`}
                        onClick={() => setActiveTab('active')}
                    >
                        Active ({activeRequests.length})
                    </button>
                    <button
                        className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
                        onClick={() => setActiveTab('pending')}
                    >
                        Pending ({pendingRequests.length})
                    </button>
                    <button
                        className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
                        onClick={() => setActiveTab('completed')}
                    >
                        Completed Today ({completedRequests.length})
                    </button>
                </div>

                {activeTab === 'active' && (
                    <div className="requests-container">
                        {activeRequests.length === 0 ? (
                            <div className="empty-state">
                                <AlertCircle size={64} />
                                <h3>No Active Trips</h3>
                                <p>Active trips will appear here when drivers accept requests</p>
                            </div>
                        ) : (
                            <div className="request-list">
                                {activeRequests.map((assignment) => {
                                    // Normalize request data from either source
                                    const requestData = assignment.transport_requests || {};
                                    const bookingData = assignment.transport_bookings || {};
                                    const isBooking = !!assignment.booking_id;
                                    const severity = isBooking ? (bookingData.urgency_level || 'routine') : (requestData.severity_level || 'routine');
                                    const pickup = isBooking ? bookingData.pickup_location : requestData.pickup_address;
                                    const dropoff = isBooking ? bookingData.destination_location : requestData.destination_address;

                                    return (
                                        <div key={assignment.id} className="request-card active-trip">
                                            <div className="request-header">
                                                <div className="severity-indicator"
                                                    style={{ backgroundColor: getSeverityColor(severity) }}
                                                />
                                                <div className="request-info">
                                                    <h3>Trip #{assignment.id.slice(0, 8)}</h3>
                                                    <p className="request-time">{formatDateTime(assignment.accepted_at)}</p>
                                                </div>
                                                <span className={`badge ${getStatusBadge(assignment.current_status)}`}>
                                                    {getStatusText(assignment.current_status)}
                                                </span>
                                            </div>

                                            <div className="request-details">
                                                <div className="detail-grid">
                                                    <div className="detail-item">
                                                        <User size={16} />
                                                        <div>
                                                            <span className="label">Driver</span>
                                                            <span className="value">{assignment.drivers?.full_name}</span>
                                                        </div>
                                                    </div>
                                                    <div className="detail-item">
                                                        <Car size={16} />
                                                        <div>
                                                            <span className="label">Vehicle</span>
                                                            <span className="value">
                                                                {assignment.vehicles?.vehicle_name} ({assignment.vehicles?.registration_number})
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="detail-item">
                                                        <MapPin size={16} />
                                                        <div>
                                                            <span className="label">Pickup</span>
                                                            <span className="value">{pickup}</span>
                                                        </div>
                                                    </div>
                                                    <div className="detail-item">
                                                        <MapPin size={16} />
                                                        <div>
                                                            <span className="label">Destination</span>
                                                            <span className="value">{dropoff}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="trip-timeline">
                                                <div className={`timeline-step ${assignment.accepted_at ? 'completed' : ''}`}>
                                                    <div className="timeline-dot"></div>
                                                    <span>Accepted</span>
                                                </div>
                                                <div className={`timeline-step ${assignment.pickup_started_at ? 'completed' : assignment.current_status === 'en_route_pickup' ? 'active' : ''}`}>
                                                    <div className="timeline-dot"></div>
                                                    <span>En Route Pickup</span>
                                                </div>
                                                <div className={`timeline-step ${assignment.patient_loaded_at ? 'completed' : assignment.current_status === 'patient_loaded' ? 'active' : ''}`}>
                                                    <div className="timeline-dot"></div>
                                                    <span>Patient Loaded</span>
                                                </div>
                                                <div className={`timeline-step ${assignment.delivery_started_at ? 'completed' : assignment.current_status === 'en_route_hospital' ? 'active' : ''}`}>
                                                    <div className="timeline-dot"></div>
                                                    <span>En Route Hospital</span>
                                                </div>
                                                <div className={`timeline-step ${assignment.completed_at ? 'completed' : ''}`}>
                                                    <div className="timeline-dot"></div>
                                                    <span>Delivered</span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'pending' && (
                    <div className="requests-container">
                        {pendingRequests.length === 0 ? (
                            <div className="empty-state">
                                <Clock size={64} />
                                <h3>No Pending Requests</h3>
                                <p>New emergency requests will appear here</p>
                            </div>
                        ) : (
                            <div className="request-list">
                                {pendingRequests.map((request) => (
                                    <div key={request.id} className="request-card">
                                        <div className="request-header">
                                            <div className="severity-indicator"
                                                style={{ backgroundColor: getSeverityColor(request.severity_level) }}
                                            />
                                            <div className="request-info">
                                                <h3>Request #{request.id.slice(0, 8)}</h3>
                                                <p className="request-time">{formatDateTime(request.created_at)}</p>
                                            </div>
                                            <span className={`badge ${getStatusBadge(request.status)}`}>
                                                {getStatusText(request.status)}
                                            </span>
                                        </div>

                                        <div className="request-details">
                                            <div className="detail-grid">
                                                <div className="detail-item">
                                                    <AlertCircle size={16} />
                                                    <div>
                                                        <span className="label">Severity</span>
                                                        <span className="value">{getStatusText(request.severity_level)}</span>
                                                    </div>
                                                </div>
                                                <div className="detail-item">
                                                    <Car size={16} />
                                                    <div>
                                                        <span className="label">Vehicle Type</span>
                                                        <span className="value">{getStatusText(request.required_transport_type)}</span>
                                                    </div>
                                                </div>
                                                <div className="detail-item">
                                                    <MapPin size={16} />
                                                    <div>
                                                        <span className="label">Pickup</span>
                                                        <span className="value">{request.pickup_address}</span>
                                                    </div>
                                                </div>
                                                <div className="detail-item">
                                                    <MapPin size={16} />
                                                    <div>
                                                        <span className="label">Destination</span>
                                                        <span className="value">{request.destination_address}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pending-notice">
                                            <Clock size={16} />
                                            <span>Waiting for driver to accept...</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'completed' && (
                    <div className="requests-container">
                        {completedRequests.length === 0 ? (
                            <div className="empty-state">
                                <AlertCircle size={64} />
                                <h3>No Completed Trips Today</h3>
                                <p>Completed trips will appear here</p>
                            </div>
                        ) : (
                            <div className="request-list">
                                {completedRequests.map((assignment) => (
                                    <div key={assignment.id} className="request-card completed">
                                        <div className="request-header">
                                            <div className="request-info">
                                                <h3>Trip #{assignment.id.slice(0, 8)}</h3>
                                                <p className="request-time">Completed {formatDateTime(assignment.completed_at)}</p>
                                            </div>
                                            <span className="badge badge-success">Delivered</span>
                                        </div>

                                        <div className="request-details">
                                            <div className="detail-grid">
                                                <div className="detail-item">
                                                    <User size={16} />
                                                    <div>
                                                        <span className="label">Driver</span>
                                                        <span className="value">{assignment.drivers?.full_name}</span>
                                                    </div>
                                                </div>
                                                <div className="detail-item">
                                                    <Car size={16} />
                                                    <div>
                                                        <span className="label">Vehicle</span>
                                                        <span className="value">{assignment.vehicles?.vehicle_name}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    )
}
