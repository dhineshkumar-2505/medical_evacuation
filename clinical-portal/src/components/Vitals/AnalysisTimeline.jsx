import { Activity, Clock } from 'lucide-react';
import './AnalysisTimeline.css';

export default function AnalysisTimeline({ history }) {
    if (!history || history.length === 0) {
        return (
            <div className="timeline-empty">
                <Activity size={48} />
                <p>No analysis records yet. Save vitals to begin.</p>
            </div>
        );
    }

    return (
        <div className="analysis-timeline">
            <h3 className="section-title">Attend Analysis</h3>

            <div className="timeline-cards">
                {history.map((record, index) => {
                    // Calculate sequence number (1-based, chronological)
                    // Assuming history is reverse chronological (newest first), 
                    // but visual numbering should probably be consistent.
                    // User said "Newest card appears at the bottom" in manual?
                    // "Newest card appears at the bottom" -> chronologically ascending list?
                    // User manual:
                    // [ Analysis 1 ]
                    // [ Analysis 2 ]
                    // This implies ascending order (oldest top, newest bottom).
                    // But typically logs are newest top.
                    // User: "Newest card appears at the bottom" -> Okay, I will follow this.
                    // If history is passed as "Most Recent First" (api default), I should reverse it for display?
                    // Or backend sends it sorted?

                    // Let's assume standard behavior for now but display Sequence #.
                    // Sequence # is intrinsic to the record.

                    const seqNum = record.sequence_number || (index + 1);

                    return (
                        <div key={record.id || index} className="timeline-card">
                            <div className="card-header">
                                <span className="seq-badge">Analysis #{seqNum}</span>
                                <span className="time-badge">
                                    <Clock size={12} />
                                    {new Date(record.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            <div className="card-metrics">
                                <div className="metric">
                                    <span className="label">HR</span>
                                    <span className="value">{record.heart_rate}</span>
                                </div>
                                <div className="metric">
                                    <span className="label">SpO2</span>
                                    <span className="value">{record.spo2}%</span>
                                </div>
                                <div className="metric">
                                    <span className="label">BP</span>
                                    <span className="value">{record.bp_sys}/{record.bp_dia}</span>
                                </div>
                                <div className="metric">
                                    <span className="label">Temp</span>
                                    <span className="value">{record.temperature}°</span>
                                </div>
                                <div className="metric">
                                    <span className="label">RR</span>
                                    <span className="value">{record.resp_rate}</span>
                                </div>
                            </div>

                            <div className="card-footer">
                                <span className={`status-badge ${record.status?.toLowerCase() || 'stable'}`}>
                                    {record.status || 'Stable'}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
