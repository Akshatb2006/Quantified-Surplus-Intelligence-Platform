/**
 * Ingredient Mapping & Surplus Calculation
 * Converts item predictions to ingredient-level usage and computes surplus risk
 */

const INGREDIENT_MAP = {
    burger: { bun: 1, patty: 1, lettuce: 20, tomato: 15 },
    fries: { potato: 150 },
    wrap: { tortilla: 1, chicken: 80, lettuce: 30, sauce: 20 },
    bucket: { chicken: 600 },
    drink: { syrup: 50, water: 300, ice: 100 }
};

// Default inventory (in grams or units)
const DEFAULT_INVENTORY = {
    bun: 500, patty: 500, lettuce: 10000, tomato: 5000,
    potato: 50000, tortilla: 300, chicken: 30000,
    sauce: 5000, syrup: 10000, water: 100000, ice: 20000
};

// Expiry urgency (hours remaining, 0-1 scale)
const EXPIRY_WEIGHTS = {
    bun: 0.8, patty: 0.9, lettuce: 0.7, tomato: 0.6,
    potato: 0.5, tortilla: 0.7, chicken: 0.9,
    sauce: 0.3, syrup: 0.2, water: 0.1, ice: 0.1
};

function computeIngredientUsage(predictions) {
    const usage = {};

    for (const [item, quantity] of Object.entries(predictions)) {
        const ingredients = INGREDIENT_MAP[item];
        if (!ingredients) continue;

        for (const [ing, amount] of Object.entries(ingredients)) {
            usage[ing] = (usage[ing] || 0) + quantity * amount;
        }
    }

    return usage;
}

function computeSurplus(predictedUsage, inventory = DEFAULT_INVENTORY) {
    const surplus = {};

    for (const [ing, qty] of Object.entries(inventory)) {
        const predicted = predictedUsage[ing] || 0;
        surplus[ing] = Math.max(0, qty - predicted);
    }

    return surplus;
}

function computeSurplusRisk(surplus, inventory = DEFAULT_INVENTORY) {
    let totalRisk = 0;
    let count = 0;

    for (const [ing, surplusQty] of Object.entries(surplus)) {
        const totalQty = inventory[ing] || 1;
        const ratio = surplusQty / totalQty;
        const urgency = EXPIRY_WEIGHTS[ing] || 0.5;
        const risk = ratio * urgency;

        totalRisk += risk;
        count++;
    }

    return count > 0 ? totalRisk / count : 0;
}

module.exports = {
    INGREDIENT_MAP,
    DEFAULT_INVENTORY,
    EXPIRY_WEIGHTS,
    computeIngredientUsage,
    computeSurplus,
    computeSurplusRisk
};
