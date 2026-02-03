import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, CheckCircle, ArrowLeft, Loader2, Phone, MapPin } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import './DriverAssignment.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function DriverAssignment() {
    const { bookingId } = useParams();
    const navigate = useNavigate();

    const [booking, setBooking] = useState(null);
    const [drivers, setDrivers] = useState([]);
    const [selectedDriverId, setSelectedDriverId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, [bookingId]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch booking details
            const bookingResponse = await fetch(`${API_URL}/bookings/${bookingId}`, {
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            if (!bookingResponse.ok) throw new Error('Failed to fetch booking');
            const bookingData = await bookingResponse.json();
            setBooking(bookingData.data);

            // Fetch available drivers
            const driversResponse = await fetch(`${API_URL}/drivers?status=active`, {
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            if (!driversResponse.ok) throw new Error('Failed to fetch drivers');
            const driversData = await driversResponse.json();
            setDrivers(driversData.data || []);

        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load booking details');
            toast.error('Failed to load booking details');
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedDriverId) {
            toast.error('Please select a driver');
            return;
        }

        try {
            setSubmitting(true);

            const response = await fetch(`${API_URL}/bookings/${bookingId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    status: 'driver_assigned',
                    driver_id: selectedDriverId
                })
            });

            if (!response.ok) throw new Error('Failed to assign driver');

            toast.success('Driver assigned successfully');
            navigate('/bookings');

        } catch (err) {
            console.error('Error assigning driver:', err);
            toast.error('Failed to assign driver');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="driver-assignment-page">
                <div className="loading-state">
                    <Loader2 className="spinner" size={40} />
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div className="driver-assignment-page">
                <div className="error-state">
                    <p>{error || 'Booking not found'}</p>
                    <button className="btn-back" onClick={() => navigate('/bookings')}>
                        <ArrowLeft size={16} />
                        Back to Bookings
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="driver-assignment-page">
                {/* Header */}
                <div className="page-header">
                    <button className="btn-back" onClick={() => navigate('/bookings')}>
                        <ArrowLeft size={18} />
                        Back
                    </button>
                    <div>
                        <h1 className="page-title">Assign Driver</h1>
                        <p className="page-description">Select a driver for this booking</p>
                    </div>
                </div>

                {/* Booking Summary */}
                <div className="booking-summary">
                    <h3>Booking Details</h3>
                    <div className="summary-grid">
                        <div className="summary-item">
                            <span className="label">Patient:</span>
                            <span className="value">{booking.patient?.name}</span>
                        </div>
                        <div className="summary-item">
                            <span className="label">Risk Score:</span>
                            <span className="value risk-badge">
                                {booking.patient_risk_score}/100
                            </span>
                        </div>
                        <div className="summary-item">
                            <span className="label">Route:</span>
                            <span className="value">
                                {booking.pickup_location} → {booking.destination_location}
                            </span>
                        </div>
                        <div className="summary-item">
                            <span className="label">Vehicle:</span>
                            <span className="value">
                                {booking.vehicle?.vehicle_name || 'Not assigned'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Driver Selection */}
                <div className="driver-selection">
                    <h3>Available Drivers</h3>

                    {drivers.length === 0 ? (
                        <div className="empty-state">
                            <User size={48} />
                            <p>No available drivers at the moment</p>
                        </div>
                    ) : (
                        <div className="drivers-grid">
                            {drivers.map((driver) => (
                                <div
                                    key={driver.id}
                                    className={`driver-card ${selectedDriverId === driver.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedDriverId(driver.id)}
                                >
                                    <div className="driver-avatar">
                                        <User size={32} />
                                    </div>

                                    <div className="driver-info">
                                        <h4>{driver.name}</h4>
                                        <p className="driver-license">License: {driver.license_number}</p>
                                    </div>

                                    <div className="driver-contact">
                                        <div className="contact-item">
                                            <Phone size={14} />
                                            <span>{driver.phone}</span>
                                        </div>
                                        {driver.current_location && (
                                            <div className="contact-item">
                                                <MapPin size={14} />
                                                <span>{driver.current_location}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className={`status-indicator status-${driver.status}`}>
                                        {driver.status}
                                    </div>

                                    {selectedDriverId === driver.id && (
                                        <div className="selected-indicator">
                                            <CheckCircle size={20} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="action-footer">
                    <button
                        className="btn-cancel"
                        onClick={() => navigate('/bookings')}
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn-assign"
                        onClick={handleAssign}
                        disabled={!selectedDriverId || submitting}
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="spinner" size={16} />
                                Assigning...
                            </>
                        ) : (
                            <>
                                <CheckCircle size={16} />
                                Assign Driver
                            </>
                        )}
                    </button>
                </div>
            </div>
            <Toaster position="top-right" />
        </>
    );
}
