import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { MapPin, Navigation, AlertCircle, CheckCircle, ArrowLeft, Clock, User } from 'lucide-react'
import { formatDateTime, calculateDistance } from '../../lib/utils'
import './ActiveTrip.css'

export default function ActiveTrip({ driver }) {
    const { tripId } = useParams()
    const navigate = useNavigate()
    const [assignment, setAssignment] = useState(null)
    const [request, setRequest] = useState(null)
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)

    useEffect(() => {
        loadTrip()

        // Subscribe to real-time updates
        const subscription = supabase
            .channel(`trip-${tripId}`)
            .on('postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'transport_assignments',
                    filter: `id=eq.${tripId}`
                },
                (payload) => {
                    setAssignment(payload.new)
                }
            )
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }, [tripId])

    const loadTrip = async () => {
        try {
            const { data: assignmentData, error: assignmentError } = await supabase
                .from('transport_assignments')
                .select('*')
                .eq('id', tripId)
                .single()

            if (assignmentError) throw assignmentError
            setAssignment(assignmentData)

            let requestData = null

            // Handle request linked via request_id (Legacy/API)
            if (assignmentData.request_id) {
                const { data, error } = await supabase
                    .from('transport_requests')
                    .select('*')
                    .eq('id', assignmentData.request_id)
                    .single()

                if (error) throw error
                requestData = data
            }
            // Handle request linked via booking_id (Clinical Portal)
            else if (assignmentData.booking_id) {
                const { data, error } = await supabase
                    .from('transport_bookings')
                    .select(`
                        *,
                        patient:patients(*)
                    `)
                    .eq('id', assignmentData.booking_id)
                    .single()

                if (error) throw error

                // Normalizing booking data to match transport_request structure
                requestData = {
                    id: data.id,
                    patient_reference_id: data.patient?.patient_id || 'N/A',
                    severity_level: data.urgency_level || 'routine',
                    pickup_address: data.pickup_location,
                    pickup_latitude: data.origin_lat || 0, // Fallback if lat/lng not in bookings
                    pickup_longitude: data.origin_lng || 0,
                    destination_address: data.destination_location,
                    destination_latitude: data.dest_lat || 0,
                    destination_longitude: data.dest_lng || 0,
                    created_at: data.created_at
                }
            } else {
                console.warn('Assignment has no request_id or booking_id')
            }

            if (!requestData) throw new Error('No associated request or booking found')
            setRequest(requestData)


        } catch (error) {
            console.error('Error loading trip:', error)
            alert('Error loading trip details')
            navigate('/')
        } finally {
            setLoading(false)
        }
    }

    const updateStatus = async (newStatus) => {
        setUpdating(true)
        try {
            const updates = {
                current_status: newStatus
            }

            // Set timestamps based on status
            const now = new Date().toISOString()
            if (newStatus === 'en_route_pickup') {
                updates.pickup_started_at = now
            } else if (newStatus === 'patient_loaded') {
                updates.patient_loaded_at = now
            } else if (newStatus === 'en_route_hospital') {
                updates.delivery_started_at = now
            } else if (newStatus === 'delivered') {
                updates.completed_at = now
            }

            const { error } = await supabase
                .from('transport_assignments')
                .update(updates)
                .eq('id', tripId)

            if (error) throw error

            // SYNC TO CLINICAL PORTAL (Update transport_bookings if linked)
            if (assignment.booking_id) {
                let bookingStatusUpdate = null

                if (newStatus === 'delivered') {
                    bookingStatusUpdate = 'completed'
                } else if (['en_route_pickup', 'patient_loaded', 'en_route_hospital'].includes(newStatus)) {
                    bookingStatusUpdate = 'in_progress'
                }

                if (bookingStatusUpdate) {
                    await supabase
                        .from('transport_bookings')
                        .update({ booking_status: bookingStatusUpdate })
                        .eq('id', assignment.booking_id)
                }
            }

            // Update driver status
            if (newStatus === 'delivered') {
                await supabase
                    .from('drivers')
                    .update({ current_status: 'available' })
                    .eq('id', driver.id)

                alert('Trip completed! Status set to Available.')
                navigate('/')
            } else {
                await supabase
                    .from('drivers')
                    .update({ current_status: 'on_trip' })
                    .eq('id', driver.id)

                await loadTrip()
            }

        } catch (error) {
            console.error('Error updating status:', error)
            alert('Error updating status: ' + error.message)
        } finally {
            setUpdating(false)
        }
    }

    const getNextAction = () => {
        const actions = {
            accepted: {
                label: 'Start Going to Pickup',
                status: 'en_route_pickup',
                icon: Navigation,
                color: 'primary'
            },
            en_route_pickup: {
                label: 'Patient Loaded',
                status: 'patient_loaded',
                icon: CheckCircle,
                color: 'success'
            },
            patient_loaded: {
                label: 'Start Going to Hospital',
                status: 'en_route_hospital',
                icon: Navigation,
                color: 'primary'
            },
            en_route_hospital: {
                label: 'Mark as Delivered',
                status: 'delivered',
                icon: CheckCircle,
                color: 'success'
            }
        }
        return actions[assignment?.current_status]
    }

    if (loading || !assignment || !request) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        )
    }

    const nextAction = getNextAction()
    const distance = calculateDistance(
        request.pickup_latitude,
        request.pickup_longitude,
        request.destination_latitude,
        request.destination_longitude
    )

    return (
        <div className="active-trip-page">
            <header className="trip-header">
                <button className="btn-back" onClick={() => navigate('/')}>
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2>Active Trip</h2>
                    <p>Trip #{assignment.id.slice(0, 8)}</p>
                </div>
            </header>

            <div className="trip-status-banner">
                <AlertCircle size={24} />
                <div className="flex-1">
                    <h3>Current Status</h3>
                    <p>{assignment.current_status.replace(/_/g, ' ').toUpperCase()}</p>
                </div>
            </div>

            <div className="trip-details">
                <div className="detail-section">
                    <h3>Patient Information</h3>
                    <div className="info-grid">
                        <div className="info-item">
                            <User size={16} />
                            <div>
                                <span className="label">Patient ID</span>
                                <span className="value">{request.patient_reference_id}</span>
                            </div>
                        </div>
                        <div className="info-item">
                            <AlertCircle size={16} />
                            <div>
                                <span className="label">Severity</span>
                                <span className="value severity-badge"
                                    style={{
                                        backgroundColor: request.severity_level === 'critical' ? '#fee2e2' : '#fef3c7',
                                        color: request.severity_level === 'critical' ? '#991b1b' : '#92400e'
                                    }}
                                >
                                    {request.severity_level.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="detail-section">
                    <h3>Pickup Location</h3>
                    <div className="location-card">
                        <MapPin size={20} />
                        <div>
                            <p className="location-address">{request.pickup_address}</p>
                            <button className="btn-navigate" onClick={() => {
                                window.open(`https://www.google.com/maps/dir/?api=1&destination=${request.pickup_latitude},${request.pickup_longitude}`, '_blank')
                            }}>
                                <Navigation size={16} />
                                Navigate
                            </button>
                        </div>
                    </div>
                </div>

                <div className="detail-section">
                    <h3>Destination</h3>
                    <div className="location-card">
                        <MapPin size={20} />
                        <div>
                            <p className="location-address">{request.destination_address}</p>
                            <p className="distance-info">~{distance.toFixed(1)} km from pickup</p>
                            <button className="btn-navigate" onClick={() => {
                                window.open(`https://www.google.com/maps/dir/?api=1&destination=${request.destination_latitude},${request.destination_longitude}`, '_blank')
                            }}>
                                <Navigation size={16} />
                                Navigate
                            </button>
                        </div>
                    </div>
                </div>

                <div className="detail-section">
                    <h3>Trip Timeline</h3>
                    <div className="timeline">
                        <div className={`timeline-item ${assignment.accepted_at ? 'completed' : ''}`}>
                            <div className="timeline-icon">
                                <CheckCircle size={20} />
                            </div>
                            <div>
                                <p className="timeline-label">Accepted</p>
                                {assignment.accepted_at && (
                                    <p className="timeline-time">{formatDateTime(assignment.accepted_at)}</p>
                                )}
                            </div>
                        </div>

                        <div className={`timeline-item ${assignment.pickup_started_at ? 'completed' : assignment.current_status === 'en_route_pickup' ? 'active' : ''}`}>
                            <div className="timeline-icon">
                                <Navigation size={20} />
                            </div>
                            <div>
                                <p className="timeline-label">En Route to Pickup</p>
                                {assignment.pickup_started_at && (
                                    <p className="timeline-time">{formatDateTime(assignment.pickup_started_at)}</p>
                                )}
                            </div>
                        </div>

                        <div className={`timeline-item ${assignment.patient_loaded_at ? 'completed' : assignment.current_status === 'patient_loaded' ? 'active' : ''}`}>
                            <div className="timeline-icon">
                                <User size={20} />
                            </div>
                            <div>
                                <p className="timeline-label">Patient Loaded</p>
                                {assignment.patient_loaded_at && (
                                    <p className="timeline-time">{formatDateTime(assignment.patient_loaded_at)}</p>
                                )}
                            </div>
                        </div>

                        <div className={`timeline-item ${assignment.delivery_started_at ? 'completed' : assignment.current_status === 'en_route_hospital' ? 'active' : ''}`}>
                            <div className="timeline-icon">
                                <Navigation size={20} />
                            </div>
                            <div>
                                <p className="timeline-label">En Route to Hospital</p>
                                {assignment.delivery_started_at && (
                                    <p className="timeline-time">{formatDateTime(assignment.delivery_started_at)}</p>
                                )}
                            </div>
                        </div>

                        <div className={`timeline-item ${assignment.completed_at ? 'completed' : assignment.current_status === 'delivered' ? 'active' : ''}`}>
                            <div className="timeline-icon">
                                <CheckCircle size={20} />
                            </div>
                            <div>
                                <p className="timeline-label">Delivered</p>
                                {assignment.completed_at && (
                                    <p className="timeline-time">{formatDateTime(assignment.completed_at)}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {nextAction && (
                <div className="trip-actions">
                    <button
                        className={`btn-${nextAction.color} btn-full btn-lg`}
                        onClick={() => updateStatus(nextAction.status)}
                        disabled={updating}
                    >
                        {updating ? (
                            'Updating...'
                        ) : (
                            <>
                                {React.createElement(nextAction.icon, { size: 20 })}
                                {nextAction.label}
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    )
}
