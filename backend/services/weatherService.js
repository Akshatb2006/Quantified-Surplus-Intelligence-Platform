/**
 * Weather Service
 * Fetches current weather from OpenWeatherMap API with simulated fallback
 */

const axios = require('axios');

const API_KEY = process.env.OPENWEATHER_API_KEY || null;
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

async function getCurrentWeather(city = 'Delhi') {
    // If API key exists, try real API
    if (API_KEY) {
        try {
            const response = await axios.get(BASE_URL, {
                params: {
                    q: city,
                    appid: API_KEY,
                    units: 'metric'
                },
                timeout: 5000
            });

            const data = response.data;
            return {
                temperature: Math.round(data.main.temp * 10) / 10,
                rainfall: data.rain?.['1h'] || 0,
                description: data.weather[0]?.description || 'clear',
                city: data.name,
                source: 'api'
            };
        } catch (error) {
            console.warn('⚠️  OpenWeather API failed, using simulated data:', error.message);
        }
    }

    // Fallback: simulated weather
    const hour = new Date().getHours();
    const baseTemp = 25 + 10 * Math.sin(2 * Math.PI * new Date().getDay() / 365);
    const hourOffset = -5 * Math.cos(2 * Math.PI * (hour - 14) / 24);
    const temperature = Math.round((baseTemp + hourOffset + (Math.random() - 0.5) * 4) * 10) / 10;

    const rainProb = Math.random();
    const rainfall = rainProb < 0.2 ? Math.round(Math.random() * 5 * 10) / 10 : 0;

    return {
        temperature,
        rainfall,
        description: rainfall > 0 ? 'light rain' : 'clear sky',
        city: city || 'Delhi',
        source: 'simulated'
    };
}

module.exports = { getCurrentWeather };
