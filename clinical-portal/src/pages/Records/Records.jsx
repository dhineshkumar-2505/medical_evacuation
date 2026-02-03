import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/apiClient';
import { Search, User, Calendar, Activity, ChevronRight, Stethoscope } from 'lucide-react';
import './Records.css';

export default function Records() {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            const response = await api.get('/patients');
            const data = response.data || response;
            setPatients(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching patients:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredPatients = patients.filter(p => {
        const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.patient_id?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    return (
        <div className="records-page-premium">
            {/* Header */}
            <div className="page-header-premium">
                <div>
                    <h1 className="page-title-gradient">Medical Records</h1>
                    <p className="page-subtitle">View patient history and clinical data</p>
                </div>
                <div className="patient-count-badge">
                    <Stethoscope size={16} />
                    {patients.length} Patients
                </div>
            </div>

            {/* Search Bar */}
            <div className="search-bar-premium">
                <Search size={18} className="search-icon" />
                <input
                    type="text"
                    placeholder="Search by name or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input-field"
                />
            </div>

            {/* Patient Grid */}
            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                </div>
            ) : filteredPatients.length === 0 ? (
                <div className="empty-state-premium">
                    <User size={48} />
                    <h3>No Patients Found</h3>
                    <p>Register patients to see their records here.</p>
                </div>
            ) : (
                <div className="patient-grid-premium">
                    {filteredPatients.map(patient => (
                        <div
                            key={patient.id}
                            className="patient-card-premium"
                            onClick={() => navigate(`/records/${patient.id}`)}
                        >
                            <div className="card-header-row">
                                <div className="avatar-premium">
                                    <User size={24} />
                                </div>
                                <div className="patient-info-col">
                                    <h4 className="patient-name">{patient.name}</h4>
                                    <span className="patient-id-mono">{patient.patient_id}</span>
                                </div>
                            </div>

                            <div className="card-details-row">
                                <div className="detail-chip">
                                    <span className="chip-label">AGE</span>
                                    <span className="chip-value">{patient.age} yrs</span>
                                </div>
                                <div className="detail-chip">
                                    <span className="chip-label">GENDER</span>
                                    <span className="chip-value">{patient.gender}</span>
                                </div>
                                <div className="detail-chip">
                                    <span className="chip-label">BLOOD</span>
                                    <span className="chip-value">{patient.blood_type || '--'}</span>
                                </div>
                            </div>

                            <div className="card-footer-row">
                                <button className="view-records-btn">
                                    View Records
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
