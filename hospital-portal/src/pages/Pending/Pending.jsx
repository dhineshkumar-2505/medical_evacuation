import { useAuth } from '../../contexts/AuthContext';
import './Pending.css';

const Pending = () => {
    const { hospital, signOut, refreshHospital } = useAuth();

    const handleRefresh = async () => {
        await refreshHospital();
    };

    return (
        <div className="pending-page">
            {/* Animated Background */}
            <div className="pending-background">
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
            </div>

            {/* Glassmorphism Card */}
            <div className="pending-card">
                <div className="pending-icon">⏳</div>
                <h1>Registration Pending</h1>
                <p className="hospital-name">{hospital?.name}</p>

                <div className="status-info">
                    <div className="status-badge pending">
                        <span className="badge-dot"></span>
                        Awaiting Admin Approval
                    </div>
                </div>

                <div className="pending-details">
                    <div className="detail-row">
                        <span className="label">Location</span>
                        <span className="value">{hospital?.operating_location}</span>
                    </div>
                    <div className="detail-row">
                        <span className="label">Contact</span>
                        <span className="value">{hospital?.contact_phone}</span>
                    </div>
                    <div className="detail-row">
                        <span className="label">Status</span>
                        <span className="value">{hospital?.status?.replace('_', ' ')}</span>
                    </div>
                </div>

                <p className="pending-message">
                    Your hospital registration is being reviewed by the
                    <strong> Island MedEvac</strong> system administrator.
                    You will be able to access the dashboard once approved.
                </p>

                <div className="pending-actions">
                    <button className="refresh-btn" onClick={handleRefresh}>
                        🔄 Check Status
                    </button>
                    <button className="logout-btn" onClick={signOut}>
                        Sign Out
                    </button>
                </div>

                <p className="pending-note">
                    You will receive email notification once approved
                </p>
            </div>
        </div>
    );
};

export default Pending;
