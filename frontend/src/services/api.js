/**
 * API Service Layer
 * Handles all backend communication
 */

const API_BASE = 'http://localhost:5000/api';

export const api = {
    async getWeather(city = 'Delhi') {
        const response = await fetch(`${API_BASE}/weather?city=${city}`);
        const data = await response.json();
        if (!data.success) throw new Error(data.error);
        return data.data;
    },

    async predict(features) {
        const response = await fetch(`${API_BASE}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(features)
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.error);
        return data.data;
    },

    async simulateDay(day, eventFlag = 0) {
        const response = await fetch(`${API_BASE}/simulate-day`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ day, eventFlag })
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.error);
        return data.data;
    },

    async runSimulation(days, eventDays = []) {
        const response = await fetch(`${API_BASE}/simulate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ days, eventDays })
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.error);
        return data.data;
    },

    async getMetrics() {
        const response = await fetch(`${API_BASE}/metrics`);
        const data = await response.json();
        if (!data.success) throw new Error(data.error);
        return data.data;
    },

    async reset() {
        const response = await fetch(`${API_BASE}/reset`, {
            method: 'POST'
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.error);
        return data;
    }
};
