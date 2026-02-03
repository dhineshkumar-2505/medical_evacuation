import { useState, useEffect } from 'react';
import { Truck, User, MapPin, Clock, AlertCircle, CheckCircle2, Navigation, Phone } from 'lucide-react';
import api from '../../services/api';
import './PatientTransportStatus.css';

export default function PatientTransportStatus({ patientId }) {
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (patientId) {
            fetchTransportStatus();

            // Poll for updates every 15 seconds
            const interval = setInterval(fetchTransportStatus, 15000);
            return () => clearInterval(interval);
        }
    }, [patientId]);

    const fetchTransportStatus = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch active booking for this patient
            const response = await api.get(`/bookings/patient/${patientId}?status=active`);

            if (response.data && response.data.data && response.data.data.length > 0) {
                setBooking(response.data.data[0]); // Get most recent active booking
            } else {
                setBooking(null);
            }
        } catch (err) {
            console.error('Error fetching transport status:', err);
            setError('Failed to load transport status');
        } finally {
            setLoading(false);
        }
    };

    const getStatusInfo = (status) => {
        const statusMap = {
            pending: { label: 'Pending Confirmation', color: 'warning', icon: Clock },
            confirmed: { label: 'Confirmed', color: 'info', icon: CheckCircle2 },
            driver_assigned: { label: 'Driver Assigned', color: 'info', icon: User },
            in_progress: { label: 'In Transit', color: 'success', icon: Navigation },
            completed: { label: 'Completed', color: 'success', icon: CheckCircle2 },
            cancelled: { label: 'Cancelled', color: 'neutral', icon: AlertCircle }
        };
        return statusMap[status] || statusMap.pending;
    };

    const getRiskBadgeClass = (score) => {
        if (score >= 80) return 'risk-critical';
        if (score >= 60) return 'risk-high';
        if (score >= 30) return 'risk-moderate';
        return 'risk-low';
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getVehicleIcon = (type) => {
        const icons = {
            helicopter: '🚁',
            ambulance: '🚑',
            ship: '🚢',
            boat: '⛵'
        };
        return icons[type] || '🚗';
    };

    if (loading && !booking) {
        return (
            <div className="transport-status-card">
                <div className="status-header">
                    <Truck size={20} />
                    <h3>Transport Status</h3>
                </div>
                <div className="loading-state-small">
                    <div className="spinner-small"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="transport-status-card">
                <div className="status-header">
                    <Truck size={20} />
                    <h3>Transport Status</h3>
                </div>
                <div className="error-state-small">
                    <AlertCircle size={16} />
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="transport-status-card">
                <div className="status-header">
                    <Truck size={20} />
                    <h3>Transport Status</h3>
                </div>
                <div className="empty-state-small">
                    <p>No active transport booking</p>
                </div>
            </div>
        );
    }

    const statusInfo = getStatusInfo(booking.booking_status);
    const StatusIcon = statusInfo.icon;

    return (
        <div className="transport-status-card">
            {/* Header */}
            <div className="status-header">
                <Truck size={20} />
                <h3>Transport Status</h3>
                <span className={`status-badge status-${statusInfo.color}`}>
                    <StatusIcon size={14} />
                    {statusInfo.label}
                </span>
            </div>

            {/* Timeline */}
            <div className="transport-timeline">
                <div className={`timeline-step ${booking.requested_at ? 'completed' : ''}`}>
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                        <p className="timeline-label">Requested</p>
                        <p className="timeline-time">{formatDateTime(booking.requested_at)}</p>
                    </div>
                </div>

                <div className={`timeline-step ${booking.confirmed_at ? 'completed' : ''}`}>
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                        <p className="timeline-label">Confirmed</p>
                        <p className="timeline-time">{formatDateTime(booking.confirmed_at)}</p>
                    </div>
                </div>

                <div className={`timeline-step ${booking.driver_assigned_at ? 'completed' : ''}`}>
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                        <p className="timeline-label">Driver Assigned</p>
                        <p className="timeline-time">{formatDateTime(booking.driver_assigned_at)}</p>
                    </div>
                </div>

                <div className={`timeline-step ${booking.started_at ? 'completed' : ''}`}>
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                        <p className="timeline-label">In Transit</p>
                        <p className="timeline-time">{formatDateTime(booking.started_at)}</p>
                    </div>
                </div>

                <div className={`timeline-step ${booking.completed_at ? 'completed' : ''}`}>
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                        <p className="timeline-label">Arrived</p>
                        <p className="timeline-time">{formatDateTime(booking.completed_at)}</p>
                    </div>
                </div>
            </div>

            {/* Transport Details */}
            <div className="transport-details">
                {/* Risk Score */}
                <div className="detail-item">
                    <div className="detail-icon">
                        <AlertCircle size={16} />
                    </div>
                    <div className="detail-content">
                        <p className="detail-label">Patient Risk</p>
                        <span className={`risk-badge ${getRiskBadgeClass(booking.patient_risk_score)}`}>
                            {booking.patient_risk_score}/100
                        </span>
                    </div>
                </div>

                {/* Route */}
                <div className="detail-item">
                    <div className="detail-icon">
                        <MapPin size={16} />
                    </div>
                    <div className="detail-content">
                        <p className="detail-label">Route</p>
                        <p className="detail-value">{booking.pickup_location}</p>
                        <p className="detail-arrow">→</p>
                        <p className="detail-value">{booking.destination_location}</p>
                    </div>
                </div>

                {/* Transport Provider */}
                {booking.company && (
                    <div className="detail-item">
                        <div className="detail-icon">
                            <Truck size={16} />
                        </div>
                        <div className="detail-content">
                            <p className="detail-label">Transport Provider</p>
                            <p className="detail-value">{booking.company.company_name}</p>
                            {booking.company.contact_phone && (
                                <p className="detail-contact">
                                    <Phone size={12} />
                                    {booking.company.contact_phone}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Vehicle */}
                {booking.vehicle && (
                    <div className="detail-item">
                        <div className="detail-icon vehicle-icon">
                            {getVehicleIcon(booking.vehicle.vehicle_type)}
                        </div>
                        <div className="detail-content">
                            <p className="detail-label">Vehicle</p>
                            <p className="detail-value">
                                {booking.vehicle.vehicle_name} ({booking.vehicle.vehicle_type})
                            </p>
                            <p className="detail-meta">{booking.vehicle.license_plate}</p>
                        </div>
                    </div>
                )}

                {/* Driver */}
                {booking.driver && (
                    <div className="detail-item">
                        <div className="detail-icon">
                            <User size={16} />
                        </div>
                        <div className="detail-content">
                            <p className="detail-label">Driver</p>
                            <p className="detail-value">{booking.driver.name}</p>
                            {booking.driver.phone && (
                                <p className="detail-contact">
                                    <Phone size={12} />
                                    {booking.driver.phone}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* ETA */}
                {booking.estimated_arrival && !booking.completed_at && (
                    <div className="detail-item eta-highlight">
                        <div className="detail-icon">
                            <Clock size={16} />
                        </div>
                        <div className="detail-content">
                            <p className="detail-label">Estimated Arrival</p>
                            <p className="detail-value eta-value">
                                {formatDateTime(booking.estimated_arrival)}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Special Requirements */}
            {booking.special_requirements && (
                <div className="special-requirements">
                    <strong>Special Requirements:</strong>
                    <p>{booking.special_requirements}</p>
                </div>
            )}
        </div>
    );
}
