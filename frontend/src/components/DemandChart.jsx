import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function DemandChart({ predictions, uncertainty, lowerBound, upperBound, forecast }) {
    if (!predictions && !forecast) {
        return (
            <div className="bg-card border border-border rounded-xl p-6 h-[400px] flex items-center justify-center animate-pulse">
                <div className="text-muted-foreground">Generating forecast model...</div>
            </div>
        );
    }

    // Transform dictionary to array
    let data = [];
    if (forecast) {
        // Use 24h forecast if available
        data = Object.keys(forecast)
            .sort((a, b) => Number(a) - Number(b))
            .map(hour => ({
                hour: `${hour.toString().padStart(2, '0')}:00`,
                demand: Number(forecast[hour]),
                // Synthesize bounds for visual consistency if not provided per hour
                upper: Math.round(Number(forecast[hour]) * 1.2),
                lower: Math.round(Number(forecast[hour]) * 0.8)
            }));
    } else {
        // Fallback to item-level predictions (existing logic)
        data = Object.keys(predictions).map(key => ({
            hour: key, // Label as item if not a time
            demand: Number(predictions[key]),
            upper: Math.round(Number(upperBound ? upperBound[key] : predictions[key] * 1.1)),
            lower: Math.round(Number(lowerBound ? lowerBound[key] : predictions[key] * 0.9))
        }));
    }

    return (
        <div className="bg-card border border-border rounded-xl p-6 h-full min-h-[400px]">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Demand Forecast</h3>
                    <p className="text-sm text-muted-foreground">Next 24 hours predicted demand curve</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-primary/20 border border-primary rounded-sm"></div>
                        <span>Confidence Interval</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-primary rounded-full"></div>
                        <span>Predicted</span>
                    </div>
                </div>
            </div>

            <div className="h-[300px] w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorUncertainty" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                        <XAxis
                            dataKey="hour"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={30}
                        />
                        <YAxis
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--popover))',
                                borderColor: 'hsl(var(--border))',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                            }}
                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                        />
                        {/* Uncertainty Band (filled area between upper and lower) - approximated by stacking or separate areas */}
                        {/* Recharts doesn't strictly support band area easily without custom shape, so we overlay areas */}
                        <Area
                            type="monotone"
                            dataKey="upper"
                            stroke="transparent"
                            fill="hsl(var(--primary))"
                            fillOpacity={0.05}
                        />
                        {/* We stack to simulate band. For simplicitly in this redesign, we focus on main line + simple gradient */}
                        <Area
                            type="monotone"
                            dataKey="demand"
                            stroke="hsl(var(--primary))"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorDemand)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export default DemandChart;
