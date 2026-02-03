import { useState, useEffect } from 'react';
import {
    Truck,
    CheckCircle,
    XCircle,
    Clock,
    RefreshCw,
    Search,
    Building2,
    Phone,
    Mail,
    MapPin,
    Shield,
    AlertCircle,
    Eye
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import toast from 'react-hot-toast';
import TransportProviderModal from '../../components/TransportProviderModal/TransportProviderModal';
import '../Clinics/Clinics.css';

const Transport = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedRegion, setSelectedRegion] = useState('all');
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('transport_companies')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCompanies(data || []);
        } catch (error) {
            console.error('Error fetching transport companies:', error);
            toast.error('Failed to load transport companies');
        } finally {
            setLoading(false);
        }
    };

    // ... (useEffect remains same) ...

    useEffect(() => {
        fetchCompanies();

        // Real-time subscription
        const subscription = supabase
            .channel('transport-companies-realtime')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'transport_companies'
            }, () => {
                fetchCompanies();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const handleApprove = async (companyId) => {
        try {
            const { error } = await supabase
                .from('transport_companies')
                .update({
                    is_verified: true,
                    is_active: true
                })
                .eq('id', companyId);

            if (error) throw error;
            toast.success('Transport provider approved successfully');
            fetchCompanies();
        } catch (error) {
            console.error('Error approving company:', error);
            toast.error('Failed to approve transport provider');
        }
    };

    const handleReject = async (companyId) => {
        try {
            const { error } = await supabase
                .from('transport_companies')
                .update({
                    is_verified: false,
                    is_active: false
                })
                .eq('id', companyId);

            if (error) throw error;
            toast.success('Transport provider rejected');
            fetchCompanies();
        } catch (error) {
            console.error('Error rejecting company:', error);
            toast.error('Failed to reject transport provider');
        }
    };

    const getStatusBadge = (company) => {
        if (!company.is_verified && company.is_active) {
            return <span className="badge badge-warning"><Clock size={14} /> Pending</span>;
        }
        if (company.is_verified && company.is_active) {
            return <span className="badge badge-success"><CheckCircle size={14} /> Approved</span>;
        }
        return <span className="badge badge-danger"><XCircle size={14} /> Rejected</span>;
    };

    const filteredCompanies = companies
        .filter((company) => {
            const matchesSearch =
                company.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                company.contact_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                company.contact_phone?.includes(searchQuery);

            const matchesFilter =
                filterStatus === 'all' ||
                (filterStatus === 'pending' && !company.is_verified && company.is_active) ||
                (filterStatus === 'approved' && company.is_verified && company.is_active) ||
                (filterStatus === 'rejected' && !company.is_active);

            const matchesRegion =
                selectedRegion === 'all' ||
                company.operating_location === selectedRegion;

            return matchesSearch && matchesFilter && matchesRegion;
        });

    const stats = {
        total: companies.length,
        pending: companies.filter(c => !c.is_verified && c.is_active).length,
        approved: companies.filter(c => c.is_verified && c.is_active).length,
        rejected: companies.filter(c => !c.is_active).length
    };

    return (
        <div className="clinics-page">
            {/* Header */}
            <div className="page-header">
                <div className="page-header-content">
                    <h1 className="page-title">Transport Provider Management</h1>
                    <p className="page-description">
                        Review and approve transport provider registrations
                    </p>
                </div>
                <div className="page-header-actions">
                    <button className="btn btn-secondary" onClick={fetchCompanies}>
                        <RefreshCw size={18} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
                <div className="stat-card">
                    <div className="stat-icon bg-info-subtle">
                        <Building2 className="text-info" />
                    </div>
                    <div>
                        <div className="stat-label">Total Providers</div>
                        <div className="stat-value">{stats.total}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon bg-warning-subtle">
                        <Clock className="text-warning" />
                    </div>
                    <div>
                        <div className="stat-label">Pending Approval</div>
                        <div className="stat-value">{stats.pending}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon bg-success-subtle">
                        <CheckCircle className="text-success" />
                    </div>
                    <div>
                        <div className="stat-label">Approved</div>
                        <div className="stat-value">{stats.approved}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon bg-danger-subtle">
                        <XCircle className="text-danger" />
                    </div>
                    <div>
                        <div className="stat-label">Rejected</div>
                        <div className="stat-value">{stats.rejected}</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="filter-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div className="tabs">
                    <button
                        className={`tab ${filterStatus === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('all')}
                    >
                        All
                        <span className="tab-count">{stats.total}</span>
                    </button>
                    <button
                        className={`tab ${filterStatus === 'pending' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('pending')}
                    >
                        Pending
                        <span className="tab-count">{stats.pending}</span>
                    </button>
                    <button
                        className={`tab ${filterStatus === 'approved' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('approved')}
                    >
                        Approved
                        <span className="tab-count">{stats.approved}</span>
                    </button>
                    <button
                        className={`tab ${filterStatus === 'rejected' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('rejected')}
                    >
                        Rejected
                        <span className="tab-count">{stats.rejected}</span>
                    </button>
                </div>

                <div className="region-filter">
                    <select
                        className="form-select"
                        value={selectedRegion}
                        onChange={(e) => setSelectedRegion(e.target.value)}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#fff',
                            fontSize: '14px',
                            color: '#475569',
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="all">All Regions</option>
                        <option value="Ooty">Ooty</option>
                        <option value="Kodaikanal">Kodaikanal</option>
                        <option value="Andaman & Nicobar">Andaman & Nicobar</option>
                        <option value="Lakshadweep">Lakshadweep</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="data-table-container">
                <div className="table-header">
                    <span className="table-title">Transport Companies</span>
                    <div className="table-actions">
                        <div className="search-wrapper">
                            <Search />
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search companies..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="table-empty">
                        <div className="spinner spinner-lg"></div>
                        <p>Loading transport companies...</p>
                    </div>
                ) : filteredCompanies.length === 0 ? (
                    <div className="table-empty">
                        <Truck />
                        <h3>No transport companies found</h3>
                        <p>Transport providers will appear here once they register</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Company Name</th>
                                <th>Contact</th>
                                <th>Location</th>
                                <th>Service Area</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCompanies.map((company) => (
                                <tr key={company.id}>
                                    <td className="cell-name">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Building2 size={18} />
                                            {company.company_name}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Mail size={14} />
                                                {company.contact_email}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Phone size={14} />
                                                {company.contact_phone}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <MapPin size={14} className="text-primary" />
                                            <span style={{ fontWeight: 500 }}>{company.operating_location || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                                            <Shield size={14} />
                                            {company.service_coverage_radius_km} km radius
                                        </div>
                                    </td>
                                    <td>{getStatusBadge(company)}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                className="btn btn-sm btn-secondary"
                                                onClick={() => {
                                                    setSelectedProvider(company);
                                                    setIsModalOpen(true);
                                                }}
                                                title="View Details"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            {!company.is_verified && company.is_active && (
                                                <>
                                                    <button
                                                        className="btn btn-sm btn-success"
                                                        onClick={() => handleApprove(company.id)}
                                                        title="Approve"
                                                    >
                                                        <CheckCircle size={16} />
                                                        Approve
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => handleReject(company.id)}
                                                        title="Reject"
                                                    >
                                                        <XCircle size={16} />
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            {company.is_verified && company.is_active && (
                                                <button
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={() => handleReject(company.id)}
                                                    title="Revoke Access"
                                                >
                                                    <Shield size={16} />
                                                    Revoke
                                                </button>
                                            )}
                                            {!company.is_active && (
                                                <button
                                                    className="btn btn-sm btn-success"
                                                    onClick={() => handleApprove(company.id)}
                                                    title="Re-approve"
                                                >
                                                    <CheckCircle size={16} />
                                                    Re-approve
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <TransportProviderModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                provider={selectedProvider}
            />
        </div >
    );
};

export default Transport;
