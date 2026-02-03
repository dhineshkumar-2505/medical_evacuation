import { X, MapPin, Building2, Phone, ShieldCheck, Clock } from 'lucide-react';
import './ClinicDetailsModal.css';

const ClinicDetailsModal = ({ clinic, onClose, onApprove, onReject }) => {
    if (!clinic) return null;

    const getStatusConfig = (status) => {
        switch (status) {
            case 'active':
                return { label: 'Active & Verified', color: '#22c55e', bg: '#dcfce7' };
            case 'pending_approval':
                return { label: 'Pending Approval', color: '#f59e0b', bg: '#fef3c7' };
            case 'suspended':
                return { label: 'Suspended', color: '#ef4444', bg: '#fee2e2' };
            default:
                return { label: status, color: '#64748b', bg: '#f1f5f9' };
        }
    };

    const statusConfig = getStatusConfig(clinic.status);

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                {/* Header Section */}
                <div className="modal-header">
                    <div className="header-content">
                        <div className="clinic-icon-large">
                            <Building2 size={32} />
                        </div>

                        <div className="modal-title-group">
                            <h2>{clinic.name}</h2>
                            <div className="modal-subtitle">Registered on {new Date(clinic.created_at).toLocaleDateString()}</div>
                        </div>
                    </div>

                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Body Section */}
                <div className="modal-body">
                    {/* Status Bar */}
                    <div className="status-row">
                        <span className="status-label">Current Status</span>
                        <span
                            className="badge"
                            style={{
                                backgroundColor: statusConfig.bg,
                                color: statusConfig.color,
                                border: `1px solid ${statusConfig.color}40`,
                                padding: '6px 16px',
                                borderRadius: '20px',
                                fontWeight: '600'
                            }}
                        >
                            {statusConfig.label}
                        </span>
                    </div>

                    {/* Details Grid */}
                    <div className="detail-grid">
                        <div className="detail-item">
                            <div className="detail-label">Location Base</div>
                            <div className="detail-value">
                                <MapPin size={18} className="text-muted" />
                                {clinic.location_name || 'Not specified'}
                            </div>
                        </div>

                        <div className="detail-item">
                            <div className="detail-label">Geographic Region</div>
                            <div className="detail-value">
                                {clinic.region_type === 'island' ? '🏝️ Island Sector' : '⛰️ Mountain Sector'}
                            </div>
                        </div>

                        <div className="detail-item">
                            <div className="detail-label">Facility Tier</div>
                            <div className="detail-value text-capitalize">
                                <ShieldCheck size={18} className="text-muted" />
                                {clinic.facility_level || 'Basic Service'}
                            </div>
                        </div>

                        <div className="detail-item">
                            <div className="detail-label">Contact Line</div>
                            <div className="detail-value">
                                <Phone size={18} className="text-muted" />
                                {clinic.contact_phone || 'No direct line'}
                            </div>
                        </div>
                    </div>

                    {/* Action Footer - Only show if pending */}
                    {clinic.status === 'pending_approval' && (
                        <div className="modal-actions">
                            <button className="btn-reject" onClick={() => onReject(clinic.id)}>
                                Reject Application
                            </button>
                            <button className="btn-approve" onClick={() => onApprove(clinic.id)}>
                                Approve & Activate
                            </button>
                        </div>
                    )}

                    {/* Read-only Footer for other states */}
                    {clinic.status !== 'pending_approval' && (
                        <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                            <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} />
                            Last updated {new Date(clinic.created_at).toLocaleString()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClinicDetailsModal;
