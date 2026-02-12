/**
 * Simulation Service v2.0
 * Multi-day simulation with:
 * - Self-organizing feedback loop (adapts cooking multiplier)
 * - Parallel baseline comparison
 * - Comprehensive metrics tracking
 */

const { predictDemand } = require('./predictionService');
const { getCurrentWeather } = require('./weatherService');
const { computeIngredientUsage, computeSurplus, computeSurplusRisk, DEFAULT_INVENTORY } = require('./ingredientMapping');
const { makeDecision, resetShelter } = require('./decisionEngine');
const { BaselineStrategy } = require('./baselineStrategy');

// AI System state
let simulationState = {
    days: [],
    totalWasteReduced: 0,
    totalMealsDonated: 0,
    totalRevenueLoss: 0,
    inventory: { ...DEFAULT_INVENTORY },
    cookingFactor: 1.0,  // Adaptive cooking multiplier
    adaptationHistory: []
};

async function simulateDay(dayNumber, weather = null, eventFlag = 0, cookingFactor = null) {
    const date = new Date();
    date.setDate(date.getDate() + dayNumber);

    const hour = 14; // Peak prediction hour
    const dayOfWeek = date.getDay();

    // Get weather
    const currentWeather = weather || await getCurrentWeather();

    const features = {
        hour,
        day_of_week: dayOfWeek,
        temperature: currentWeather.temperature,
        rainfall: currentWeather.rainfall,
        event_flag: eventFlag
    };

    // Predict demand
    const predictionResult = await predictDemand(features);
    const predictions = predictionResult.predictions;
    const uncertainty = predictionResult.uncertainty;

    // Apply adaptive cooking factor
    const appliedCookingFactor = cookingFactor !== null ? cookingFactor : simulationState.cookingFactor;
    const adjustedPredictions = {};
    for (const [item, value] of Object.entries(predictions)) {
        adjustedPredictions[item] = value * appliedCookingFactor;
    }

    // Compute ingredient usage and surplus
    const ingredientUsage = computeIngredientUsage(adjustedPredictions);
    const surplus = computeSurplus(ingredientUsage, simulationState.inventory);
    const surplusRisk = computeSurplusRisk(surplus, simulationState.inventory);

    // Make decision with enhanced parameters
    const decision = makeDecision(
        surplusRisk,
        adjustedPredictions,
        surplus,
        uncertainty,
        currentWeather,
        eventFlag
    );

    // Simulate actual demand (add realistic noise)
    const actualDemand = {};
    for (const [item, pred] of Object.entries(predictions)) {
        const noise = (Math.random() - 0.5) * pred * 0.2;
        actualDemand[item] = Math.max(0, Math.round(pred + noise));
    }

    // Calculate prediction error for feedback loop
    const totalPredicted = Object.values(predictions).reduce((a, b) => a + b, 0);
    const totalActual = Object.values(actualDemand).reduce((a, b) => a + b, 0);
    const predictionError = totalActual - totalPredicted;

    // FEEDBACK LOOP: Adapt cooking factor based on error
    const oldCookingFactor = simulationState.cookingFactor;
    if (Math.abs(predictionError) > 3) {
        if (predictionError > 0) {
            // Underpredicted → cook more
            simulationState.cookingFactor += 0.05;
        } else {
            // Overpredicted → cook less
            simulationState.cookingFactor -= 0.05;
        }
        // Clamp between 0.8 and 1.2
        simulationState.cookingFactor = Math.max(0.8, Math.min(1.2, simulationState.cookingFactor));
    }

    // Track adaptation
    simulationState.adaptationHistory.push({
        day: dayNumber,
        predictionError: Math.round(predictionError * 10) / 10,
        oldFactor: Math.round(oldCookingFactor * 100) / 100,
        newFactor: Math.round(simulationState.cookingFactor * 100) / 100
    });

    // Update inventory based on actual usage
    const actualUsage = computeIngredientUsage(actualDemand);
    for (const [ing, used] of Object.entries(actualUsage)) {
        simulationState.inventory[ing] = Math.max(0, simulationState.inventory[ing] - used);
    }

    // Calculate metrics
    const wasteKg = decision.redistributionAmount * 0.3;
    simulationState.totalWasteReduced += wasteKg;
    simulationState.totalMealsDonated += decision.redistributionAmount;

    // Revenue calculation
    const PRICES = { burger: 150, fries: 80, wrap: 120, bucket: 350, drink: 40 };
    let dayRevenue = 0;

    // Calculate gross revenue based on actual sales
    for (const [item, actual] of Object.entries(actualDemand)) {
        const produced = adjustedPredictions[item] || 0;
        const sold = Math.min(produced, actual);
        dayRevenue += sold * (PRICES[item] || 100);
    }

    // Apply discount if applicable
    if (decision.action === 'discount') {
        const discountAmount = dayRevenue * 0.2;
        dayRevenue -= discountAmount;
        simulationState.totalRevenueLoss += discountAmount;
    }

    simulationState.totalRevenue += dayRevenue;

    const dayResult = {
        day: dayNumber,
        date: date.toISOString().split('T')[0],
        weather: currentWeather,
        predictions,
        adjustedPredictions,
        actualDemand,
        predictionError: Math.round(predictionError * 10) / 10,
        cookingFactor: Math.round(appliedCookingFactor * 100) / 100,
        surplusRisk,
        decision,
        metricsSnapshot: {
            wasteReduced: Math.round(simulationState.totalWasteReduced * 10) / 10,
            mealsDonated: simulationState.totalMealsDonated,
            revenueLoss: Math.round(simulationState.totalRevenueLoss),
            totalRevenue: Math.round(simulationState.totalRevenue)
        }
    };

    simulationState.days.push(dayResult);
    return dayResult;
}

