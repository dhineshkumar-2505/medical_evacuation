import { useAuth } from '../../contexts/AuthContext';
import './Pending.css';

const Pending = () => {
    const { hospital, signOut, refreshHospital } = useAuth();
    console.log('Hospital data in Pending page:', hospital);

    const handleRefresh = async () => {
        await refreshHospital();
    };

    const isRejected = hospital?.status?.trim().toLowerCase() === 'suspended';

    return (
        <div className="pending-page">
            {/* Animated Background */}
            <div className="pending-background">
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
            </div>

            {/* Glassmorphism Card */}
            <div className={`pending-card ${isRejected ? 'rejected' : ''}`}>
                <div className="pending-icon">
                    {isRejected ? '❌' : '⏳'}
                </div>
                <h1>{isRejected ? 'Registration Rejected' : 'Registration Pending'}</h1>
                <p className="hospital-name">{hospital?.name}</p>

                <div className="status-info">
                    {isRejected ? (
                        <div className="status-badge rejected">
                            <span className="badge-dot"></span>
                            Application Rejected
                        </div>
                    ) : (
                        <div className="status-badge pending">
                            <span className="badge-dot"></span>
                            Awaiting Admin Approval
                        </div>
                    )}
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
                    {isRejected ? (
                        <>
                            Your hospital registration has been <strong>rejected</strong> by the
                            <strong> Island MedEvac</strong> administrator. Please review your details and resubmit.
                        </>
                    ) : (
                        <>
                            Your hospital registration is being reviewed by the
                            <strong> Island MedEvac</strong> system administrator.
                            You will be able to access the dashboard once approved.
                        </>
                    )}
                </p>

                <div className="pending-actions">
                    {isRejected ? (
                        <button className="refresh-btn resubmit" onClick={() => window.location.href = '/register'}>
                            ✍️ Resubmit Application
                        </button>
                    ) : (
                        <button className="refresh-btn" onClick={handleRefresh}>
                            🔄 Check Status
                        </button>
                    )}
                    <button className="logout-btn" onClick={signOut}>
                        Sign Out
                    </button>
                </div>

                <p className="pending-note">
                    {isRejected
                        ? 'Contact support if you believe this was a mistake.'
                        : 'You will receive email notification once approved'
                    }
                </p>
            </div>
        </div>
    );
};

export default Pending;
