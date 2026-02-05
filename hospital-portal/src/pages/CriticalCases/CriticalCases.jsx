import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabaseClient';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import './CriticalCases.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const CriticalCases = () => {
    const { hospital } = useAuth();
    const navigate = useNavigate();
    const [criticalCases, setCriticalCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchData = useCallback(async () => {
        if (!hospital?.id) return;

        try {
            const criticalRes = await fetch(`${API_URL}/critical/hospital/${hospital.id}`);
            const criticalData = await criticalRes.json();

            if (criticalData.success) {
                console.log('📥 Received critical cases:', criticalData.cases);

                // Force sort in frontend to guarantee order: Risk (Desc) -> Date (Desc)
                const sortedCases = [...(criticalData.cases || [])].sort((a, b) => {
                    const riskA = a.risk_score || 0;
                    const riskB = b.risk_score || 0;

                    if (riskB !== riskA) return riskB - riskA; // Higher risk first
                    return new Date(b.shared_at) - new Date(a.shared_at); // Newer first
                });

                setCriticalCases(sortedCases);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [hospital?.id]);

    useEffect(() => {
        if (!hospital?.id) return;
        fetchData();

        const channel = supabase
            .channel(`hospital-${hospital.id}-cases`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'critical_cases',
                filter: `target_hospital_id=eq.${hospital.id}`,
            }, () => fetchData())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [hospital?.id, fetchData]);

    const filteredCases = criticalCases.filter(caseItem => {
        const matchesSearch = caseItem.patient?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            caseItem.patient?.patient_id?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    // Group cases by date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayCases = filteredCases.filter(c => new Date(c.shared_at) >= today);
    const yesterdayCases = filteredCases.filter(c => {
        const date = new Date(c.shared_at);
        return date >= yesterday && date < today;
    });
    const olderCases = filteredCases.filter(c => new Date(c.shared_at) < yesterday);

    const getRiskBadge = (riskScore) => {
        if (riskScore >= 80) return { class: 'risk-critical', label: 'Critical', emoji: '🔴' };
        if (riskScore >= 60) return { class: 'risk-high', label: 'High', emoji: '🟠' };
        if (riskScore >= 30) return { class: 'risk-medium', label: 'Medium', emoji: '🟡' };
        return { class: 'risk-low', label: 'Low', emoji: '🟢' };
    };

    const getStatusBadge = (status) => {
        const badges = {
            shared: { class: 'badge-warning', label: 'Pending' },
            acknowledged: { class: 'badge-success', label: 'Acknowledged' },
            closed: { class: 'badge-default', label: 'Closed' }
        };
        return badges[status] || { class: 'badge-default', label: status };
    };

    return (
        <div className="patients-page-premium">
            <div className="page-header-row">
                <div className="header-text">
                    <h1 className="page-title-gradient">Critical Cases</h1>
                    <p className="page-subtitle">Manage emergency patient transfers</p>
                </div>
            </div>

            <div className="data-table-premium">
                <div className="table-header-row">
                    <h2 className="table-title">All Cases ({filteredCases.length})</h2>
                    <div className="search-wrapper-premium">
                        <span className="search-icon-emoji">🔍</span>
                        <input
                            type="text"
                            placeholder="Search cases..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input-premium"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="table-loading">Loading cases...</div>
                ) : filteredCases.length === 0 ? (
                    <div className="empty-table-state">
                        <span className="empty-icon-emoji">📋</span>
                        <p className="empty-title">No critical cases found</p>
                        <p className="empty-subtitle">
                            {searchQuery ? 'Try adjusting your search' : 'Patients shared by clinics will appear here'}
                        </p>
                    </div>
                ) : (
                    <div className="segmented-cases-container">
                        {todayCases.length > 0 && (
                            <div className="date-section">
                                <h3 className="date-section-title">📅 Today ({todayCases.length})</h3>
                                <div className="cases-grid">
                                    {todayCases.map((caseItem) => (
                                        <div key={caseItem.id} className="case-card" onClick={() => navigate(`/case/${caseItem.id}`)}>
                                            <div className="case-card-header">
                                                <div className="patient-info">
                                                    <div className="patient-avatar">{caseItem.patient?.name?.charAt(0) || 'P'}</div>
                                                    <div>
                                                        <div className="patient-name">{caseItem.patient?.name || 'Unknown'}</div>
                                                        <div className="patient-id">{caseItem.patient?.patient_id}</div>
                                                    </div>
                                                </div>
                                                <span className={`risk-badge ${getRiskBadge(caseItem.risk_score).class}`}>
                                                    {getRiskBadge(caseItem.risk_score).emoji} {getRiskBadge(caseItem.risk_score).label} ({caseItem.risk_score || 0})
                                                </span>
                                            </div>
                                            <div className="case-card-body">
                                                <div className="case-detail">🏥 {caseItem.clinic?.name}</div>
                                                <div className="case-detail">📍 {caseItem.clinic?.operating_location}</div>
                                                <div className="case-detail">⏰ {new Date(caseItem.shared_at).toLocaleTimeString()}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {yesterdayCases.length > 0 && (
                            <div className="date-section">
                                <h3 className="date-section-title">📅 Yesterday ({yesterdayCases.length})</h3>
                                <div className="cases-grid">
                                    {yesterdayCases.map((caseItem) => (
                                        <div key={caseItem.id} className="case-card" onClick={() => navigate(`/case/${caseItem.id}`)}>
                                            <div className="case-card-header">
                                                <div className="patient-info">
                                                    <div className="patient-avatar">{caseItem.patient?.name?.charAt(0) || 'P'}</div>
                                                    <div>
                                                        <div className="patient-name">{caseItem.patient?.name || 'Unknown'}</div>
                                                        <div className="patient-id">{caseItem.patient?.patient_id}</div>
                                                    </div>
                                                </div>
                                                <span className={`risk-badge ${getRiskBadge(caseItem.risk_score).class}`}>
                                                    {getRiskBadge(caseItem.risk_score).emoji} {getRiskBadge(caseItem.risk_score).label} ({caseItem.risk_score || 0})
                                                </span>
                                            </div>
                                            <div className="case-card-body">
                                                <div className="case-detail">🏥 {caseItem.clinic?.name}</div>
                                                <div className="case-detail">📍 {caseItem.clinic?.operating_location}</div>
                                                <div className="case-detail">⏰ {new Date(caseItem.shared_at).toLocaleString()}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {olderCases.length > 0 && (
                            <div className="date-section">
                                <h3 className="date-section-title">📅 Older ({olderCases.length})</h3>
                                <div className="cases-grid">
                                    {olderCases.map((caseItem) => (
                                        <div key={caseItem.id} className="case-card" onClick={() => navigate(`/case/${caseItem.id}`)}>
                                            <div className="case-card-header">
                                                <div className="patient-info">
                                                    <div className="patient-avatar">{caseItem.patient?.name?.charAt(0) || 'P'}</div>
                                                    <div>
                                                        <div className="patient-name">{caseItem.patient?.name || 'Unknown'}</div>
                                                        <div className="patient-id">{caseItem.patient?.patient_id}</div>
                                                    </div>
                                                </div>
                                                <span className={`risk-badge ${getRiskBadge(caseItem.risk_score).class}`}>
                                                    {getRiskBadge(caseItem.risk_score).emoji} {getRiskBadge(caseItem.risk_score).label} ({caseItem.risk_score || 0})
                                                </span>
                                            </div>
                                            <div className="case-card-body">
                                                <div className="case-detail">🏥 {caseItem.clinic?.name}</div>
                                                <div className="case-detail">📍 {caseItem.clinic?.operating_location}</div>
                                                <div className="case-detail">⏰ {new Date(caseItem.shared_at).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CriticalCases;
