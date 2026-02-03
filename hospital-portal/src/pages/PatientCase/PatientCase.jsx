import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Area, AreaChart
} from 'recharts';
import './PatientCase.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const PatientCase = () => {
    const { caseId } = useParams();
    const navigate = useNavigate();
    const { hospital } = useAuth();

    const [caseData, setCaseData] = useState(null);
    const [patient, setPatient] = useState(null);
    const [vitals, setVitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [acknowledging, setAcknowledging] = useState(false);

    useEffect(() => {
        if (caseId) {
            fetchCaseData();
        }
    }, [caseId]);

    const fetchCaseData = async () => {
        try {
            // Get specific case details
            // In a real app we might have a direct endpoint, but here we can fetch lists
            const criticalRes = await fetch(`${API_URL}/api/critical/hospital/${hospital?.id}`);
            const criticalData = await criticalRes.json();

            if (criticalData.success) {
                const foundCase = criticalData.cases.find(c => c.id === caseId);

                if (foundCase) {
                    setCaseData(foundCase);

                    // Fetch patient details
                    const patientRes = await fetch(`${API_URL}/api/critical/patient/${foundCase.patient_id}`);
                    const patientData = await patientRes.json();

                    if (patientData.success) {
                        setPatient(patientData.patient);
                        setVitals(patientData.vitals || []);
                    }
                } else {
                    toast.error('Case not found');
                    navigate('/cases');
                }
            }
        } catch (error) {
            console.error('Error fetching case:', error);
            toast.error('Failed to load case details');
        } finally {
            setLoading(false);
        }
    };

    const handleAcknowledge = async () => {
        if (!caseData) return;

        setAcknowledging(true);
        try {
            const res = await fetch(`${API_URL}/api/critical/acknowledge/${caseData.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hospital_id: hospital?.id })
            });

            const data = await res.json();

            if (data.success) {
                toast.success('Case acknowledged! Clinic has been notified.');
                setCaseData({ ...caseData, status: 'acknowledged', acknowledged_at: new Date().toISOString() });
            } else {
                toast.error(data.error || 'Failed to acknowledge');
            }
        } catch (error) {
            console.error('Error acknowledging:', error);
            toast.error('Failed to acknowledge case');
        } finally {
            setAcknowledging(false);
        }
    };

    // Latest Vitals
    const latestVitals = vitals.length > 0 ? vitals[vitals.length - 1] : null;

    // Parse BP helper
    const parseBP = (v) => {
        if (v.systolic_bp && v.diastolic_bp) return { s: v.systolic_bp, d: v.diastolic_bp };
        if (v.blood_pressure) {
            const [s, d] = v.blood_pressure.split('/').map(n => parseInt(n));
            if (!isNaN(s) && !isNaN(d)) return { s, d };
        }
        return { s: null, d: null };
    };

    // Chart Data
    const chartData = vitals.map((v, i) => {
        const bp = parseBP(v);
        return {
            name: new Date(v.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            heartRate: v.heart_rate,
            systolic: bp.s,
            diastolic: bp.d,
            spo2: v.spo2,
            temperature: v.temperature
        };
    });

    if (loading) return <div className="loading-page">Loading details...</div>;
    if (!caseData) return <div className="loading-page">Case not found</div>;

    return (
        <div className="patient-case-page">
            <button className="back-link" onClick={() => navigate('/cases')}>
                ← Back to Cases
            </button>

            {/* Case Header */}
            <div className="case-header">
                <div className="patient-hero">
                    <div className="patient-avatar-large">
                        {patient?.name?.charAt(0) || 'P'}
                    </div>
                    <div className="patient-hero-info">
                        <span className="patient-id-badge">{patient?.patient_id}</span>
                        <h1>{patient?.name}</h1>
                        <div className="patient-meta-grid">
                            <div className="meta-item">
                                <span className="meta-label">Age / Gender</span>
                                <span className="meta-value">{patient?.age} yrs / {patient?.gender}</span>
                            </div>
                            <div className="meta-item">
                                <span className="meta-label">Blood Type</span>
                                <span className="meta-value">{patient?.blood_group || '--'}</span>
                            </div>
                            <div className="meta-item">
                                <span className="meta-label">Condition</span>
                                <span className="meta-value status-critical">{caseData.condition || 'Critical'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="clinic-info-card">
                    <div className="clinic-label">Transferring From</div>
                    <div className="clinic-name">{caseData.clinic?.name}</div>
                    <div className="clinic-location">{caseData.clinic?.operating_location}</div>
                </div>
            </div>

            {/* Status Banner */}
            <div className={`status-banner ${caseData.status}`}>
                <div className="status-text">
                    <span className="status-icon">
                        {caseData.status === 'acknowledged' ? '✅' : '🚨'}
                    </span>
                    <div>
                        <h3>{caseData.status === 'acknowledged' ? 'Admission Acknowledged' : 'Action Required'}</h3>
                        <span>
                            {caseData.status === 'acknowledged'
                                ? `Acknowledged at ${new Date(caseData.acknowledged_at).toLocaleString()}`
                                : 'Please review metrics and acknowledge transfer'}
                        </span>
                    </div>
                </div>
                {caseData.status !== 'acknowledged' && (
                    <button
                        className="acknowledge-btn"
                        onClick={handleAcknowledge}
                        disabled={acknowledging}
                    >
                        {acknowledging ? 'Processing...' : 'Acknowledge Transfer'}
                    </button>
                )}
            </div>

            {/* Vitals Overview */}
            <div className="vitals-section">
                <div className="section-title">
                    <div className="section-title-icon vitals">📊</div>
                    Current Vitals
                </div>

                <div className="vitals-cards-grid">
                    <div className="vital-card heart">
                        <div className="vital-icon">❤️</div>
                        <div className="vital-value">{latestVitals?.heart_rate || '--'} <span className="unit">bpm</span></div>
                        <div className="vital-label">Heart Rate</div>
                    </div>
                    <div className="vital-card bp">
                        <div className="vital-icon">🩸</div>
                        <div className="vital-value">
                            {latestVitals?.blood_pressure ||
                                (latestVitals?.systolic_bp ? `${latestVitals.systolic_bp}/${latestVitals.diastolic_bp}` : '--/--')}
                        </div>
                        <div className="vital-label">Blood Pressure</div>
                    </div>
                    <div className="vital-card oxygen">
                        <div className="vital-icon">💧</div>
                        <div className="vital-value">{latestVitals?.spo2 || '--'} <span className="unit">%</span></div>
                        <div className="vital-label">SpO2</div>
                    </div>
                    <div className="vital-card temp">
                        <div className="vital-icon">🌡️</div>
                        <div className="vital-value">{latestVitals?.temperature || '--'} <span className="unit">°F</span></div>
                        <div className="vital-label">Temperature</div>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="charts-grid">
                <div className="chart-card">
                    <div className="chart-header">
                        <h3><span>❤️</span> Heart Rate History</h3>
                    </div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis domain={['auto', 'auto']} fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Area type="monotone" dataKey="heartRate" stroke="#ef4444" fillOpacity={1} fill="url(#colorHr)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-header">
                        <h3><span>🩸</span> Blood Pressure Trend</h3>
                    </div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis domain={['auto', 'auto']} fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Line type="monotone" dataKey="systolic" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} />
                                <Line type="monotone" dataKey="diastolic" stroke="#a855f7" strokeWidth={3} strokeDasharray="5 5" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-header">
                        <h3><span>💧</span> SpO2 History</h3>
                    </div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorSpo2" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis domain={['auto', 'auto']} fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Area type="monotone" dataKey="spo2" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSpo2)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-header">
                        <h3><span>🌡️</span> Temperature History</h3>
                    </div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis domain={['auto', 'auto']} fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Area type="monotone" dataKey="temperature" stroke="#f59e0b" fillOpacity={1} fill="url(#colorTemp)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientCase;
