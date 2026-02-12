import './WeatherCard.css';

function WeatherCard({ weather }) {
    if (!weather) return <div className="weather-card loading">Loading weather...</div>;

    return (
        <div className="weather-card">
            <div className="weather-header">
                <h3>🌤️ Current Weather</h3>
                <span className="weather-source">{weather.source}</span>
            </div>
            <div className="weather-body">
                <div className="weather-main">
                    <div className="temperature">{weather.temperature}°C</div>
                    <div className="description">{weather.description}</div>
                </div>
                <div className="weather-details">
                    <div className="detail-item">
                        <span className="label">City</span>
                        <span className="value">{weather.city}</span>
                    </div>
                    <div className="detail-item">
                        <span className="label">Rainfall</span>
                        <span className="value">{weather.rainfall} mm</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default WeatherCard;
