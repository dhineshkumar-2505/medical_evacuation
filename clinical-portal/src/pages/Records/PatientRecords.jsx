import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/apiClient';
import { ArrowLeft, User, Calendar, Activity, Heart, Wind, Gauge, Thermometer, Clock } from 'lucide-react';
import useVitalsAnalysis from '../../hooks/useVitalsAnalysis';
import './PatientRecords.css';

export default function PatientRecords() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [vitalsHistory, setVitalsHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const analysis = useVitalsAnalysis(vitalsHistory);

    useEffect(() => {
        if (id) {
            fetchPatientData();
        }
    }, [id]);

    const fetchPatientData = async () => {
        try {
            const patientRes = await api.get(`/patients/${id}`);
            setPatient(patientRes.data || patientRes);

            const vitalsRes = await api.get(`/vitals?patient_id=${id}&limit=50`);
            setVitalsHistory(vitalsRes.data || []);
        } catch (err) {
            console.error('Error fetching patient data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Group vitals by date
    const groupByDate = (records) => {
        const groups = {};
        records.forEach(record => {
            const date = new Date(record.recorded_at).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(record);
        });
        return groups;
    };

    const groupedVitals = groupByDate(vitalsHistory);

    const getStatusClass = (status) => {
        const s = (status || 'stable').toLowerCase();
        switch (s) {
            case 'critical': return 'status-critical';
            case 'observe': case 'observation': return 'status-observe';
            default: return 'status-stable';
        }
    };

    const getStatusLabel = (status) => {
        const s = (status || 'stable').toLowerCase();
        switch (s) {
            case 'critical': return 'Critical';
            case 'observe': case 'observation': return 'Observe';
            default: return 'Stable';
        }
    };

    if (loading) {
        return <div className="loading-page"><div className="spinner"></div></div>;
    }

    if (!patient) {
        return (
            <div className="error-page">
                <h2>Patient Not Found</h2>
                <button onClick={() => navigate('/records')} className="btn btn-primary">Back to Records</button>
            </div>
        );
    }

    return (
        <div className="patient-records-premium">
            {/* Back Button */}
            <button onClick={() => navigate('/records')} className="back-btn-premium">
                <ArrowLeft size={18} />
                Back to Records
            </button>

            {/* Patient Header */}
            <div className="patient-header-premium">
                <div className="header-avatar-large">
                    <User size={36} />
                </div>
                <div className="header-info-col">
                    <h1 className="patient-name-large">{patient.name}</h1>
                    <span className="patient-meta-text">
                        {patient.patient_id} • {patient.age} yrs • {patient.gender}
                    </span>
                </div>
                <div className="header-badges-row">
                    <span className={`status-badge-large ${getStatusClass(analysis.status)}`}>
                        {getStatusLabel(analysis.status)}
                    </span>
                    {patient.blood_type && (
                        <span className="blood-badge-large">{patient.blood_type}</span>
                    )}
                </div>
            </div>

            {/* Risk Score Summary */}
            {vitalsHistory.length > 0 && (
                <div className="risk-summary-bar">
                    <div className="risk-info">
                        <span className="risk-label">Current Risk Score</span>
                        <span className={`risk-value ${getStatusClass(analysis.status)}`}>{analysis.riskScore}/100</span>
                    </div>
                    <div className="risk-explanation">{analysis.explanation}</div>
                </div>
            )}

            {/* Timeline Section */}
            <div className="timeline-section">
                <h2 className="timeline-title-premium">
                    <Activity size={22} />
                    Medical Timeline
                    <span className="record-count-badge">{vitalsHistory.length} records</span>
                </h2>

                {vitalsHistory.length === 0 ? (
                    <div className="empty-timeline-premium">
                        <Calendar size={56} />
                        <p>No records found for this patient.</p>
                    </div>
                ) : (
                    <div className="date-groups-container">
                        {Object.entries(groupedVitals).map(([date, records]) => (
                            <div key={date} className="date-group-premium">
                                <div className="date-header-premium">
                                    <Calendar size={16} />
                                    <span>{date}</span>
                                </div>
                                <div className="records-grid">
                                    {records.map((record, idx) => {
                                        const seqNum = records.length - idx;
                                        const singleAnalysis = useVitalsAnalysis([record]);

                                        return (
                                            <div key={record.id || idx} className="record-card-premium">
                                                {/* Card Header */}
                                                <div className="record-card-header">
                                                    <span className="record-seq">#{seqNum}</span>
                                                    <span className="record-time">
                                                        <Clock size={14} />
                                                        {new Date(record.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <span className={`record-status ${getStatusClass(singleAnalysis.status)}`}>
                                                        {getStatusLabel(singleAnalysis.status)}
                                                    </span>
                                                </div>

                                                {/* Vitals Grid */}
                                                <div className="record-vitals-grid">
                                                    <div className="vital-box">
                                                        <Heart size={20} className="vital-icon heart" />
                                                        <div className="vital-data">
                                                            <span className="vital-value">{record.heart_rate || '--'}</span>
                                                            <span className="vital-unit">BPM</span>
                                                        </div>
                                                    </div>
                                                    <div className="vital-box">
                                                        <Wind size={20} className="vital-icon spo2" />
                                                        <div className="vital-data">
                                                            <span className="vital-value">{record.spo2 || '--'}</span>
                                                            <span className="vital-unit">%</span>
                                                        </div>
                                                    </div>
                                                    <div className="vital-box">
                                                        <Gauge size={20} className="vital-icon bp" />
                                                        <div className="vital-data">
                                                            <span className="vital-value">{record.blood_pressure || '--'}</span>
                                                            <span className="vital-unit">mmHg</span>
                                                        </div>
                                                    </div>
                                                    <div className="vital-box">
                                                        <Thermometer size={20} className="vital-icon temp" />
                                                        <div className="vital-data">
                                                            <span className="vital-value">{record.temperature || '--'}</span>
                                                            <span className="vital-unit">°F</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
