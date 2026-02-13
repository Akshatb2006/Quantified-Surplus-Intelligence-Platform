import { AlertTriangle, CheckCircle, Truck, Thermometer, Info, AlertOctagon } from 'lucide-react';

function DecisionPanel({ decision }) {
    if (!decision) return (
        <div className="bg-card w-full h-full min-h-[200px] rounded-xl border border-border flex items-center justify-center animate-pulse p-6">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <AlertOctagon size={32} />
                <span>Waiting for analysis...</span>
            </div>
        </div>
    );

    const { action, reason, color, recommendations = [], foodSafety } = decision;

    const actionIcons = {
        CASCADING: AlertOctagon, // CSVE
        REDISTRIBUTE: Truck,
        DISCOUNT: AlertTriangle,
        NORMAL: CheckCircle
    };

    const Icon = actionIcons[action?.toUpperCase()] || Info;

    const getStatusColor = (actionType) => {
        switch (actionType?.toUpperCase()) {
            case 'CASCADING': return 'text-purple-600 bg-purple-600/10 border-purple-600/20';
            case 'REDISTRIBUTE': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
            case 'DISCOUNT': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            case 'NORMAL': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
        }
    };

    const statusStyle = getStatusColor(action);

    return (
        <div className="bg-card border border-border rounded-xl p-6 h-full flex flex-col relative overflow-hidden">
            {/* Status Indicator */}
            <div className={`absolute top-0 left-0 w-1.5 h-full ${statusStyle.split(' ')[0].replace('text', 'bg')}`} />

            <div className="flex items-center justify-between mb-6 pl-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${statusStyle}`}>
                        <Icon size={24} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg leading-tight">AI Decision</h3>
                        <p className={`text-xs font-bold tracking-wider uppercase ${statusStyle.split(' ')[0]}`}>
                            {action}
                        </p>
                    </div>
                </div>
            </div>

            <div className="pl-4 space-y-6 flex-1">
                <div className="bg-secondary/50 p-4 rounded-lg border border-border/50">
                    <p className="text-sm text-foreground leading-relaxed">
                        <span className="text-primary font-semibold mr-1">Analysis:</span>
                        {reason}
                    </p>
                </div>

                {/* CSVE Tier Display */}
                {action === 'cascading' && decision.csve && (
                    <div className="space-y-3">
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
                            Cascading Strategy
                        </h4>
                        <div className="grid grid-cols-3 gap-3">
                            {/* Tier 1: Revenue */}
                            <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3 text-center">
                                <div className="text-[10px] text-purple-600 font-bold uppercase mb-1">Scale Revenue</div>
                                <div className="text-lg font-bold text-foreground">{decision.csve.tiers.revenue.count}</div>
                                <div className="text-[10px] text-muted-foreground">Items Sold</div>
                                <div className="text-xs font-semibold text-green-600 mt-1">+₹{decision.csve.tiers.revenue.value}</div>
                            </div>

                            {/* Tier 2: Redistribute */}
                            <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 text-center">
                                <div className="text-[10px] text-blue-600 font-bold uppercase mb-1">Redistribute</div>
                                <div className="text-lg font-bold text-foreground">{decision.csve.tiers.redistribution.count}</div>
                                <div className="text-[10px] text-muted-foreground">Meals Donated</div>
                                <div className="text-xs font-semibold text-blue-600 mt-1">Social Val</div>
                            </div>

                            {/* Tier 3: Buffer */}
                            <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3 text-center">
                                <div className="text-[10px] text-orange-600 font-bold uppercase mb-1">Safety Buffer</div>
                                <div className="text-lg font-bold text-foreground">{decision.csve.tiers.buffer.count}</div>
                                <div className="text-[10px] text-muted-foreground">Items Held</div>
                                <div className="text-xs font-semibold text-orange-600 mt-1">Late Rush</div>
                            </div>
                        </div>
                    </div>
                )}

                {foodSafety && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <Thermometer size={14} /> Food Safety
                            </span>
                            <span className={`px-2 py-0.5 rounded border ${foodSafety.riskLevel === 'LOW' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                foodSafety.riskLevel === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                    'bg-red-500/10 text-red-500 border-red-500/20'
                                }`}>
                                {foodSafety.riskLevel} RISK
                            </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            <div className="bg-background border border-border/50 p-2 rounded text-center">
                                <div className="text-[10px] text-muted-foreground mb-1">Ambient</div>
                                <div className="font-mono text-sm font-semibold">{foodSafety.ambientTemp}°C</div>
                            </div>
                            <div className="bg-background border border-border/50 p-2 rounded text-center">
                                <div className="text-[10px] text-muted-foreground mb-1">Frozen Temp</div>
                                <div className="font-mono text-sm font-semibold text-blue-500">{foodSafety.estimatedFrozenTemp}°C</div>
                            </div>
                            <div className="bg-background border border-border/50 p-2 rounded text-center">
                                <div className="text-[10px] text-muted-foreground mb-1">Stress Idx</div>
                                <div className="font-mono text-sm font-semibold">{foodSafety.stressIndex}x</div>
                            </div>
                            <div className="bg-background border border-border/50 p-2 rounded text-center">
                                <div className="text-[10px] text-muted-foreground mb-1">Shelf Life</div>
                                <div className="font-mono text-sm font-semibold text-orange-500">{foodSafety.effectiveHours}h</div>
                            </div>
                        </div>
                    </div>
                )}

                {recommendations && recommendations.length > 0 && (
                    <div className="mt-4">
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3 flex items-center gap-2">
                            <Truck size={12} /> Logistics
                        </h4>
                        <ul className="space-y-2">
                            {recommendations.map((rec, idx) => (
                                <li key={idx} className="text-sm flex items-start gap-2 text-muted-foreground">
                                    <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${rec.includes('CRITICAL') ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-primary'
                                        }`} />
                                    <span>{rec}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DecisionPanel;
