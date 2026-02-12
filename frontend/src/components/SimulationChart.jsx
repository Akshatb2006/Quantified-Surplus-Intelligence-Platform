import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './SimulationChart.css';

function SimulationChart({ simulationData }) {
    if (!simulationData || simulationData.length === 0) {
        return <div className="simulation-chart loading">Run simulation to see trends...</div>;
    }

    return (
        <div className="simulation-chart">
            <h3>📈 Multi-Day Simulation</h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={simulationData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <XAxis
                        dataKey="day"
                        stroke="#94a3b8"
                        label={{ value: 'Day', position: 'insideBottom', offset: -5, fill: '#94a3b8' }}
                    />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            color: '#e2e8f0'
                        }}
                    />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="surplusRisk"
                        stroke="#ef4444"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Surplus Risk"
                    />
                    <Line
                        type="monotone"
                        dataKey="totalDemand"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Total Demand"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export default SimulationChart;
