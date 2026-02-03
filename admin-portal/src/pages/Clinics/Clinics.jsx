import { useState, useEffect } from 'react';
import {
    Building2,
    MapPin,
    Search,
    CheckCircle,
    XCircle,
    Eye,
    Plus,
    RefreshCw,
} from 'lucide-react';
import { api } from '../../services/apiClient';
import { socket } from '../../services/socketClient';
import ClinicDetailsModal from '../../components/ClinicDetailsModal/ClinicDetailsModal';
import './Clinics.css';

const Clinics = () => {
    const [clinics, setClinics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClinic, setSelectedClinic] = useState(null);

    // Fetch clinics via REST API
    const fetchClinics = async () => {
        try {
            setLoading(true);
            const response = await api.get('/clinics');
            // Ensure we handle both { data: [...] } and just [...] array responses
            const data = response.data || response;
            setClinics(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching clinics:', error);
            setClinics([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClinics();
        socket.connect();

        // Real-time socket listeners
        const cleanups = [
            socket.on('clinic:created', () => fetchClinics()),
            socket.on('clinic:approved', () => fetchClinics()),
            socket.on('clinic:rejected', () => fetchClinics())
        ];

        return () => {
            cleanups.forEach(clean => clean());
            // Don't disconnect socket here as other pages might need it
        };
    }, []);

    // Handle clinic approval
    const handleApprove = async (clinicId) => {
        try {
            await api.patch(`/clinics/${clinicId}/approve`);
            setSelectedClinic(null);
            // fetchClinics() will be called by socket listener
        } catch (error) {
            console.error('Error approving clinic:', error);
        }
    };

    // Handle clinic rejection
    const handleReject = async (clinicId) => {
        try {
            await api.patch(`/clinics/${clinicId}/reject`);
            setSelectedClinic(null);
        } catch (error) {
            console.error('Error rejecting clinic:', error);
        }
    };

    // Filter clinics based on tab and search
    const filteredClinics = clinics.filter((clinic) => {
        const matchesTab =
            activeTab === 'all' ||
            (activeTab === 'pending' && clinic.status === 'pending_approval') ||
            (activeTab === 'active' && clinic.status === 'active') ||
            (activeTab === 'suspended' && clinic.status === 'suspended');

        const matchesSearch =
            clinic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            clinic.location_name.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesTab && matchesSearch;
    });

    const pendingCount = clinics.filter((c) => c.status === 'pending_approval').length;
    const activeCount = clinics.filter((c) => c.status === 'active').length;

    const getStatusBadge = (status) => {
        switch (status) {
            case 'active':
                return <span className="badge badge-success">Active</span>;
            case 'pending_approval':
                return <span className="badge badge-warning">Pending</span>;
            case 'suspended':
                return <span className="badge badge-danger">Suspended</span>;
            default:
                return <span className="badge badge-neutral">{status}</span>;
        }
    };

    const getFacilityBadge = (level) => {
        switch (level) {
            case 'basic':
                return <span className="badge badge-neutral">Basic</span>;
            case 'intermediate':
                return <span className="badge badge-info">Intermediate</span>;
            case 'advanced':
                return <span className="badge badge-success">Advanced</span>;
            default:
                return <span className="badge badge-neutral">{level}</span>;
        }
    };

    return (
        <div className="clinics-page">
            {/* Header */}
            <div className="page-header">
                <div className="page-header-content">
                    <h1 className="page-title">Clinic Management</h1>
                    <p className="page-description">
                        Review, approve, and manage registered medical clinics across all regions
                    </p>
                </div>
                <div className="page-header-actions">
                    <button className="btn btn-secondary" onClick={fetchClinics}>
                        <RefreshCw size={18} />
                        Refresh
                    </button>
                    <button className="btn btn-primary">
                        <Plus size={18} />
                        Add Clinic
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    All Clinics
                    <span className="tab-count">{clinics.length}</span>
                </button>
                <button
                    className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pending')}
                >
                    Pending Approval
                    <span className="tab-count">{pendingCount}</span>
                </button>
                <button
                    className={`tab ${activeTab === 'active' ? 'active' : ''}`}
                    onClick={() => setActiveTab('active')}
                >
                    Active
                    <span className="tab-count">{activeCount}</span>
                </button>
            </div>

            {/* Table */}
            <div className="data-table-container">
                <div className="table-header">
                    <span className="table-title">
                        {activeTab === 'pending' ? 'Pending Approvals' : 'Registered Clinics'}
                    </span>
                    <div className="table-actions">
                        <div className="search-wrapper">
                            <Search />
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search clinics..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="table-empty">
                        <div className="spinner spinner-lg"></div>
                        <p>Loading clinics...</p>
                    </div>
                ) : filteredClinics.length === 0 ? (
                    <div className="table-empty">
                        <Building2 />
                        <h3>No clinics found</h3>
                        <p>
                            {searchQuery
                                ? 'Try adjusting your search query'
                                : 'Clinics will appear here once they register'}
                        </p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Clinic Name</th>
                                <th>Location</th>
                                <th>Region Type</th>
                                <th>Facility Level</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClinics.map((clinic) => (
                                <tr key={clinic.id}>
                                    <td className="cell-name">{clinic.name}</td>
                                    <td className="cell-location">
                                        <MapPin />
                                        {clinic.location_name}
                                    </td>
                                    <td>
                                        <span className="badge badge-info">
                                            {clinic.region_type === 'island' ? '🏝️ Island' : '⛰️ Mountain'}
                                        </span>
                                    </td>
                                    <td>{getFacilityBadge(clinic.facility_level)}</td>
                                    <td>{getStatusBadge(clinic.status)}</td>
                                    <td>
                                        <div className="action-buttons">
                                            {clinic.status === 'pending_approval' && (
                                                <>
                                                    <button
                                                        className="action-btn approve"
                                                        title="Approve"
                                                        onClick={() => handleApprove(clinic.id)}
                                                    >
                                                        <CheckCircle size={16} />
                                                    </button>
                                                    <button
                                                        className="action-btn reject"
                                                        title="Reject"
                                                        onClick={() => handleReject(clinic.id)}
                                                    >
                                                        <XCircle size={16} />
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                className="action-btn view"
                                                title="View Details"
                                                onClick={() => setSelectedClinic(clinic)}
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Premium Details Modal */}
            <ClinicDetailsModal
                clinic={selectedClinic}
                onClose={() => setSelectedClinic(null)}
                onApprove={handleApprove}
                onReject={handleReject}
            />
        </div>
    );
};

export default Clinics;
