/**
 * Decision Engine v2.0
 * Dynamic optimization with expected value calculations
 * Uncertainty-driven decisions + equity scoring
 */

const { calculateSpoilageRisk, getLogisticsRecommendation } = require('./foodSafetyService');

const SHELTER = {
    capacity: 100,  // meals per day
    baseNeedScore: 0.7,
    currentOccupancy: 65,
    mealsProvided: 0,
    wasteReduced: 0
};

// Economic parameters (in INR)
const COSTS = {
    wasteDisposal: 50,      // per kg
    avgMealPrice: 150,      // avg price per item
    transportCost: 500,     // fixed cost for redistribution
    socialValue: 100        // social benefit per meal donated
};

/**
 * Calculate shelter need score based on context
 */
function calculateShelterNeed(weather, eventFlag) {
    let needScore = SHELTER.baseNeedScore;

    // Rain increases shelter need (more people seek shelter)
    if (weather && weather.rainfall > 2) {
        needScore += 0.1;
    }

    // Events may increase need
    if (eventFlag === 1) {
        needScore += 0.05;
    }

    // Occupancy increases urgency
    const occupancyRate = SHELTER.currentOccupancy / SHELTER.capacity;
    if (occupancyRate > 0.8) {
        needScore += 0.1;
    }

    return Math.min(needScore, 1.0);
}

/**
 * Calculate expected costs for each action
 */
function calculateExpectedCosts(surplusRisk, predictions, surplus, uncertainty) {
    const avgUncertainty = Object.values(uncertainty).reduce((a, b) => a + b, 0) / Object.keys(uncertainty).length;

    // Total demand to work with
    const totalDemand = Object.values(predictions).reduce((a, b) => a + b, 0);

    // Estimate surplus in kg (rough conversion: item surplus × 0.1 kg average)
    const totalSurplusKg = Object.values(surplus)
        .filter((_, idx) => ['chicken', 'potato', 'patty'].includes(Object.keys(surplus)[idx]))
        .reduce((a, b) => a + b, 0) / 1000; // grams to kg

    // Expected waste cost (do nothing)
    const expectedWasteCost = totalSurplusKg * COSTS.wasteDisposal;

    // Expected discount loss (apply 20% discount)
    const discountRate = 0.20;
    const expectedDiscountLoss = totalDemand * COSTS.avgMealPrice * discountRate;

    // Expected redistribution net benefit
    const redistributeAmount = Math.min(
        Math.round(totalDemand * surplusRisk),
        SHELTER.capacity
    );
    const redistributeBenefit = redistributeAmount * COSTS.socialValue;
    const redistributeCost = COSTS.transportCost;
    const expectedRedistributeNet = redistributeBenefit - redistributeCost;

    return {
        waste: Math.round(expectedWasteCost),
        discount: Math.round(expectedDiscountLoss),
        redistribute: Math.round(-expectedRedistributeNet), // negative = benefit
        details: {
            surplusKg: Math.round(totalSurplusKg * 10) / 10,
            redistributeAmount,
            avgUncertainty: Math.round(avgUncertainty * 100) / 100
        }
    };
}

/**
 * Calculate uncertainty-driven adjustments
 */
function calculateUncertaintyAdjustments(uncertainty) {
    const avgUncertainty = Object.values(uncertainty).reduce((a, b) => a + b, 0) / Object.keys(uncertainty).length;

    // Normalized uncertainty (0-1 scale, where 2.0 is high)
    const uncertaintyFactor = Math.min(avgUncertainty / 2.0, 1.0);

    // High uncertainty → be conservative
    const batchMultiplier = 1.0 - (uncertaintyFactor * 0.15); // reduce up to 15%
    const redistributionBuffer = 1.0 + (uncertaintyFactor * 0.25); // increase up to 25%
    const discountThreshold = 0.3 - (uncertaintyFactor * 0.1); // lower threshold

    return {
        batchMultiplier: Math.round(batchMultiplier * 100) / 100,
        redistributionBuffer: Math.round(redistributionBuffer * 100) / 100,
        discountThreshold: Math.round(discountThreshold * 100) / 100,
        reason: uncertaintyFactor > 0.6
            ? `High uncertainty (σ=${avgUncertainty.toFixed(1)}) → conservative approach`
            : `Normal uncertainty (σ=${avgUncertainty.toFixed(1)}) → standard operations`,
        uncertaintyLevel: uncertaintyFactor > 0.6 ? 'high' : (uncertaintyFactor > 0.3 ? 'medium' : 'low')
    };
}

