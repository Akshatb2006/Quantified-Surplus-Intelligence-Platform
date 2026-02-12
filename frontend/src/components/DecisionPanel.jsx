import './DecisionPanel.css';

function DecisionPanel({ decision }) {
    if (!decision) return <div className="decision-panel loading">Loading decision...</div>;

    const { action, reason, color, recommendations = [], foodSafety } = decision;

    const actionIcons = {
        REDISTRIBUTE: '🎁',
        DISCOUNT: '💰',
        NORMAL: '✅'
    };

    // Safely get icon
    const icon = actionIcons[action?.toUpperCase()] || '📋';

    return (
        <div className="decision-panel" style={{ borderLeft: `6px solid ${color}` }}>
            <div className="decision-header">
                <h3>🤖 AI Decision</h3>
                <div className="action-badge" style={{ backgroundColor: color }}>
                    {icon} {action?.toUpperCase()}
                </div>
            </div>

            <p className="decision-reason">{reason}</p>

            {foodSafety && (
                <div className={`food-safety-info ${foodSafety.riskLevel.toLowerCase()}-risk`}>
                    <div className="safety-header">
                        <span>❄️ Food Safety Monitor</span>
                        <span className="risk-tag">{foodSafety.riskLevel} RISK</span>
                    </div>
                    <div className="safety-metrics">
                        <div className="safety-metric">
                            <span className="label">Ambient Temp</span>
                            <span className="value">{foodSafety.ambientTemp}°C</span>
                        </div>
                        <div className="safety-metric">
                            <span className="label">Heat Stress</span>
                            <span className="value">{foodSafety.stressIndex}x</span>
                        </div>
                        <div className="safety-metric">
                            <span className="label">Shelf Life</span>
                            <span className="value warning">{foodSafety.effectiveHours}h</span>
                            <span className="sub">was {foodSafety.originalHours}h</span>
                        </div>
                    </div>
                </div>
            )}

            {recommendations && recommendations.length > 0 && (
                <div className="recommendations">
                    <h4>Recommendations & Logistics:</h4>
                    <ul>
                        {recommendations.map((rec, idx) => (
                            <li key={idx} className={rec.includes('CRITICAL') || rec.includes('High uncertainty') ? 'urgent-rec' : ''}>
                                {rec}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default DecisionPanel;
