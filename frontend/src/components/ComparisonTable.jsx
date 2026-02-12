import './ComparisonTable.css';

function ComparisonTable({ comparison, baselineMetrics, aiMetrics }) {
    if (!comparison || !baselineMetrics || !aiMetrics) {
        return <div className="comparison-table loading">Run simulation to see baseline comparison...</div>;
    }

    const rows = [
        {
            metric: 'Waste (kg)',
            baseline: baselineMetrics.totalWasteKg || 0,
            ai: Math.max(0, (baselineMetrics.totalWasteKg || 0) - (aiMetrics.wasteReductionKg || 0)),
            delta: `-${comparison.wasteReductionPercent}%`,
            isGood: true
        },
        {
            metric: 'Meals Donated',
            baseline: baselineMetrics.totalMealsDonated || 0,
            ai: aiMetrics.mealsDonated || 0,
            delta: `+${comparison.mealsDonatedDelta}`,
            isGood: true
        },
        {
            metric: 'Revenue Impact',
            baseline: `₹${baselineMetrics.revenueLoss || 0}`,
            ai: aiMetrics.revenueLoss >= 0 ? `-₹${aiMetrics.revenueLoss}` : `+₹${Math.abs(aiMetrics.revenueLoss)}`,
            delta: comparison.revenueDelta >= 0 ? `-₹${comparison.revenueDelta}` : `+₹${Math.abs(comparison.revenueDelta)}`,
            isGood: comparison.revenueDelta <= 0
        }
    ];

    const netValue = comparison.netSocialValue || 0;

    return (
        <div className="comparison-table">
            <h3>📊 Baseline vs AI System</h3>

            <div className="impact-summary">
                <div className="impact-highlight">
                    <span className="highlight-label">AI Impact</span>
                    <span className="highlight-value">
                        {comparison.wasteReductionPercent > 0 ? `${comparison.wasteReductionPercent}% waste reduction` : 'Running...'}
                    </span>
                </div>
                <div className="impact-stat">
                    <span className="stat-icon">🍽️</span>
                    <span className="stat-text">{comparison.mealsDonatedDelta} meals donated</span>
                </div>
                <div className="impact-stat">
                    <span className="stat-icon">💰</span>
                    <span className="stat-text">Net Value: ₹{Math.round(netValue)}</span>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Metric</th>
                        <th>Baseline</th>
                        <th>AI System</th>
                        <th>Delta</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, idx) => (
                        <tr key={idx}>
                            <td className="metric-name">{row.metric}</td>
                            <td className="baseline-value">{typeof row.baseline === 'number' ? Math.round(row.baseline * 10) / 10 : row.baseline}</td>
                            <td className="ai-value">{typeof row.ai === 'number' ? Math.round(row.ai * 10) / 10 : row.ai}</td>
                            <td className={`delta-value ${row.isGood ? 'positive' : 'negative'}`}>
                                {row.delta}
                                {row.isGood && <span className="check-icon"> ✅</span>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default ComparisonTable;
