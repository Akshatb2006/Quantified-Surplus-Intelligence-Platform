import './MetricsCards.css';

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
            value: `${Math.round(data.carbonSaved)}kg CO₂`,
            icon: '🌍',
            color: '#10b981' // Green
        },
        {
            title: 'Food Saved',
            value: `${Math.round(data.foodSaved)}kg`,
            icon: '🥗',
            color: '#3b82f6'
        },
        {
            title: 'Meals Donated',
            value: data.mealsDonated || 0,
            icon: '🍽️',
            color: '#f59e0b'
        },
        {
            title: 'Revenue Impact',
            value: data.revenueImpact >= 0 ? `+₹${data.revenueImpact}` : `-₹${Math.abs(data.revenueImpact)}`,
            icon: '💵',
            color: data.revenueImpact >= 0 ? '#10b981' : '#ef4444'
        }
    ];

    return (
        <div className="metrics-cards">
            {cards.map((card, idx) => (
                <div key={idx} className="metric-card" style={{ borderTop: `3px solid ${card.color}` }}>
                    <div className="metric-icon" style={{ color: card.color }}>
                        {card.icon}
                    </div>
                    <div className="metric-content">
                        <div className="metric-title">{card.title}</div>
                        <div className="metric-value" style={{ color: card.color }}>
                            {card.value}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default MetricsCards;
