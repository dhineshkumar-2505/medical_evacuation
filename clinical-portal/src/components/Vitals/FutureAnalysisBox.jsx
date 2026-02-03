import { TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';
import './FutureAnalysisBox.css';

export default function FutureAnalysisBox({ history, prediction }) {
    // GATEKEEPER: Only show if we have 5 or more records
    if (!history || history.length < 5 || !prediction) {
        return (
            <div className="future-locked">
                <div className="lock-content">
                    <TrendingUp size={24} className="lock-icon" />
                    <h4>Predictive Analysis Locked</h4>
                    <p>Collect {5 - (history?.length || 0)} more record(s) to unlock trend prediction.</p>
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${((history?.length || 0) / 5) * 100}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="future-box">
            <div className="future-header">
                <h3><TrendingUp size={20} /> Future Analysis (Predicted)</h3>
                <span className="badge-predicted">Next 15-30 min</span>
            </div>

            <div className="predictions-grid">
                <div className="predict-card">
                    <span className="label">Heart Rate</span>
                    <div className="value-group">
                        <span className="value">{prediction.heart_rate}</span>
                        {/* Dummy logic for arrow direction based on last real value */}
                        <span className="trend-arrow up">↑</span>
                    </div>
                </div>

                <div className="predict-card">
                    <span className="label">SpO2</span>
                    <div className="value-group">
                        <span className="value">{prediction.spo2}%</span>
                        <span className="trend-arrow down">↓</span>
                    </div>
                </div>

                <div className="predict-card">
                    <span className="label">BP</span>
                    <span className="value">{prediction.bp_sys}/{prediction.bp_dia}</span>
                </div>

                <div className="predict-card">
                    <span className="label">Temp</span>
                    <span className="value">{prediction.temperature}°</span>
                </div>

                <div className="predict-card">
                    <span className="label">RR</span>
                    <div className="value-group">
                        <span className="value">{prediction.resp_rate}</span>
                        <span className="trend-arrow up">↑</span>
                    </div>
                </div>
            </div>

            <div className="risk-summary">
                <div className="risk-score">
                    <span className="score-label">RTL Risk Score</span>
                    <span className="score-value critical">72</span>
                    <span className="score-max">/ 100</span>
                </div>
                <div className="risk-action">
                    <button className="btn btn-danger btn-sm">
                        <AlertTriangle size={16} />
                        Immediate Action Required
                    </button>
                </div>
            </div>
        </div>
    );
}
