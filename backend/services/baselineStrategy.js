/**
 * Baseline Strategy Service
 * Simulates traditional "dumb" approach without AI/weather awareness
 * Used for comparison to quantify AI system impact
 */

const { DEFAULT_INVENTORY } = require('./ingredientMapping');

// Historical averages (fixed production, no adaptation)
const HISTORICAL_AVERAGES = {
    burger: 15,
    fries: 20,
    wrap: 10,
    bucket: 8,
    drink: 25
};

class BaselineStrategy {
    constructor() {
        this.inventory = { ...DEFAULT_INVENTORY };
        this.totalWaste = 0;
        this.totalRevenueLoss = 0;
        this.totalRevenue = 0;
        this.days = [];
    }

    simulateDay(dayNumber, actualDemand) {
        // Baseline: Always produce historical average (no weather, no events)
        const production = { ...HISTORICAL_AVERAGES };

        // Calculate waste: production - actual demand
        const waste = {};
        let dayWaste = 0;

        for (const item in production) {
            const produced = production[item];
            const actual = actualDemand[item] || 0;
            const itemWaste = Math.max(0, produced - actual);
            waste[item] = itemWaste;

            // Assume 100g per item average
            dayWaste += itemWaste * 0.1; // kg
        }

        // Waste accumulated in the block below (line ~60)

        // Baseline has NO redistribution (all waste goes to trash)
        // Baseline has NO discounting (fixed pricing)

        const dayResult = {
            day: dayNumber,
            production,
            actualDemand,
            waste,
            wasteKg: dayWaste,
            mealsDonated: 0,
            discountRevenueLoss: 0,
            revenue: this.calculateRevenue(production, actualDemand)
        };

        this.totalWaste += dayWaste;
        this.totalRevenue += dayResult.revenue;

        this.days.push(dayResult);
        return dayResult;
    }

    calculateRevenue(production, actualDemand) {
        let revenue = 0;
        const PRICES = { burger: 150, fries: 80, wrap: 120, bucket: 350, drink: 40 };
        for (const item in production) {
            const sold = Math.min(production[item], actualDemand[item] || 0);
            revenue += sold * (PRICES[item] || 100);
        }
        return revenue;
    }

    getMetrics() {
        return {
            totalWasteKg: Math.round(this.totalWaste * 10) / 10,
            totalMealsDonated: 0,
            revenueLoss: 0,
            totalRevenue: Math.round(this.totalRevenue),
            avgDailyWaste: this.days.length > 0
                ? Math.round((this.totalWaste / this.days.length) * 10) / 10
                : 0
        };
    }

    reset() {
        this.inventory = { ...DEFAULT_INVENTORY };
        this.totalWaste = 0;
        this.totalRevenueLoss = 0;
        this.totalRevenue = 0;
        this.days = [];
    }
}

module.exports = { BaselineStrategy, HISTORICAL_AVERAGES };
