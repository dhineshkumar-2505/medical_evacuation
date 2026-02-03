import { useAuth } from '../../contexts/AuthContext';
import { Clock, RefreshCw, LogOut } from 'lucide-react';
import './PendingApproval.css';

export default function PendingApproval() {
    const { clinic, refreshClinic, signOut } = useAuth();

    const handleRefresh = async () => {
        await refreshClinic();
        // If approved, App.jsx will redirect automatically
    };

    return (
        <div className="pending-page">
            <div className="pending-background">
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
            </div>

            <div className="pending-card">
                <div className="pending-icon">
                    <Clock size={48} />
                </div>

                <h1>Registration Under Review</h1>
                <p className="pending-message">
                    Your clinic <strong>"{clinic?.name}"</strong> registration has been submitted
                    and is awaiting approval from Central Command.
                </p>

                <div className="pending-details">
                    <div className="detail-row">
                        <span className="label">Location</span>
                        <span className="value">{clinic?.location_name}</span>
                    </div>
                    <div className="detail-row">
                        <span className="label">Region</span>
                        <span className="value">
                            {clinic?.region_type === 'island' ? '🏝️ Island' : '⛰️ Mountain'}
                        </span>
                    </div>
                    <div className="detail-row">
                        <span className="label">Status</span>
                        <span className="status-badge">Pending Approval</span>
                    </div>
                </div>

                <div className="pending-actions">
                    <button className="btn btn-primary" onClick={handleRefresh}>
                        <RefreshCw size={18} />
                        Check Status
                    </button>
                    <button className="btn btn-ghost" onClick={signOut}>
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </div>

                <p className="pending-note">
                    You will be able to access the Clinical Portal once your registration is approved.
                </p>
            </div>
        </div>
    );
}
