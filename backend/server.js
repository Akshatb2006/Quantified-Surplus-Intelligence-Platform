/**
 * Express Server
 * Main backend server with CORS and route mounting
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { getCurrentWeather } = require('./services/weatherService');
const { predictDemand } = require('./services/predictionService');
const { computeIngredientUsage, computeSurplus, computeSurplusRisk } = require('./services/ingredientMapping');
const { makeDecision, getShelterStatus } = require('./services/decisionEngine');
const { runSimulation, simulateDay, getMetrics, resetSimulation } = require('./services/simulationService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes

// GET /api/weather
app.get('/api/weather', async (req, res) => {
    try {
        const city = req.query.city || 'Delhi';
        const weather = await getCurrentWeather(city);
        res.json({ success: true, data: weather });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/predict
app.post('/api/predict', async (req, res) => {
    try {
        const features = req.body;

        // Validate required features
        const required = ['hour', 'day_of_week', 'temperature', 'rainfall', 'event_flag'];
        for (const field of required) {
            if (features[field] === undefined) {
                return res.status(400).json({ success: false, error: `Missing field: ${field}` });
            }
        }

        const predictions = await predictDemand(features);

        // Add surplus calculation
        const ingredientUsage = computeIngredientUsage(predictions.predictions);
        const surplus = computeSurplus(ingredientUsage);
        const surplusRisk = computeSurplusRisk(surplus);
        const weather = { temperature: features.temperature, rainfall: features.rainfall };
        const decision = makeDecision(surplusRisk, predictions.predictions, surplus, predictions.uncertainty, weather, features.event_flag);

        res.json({
            success: true,
            data: {
                ...predictions,
                ingredientUsage,
                surplus,
                surplusRisk,
                decision
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/simulate-day
app.post('/api/simulate-day', async (req, res) => {
    try {
        const { day = 0, eventFlag = 0 } = req.body;
        const result = await simulateDay(day, null, eventFlag);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/simulate
app.post('/api/simulate', async (req, res) => {
    try {
        const { days = 7, eventDays = [] } = req.body;
        const results = await runSimulation(days, eventDays);
        res.json({ success: true, data: results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/metrics
app.get('/api/metrics', (req, res) => {
    try {
        const metrics = getMetrics();
        const shelter = getShelterStatus();
        res.json({ success: true, data: { metrics, shelter } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/reset
app.post('/api/reset', (req, res) => {
    try {
        resetSimulation();
        res.json({ success: true, message: 'Simulation reset successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`📡 API endpoints:`);
    console.log(`   GET  /api/weather?city=Delhi`);
    console.log(`   POST /api/predict`);
    console.log(`   POST /api/simulate-day`);
    console.log(`   POST /api/simulate`);
    console.log(`   GET  /api/metrics`);
    console.log(`   POST /api/reset`);
});
