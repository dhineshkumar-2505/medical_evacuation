import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, User, AlertTriangle, TrendingUp, Bell, Loader2, MapPin } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import './BookingRequests.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function BookingRequests() {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending'); // pending, confirmed, all
    const [processingId, setProcessingId] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchBookings();

        // Set up real-time subscription
        const interval = setInterval(fetchBookings, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, [filter]);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            setError(null);

            const endpoint = filter === 'all'
                ? '/bookings'
                : `/bookings?status=${filter}`;

            const response = await fetch(`${API_URL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to fetch bookings');

            const data = await response.json();
            setBookings(data.data || []);
        } catch (err) {
            console.error('Error fetching bookings:', err);
            setError('Failed to load bookings');
            toast.error('Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (bookingId) => {
        setProcessingId(bookingId);
        try {
            const response = await fetch(`${API_URL}/bookings/${bookingId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ status: 'confirmed' })
            });

            if (!response.ok) throw new Error('Failed to accept booking');
            toast.success('Booking accepted');
            fetchBookings();
        } catch (err) {
            console.error('Error accepting booking:', err);
            toast.error('Failed to accept booking');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (bookingId) => {
        if (!confirm('Are you sure you want to reject this booking?')) return;

        setProcessingId(bookingId);
        try {
            const response = await fetch(`${API_URL}/bookings/${bookingId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ status: 'cancelled' })
            });

            if (!response.ok) throw new Error('Failed to reject booking');
            toast.success('Booking rejected');
            fetchBookings();
        } catch (err) {
            console.error('Error rejecting booking:', err);
            toast.error('Failed to reject booking');
        } finally {
            setProcessingId(null);
        }
    };

    const handleAssignDriver = (bookingId) => {
        navigate(`/bookings/${bookingId}/assign-driver`);
    };

    const getRiskBadgeClass = (score) => {
        if (score >= 80) return 'risk-critical';
        if (score >= 60) return 'risk-high';
        if (score >= 30) return 'risk-moderate';
        return 'risk-low';
    };

    const getUrgencyBadgeClass = (urgency) => {
        const map = {
            critical: 'urgency-critical',
            high: 'urgency-high',
            medium: 'urgency-medium',
            low: 'urgency-low'
        };
        return map[urgency] || 'urgency-medium';
    };

    return (
        <div className="booking-requests-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">
                        <Bell size={28} />
                        Booking Requests
                    </h1>
                    <p className="page-description">Manage incoming transport bookings</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="filter-tabs">
                <button
                    className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
                    onClick={() => setFilter('pending')}
                >
                    Pending
                    {bookings.filter(b => b.booking_status === 'pending').length > 0 && (
                        <span className="badge-count">
                            {bookings.filter(b => b.booking_status === 'pending').length}
                        </span>
                    )}
                </button>
                <button
                    className={`filter-tab ${filter === 'confirmed' ? 'active' : ''}`}
                    onClick={() => setFilter('confirmed')}
                >
                    Confirmed
                </button>
                <button
                    className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All Bookings
                </button>
            </div>

            {/* Bookings List */}
            <div className="bookings-container">
                {loading ? (
                    <div className="loading-state">
                        <Loader2 className="spinner" size={40} />
                        <p>Loading bookings...</p>
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="empty-state">
                        <Bell size={64} />
                        <h3>No Bookings</h3>
                        <p>You don't have any {filter !== 'all' ? filter : ''} bookings at the moment.</p>
                    </div>
                ) : (
                    <div className="bookings-grid">
                        {bookings.map((booking) => (
                            <div key={booking.id} className="booking-card">
                                {/* Header */}
                                <div className="booking-header">
                                    <div className="booking-badges">
                                        <span className={`badge ${getRiskBadgeClass(booking.patient_risk_score)}`}>
                                            Risk: {booking.patient_risk_score}/100
                                        </span>
                                        <span className={`badge ${getUrgencyBadgeClass(booking.urgency)}`}>
                                            {booking.urgency}
                                        </span>
                                    </div>
                                    <span className={`status-badge status-${booking.booking_status}`}>
                                        {booking.booking_status}
                                    </span>
                                </div>

                                {/* Patient Info */}
                                <div className="booking-section">
                                    <div className="section-icon">
                                        <User size={18} />
                                    </div>
                                    <div className="section-content">
                                        <h4>Patient</h4>
                                        <p className="patient-name">{booking.patient?.name || 'Unknown'}</p>
                                        <p className="patient-id">ID: {booking.patient?.patient_id}</p>
                                    </div>
                                </div>

                                {/* Location Info */}
                                <div className="booking-section">
                                    <div className="section-icon">
                                        <MapPin size={18} />
                                    </div>
                                    <div className="section-content">
                                        <h4>Route</h4>
                                        <p className="location-from">{booking.pickup_location}</p>
                                        <p className="location-arrow">→</p>
                                        <p className="location-to">{booking.destination_location}</p>
                                    </div>
                                </div>

                                {/* Vehicle Recommendation */}
                                <div className="booking-section">
                                    <div className="section-icon">
                                        <AlertTriangle size={18} />
                                    </div>
                                    <div className="section-content">
                                        <h4>Recommended Vehicle</h4>
                                        <p className="recommended-vehicle">
                                            {booking.recommended_vehicle_type || 'Any'}
                                        </p>
                                        {booking.vehicle && (
                                            <p className="assigned-vehicle">
                                                Assigned: {booking.vehicle.vehicle_name}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Timing */}
                                <div className="booking-section">
                                    <div className="section-icon">
                                        <Clock size={18} />
                                    </div>
                                    <div className="section-content">
                                        <h4>Requested</h4>
                                        <p className="booking-time">
                                            {new Date(booking.requested_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                {/* Special Requirements */}
                                {booking.special_requirements && (
                                    <div className="booking-notes">
                                        <strong>Special Requirements:</strong>
                                        <p>{booking.special_requirements}</p>
                                    </div>
                                )}

                                {/* Notes */}
                                {booking.notes && (
                                    <div className="booking-notes">
                                        <strong>Notes:</strong>
                                        <p>{booking.notes}</p>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="booking-actions">
                                    {booking.booking_status === 'pending' && (
                                        <>
                                            <button
                                                className="btn-accept"
                                                onClick={() => handleAccept(booking.id)}
                                                disabled={processingId === booking.id}
                                            >
                                                {processingId === booking.id ? (
                                                    <Loader2 className="spinner" size={16} />
                                                ) : (
                                                    <CheckCircle size={16} />
                                                )}
                                                Accept
                                            </button>
                                            <button
                                                className="btn-reject"
                                                onClick={() => handleReject(booking.id)}
                                                disabled={processingId === booking.id}
                                            >
                                                <XCircle size={16} />
                                                Reject
                                            </button>
                                        </>
                                    )}

                                    {booking.booking_status === 'confirmed' && !booking.driver_id && (
                                        <button
                                            className="btn-assign"
                                            onClick={() => handleAssignDriver(booking.id)}
                                        >
                                            <User size={16} />
                                            Assign Driver
                                        </button>
                                    )}

                                    {booking.driver && (
                                        <div className="driver-assigned">
                                            <User size={16} />
                                            Driver: {booking.driver.name}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <Toaster position="top-right" />
        </div>
    );
}
