import { Leaf, Utensils, Heart, IndianRupee, TrendingUp, TrendingDown } from 'lucide-react';

function MetricsCards({ metrics }) {
    const defaultMetrics = {
        wasteReduction: 0,
        foodSaved: 0,
        mealsDonated: 0,
        revenueImpact: 0
    };

    const data = metrics || defaultMetrics;

    const cards = [
        {
            title: 'Carbon Saved',
            value: `${Math.round(data.carbonSaved)}`,
            unit: 'kg CO₂',
            icon: Leaf,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20'
        },
        {
            title: 'Food Saved',
            value: `${Math.round(data.foodSaved)}`,
            unit: 'kg',
            icon: Utensils,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20'
        },
        {
            title: 'Meals Donated',
            value: data.mealsDonated || 0,
            unit: 'meals',
            icon: Heart,
            color: 'text-rose-500',
            bg: 'bg-rose-500/10',
            border: 'border-rose-500/20'
        },
        {
            title: 'Revenue Impact',
            value: data.revenueImpact >= 0 ? `₹${data.revenueImpact}` : `-₹${Math.abs(data.revenueImpact)}`,
            unit: 'net',
            icon: IndianRupee,
            color: data.revenueImpact >= 0 ? 'text-amber-500' : 'text-red-500',
            bg: data.revenueImpact >= 0 ? 'bg-amber-500/10' : 'bg-red-500/10',
            border: data.revenueImpact >= 0 ? 'border-amber-500/20' : 'border-red-500/20'
        }
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cards.map((card, idx) => (
                <div key={idx} className={`rounded-xl border p-4 ${card.bg} ${card.border} transition-all hover:scale-[1.02]`}>
                    <div className="flex justify-between items-start mb-2">
                        <div className={`p-2 rounded-lg bg-background/60 backdrop-blur ${card.color}`}>
                            <card.icon size={18} />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold tracking-tight text-foreground">
                            {card.value}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-xs text-muted-foreground font-medium">{card.title}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full bg-background/50 border ${card.border} ${card.color}`}>
                                {card.unit}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default MetricsCards;
