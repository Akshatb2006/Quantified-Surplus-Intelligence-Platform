import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import '../App.css';
import { api } from '../services/api';
import Layout from './Layout';
import WeatherCard from './WeatherCard';
import DemandChart from './DemandChart';
import SurplusGauge from './SurplusGauge';
import DecisionPanel from './DecisionPanel';
import MetricsCards from './MetricsCards';
import SimulationChart from './SimulationChart';
import ComparisonTable from './ComparisonTable';
import { Settings2, Play, RefreshCw, MapPin, Calendar, BarChart3, ArrowLeft } from 'lucide-react';

function Dashboard({ initialConfig, onBack }) {
    const [weather, setWeather] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [simulationData, setSimulationData] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [comparison, setComparison] = useState(null);
    const [baselineMetrics, setBaselineMetrics] = useState(null);
    const [loading, setLoading] = useState(false);

    // Controls initialized from config
    const [city, setCity] = useState(initialConfig?.city || 'Delhi');
    const [eventFlag, setEventFlag] = useState(initialConfig?.eventFlag || 0);
    const [simulationDays, setSimulationDays] = useState(initialConfig?.simulationDays || 7);

    useEffect(() => {
        loadInitialData();
    }, []); // Run once on mount

    useEffect(() => {
        if (weather) {
            fetchPrediction(weather);
        }
    }, [eventFlag]);

    async function loadInitialData() {
        try {
            const weatherData = await api.getWeather(city);
            setWeather(weatherData);
            await fetchPrediction(weatherData);
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    }

    async function fetchPrediction(weatherData) {
        const w = (weatherData && weatherData.temperature !== undefined) ? weatherData : weather;
        if (!w || w.temperature === undefined) {
            return;
        }

        const now = new Date();
        const hour = now.getHours();
        const dayOfWeek = now.getDay();

        const features = {
            hour,
            day_of_week: dayOfWeek,
            temperature: w.temperature,
            rainfall: w.rainfall,
            event_flag: eventFlag
        };

        try {
            const predictionData = await api.predict(features);
            setPrediction(predictionData);
        } catch (error) {
            console.error('Error fetching prediction:', error);
        }
    }

    async function runSimulation() {
        setLoading(true);
        try {
            const results = await api.runSimulation(simulationDays, []);
            if (results.days && Array.isArray(results.days)) {
                const chartData = results.days.map(day => ({
                    day: day.day + 1,
                    surplusRisk: Math.round(Number(day.surplusRisk) * 100) / 100, // Already a percentage from backend
                    totalDemand: Object.values(day.predictions || {}).reduce((sum, val) => sum + Number(val), 0)
                }));
                setSimulationData(chartData);
            }

            if (results.summary && results.summary.comparison) {
                const comp = results.summary.comparison;
                const ai = results.summary.ai || {};
                const bl = results.summary.baseline || {};

                // Map to field names ComparisonTable expects
                const wastePercent = bl.totalWasteKg > 0
                    ? -((comp.wasteReductionKg / bl.totalWasteKg) * 100)
                    : 0; // Negative = reduction (good, since inverse=true)
                const revenuePercent = bl.totalRevenue > 0
                    ? ((ai.totalRevenue - bl.totalRevenue) / bl.totalRevenue) * 100
                    : 0;
                const costPercent = bl.revenueLoss > 0
                    ? -(((ai.revenueLoss || 0) - (bl.revenueLoss || 0)) / Math.max(bl.revenueLoss, 1)) * 100
                    : 0;

                setComparison({
                    waste: Math.round(wastePercent * 10) / 10,
                    cost: Math.round(costPercent * 10) / 10,
                    revenue: Math.round(revenuePercent * 10) / 10
                });
                setBaselineMetrics({
                    waste: bl.totalWasteKg || 0,
                    cost: bl.revenueLoss || 0,
                    revenue: bl.totalRevenue || 0
                });
            }

            await loadMetrics();
        } catch (error) {
            console.error('Error running simulation:', error);
        } finally {
            setLoading(false);
        }
    }

    async function loadMetrics() {
        try {
            const metricsData = await api.getMetrics();
            const transformedMetrics = {
                carbonSaved: metricsData.metrics?.carbonSavedKg || 0,
                foodSaved: metricsData.metrics?.wasteReductionKg || 0,
                mealsDonated: metricsData.metrics?.mealsDonated || 0,
                revenueImpact: -(metricsData.metrics?.revenueLoss || 0)
            };
            setMetrics(transformedMetrics);
        } catch (error) {
            console.error('Error loading metrics:', error);
        }
    }

    async function handleCityChange() {
        try {
            const weatherData = await api.getWeather(city);
            setWeather(weatherData);
            await fetchPrediction(weatherData);
        } catch (error) {
            console.error('Error changing city:', error);
        }
    }

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    return (
        <Layout>
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-card border border-border rounded-xl p-6 mb-8 shadow-sm"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Settings2 className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold text-foreground">Simulation Controls</h2>
                    </div>

                    {onBack && (
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft size={16} /> Back to Setup
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <MapPin size={14} /> Restaurant Location
                        </label>
                        <select
                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                            value={city === 'Delhi' ? 'Rest-A' : (city === 'Mumbai' ? 'Rest-B' : 'Rest-A')}
                            onChange={(e) => {
                                setLoading(true);
                                setTimeout(() => {
                                    runSimulation();
                                    setLoading(false);
                                }, 500);
                            }}
                        >
                            <option value="Rest-A">🍔 Burger King (Connaught Place)</option>
                            <option value="Rest-B">🍕 Domino's (Hauz Khas)</option>
                            <option value="Rest-C">🍗 KFC (Saket)</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <MapPin size={14} /> City Override
                        </label>
                        <input
                            type="text"
                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            onBlur={handleCityChange}
                            placeholder="Enter city name"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Calendar size={14} /> Simulation Horizon
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="range"
                                className="flex-1 accent-primary h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                                min="3"
                                max="14"
                                value={simulationDays}
                                onChange={(e) => setSimulationDays(parseInt(e.target.value))}
                            />
                            <span className="text-sm font-bold w-8">{simulationDays}d</span>
                        </div>
                    </div>

                    <div className="flex items-end gap-3">
                        <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground cursor-pointer bg-secondary/50 px-3 py-2 rounded-md hover:bg-secondary transition-colors h-[40px] flex-1 justify-center border border-border">
                            <input
                                type="checkbox"
                                className="accent-primary w-4 h-4"
                                checked={eventFlag === 1}
                                onChange={(e) => setEventFlag(e.target.checked ? 1 : 0)}
                            />
                            Special Event Effect
                        </label>
                    </div>
                </div>

                <div className="flex gap-4 mt-6 pt-4 border-t border-border/50">
                    <button
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 font-medium disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                        onClick={runSimulation}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" /> Running Simulation...
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4" /> Run Simulation
                            </>
                        )}
                    </button>

                    <button
                        className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2.5 rounded-lg hover:bg-secondary/80 transition-all font-medium border border-border"
                        onClick={() => fetchPrediction()}
                    >
                        <RefreshCw className="w-4 h-4" /> Refresh Prediction
                    </button>
                </div>
            </motion.div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                <motion.div variants={item} className="col-span-1 md:col-span-2 lg:col-span-1">
                    <WeatherCard weather={weather} />
                </motion.div>

                <motion.div variants={item} className="col-span-1 md:col-span-2 lg:col-span-1">
                    <SurplusGauge surplusRisk={prediction?.surplusRisk} />
                </motion.div>

                <motion.div variants={item} className="col-span-1 md:col-span-4 lg:col-span-2">
                    <MetricsCards metrics={metrics} />
                </motion.div>

                <motion.div variants={item} className="col-span-1 md:col-span-4 lg:col-span-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                        <DemandChart
                            forecast={prediction?.hourly_forecast}
                            predictions={prediction?.predictions}
                            uncertainty={prediction?.uncertainty}
                            lowerBound={prediction?.lower_bound}
                            upperBound={prediction?.upper_bound}
                        />
                        <DecisionPanel decision={prediction?.decision} />
                    </div>
                </motion.div>

                <motion.div variants={item} className="col-span-1 md:col-span-4 border-t border-border pt-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        Performance Analysis
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <SimulationChart simulationData={simulationData} />
                        <ComparisonTable
                            comparison={comparison}
                            baselineMetrics={baselineMetrics}
                            aiMetrics={metrics}
                        />
                    </div>
                </motion.div>
            </motion.div>
        </Layout>
    );
}

export default Dashboard;