/**
 * Main decision function with expected value optimization AND food safety logic
 */
function makeDecision(surplusRisk, predictions, surplus, uncertainty = {}, weather = null, eventFlag = 0) {
    // Calculate shelter need and priority score
    const shelterNeed = calculateShelterNeed(weather, eventFlag);
    const priorityScore = surplusRisk * shelterNeed;

    // Calculate expected costs
    const expectedCosts = calculateExpectedCosts(surplusRisk, predictions, surplus, uncertainty);

    // Calculate uncertainty adjustments
    const uncertaintyAdjustment = calculateUncertaintyAdjustments(uncertainty);

    // --- FOOD SAFETY & SPOILAGE LOGIC ---
    const ambientTemp = weather ? weather.temperature : 25;
    // Assess risk for representative high-risk item
    const criticalItem = 'chicken';
    const spoilageInfo = calculateSpoilageRisk(criticalItem, ambientTemp);

    // Choose action with minimum expected loss
    // --- CASCADING SURPLUS VALUE EXTRACTION (CSVE) ---
    // Calculate tiered value: Revenue -> Redistribution -> Buffer
    const csveResult = calculateCSVE(surplusRisk, predictions, surplus, expectedCosts);

    // Compare with other strategies
    // We prioritize CSVE if it offers a balanced approach with revenue recovery AND social impact
    // unless strictly cost-prohibitive (which is unlikely given revenue recovery)

    // Default to normal
    let chosenAction = 'normal';
    let maxNetValue = -expectedCosts.waste; // Baseline is negative cost of waste

    // Value of Redistribution (Social Value - Cost)
    const redistributeNetValue = -expectedCosts.redistribute;

    // Value of Discount (Revenue Recaptured - Discount Loss) - simpler proxy:
    // Actually expectedCosts.discount is just the LOSS.
    // Revenue = TotalPotential - DiscountLoss.
    // We need to compare "Benefit over Baseline".

    // Let's use the explicit expected costs for comparison as before, but add CSVE
    // CSVE Net Value = Revenue - TransportCost + SocialValue

    // CSVE is usually superior because it captures revenue AND social value.
    if (csveResult.netValue > redistributeNetValue && csveResult.netValue > -expectedCosts.waste) {
        chosenAction = 'cascading';
    } else if (expectedCosts.redistribute < expectedCosts.waste && expectedCosts.redistribute < expectedCosts.discount) {
        chosenAction = 'redistribute';
    } else if (expectedCosts.discount < expectedCosts.waste) {
        chosenAction = 'discount';
    }

    // OVERRIDE: Critical Food Safety Risk
    // If heat stress is high, we MUST redistribute or freeze. 
    if (spoilageInfo.riskLevel === 'CRITICAL' || spoilageInfo.riskLevel === 'HIGH') {
        if (chosenAction !== 'redistribute' && chosenAction !== 'cascading') {
            // If CSVE can handle the risk (fast dispatch), keep it, otherwise fall back to pure redistribute
            // For now, let's say CSVE allows for expedited redistribution of the donation tier.
            // But if CRITICAL, maybe we skip the discount tier? 
            // Let's force redistribute for CRITICAL to be safe, or allow CSVE if it has high redistribution.
            if (spoilageInfo.riskLevel === 'CRITICAL') {
                chosenAction = 'redistribute';
            } else {
                chosenAction = 'cascading'; // Try to sell some, donate rest quickly
            }
        }
    }

    // Build decision object
    const decision = {
        action: chosenAction,
        actionLabel: '',
        color: '',
        discountPercent: 0,
        redistributionAmount: 0,
        reason: '',
        surplusRisk: Math.round(surplusRisk * 1000) / 1000,
        expectedCosts,
        chosenStrategy: '',
        uncertaintyAdjustment,
        equityMetrics: {
            shelterNeed: Math.round(shelterNeed * 100) / 100,
            priorityScore: Math.round(priorityScore * 100) / 100,
            socialImpact: priorityScore > 0.5 ? 'High' : (priorityScore > 0.3 ? 'Medium' : 'Low')
        },
        foodSafety: spoilageInfo,
        csve: csveResult // Attach CSVE details
    };

    // Set action-specific details
    if (chosenAction === 'cascading') {
        decision.actionLabel = 'Cascading Value Extraction';
        decision.color = 'purple'; // Premium/Profit color
        decision.reason = `CSVE Optimization: Recover ₹${csveResult.tiers.revenue.value} revenue + Donate ${csveResult.tiers.redistribution.count} meals.`;
        decision.chosenStrategy = `Multi-tier approach maximizes economic & social returns.`;
        decision.redistributionAmount = csveResult.tiers.redistribution.count;
    } else if (chosenAction === 'redistribute') {
        decision.actionLabel = 'Redistribute to Shelter';
        decision.color = 'blue';
        decision.redistributionAmount = expectedCosts.details.redistributeAmount > 0 ? expectedCosts.details.redistributeAmount : 50;

        if (spoilageInfo.riskLevel === 'CRITICAL' || spoilageInfo.riskLevel === 'HIGH') {
            decision.reason = `⚠️ SAFETY ALERT: High heat (${ambientTemp}°C) requires immediate redistribution.`;
            decision.chosenStrategy = `Heat Index ${spoilageInfo.stressIndex}x forces Cold Chain protocol.`;
            decision.color = 'purple';
        } else {
            decision.reason = `Expected value optimization: Redistribution provides best outcome (net benefit ₹${Math.abs(expectedCosts.redistribute)}).`;
            decision.chosenStrategy = `Waste cost (₹${expectedCosts.waste}) > Redistribution benefit. Priority score: ${decision.equityMetrics.priorityScore.toFixed(2)}`;
        }

        // Apply to shelter
        SHELTER.mealsProvided += decision.redistributionAmount;
        SHELTER.wasteReduced += decision.redistributionAmount * 0.3;

    } else if (chosenAction === 'discount') {
        decision.actionLabel = 'Apply Discount';
        decision.color = 'orange';
        decision.discountPercent = 20;
        decision.reason = `Expected value optimization: 20% discount minimizes loss (₹${expectedCosts.discount}).`;
        decision.chosenStrategy = `Discount loss (₹${expectedCosts.discount}) < Waste cost (₹${expectedCosts.waste})`;

    } else {
        decision.actionLabel = 'Normal Operation';
        decision.color = 'green';
        decision.reason = `Low surplus risk and costs justify normal operations.`;
        decision.chosenStrategy = `All scenarios have minimal expected cost. Continue normal pricing.`;
    }

    // Add recommendations
    decision.recommendations = generateRecommendations(decision, uncertaintyAdjustment);

    // Add Food Safety Recommendations
    const safetyRecs = getLogisticsRecommendation({ temperature: ambientTemp }, spoilageInfo);
    decision.recommendations = [...decision.recommendations, ...safetyRecs];

    return decision;
}

