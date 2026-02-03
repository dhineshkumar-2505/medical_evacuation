import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/apiClient';
import {
    Ambulance,
    AlertTriangle,
    Plus,
    Clock,
    CheckCircle,
    XCircle,
} from 'lucide-react';
import './Evacuations.css';

export default function Evacuations() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const patientIdParam = searchParams.get('patient');

    const [evacuations, setEvacuations] = useState([]);
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(!!patientIdParam);

    const [formData, setFormData] = useState({
        patient_id: patientIdParam || '',
        urgency: 'prepare',
        reason: '',
        notes: '',
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch evacuations via secure API
            const evacRes = await api.get('/evacuations');
            setEvacuations(evacRes.data || []);

            // Fetch patients for modal via secure API
            const patientRes = await api.get('/patients');
            setPatients(patientRes.data || []);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await api.post('/evacuations', {
                patient_id: formData.patient_id,
                urgency: formData.urgency,
                reason: formData.reason,
                notes: formData.notes || null,
            });

            setShowModal(false);
            setFormData({ patient_id: '', urgency: 'prepare', reason: '', notes: '' });
            fetchData();
        } catch (err) {
            console.error('Error creating evacuation:', err);
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            await api.patch(`/evacuations/${id}`, { status: newStatus });
            fetchData();
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };


    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending': return 'warning';
            case 'approved': return 'info';
            case 'in_progress': return 'info';
            case 'completed': return 'success';
            case 'cancelled': return 'neutral';
            default: return 'neutral';
        }
    };

    const getUrgencyClass = (urgency) => {
        return urgency === 'immediate' ? 'danger' : 'warning';
    };

    return (
        <div className="evacuations-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Evacuation Requests</h1>
                    <p className="page-description">Manage patient evacuation requests</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={18} />
                        New Request
                    </button>
                </div>
            </div>

            {/* Evacuations List */}
            <div className="evacuations-list">
                {loading ? (
                    <div className="list-loading">
                        <div className="spinner spinner-lg"></div>
                    </div>
                ) : evacuations.length === 0 ? (
                    <div className="list-empty">
                        <Ambulance size={64} />
                        <h3>No Evacuation Requests</h3>
                        <p>All patients are stable</p>
                    </div>
                ) : (
                    evacuations.map((evac) => (
                        <div key={evac.id} className={`evacuation-card ${evac.urgency}`}>
                            <div className="evac-header">
                                <div className="evac-urgency">
                                    {evac.urgency === 'immediate' ? (
                                        <AlertTriangle size={20} />
                                    ) : (
                                        <Clock size={20} />
                                    )}
                                    <span className={`badge badge-${getUrgencyClass(evac.urgency)}`}>
                                        {evac.urgency}
                                    </span>
                                </div>
                                <span className={`badge badge-${getStatusBadge(evac.status)}`}>
                                    {evac.status?.replace('_', ' ')}
                                </span>
                            </div>

                            <div className="evac-patient">
                                <span className="patient-name">{evac.patient?.name || 'Unknown'}</span>
                                <span className="patient-id">{evac.patient?.patient_id}</span>
                            </div>

                            <div className="evac-reason">
                                <strong>Reason:</strong> {evac.reason}
                            </div>

                            {evac.notes && (
                                <div className="evac-notes">
                                    <strong>Notes:</strong> {evac.notes}
                                </div>
                            )}

                            <div className="evac-footer">
                                <span className="evac-time">
                                    {new Date(evac.created_at).toLocaleString()}
                                </span>

                                {evac.status === 'pending' && (
                                    <div className="evac-actions">
                                        <button
                                            className="btn-icon approve"
                                            onClick={() => updateStatus(evac.id, 'approved')}
                                            title="Approve"
                                        >
                                            <CheckCircle size={18} />
                                        </button>
                                        <button
                                            className="btn-icon cancel"
                                            onClick={() => updateStatus(evac.id, 'cancelled')}
                                            title="Cancel"
                                        >
                                            <XCircle size={18} />
                                        </button>
                                    </div>
                                )}

                                {evac.status === 'approved' && (
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => updateStatus(evac.id, 'in_progress')}
                                    >
                                        Start Transport
                                    </button>
                                )}

                                {evac.status === 'in_progress' && (
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => updateStatus(evac.id, 'completed')}
                                    >
                                        Mark Complete
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>
                                <Ambulance size={24} />
                                Request Evacuation
                            </h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <XCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Patient *</label>
                                <select
                                    name="patient_id"
                                    value={formData.patient_id}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Patient</option>
                                    {patients.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} ({p.patient_id}) - {p.status}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Urgency *</label>
                                <div className="urgency-options">
                                    <label className={`urgency-option ${formData.urgency === 'prepare' ? 'active' : ''}`}>
                                        <input
                                            type="radio"
                                            name="urgency"
                                            value="prepare"
                                            checked={formData.urgency === 'prepare'}
                                            onChange={handleChange}
                                        />
                                        <Clock size={20} />
                                        <span>Prepare</span>
                                        <small>Schedule for later</small>
                                    </label>
                                    <label className={`urgency-option ${formData.urgency === 'immediate' ? 'active danger' : ''}`}>
                                        <input
                                            type="radio"
                                            name="urgency"
                                            value="immediate"
                                            checked={formData.urgency === 'immediate'}
                                            onChange={handleChange}
                                        />
                                        <AlertTriangle size={20} />
                                        <span>Immediate</span>
                                        <small>Life-threatening</small>
                                    </label>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Reason *</label>
                                <select
                                    name="reason"
                                    value={formData.reason}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Reason</option>
                                    <option value="Critical SPO2 levels">Critical SPO2 levels</option>
                                    <option value="Cardiac emergency">Cardiac emergency</option>
                                    <option value="Trauma/Injury">Trauma/Injury</option>
                                    <option value="Surgery required">Surgery required</option>
                                    <option value="Specialist consultation">Specialist consultation</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Additional Notes</label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="Any additional information..."
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <Ambulance size={18} />
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
