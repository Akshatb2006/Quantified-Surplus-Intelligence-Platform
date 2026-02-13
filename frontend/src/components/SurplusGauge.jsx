import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

function SurplusGauge({ surplusRisk }) {
    if (surplusRisk === undefined || surplusRisk === null) {
        return (
            <div className="bg-card border border-border rounded-xl p-6 h-full flex items-center justify-center animate-pulse min-h-[250px]">
                <div className="text-muted-foreground">Loading gauge...</div>
            </div>
        );
    }

    const value = Math.max(0, Math.min(100, surplusRisk));

    // Determine color based on risk
    let color = '#3b82f6'; // Blue (Low)
    let status = 'Stable';

    if (value > 75) {
        color = '#ef4444'; // Red (High)
        status = 'Critical';
    } else if (value > 40) {
        color = '#f59e0b'; // Amber (Medium)
        status = 'Warning';
    } else {
        color = '#10b981'; // Emerald (Safe)
        status = 'Optimal';
    }

    const data = [
        { name: 'Risk', value: value },
        { name: 'Safety', value: 100 - value }
    ];

    return (
        <div className="bg-card border border-border rounded-xl p-6 h-full flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-4 left-4 font-semibold text-foreground flex items-center gap-2 z-10">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                Surplus Risk Index
            </div>

            <div className="relative w-full h-[200px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="80%"
                            startAngle={180}
                            endAngle={0}
                            innerRadius={80}
                            outerRadius={100}
                            paddingAngle={0}
                            dataKey="value"
                            stroke="none"
                        >
                            <Cell key="risk" fill={color} />
                            <Cell key="safe" fill="var(--secondary)" />
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>

                {/* Needle / Value Display */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 -translate-y-4 text-center">
                    <div className="text-4xl font-bold tracking-tighter" style={{ color }}>
                        {Math.round(value)}%
                    </div>
                    <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mt-1">
                        {status}
                    </div>
                </div>
            </div>

            <div className="w-full mt-4 grid grid-cols-3 gap-1 text-center text-xs text-muted-foreground font-medium uppercase tracking-wide">
                <div className="border-t-2 border-emerald-500/50 pt-1">Safe</div>
                <div className="border-t-2 border-amber-500/50 pt-1">Warning</div>
                <div className="border-t-2 border-red-500/50 pt-1">Critical</div>
            </div>
        </div>
    );
}

export default SurplusGauge;
