import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const Dashboard = () => {
    const { hospital, user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        criticalPending: 0,
        completed: 0,
    });
    const [criticalCases, setCriticalCases] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!hospital?.id) return;

        try {
            const criticalRes = await fetch(`${API_URL}/critical/hospital/${hospital.id}`);
            const criticalData = await criticalRes.json();

            if (criticalData.success) {
                const cases = criticalData.cases || [];
                // Sort by shared_at desc
                cases.sort((a, b) => new Date(b.shared_at) - new Date(a.shared_at));

                setCriticalCases(cases);
                const criticalPending = cases.filter(c => c.status === 'shared').length || 0;
                const completed = cases.filter(c => c.status === 'acknowledged' || c.status === 'closed').length || 0;
                setStats({ criticalPending, completed });
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            // toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [hospital?.id]);

    useEffect(() => {
        if (!hospital?.id) return;
        fetchData();

        const channel = supabase
            .channel(`hospital-${hospital.id}-dashboard`)
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

    // Top 5 recent cases
    const recentCases = criticalCases.slice(0, 5);

    return (
        <div className="dashboard-premium">
            {/* Header */}
            <div className="dashboard-header-premium">
                <div>
                    <h1 className="dashboard-title-gradient">Hospital Dashboard</h1>
                    <p className="dashboard-subtitle">Overview of critical transfers and capacity</p>
                </div>
                <div className="header-actions">
                    <span className="user-email-text">{new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid-premium">
                <div className="stat-card-premium primary">
                    <div className="stat-icon-box">🚨</div>
                    <div className="stat-content">
                        <span className="stat-value-large">{stats.criticalPending}</span>
                        <span className="stat-label">Pending Cases</span>
                    </div>
                </div>

                <div className="stat-card-premium secondary">
                    <div className="stat-icon-box">✅</div>
                    <div className="stat-content">
                        <span className="stat-value-large">{stats.completed}</span>
                        <span className="stat-label">Acknowledged</span>
                    </div>
                </div>

                <div className="stat-card-premium tertiary">
                    <div className="stat-icon-box">📋</div>
                    <div className="stat-content">
                        <span className="stat-value-large">{criticalCases.length}</span>
                        <span className="stat-label">Total Cases</span>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="dashboard-grid-premium">
                {/* Recent Critical Cases */}
                <div className="dashboard-panel-premium">
                    <div className="panel-header-row">
                        <h3 className="panel-title">
                            <span>🚑</span> Recent Critical Cases
                        </h3>
                        <Link to="/cases" className="panel-link">
                            View All Cases <span>→</span>
                        </Link>
                    </div>

                    <div className="patient-list-premium">
                        {loading ? (
                            <div className="panel-loading">Loading...</div>
                        ) : recentCases.length === 0 ? (
                            <div className="panel-empty">
                                <span style={{ fontSize: '40px' }}>📋</span>
                                <p>No critical cases yet</p>
                            </div>
                        ) : (
                            recentCases.map((caseItem) => (
                                <div
                                    key={caseItem.id}
                                    className="patient-item-premium"
                                    onClick={() => navigate(`/case/${caseItem.id}`)}
                                >
                                    <div className="patient-avatar-circle">
                                        {caseItem.patient?.name?.charAt(0) || 'P'}
                                    </div>
                                    <div className="patient-info-col">
                                        <span className="patient-name">{caseItem.patient?.name}</span>
                                        <span className="patient-meta">
                                            From {caseItem.clinic?.name || 'Clinic'} • {caseItem.status}
                                        </span>
                                    </div>
                                    <button className="view-btn-small">
                                        <span>👁️</span>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="dashboard-panel-premium">
                    <div className="panel-header-row">
                        <h3 className="panel-title">
                            <span>⚡</span> Quick Actions
                        </h3>
                    </div>
                    <div className="quick-actions-grid">
                        <Link to="/cases" className="quick-action-card">
                            <span className="action-icon evac">🚨</span>
                            <span className="action-label">View Cases</span>
                        </Link>
                        {/* Placeholder for future actions */}
                        <div className="quick-action-card">
                            <span className="action-icon records">📊</span>
                            <span className="action-label">Reports</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
