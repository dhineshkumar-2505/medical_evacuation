import React from 'react';
import { AlertTriangle, XCircle, Activity, CheckCircle2 } from 'lucide-react';
import './PremiumAlertModal.css';

export default function PremiumAlertModal({ isOpen, onClose, type = 'warning', data }) {
    if (!isOpen) return null;

    const isCritical = type === 'critical';

    return (
        <div className="premium-modal-overlay">
            <div className={`premium-modal-content ${isCritical ? 'modal-critical' : 'modal-warning'}`}>
                <div className="modal-header">
                    <div className="modal-icon-wrapper">
                        {isCritical ? (
                            <AlertTriangle size={32} className="modal-icon critical-icon" />
                        ) : (
                            <Activity size={32} className="modal-icon warning-icon" />
                        )}
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>
                        <XCircle size={24} />
                    </button>
                </div>

                <div className="modal-body">
                    <h2 className="modal-title">
                        {isCritical ? 'CRITICAL ALERT' : 'Vitals Warning'}
                    </h2>

                    <div className="score-display">
                        <span className="score-label">Risk Score</span>
                        <span className="score-value">{data?.score || 0}</span>
                        <span className="score-max">/100</span>
                    </div>

                    <p className="modal-message">
                        {isCritical
                            ? "Patient condition escalated to CRITICAL status. Immediate intervention required."
                            : "Abnormal vitals detected. Please monitor closely."}
                    </p>

                    {data?.alerts?.length > 0 && (
                        <div className="alerts-list">
                            {data.alerts.map((alert, idx) => (
                                <div key={idx} className="alert-item">
                                    <div className="alert-bullet"></div>
                                    <span>{alert}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn-premium-action" onClick={onClose}>
                        {isCritical ? 'Acknowledge Priority' : 'Dismiss'}
                    </button>
                </div>
            </div>
        </div>
    );
}