function generateRecommendations(decision, uncertaintyAdj) {
    const recs = [];

    if (decision.action === 'cascading') {
        recs.push(`💰 Revenue: Sell ${decision.csve.tiers.revenue.count} items @ 20% off`);
        recs.push(`🚛 Redistribute: ${decision.csve.tiers.redistribution.count} meals (Pickup 2PM)`);
        recs.push(`🛡️ Buffer: Keep ${decision.csve.tiers.buffer.count} items for late rush`);
        recs.push(`Net Value: ₹${decision.csve.netValue} (vs ₹${-decision.expectedCosts.waste} if wasted)`);
    } else if (decision.action === 'redistribute') {
        recs.push(`Contact shelter for immediate pickup of ${decision.redistributionAmount} meals`);
        recs.push(`Estimated social value: ₹${decision.redistributionAmount * COSTS.socialValue}`);
        if (decision.equityMetrics.priorityScore > 0.6) {
            recs.push(`🔴 High priority: Shelter need score is ${decision.equityMetrics.shelterNeed}`);
        }
    } else if (decision.action === 'discount') {
        recs.push(`Apply 20% discount to accelerate sales`);
        recs.push(`Monitor sales velocity for next 2 hours`);
    } else {
        recs.push(`Continue standard operations`);
        recs.push(`Stock levels optimal for predicted demand`);
    }

    // Add uncertainty-driven recommendations
    if (uncertaintyAdj.uncertaintyLevel === 'high') {
        recs.push(`⚠️ High uncertainty: Reduce batch size to ${(uncertaintyAdj.batchMultiplier * 100).toFixed(0)}%`);
    }

    return recs;
}

