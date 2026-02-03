import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabaseClient';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import './CriticalCases.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const CriticalCases = () => {
    const { hospital } = useAuth();
    const navigate = useNavigate();
    const [criticalCases, setCriticalCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchData = useCallback(async () => {
        if (!hospital?.id) return;

        try {
            const criticalRes = await fetch(`${API_URL}/api/critical/hospital/${hospital.id}`);
            const criticalData = await criticalRes.json();

            if (criticalData.success) {
                setCriticalCases(criticalData.cases || []);
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
                    <div className="table-wrapper">
                        <table className="premium-table">
                            <thead>
                                <tr>
                                    <th>Patient</th>
                                    <th>From Clinic</th>
                                    <th>Location</th>
                                    <th>Age / Gender</th>
                                    <th>Shared At</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCases.map((caseItem) => (
                                    <tr key={caseItem.id} className="table-row-premium">
                                        <td>
                                            <div className="patient-cell">
                                                <div className="patient-avatar-table">
                                                    {caseItem.patient?.name?.charAt(0) || 'P'}
                                                </div>
                                                <div>
                                                    <div className="patient-name-table">{caseItem.patient?.name || 'Unknown'}</div>
                                                    <div className="patient-id-table">{caseItem.patient?.patient_id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{caseItem.clinic?.name || 'N/A'}</td>
                                        <td>{caseItem.clinic?.operating_location || 'N/A'}</td>
                                        <td>{caseItem.patient?.age} yrs / {caseItem.patient?.gender}</td>
                                        <td>{new Date(caseItem.shared_at).toLocaleString()}</td>
                                        <td>
                                            <span className={`status-badge-table ${getStatusBadge(caseItem.status).class}`}>
                                                {getStatusBadge(caseItem.status).label}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-sm btn-primary"
                                                onClick={() => navigate(`/case/${caseItem.id}`)}
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CriticalCases;
