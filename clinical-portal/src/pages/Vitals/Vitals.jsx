import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/apiClient';
import { socket } from '../../services/socketClient';
import {
    User, Activity, Clock, TrendingUp, AlertTriangle,
    Heart, Wind, Gauge, Thermometer, ChevronRight
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceDot, Area, ComposedChart
} from 'recharts';
import useVitalsAnalysis from '../../hooks/useVitalsAnalysis';
import VitalsEntryForm from '../../components/Vitals/VitalsEntryForm';
import './Vitals.css';

export default function Vitals() {
    const [searchParams] = useSearchParams();
    const patientId = searchParams.get('patient');

    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(() => {
        return patientId || localStorage.getItem('lastSelectedPatient') || '';
    });

    // Persist selection
    useEffect(() => {
        if (selectedPatient) {
            localStorage.setItem('lastSelectedPatient', selectedPatient);
        }
    }, [selectedPatient]);
    const [vitalsHistory, setVitalsHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    // Use ML-grade analysis hook
    const analysis = useVitalsAnalysis(vitalsHistory);

    useEffect(() => {
        fetchPatients();
        socket.connect();

        const cleanup = socket.on('vitals:logged', (data) => {
            if (selectedPatient && (!data.patient_id || data.patient_id === selectedPatient)) {
                fetchVitalsHistory(selectedPatient);
            }
        });

        return () => cleanup();
    }, [selectedPatient]);

    useEffect(() => {
        if (selectedPatient) {
            fetchVitalsHistory(selectedPatient);
        } else {
            setVitalsHistory([]);
        }
    }, [selectedPatient]);

    const fetchPatients = async () => {
        try {
            const response = await api.get('/patients');
            const data = response.data || response;
            setPatients(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching patients:', err);
        }
    };

    const fetchVitalsHistory = async (patId) => {
        setLoading(true);
        try {
            const response = await api.get(`/vitals?patient_id=${patId}&limit=20&active_session=true`);
            setVitalsHistory(response.data || []);
        } catch (err) {
            console.error('Error fetching vitals:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'critical': return 'status-critical';
            case 'observe': return 'status-observe';
            default: return 'status-stable';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'critical': return 'Critical';
            case 'observe': return 'Observe';
            default: return 'Stable';
        }
    };

    // Prepare chart data (reverse for chronological order)
    const chartData = [...vitalsHistory].reverse().map((v, idx) => ({
        index: idx + 1,
        time: new Date(v.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hr: v.heart_rate,
        spo2: v.spo2,
        rr: v.respiratory_rate,
        temp: v.temperature
    }));

    // Add prediction point if available
    if (analysis.predictions) {
        chartData.push({
            index: chartData.length + 1,
            time: 'Predicted',
            hr: analysis.predictions.heart_rate?.value,
            spo2: analysis.predictions.spo2?.value,
            rr: analysis.predictions.respiratory_rate?.value,
            temp: analysis.predictions.temperature?.value,
            isPrediction: true
        });
    }

    return (
        <div className="vitals-page-premium">
            {/* Header */}
            <div className="page-header-premium">
                <div className="header-content">
                    <h1 className="page-title-gradient">Vitals Analysis</h1>
                    <p className="page-subtitle">ML-Powered Sequential Monitoring</p>
                </div>
                {selectedPatient && vitalsHistory.length > 0 && (
                    <div className={`status-indicator ${getStatusClass(analysis.status)}`}>
                        <span className="status-dot"></span>
                        {getStatusLabel(analysis.status)}
                    </div>
                )}
            </div>

            {/* Patient Selector */}
            <div className="patient-selector-premium">
                <User className="selector-icon" />
                <select
                    value={selectedPatient}
                    onChange={(e) => setSelectedPatient(e.target.value)}
                    className="patient-select-input"
                >
                    <option value="">— Select Patient —</option>
                    {patients.map(p => (
                        <option key={p.id} value={p.id}>
                            {p.name} ({p.patient_id})
                        </option>
                    ))}
                </select>
            </div>

            {/* Main Content */}
            {selectedPatient && (
                <div className="vitals-main-grid">
                    {/* Left: Entry Form */}
                    <div className="panel-premium form-panel">
                        <VitalsEntryForm
                            patientId={selectedPatient}
                            onSuccess={() => fetchVitalsHistory(selectedPatient)}
                            onCompleteSession={() => {
                                // Clear local history to start fresh session
                                setVitalsHistory([]);
                            }}
                        />
                    </div>

                    {/* Right: Analysis Timeline */}
                    <div className="panel-premium timeline-panel">
                        <div className="panel-header-premium">
                            <Activity size={20} />
                            <h3>Analysis Timeline</h3>
                            <span className="record-count">{vitalsHistory.length} records</span>
                        </div>

                        {loading ? (
                            <div className="loading-state"><div className="spinner"></div></div>
                        ) : vitalsHistory.length === 0 ? (
                            <div className="empty-state-premium">
                                <Activity size={48} />
                                <p>No records yet. Start logging vitals.</p>
                            </div>
                        ) : (
                            <div className="timeline-scroll">
                                {vitalsHistory.map((record, idx) => {
                                    const seqNum = vitalsHistory.length - idx;
                                    const recordAnalysis = useVitalsAnalysis([record]);

                                    return (
                                        <div key={record.id || idx} className="timeline-card-premium">
                                            <div className="card-left">
                                                <span className="seq-badge-premium">#{seqNum}</span>
                                            </div>
                                            <div className="card-center">
                                                <div className="vitals-mini-grid">
                                                    <div className="vital-mini">
                                                        <Heart size={14} className="mini-icon hr" />
                                                        <span>{record.heart_rate || '--'}</span>
                                                    </div>
                                                    <div className="vital-mini">
                                                        <Wind size={14} className="mini-icon spo2" />
                                                        <span>{record.spo2 || '--'}%</span>
                                                    </div>
                                                    <div className="vital-mini">
                                                        <Gauge size={14} className="mini-icon bp" />
                                                        <span>{record.blood_pressure || '--'}</span>
                                                    </div>
                                                    <div className="vital-mini">
                                                        <Thermometer size={14} className="mini-icon temp" />
                                                        <span>{record.temperature || '--'}°</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="card-right">
                                                <span className="time-mini">
                                                    <Clock size={12} />
                                                    {new Date(record.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span className={`status-mini ${getStatusClass(recordAnalysis.status)}`}>
                                                    {getStatusLabel(recordAnalysis.status)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Prediction & Charts Section */}
            {selectedPatient && vitalsHistory.length > 0 && (
                <div className="analysis-section">
                    {/* Risk Score & Explanation */}
                    <div className="risk-panel-premium">
                        <div className="risk-header">
                            <h3>Risk Assessment</h3>
                            <span className="confidence-badge">
                                {analysis.canPredict ? 'High Confidence' : `${vitalsHistory.length}/5 for prediction`}
                            </span>
                        </div>

                        <div className="risk-content">
                            <div className="risk-gauge">
                                <div className="gauge-track">
                                    <div
                                        className={`gauge-fill ${getStatusClass(analysis.status)}`}
                                        style={{ width: `${analysis.riskScore}%` }}
                                    ></div>
                                </div>
                                <div className="gauge-labels">
                                    <span>0</span>
                                    <span className="score-large">{analysis.riskScore}</span>
                                    <span>100</span>
                                </div>
                            </div>

                            <div className="explanation-box">
                                <p>{analysis.explanation}</p>
                            </div>
                        </div>

                        {analysis.status === 'critical' && (
                            <button className="btn btn-danger evacuation-btn">
                                <AlertTriangle size={18} />
                                Request Evacuation
                            </button>
                        )}
                    </div>

                    {/* Predictions (if available) */}
                    {analysis.canPredict && analysis.predictions && (
                        <div className="prediction-panel-premium">
                            <div className="prediction-header">
                                <TrendingUp size={20} />
                                <h3>Predicted Next Values</h3>
                                <span className="time-badge">15-30 min</span>
                            </div>

                            <div className="predictions-grid">
                                {Object.entries(analysis.predictions).map(([key, pred]) => (
                                    <div key={key} className="prediction-card">
                                        <span className="pred-label">{pred.label}</span>
                                        <span className="pred-value">
                                            {pred.value}
                                            {pred.direction === 'increasing' && <span className="trend-up">↑</span>}
                                            {pred.direction === 'decreasing' && <span className="trend-down">↓</span>}
                                        </span>
                                        <span className="pred-confidence">R²={pred.confidence}</span>
                                    </div>
                                ))}
                            </div>

                            {analysis.predictedRiskScore != null && (
                                <div className="predicted-risk-card">
                                    <div className="pred-risk-label">Predicted Risk Score</div>
                                    <div className={`pred-risk-value ${analysis.predictedRiskScore >= 50 ? 'text-critical' : 'text-stable'}`}>
                                        {analysis.predictedRiskScore}
                                        <span className="pred-risk-max">/100</span>
                                    </div>
                                    <div className="pred-risk-trend">
                                        {analysis.predictedRiskScore > analysis.riskScore ? (
                                            <span className="trend-bad">Risk Increasing (+{analysis.predictedRiskScore - analysis.riskScore})</span>
                                        ) : analysis.predictedRiskScore < analysis.riskScore ? (
                                            <span className="trend-good">Condition Improving</span>
                                        ) : (
                                            <span className="trend-neutral">Stable Risk</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Trend Charts */}
                    {vitalsHistory.length >= 3 && (
                        <div className="charts-panel-premium">
                            <div className="chart-header">
                                <h3>Trend Visualization</h3>
                            </div>

                            <div className="charts-grid">
                                {/* Heart Rate Chart */}
                                <div className="chart-card-premium">
                                    <h4><Heart size={14} /> Heart Rate</h4>
                                    <ResponsiveContainer width="100%" height={120}>
                                        <ComposedChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                                            <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                                            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} />
                                            <Tooltip />
                                            <Line
                                                type="monotone"
                                                dataKey="hr"
                                                stroke="#ef4444"
                                                strokeWidth={2}
                                                dot={(props) => props.payload.isPrediction ? (
                                                    <circle cx={props.cx} cy={props.cy} r={6} fill="#ef4444" stroke="#fff" strokeWidth={2} />
                                                ) : (
                                                    <circle cx={props.cx} cy={props.cy} r={3} fill="#ef4444" />
                                                )}
                                            />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* SpO2 Chart */}
                                <div className="chart-card-premium">
                                    <h4><Wind size={14} /> SpO₂</h4>
                                    <ResponsiveContainer width="100%" height={120}>
                                        <ComposedChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                                            <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                                            <YAxis domain={[85, 100]} tick={{ fontSize: 10 }} />
                                            <Tooltip />
                                            <Line
                                                type="monotone"
                                                dataKey="spo2"
                                                stroke="#3b82f6"
                                                strokeWidth={2}
                                                dot={(props) => props.payload.isPrediction ? (
                                                    <circle cx={props.cx} cy={props.cy} r={6} fill="#3b82f6" stroke="#fff" strokeWidth={2} />
                                                ) : (
                                                    <circle cx={props.cx} cy={props.cy} r={3} fill="#3b82f6" />
                                                )}
                                            />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Locked State */}
            {selectedPatient && vitalsHistory.length > 0 && vitalsHistory.length < 5 && (
                <div className="prediction-locked-premium">
                    <TrendingUp size={24} />
                    <div>
                        <h4>Predictive Analysis Locked</h4>
                        <p>Collect {5 - vitalsHistory.length} more record(s) to unlock ML predictions</p>
                    </div>
                    <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${(vitalsHistory.length / 5) * 100}%` }}></div>
                    </div>
                </div>
            )}
        </div>
    );
}
