/**
 * Food Safety Service
 * Implements regulatory standards and thermal decay modeling
 * Based on FSSAI/USDA guidelines for safe food handling
 */

// Shelf life in hours at standard refrigeration (4°C)
const BASE_SHELF_LIFE = {
    chicken: 48,
    dairy: 72,      // cheese, milk-based sauces
    vegetables: 120, // lettuce, tomato (cut)
    cooked_meat: 72, // patty
    bread: 120      // bun
};

// Temperature thresholds (Celsius)
const TEMP_ZONES = {
    FREEZING: -18,
    REFRIGERATED_MIN: 0,
    REFRIGERATED_MAX: 4,
    DANGER_MIN: 5,
    DANGER_MAX: 60
};

function calculateTempStress(ambientTemp) {
    if (ambientTemp > 35) return 2.5; // Extreme heat
    if (ambientTemp > 30) return 2.0; // High heat
    if (ambientTemp > 25) return 1.5; // Warm
    if (ambientTemp > 20) return 1.2; // Room temp
    return 1.0; // Cool/Standard
}

function calculateSpoilageRisk(ingredient, ambientTemp) {
    const category = mapIngredientToCategory(ingredient);
    const baseHours = BASE_SHELF_LIFE[category] || 72;

    // Effective shelf life reduces as stress increases
    const stressIndex = calculateTempStress(ambientTemp);
    const effectiveHours = Math.round(baseHours / stressIndex);

    let riskLevel = 'LOW';
    if (effectiveHours < 12) riskLevel = 'CRITICAL';
    else if (effectiveHours < 24) riskLevel = 'HIGH';
    else if (effectiveHours < 48) riskLevel = 'MEDIUM';

    // Check Danger Zone: 5°C to 60°C
    const isDangerZone = ambientTemp >= TEMP_ZONES.DANGER_MIN && ambientTemp <= TEMP_ZONES.DANGER_MAX;

    // Estimate frozen food temperature based on ambient temperature
    // Assuming a standard freezer target of -18°C with thermal ingress factor
    let estimatedFrozenTemp = -18;
    if (ambientTemp > -18) {
        estimatedFrozenTemp += (ambientTemp + 18) * 0.1; // 10% thermal exposure factor
    }
    estimatedFrozenTemp = Math.round(estimatedFrozenTemp * 10) / 10;

    return {
        ambientTemp,
        estimatedFrozenTemp,
        originalHours: baseHours,
        effectiveHours,
        stressIndex,
        riskLevel,
        isDangerZone,
        category
    };
}

function mapIngredientToCategory(ingredient) {
    if (['chicken', 'meat', 'patty'].includes(ingredient)) return 'chicken';
    if (['cheese', 'milk', 'sauce'].includes(ingredient)) return 'dairy';
    if (['lettuce', 'tomato', 'potato'].includes(ingredient)) return 'vegetables';
    if (['bun', 'tortilla'].includes(ingredient)) return 'bread';
    return 'vegetables';
}

function getLogisticsRecommendation(surplusRisk, spoilageInfo) {
    const recs = [];

    if (spoilageInfo.isDangerZone) {
        recs.push(`⚠️ WARNING: Ambient temp ${surplusRisk.temperature}°C is in Danger Zone.`);
    }

    if (spoilageInfo.riskLevel === 'CRITICAL') {
        recs.push(`❄️ CRITICAL: Effective shelf life dropped to ${spoilageInfo.effectiveHours}h.`);
        recs.push(`🚛 Action: Cold chain dispatch required within 2 hours.`);
    } else if (spoilageInfo.riskLevel === 'HIGH') {
        const reduction = (100 * (1 - 1 / spoilageInfo.stressIndex)).toFixed(0);
        recs.push(`🧊 HIGH RISK: Heat stress reduces life by ${reduction}%. Expedite.`);
    }

    return recs;
}

module.exports = {
    calculateTempStress,
    calculateSpoilageRisk,
    getLogisticsRecommendation,
    BASE_SHELF_LIFE,
    TEMP_ZONES
};