function getShelterStatus() {
    return { ...SHELTER };
}

function resetShelter() {
    SHELTER.mealsProvided = 0;
    SHELTER.wasteReduced = 0;
    SHELTER.currentOccupancy = 65;
}

/**
 * Calculate Cascading Surplus Value Extraction (CSVE)
 * Tier 1: Revenue Recovery (Discount)
 * Tier 2: Redistribution (Charity)
 * Tier 3: Operational Buffer
 */
function calculateCSVE(surplusRisk, predictions, surplus, expectedCosts) {
    // Total potential surplus items (approx based on risk)
    const totalDemand = Object.values(predictions).reduce((a, b) => a + b, 0);
    const estimatedSurplusItems = Math.round(totalDemand * surplusRisk);

    // PARAMETERS
    const REVENUE_CONVERSION_RATE = 0.40; // Sell 40% of surplus
    const BUFFER_RATE = 0.10; // Keep 10%
    const REDISTRIBUTION_RATE = 0.50; // Donate 50%
    const DISCOUNT_PCT = 0.20; // 20% off

    // Tier 1: Revenue Recovery
    const revenueItems = Math.floor(estimatedSurplusItems * REVENUE_CONVERSION_RATE);
    const discountedPrice = COSTS.avgMealPrice * (1 - DISCOUNT_PCT);
    const revenueValue = revenueItems * discountedPrice;

    // Tier 2: Redistribution
    const redistributionItems = Math.floor(estimatedSurplusItems * REDISTRIBUTION_RATE);
    const socialValue = redistributionItems * COSTS.socialValue;

    // Tier 3: Buffer
    const bufferItems = Math.max(0, estimatedSurplusItems - revenueItems - redistributionItems);

    // Net Value Calculation
    // Benefit: Revenue + Social Value + (Avoided Waste Cost on donated+sold items)
    // Cost: Transport for donation
    // Baseline is "Waste All" -> Pay disposal for all.
    // Here we strictly calculate the "Active Value" generated.

    const transportCost = redistributionItems > 0 ? COSTS.transportCost : 0;
    const netValue = revenueValue + socialValue - transportCost;

    return {
        totalSurplus: estimatedSurplusItems,
        netValue: Math.round(netValue),
        tiers: {
            revenue: {
                count: revenueItems,
                value: Math.round(revenueValue),
                label: 'Flash Discount'
            },
            redistribution: {
                count: redistributionItems,
                value: Math.round(socialValue),
                label: 'Shelter Commit'
            },
            buffer: {
                count: bufferItems,
                label: 'Safety Stock'
            }
        }
    };
}

module.exports = {
    makeDecision,
    getShelterStatus,
    resetShelter,
    COSTS
};
