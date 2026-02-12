import { useState, useEffect } from 'react';
import './App.css';
import { api } from './services/api';
import WeatherCard from './components/WeatherCard';
import DemandChart from './components/DemandChart';
import SurplusGauge from './components/SurplusGauge';
import DecisionPanel from './components/DecisionPanel';
import MetricsCards from './components/MetricsCards';
import SimulationChart from './components/SimulationChart';
import ComparisonTable from './components/ComparisonTable';

function App() {
  const [weather, setWeather] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [simulationData, setSimulationData] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [baselineMetrics, setBaselineMetrics] = useState(null);
  const [loading, setLoading] = useState(false);

  // Controls
  const [city, setCity] = useState('Delhi');
  const [eventFlag, setEventFlag] = useState(0);
  const [simulationDays, setSimulationDays] = useState(7);

  useEffect(() => {
    loadInitialData();
  }, []);

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
    // Handle case where weatherData is an event or undefined
    const w = (weatherData && weatherData.temperature !== undefined) ? weatherData : weather;
    if (!w || w.temperature === undefined) {
      console.warn("Prediction skipped: Missing temperature data", w);
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
      // Extract days array and transform for chart
      if (results.days && Array.isArray(results.days)) {
        const chartData = results.days.map(day => ({
          day: day.day + 1, // Make 1-indexed for display
          surplusRisk: Math.round(day.surplusRisk * 100) / 100,
          totalDemand: Object.values(day.predictions || {}).reduce((sum, val) => sum + val, 0)
        }));
        setSimulationData(chartData);
      }

      // Extract comparison data
      if (results.summary && results.summary.comparison) {
        setComparison(results.summary.comparison);
        setBaselineMetrics(results.summary.baseline);
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
      // Transform metrics for display
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

  return (
    <div className="app">
      <div className="sidebar">
        <div className="logo">
          <h1>🌍 Food Surplus AI</h1>
          <p>Predictive Redistribution System</p>
        </div>

        <div className="controls">
          <div className="control-group">
            <label>Select Restaurant</label>
            <select
              value={city === 'Delhi' ? 'Rest-A' : (city === 'Mumbai' ? 'Rest-B' : 'Rest-A')}
              onChange={(e) => {
                // Fake restaurant switch by just re-running
                setLoading(true);
                setTimeout(() => {
                  runSimulation();
                  setLoading(false);
                }, 500);
              }}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', background: '#334155', color: 'white', border: '1px solid #475569' }}
            >
              <option value="Rest-A">🍔 Burger King (Connaught Place)</option>
              <option value="Rest-B">🍕 Domino's (Hauz Khas)</option>
              <option value="Rest-C">🍗 KFC (Saket)</option>
            </select>
          </div>

          <div className="control-group">
            <label>City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onBlur={handleCityChange}
              placeholder="Enter city name"
            />
          </div>

          <div className="control-group">
            <label>
              <input
                type="checkbox"
                checked={eventFlag === 1}
                onChange={(e) => setEventFlag(e.target.checked ? 1 : 0)}
              />
              Special Event Today
            </label>
          </div>

          <div className="control-group">
            <label>Simulation Days: {simulationDays}</label>
            <input
              type="range"
              min="3"
              max="14"
              value={simulationDays}
              onChange={(e) => setSimulationDays(parseInt(e.target.value))}
            />
          </div>

          <button
            className="btn-primary"
            onClick={runSimulation}
            disabled={loading}
          >
            {loading ? '⏳ Running...' : '🚀 Run Simulation'}
          </button>

          <button
            className="btn-secondary"
            onClick={() => fetchPrediction()}
          >
            🔄 Refresh Prediction
          </button>
        </div>
      </div>

      <div className="main-content">
        <div className="dashboard-grid">
          <div className="grid-item span-2">
            <WeatherCard weather={weather} />
          </div>

          <div className="grid-item span-2">
            <SurplusGauge surplusRisk={prediction?.surplusRisk} />
          </div>

          <div className="grid-item span-4">
            <DemandChart
              predictions={prediction?.predictions}
              uncertainty={prediction?.uncertainty}
              lowerBound={prediction?.lower_bound}
              upperBound={prediction?.upper_bound}
            />
          </div>

          <div className="grid-item span-4">
            <DecisionPanel decision={prediction?.decision} />
          </div>

          <div className="grid-item span-4">
            <MetricsCards metrics={metrics} />
          </div>

          <div className="grid-item span-4">
            <SimulationChart simulationData={simulationData} />
          </div>

          <div className="grid-item span-4">
            <ComparisonTable
              comparison={comparison}
              baselineMetrics={baselineMetrics}
              aiMetrics={metrics}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
