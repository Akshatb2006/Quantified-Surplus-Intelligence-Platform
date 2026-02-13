import { CloudRain, MapPin, Thermometer, Wind } from 'lucide-react';

function WeatherCard({ weather }) {
    if (!weather) return (
        <div className="bg-card border border-border rounded-xl p-6 h-full flex items-center justify-center min-h-[200px]">
            <div className="flex flex-col items-center gap-2 text-muted-foreground animate-pulse">
                <CloudRain size={32} />
                <span>Loading weather data...</span>
            </div>
        </div>
    );

    return (
        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-6 h-full relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <CloudRain size={100} />
            </div>

            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex items-center gap-2 text-blue-400">
                    <CloudRain size={20} />
                    <h3 className="font-semibold tracking-wide uppercase text-xs">Environment</h3>
                </div>
                <span className="text-xs bg-background/50 backdrop-blur px-2 py-1 rounded text-muted-foreground border border-border">
                    {weather.source}
                </span>
            </div>

            <div className="space-y-6 relative z-10">
                <div className="flex items-end gap-2">
                    <div className="text-5xl font-bold text-foreground tracking-tighter">
                        {weather.temperature}°
                    </div>
                    <div className="text-muted-foreground mb-1 font-medium">{weather.description}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-background/40 backdrop-blur p-3 rounded-lg border border-border/50">
                        <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                            <MapPin size={12} />
                            <span>Location</span>
                        </div>
                        <div className="font-semibold text-sm">{weather.city}</div>
                    </div>
                    <div className="bg-background/40 backdrop-blur p-3 rounded-lg border border-border/50">
                        <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                            <Wind size={12} />
                            <span>Rainfall</span>
                        </div>
                        <div className="font-semibold text-sm">{weather.rainfall} mm</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default WeatherCard;
