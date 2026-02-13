import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function SimulationChart({ simulationData }) {
    if (!simulationData || simulationData.length === 0) {
        return (
            <div className="bg-card border border-border rounded-xl p-6 h-full flex flex-col items-center justify-center min-h-[300px] text-muted-foreground text-center">
                <div className="mb-2">Run a simulation to see the sustainability impact analysis</div>
                <div className="text-sm opacity-50">Adjust parameters and click "Run Simulation"</div>
            </div>
        );
    }

    return (
        <div className="bg-card border border-border rounded-xl p-6 h-full">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <span>📊</span> Simulation Results
            </h3>

            <div className="h-[300px] w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={simulationData.map(d => ({
                            ...d,
                            totalDemand: Number(d.totalDemand),
                            surplusRisk: Number(d.surplusRisk)
                        }))}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                        <XAxis
                            dataKey="day"
                            label={{ value: 'Day', position: 'insideBottomRight', offset: -5, fill: 'hsl(var(--muted-foreground))' }}
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            yAxisId="left"
                            orientation="left"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                            contentStyle={{
                                backgroundColor: 'hsl(var(--popover))',
                                borderColor: 'hsl(var(--border))',
                                borderRadius: '8px'
                            }}
                        />
                        <Legend />
                        <Bar dataKey="totalDemand" name="Total Demand" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} yAxisId="left" />
                        <Bar dataKey="surplusRisk" name="Surplus Risk Index" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} yAxisId="right" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export default SimulationChart;
