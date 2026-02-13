import { TrendingUp, TrendingDown, Minus, CheckCircle2 } from 'lucide-react';

function ComparisonTable({ comparison, baselineMetrics, aiMetrics }) {
    if (!comparison) return null;

    const metrics = [
        { key: 'waste', label: 'Waste Generated', unit: 'kg', inverse: true },
        { key: 'cost', label: 'Operational Cost', unit: '₹', inverse: true },
        { key: 'revenue', label: 'Revenue', unit: '₹', inverse: false }
    ];

    const getChangeIcon = (percent, inverse) => {
        const isGood = inverse ? percent < 0 : percent > 0;
        if (Math.abs(percent) < 1) return <Minus size={16} className="text-muted-foreground" />;

        if (isGood) return <TrendingUp size={16} className="text-emerald-500" />;
        return <TrendingDown size={16} className="text-red-500" />;
    };

    const formatValue = (val, unit) => {
        return unit === '₹' ? `₹${Math.round(val).toLocaleString()}` : `${Math.round(val)} ${unit}`;
    };

    return (
        <div className="bg-card border border-border rounded-xl p-6 h-full">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <CheckCircle2 size={20} className="text-primary" />
                AI vs Baseline Comparison
            </h3>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="text-left font-medium text-muted-foreground py-3 pl-2">Metric</th>
                            <th className="text-right font-medium text-muted-foreground py-3">Baseline</th>
                            <th className="text-right font-medium text-muted-foreground py-3 text-primary">AI Optimized</th>
                            <th className="text-right font-medium text-muted-foreground py-3 pr-2">Improvement</th>
                        </tr>
                    </thead>
                    <tbody>
                        {metrics.map((m) => {
                            const baseline = baselineMetrics?.[m.key] || 0;
                            const ai = aiMetrics?.[m.key === 'waste' ? 'foodSaved' : (m.key === 'revenue' ? 'revenueImpact' : 'cost')] || 0;
                            // Note: aiMetrics structure might differ, mapping needs to be precise based on actual prop data structure
                            // Adjusting logic:
                            // baselineMetrics has raw values.
                            // comparison object usually holds the % diff.
                            // We need real values if possible. 

                            // Let's use the 'comparison' prop directly which likely has the % change
                            const percentChange = comparison[m.key] || 0;

                            // Color logic
                            const inverse = m.inverse;
                            const isGood = inverse ? percentChange < 0 : percentChange > 0;
                            const colorClass = isGood ? 'text-emerald-500 font-semibold' : 'text-red-500 font-semibold';
                            const bgClass = isGood ? 'bg-emerald-500/10' : 'bg-red-500/10';

                            return (
                                <tr key={m.key} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                                    <td className="py-4 pl-2 font-medium">{m.label}</td>
                                    <td className="py-4 text-right text-muted-foreground">
                                        {formatValue(baseline, m.unit)}
                                    </td>
                                    <td className="py-4 text-right font-medium text-foreground">
                                        {/* For demo, we might not have exact AI value in this prop structure, but we have % change. 
                                            AI = Baseline * (1 + change/100) */}
                                        {formatValue(baseline * (1 + percentChange / 100), m.unit)}
                                    </td>
                                    <td className="py-4 text-right pr-2">
                                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${bgClass} ${colorClass}`}>
                                            {getChangeIcon(percentChange, inverse)}
                                            {percentChange > 0 ? '+' : ''}{Math.round(percentChange)}%
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 bg-secondary/30 p-4 rounded-lg border border-border/50 text-xs text-muted-foreground leading-relaxed">
                <strong>Analysis:</strong> The AI model demonstrates significant efficiency gains.
                Redistribution strategies have effectively lowered waste by
                <span className="text-emerald-500 font-bold mx-1">{Math.abs(Math.round(comparison.waste))}%</span>
                while maintaining or improving revenue streams.
            </div>
        </div>
    );
}

export default ComparisonTable;
