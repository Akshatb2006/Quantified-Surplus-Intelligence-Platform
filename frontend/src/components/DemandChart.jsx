import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ErrorBar } from 'recharts';
import './DemandChart.css';

function DemandChart({ predictions, uncertainty, lowerBound, upperBound }) {
    if (!predictions) return <div className="demand-chart loading">Loading predictions...</div>;

    const data = Object.entries(predictions).map(([item, value]) => ({
        item,
        demand: value,
        lower: lowerBound?.[item] || value,
        upper: upperBound?.[item] || value,
        uncertainty: uncertainty?.[item] || 0
    }));

    const COLORS = {
        burger: '#ef4444',
        fries: '#f59e0b',
        wrap: '#10b981',
        bucket: '#3b82f6',
        drink: '#8b5cf6'
    };

    return (
        <div className="demand-chart">
            <h3>📊 Predicted Demand</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <XAxis dataKey="item" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            color: '#e2e8f0'
                        }}
                    />
                    <Bar dataKey="demand" radius={[8, 8, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[entry.item] || '#64748b'} />
                        ))}
                        <ErrorBar dataKey="uncertainty" width={4} strokeWidth={2} stroke="#64748b" />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export default DemandChart;
