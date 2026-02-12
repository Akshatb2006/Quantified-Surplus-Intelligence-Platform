import './SurplusGauge.css';

function SurplusGauge({ surplusRisk }) {
    if (surplusRisk === undefined || surplusRisk === null) {
        return <div className="surplus-gauge loading">Loading risk...</div>;
    }

    const percentage = Math.round(surplusRisk * 100);
    const rotation = (surplusRisk * 180) - 90; // -90 to 90 degrees

    let riskLevel = 'low';
    let riskColor = '#10b981';
    if (surplusRisk > 0.6) {
        riskLevel = 'high';
        riskColor = '#ef4444';
    } else if (surplusRisk > 0.3) {
        riskLevel = 'medium';
        riskColor = '#f59e0b';
    }

    return (
        <div className="surplus-gauge">
            <h3>⚠️ Surplus Risk</h3>
            <div className="gauge-container">
                <svg className="gauge-svg" viewBox="0 0 200 120">
                    {/* Background arc */}
                    <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke="#334155"
                        strokeWidth="20"
                        strokeLinecap="round"
                    />
                    {/* Colored arc */}
                    <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke={riskColor}
                        strokeWidth="20"
                        strokeLinecap="round"
                        strokeDasharray={`${surplusRisk * 251} 251`}
                    />
                    {/* Needle */}
                    <line
                        x1="100"
                        y1="100"
                        x2="100"
                        y2="40"
                        stroke="#e2e8f0"
                        strokeWidth="3"
                        strokeLinecap="round"
                        transform={`rotate(${rotation} 100 100)`}
                    />
                    <circle cx="100" cy="100" r="8" fill="#e2e8f0" />
                </svg>
                <div className="gauge-value" style={{ color: riskColor }}>
                    {percentage}%
                </div>
                <div className={`risk-label risk-${riskLevel}`}>
                    {riskLevel.toUpperCase()} RISK
                </div>
            </div>
        </div>
    );
}

export default SurplusGauge;
