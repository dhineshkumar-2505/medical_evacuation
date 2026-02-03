import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/apiClient';
import { socket } from '../../services/socketClient';
import { TableSkeleton } from '../../components/Skeleton/Skeleton';
import {
    Search,
    Plus,
    Users,
    Eye,
    Activity,
    Ambulance,
    FileText,
} from 'lucide-react';
import './Patients.css';

export default function Patients() {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const fetchPatients = async () => {
        try {
            const response = await api.get('/patients');
            const data = response.data || response;
            setPatients(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching patients:', err);
            setPatients([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
        socket.connect();

        const cleanups = [
            socket.on('patient:created', () => fetchPatients()),
            socket.on('patient:critical', () => fetchPatients()),
            socket.on('vitals:logged', () => fetchPatients())
        ];

        return () => cleanups.forEach(clean => clean());
    }, []);

    const filteredPatients = patients.filter(patient => {
        const matchesSearch = patient.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            patient.patient_id?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    return (
        <div className="patients-page-premium">
            {/* Header */}
            <div className="page-header-row">
                <div className="header-text">
                    <h1 className="page-title-gradient">Patient Management</h1>
                    <p className="page-subtitle">View and manage all registered patients</p>
                </div>
                <Link to="/patients/new" className="btn btn-primary register-btn">
                    <Plus size={18} />
                    Register Patient
                </Link>
            </div>

            {/* Stats Bar */}
            <div className="stats-bar">
                <div className="stat-item">
                    <Users size={20} />
                    <div className="stat-content">
                        <span className="stat-value">{patients.length}</span>
                        <span className="stat-label">Total Patients</span>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="data-table-premium">
                <div className="table-header-row">
                    <span className="table-title">Patient Records</span>
                    <div className="search-wrapper-premium">
                        <Search size={18} />
                        <input
                            type="text"
                            className="search-input-field"
                            placeholder="Search patients..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <TableSkeleton rows={6} />
                ) : filteredPatients.length === 0 ? (
                    <div className="table-empty-premium">
                        <Users size={64} />
                        <h3>No Patients Found</h3>
                        <p>Register a new patient to get started</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Patient ID</th>
                                <th>Name</th>
                                <th>Age / Gender</th>
                                <th>Blood Type</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPatients.map((patient) => (
                                <tr key={patient.id}>
                                    <td className="cell-id">{patient.patient_id || '-'}</td>
                                    <td className="cell-name">{patient.name}</td>
                                    <td>{patient.age} yrs / {patient.gender}</td>
                                    <td>
                                        {patient.blood_type ? (
                                            <span className="blood-chip">{patient.blood_type}</span>
                                        ) : '-'}
                                    </td>
                                    <td>
                                        <div className="action-buttons-row">
                                            <button
                                                className="action-btn-premium view"
                                                onClick={() => navigate(`/records/${patient.id}`)}
                                                title="View Records"
                                            >
                                                <FileText size={16} />
                                            </button>
                                            <button
                                                className="action-btn-premium vitals"
                                                onClick={() => navigate(`/vitals?patient=${patient.id}`)}
                                                title="Log Vitals"
                                            >
                                                <Activity size={16} />
                                            </button>
                                            <button
                                                className="action-btn-premium transport"
                                                onClick={() => navigate('/transport', { state: { openBooking: true, patientId: patient.id } })}
                                                title="Book Transport"
                                            >
                                                <Ambulance size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
