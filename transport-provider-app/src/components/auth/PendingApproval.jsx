import { Clock, CheckCircle } from 'lucide-react'
import './PendingApproval.css'

export default function PendingApproval({ companyName }) {
    return (
        <div className="pending-approval-page">
            <div className="pending-approval-container">
                <div className="pending-icon">
                    <Clock size={64} />
                </div>
                <h1>Application Under Review</h1>
                <p className="subtitle">
                    Thank you for registering with the Transport Provider Portal
                </p>

                <div className="status-card">
                    <div className="status-header">
                        <CheckCircle className="text-success" size={24} />
                        <h3>Registration Submitted Successfully</h3>
                    </div>
                    <div className="company-info">
                        <p><strong>Company:</strong> {companyName}</p>
                        <p><strong>Status:</strong> <span className="badge badge-warning">Pending Admin Approval</span></p>
                    </div>
                </div>

                <div className="info-box">
                    <h4>What happens next?</h4>
                    <ul>
                        <li>Our admin team will review your application</li>
                        <li>You'll receive an email notification once approved</li>
                        <li>After approval, you can log in and start managing your fleet</li>
                    </ul>
                </div>

                <div className="contact-info">
                    <p>Need help? Contact our support team</p>
                    <p className="text-muted">This usually takes 24-48 hours</p>
                </div>

                <button
                    onClick={() => window.location.reload()}
                    className="btn-secondary"
                    style={{ marginTop: '24px' }}
                >
                    Refresh Status
                </button>
            </div>
        </div>
    )
}