async function runSimulation(numDays = 7, eventDays = []) {
    resetSimulation();

    // Initialize baseline strategy
    const baseline = new BaselineStrategy();

    const aiResults = [];
    const baselineResults = [];

    for (let i = 0; i < numDays; i++) {
        const eventFlag = eventDays.includes(i) ? 1 : 0;

        // Run AI simulation
        const aiDay = await simulateDay(i, null, eventFlag);
        aiResults.push(aiDay);

        // Run baseline simulation (same actual demand)
        const baselineDay = baseline.simulateDay(i, aiDay.actualDemand);
        baselineResults.push(baselineDay);
    }

    // Get final metrics
    const aiMetrics = getMetrics();
    const baselineMetrics = baseline.getMetrics();

    return {
        days: aiResults,
        baseline: {
            days: baselineResults,
            metrics: baselineMetrics
        },
        summary: {
            totalDays: numDays,
            ai: aiMetrics,
            baseline: baselineMetrics,
            comparison: calculateComparison(aiMetrics, baselineMetrics)
        },
        adaptationHistory: simulationState.adaptationHistory
    };
}

function calculateComparison(aiMetrics, baselineMetrics) {
    // "Food Saved" is strictly what AI redistributed/saved from waste
    // Baseline wastes everything surplus. AI saves surplus via redistribution.
    // So Food Saved = AI Redistributed Amount.
    const foodSavedKg = aiMetrics.wasteReductionKg;

    // Waste Reduction % = (Baseline Waste - AI Waste) / Baseline Waste
    // AI Waste = Baseline Waste (Total Surplus) - Redistribution - DiscountSales(that would be wasted)
    // Actually simpler: Reduction % = (Food Saved) / Baseline Waste
    const wasteReductionPercent = baselineMetrics.totalWasteKg > 0
        ? (foodSavedKg / baselineMetrics.totalWasteKg) * 100
        : 0;

    const mealsDelta = aiMetrics.mealsDonated - baselineMetrics.totalMealsDonated;

    // Revenue Delta: AI Revenue - Baseline Revenue
    const revenueDelta = aiMetrics.totalRevenue - baselineMetrics.totalRevenue;

    return {
        wasteReductionKg: Math.round(foodSavedKg * 10) / 10,
        wasteReductionPercent: Math.round(wasteReductionPercent * 10) / 10,
        mealsDonatedDelta: mealsDelta,
        revenueDelta: Math.round(revenueDelta),
        netSocialValue: (mealsDelta * 100) + revenueDelta // Combined value
    };
}

function calculateWasteReduction() {
    // Estimate baseline waste without system
    const baselineWaste = 500; // kg over simulation period
    const reduction = (simulationState.totalWasteReduced / baselineWaste) * 100;
    return Math.round(reduction * 10) / 10;
}

function calculateAvgRisk() {
    if (simulationState.days.length === 0) return 0;
    const totalRisk = simulationState.days.reduce((sum, day) => sum + day.surplusRisk, 0);
    return Math.round((totalRisk / simulationState.days.length) * 1000) / 1000;
}

function resetSimulation() {
    simulationState = {
        days: [],
        totalWasteReduced: 0,
        totalMealsDonated: 0,
        totalRevenueLoss: 0,
        inventory: { ...DEFAULT_INVENTORY },
        cookingFactor: 1.0,
        adaptationHistory: []
    };
    resetShelter();
}

function getMetrics() {
    return {
        wasteReductionKg: Math.round(simulationState.totalWasteReduced * 10) / 10,
        mealsDonated: simulationState.totalMealsDonated,
        revenueLoss: Math.round(simulationState.totalRevenueLoss),
        totalRevenue: Math.round(simulationState.totalRevenue),
        wasteReductionPercent: calculateWasteReduction(),
        avgSurplusRisk: calculateAvgRisk(),
        daysSimulated: simulationState.days.length,
        finalCookingFactor: Math.round(simulationState.cookingFactor * 100) / 100,
        adaptationCount: simulationState.adaptationHistory.filter(h => h.oldFactor !== h.newFactor).length,
        carbonSavedKg: Math.round(simulationState.totalWasteReduced * 2.5 * 10) / 10 // 2.5kg CO2e per kg food waste
    };
}

module.exports = {
    simulateDay,
    runSimulation,
    getMetrics,
    resetSimulation
};
