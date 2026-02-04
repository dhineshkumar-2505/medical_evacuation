export default function PendingApproval({ companyName, isRejected }) {
    return (
        <div className={`pending-approval-page ${isRejected ? 'rejected' : ''}`}>
            <div className="pending-approval-container">
                <div className="pending-icon">
                    {isRejected ? <XCircle size={64} color="#ef4444" /> : <Clock size={64} />}
                </div>
                <h1>{isRejected ? 'Application Rejected' : 'Application Under Review'}</h1>
                <p className="subtitle">
                    {isRejected
                        ? 'Your application for the Transport Provider Portal was not successful'
                        : 'Thank you for registering with the Transport Provider Portal'
                    }
                </p>

                <div className="status-card">
                    <div className="status-header">
                        {isRejected ? <XCircle className="text-danger" size={24} /> : <CheckCircle className="text-success" size={24} />}
                        <h3>{isRejected ? 'Application Rejected' : 'Registration Submitted Successfully'}</h3>
                    </div>
                    <div className="company-info">
                        <p><strong>Company:</strong> {companyName}</p>
                        <p><strong>Status:</strong> <span className={`badge ${isRejected ? 'badge-danger' : 'badge-warning'}`}>
                            {isRejected ? 'Rejected by Admin' : 'Pending Admin Approval'}
                        </span></p>
                    </div>
                </div>

                <div className="info-box">
                    <h4>{isRejected ? 'What can you do?' : 'What happens next?'}</h4>
                    <ul>
                        {isRejected ? (
                            <>
                                <li>Review your company information for accuracy</li>
                                <li>Contact our support team for more details on the rejection</li>
                                <li>You can update your profile and try reapplying</li>
                            </>
                        ) : (
                            <>
                                <li>Our admin team will review your application</li>
                                <li>You'll receive an email notification once approved</li>
                                <li>After approval, you can log in and start managing your fleet</li>
                            </>
                        )}
                    </ul>
                </div>

                <div className="contact-info">
                    <p>Need help? Contact our support team</p>
                    <p className="text-muted">{isRejected ? 'We are here to help you get onboarded' : 'This usually takes 24-48 hours'}</p>
                </div>

                <div className="pending-actions" style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '24px' }}>
                    {isRejected ? (
                        <button
                            onClick={() => window.location.href = '/onboarding'}
                            className="btn-primary"
                        >
                            ✍️ Reapply / Edit Profile
                        </button>
                    ) : (
                        <button
                            onClick={() => window.location.reload()}
                            className="btn-secondary"
                        >
                            🔄 Refresh Status
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
