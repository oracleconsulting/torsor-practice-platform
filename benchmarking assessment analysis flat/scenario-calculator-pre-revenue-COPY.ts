// ============================================================================
// PRE-REVENUE SCENARIO CALCULATORS
// Deterministic financial scenario modelling for pre-revenue/early-revenue
// businesses. No LLM calls — pure arithmetic.
// ============================================================================

export interface PreRevenueScenarioResult {
  scenarioName: string;
  inputs: Record<string, number | string>;
  outputs: Record<string, number | string>;
  valuationImpact?: { current: number; projected: number; delta: number };
  summary: string;
  methodology: string;
}

export interface RoundDefinition {
  name: string;
  amount: number;
  preMoneyValuation: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Pipeline Conversion Scenario
// ─────────────────────────────────────────────────────────────────────────────

export function calculatePipelineConversionScenario(
  pipelineAcv: number,
  conversionRates: number[],
  arrMultiple: number,
): PreRevenueScenarioResult[] {
  return conversionRates.map((rate) => {
    const achievedARR = pipelineAcv * (rate / 100);
    const valuation = achievedARR * arrMultiple;

    return {
      scenarioName: `Pipeline at ${rate}% conversion`,
      inputs: {
        pipelineAcv,
        conversionRate: rate,
        arrMultiple,
      },
      outputs: {
        achievedARR,
        impliedValuation: valuation,
      },
      valuationImpact: {
        current: 0,
        projected: valuation,
        delta: valuation,
      },
      summary: `At ${rate}% conversion of your £${pipelineAcv.toLocaleString()} qualified pipeline, you'd achieve £${achievedARR.toLocaleString()} ARR, valued at £${valuation.toLocaleString()}.`,
      methodology:
        'achievedARR = pipelineAcv × conversionRate; valuation = achievedARR × arrMultiple',
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Contract Term Scenario
// ─────────────────────────────────────────────────────────────────────────────

export function calculateContractTermScenario(
  currentArr: number,
  arrMultiple: number,
  termYearsOptions: number[],
): PreRevenueScenarioResult[] {
  return termYearsOptions.map((term) => {
    const rawMultiple = arrMultiple * (1 + (term - 1) * 0.15);
    const adjustedMultiple = Math.min(rawMultiple, arrMultiple * 2);
    const currentValuation = currentArr * arrMultiple;
    const projectedValuation = currentArr * adjustedMultiple;

    return {
      scenarioName: `${term}-year contracts`,
      inputs: {
        currentArr,
        baseMultiple: arrMultiple,
        termYears: term,
      },
      outputs: {
        adjustedMultiple: Math.round(adjustedMultiple * 100) / 100,
        projectedValuation,
      },
      valuationImpact: {
        current: currentValuation,
        projected: projectedValuation,
        delta: projectedValuation - currentValuation,
      },
      summary: `Shifting to ${term}-year contracts would lift your effective multiple from ${arrMultiple.toFixed(1)}x to ${adjustedMultiple.toFixed(1)}x.`,
      methodology:
        'adjustedMultiple = baseMultiple × (1 + (termYears - 1) × 0.15), capped at 2× base',
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. NRR Compounding Scenario
// ─────────────────────────────────────────────────────────────────────────────

export function calculateNrrCompoundingScenario(
  startingArr: number,
  nrrPcts: number[],
  years: number,
  arrMultiple: number,
): PreRevenueScenarioResult[] {
  return nrrPcts.map((nrr) => {
    const compoundedArr = startingArr * Math.pow(nrr / 100, years);
    const currentValuation = startingArr * arrMultiple;
    const projectedValuation = compoundedArr * arrMultiple;

    return {
      scenarioName: `NRR ${nrr}% over ${years} years`,
      inputs: {
        startingArr,
        nrrPct: nrr,
        years,
        arrMultiple,
      },
      outputs: {
        compoundedArr: Math.round(compoundedArr),
        projectedValuation: Math.round(projectedValuation),
      },
      valuationImpact: {
        current: currentValuation,
        projected: Math.round(projectedValuation),
        delta: Math.round(projectedValuation - currentValuation),
      },
      summary: `At ${nrr}% NRR, your £${startingArr.toLocaleString()} ARR compounds to £${Math.round(compoundedArr).toLocaleString()} over ${years} years.`,
      methodology: 'compoundedArr = startingArr × (nrr/100)^years; valuation = compoundedArr × arrMultiple',
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Pricing Tier Mix Scenario
// ─────────────────────────────────────────────────────────────────────────────

export function calculatePricingTierMixScenario(
  totalLogos: number,
  mixOptions: Array<{ enterprise: number; midMarket: number; smb: number }>,
  acvByTier: { enterprise: number; midMarket: number; smb: number },
  arrMultiple: number,
): PreRevenueScenarioResult[] {
  return mixOptions.map((mix, idx) => {
    const blendedAcv =
      (mix.enterprise / 100) * acvByTier.enterprise +
      (mix.midMarket / 100) * acvByTier.midMarket +
      (mix.smb / 100) * acvByTier.smb;

    const totalArr = totalLogos * blendedAcv;
    const valuation = totalArr * arrMultiple;

    return {
      scenarioName: `Mix ${idx + 1}: ${mix.enterprise}% Ent / ${mix.midMarket}% MM / ${mix.smb}% SMB`,
      inputs: {
        totalLogos,
        enterprisePct: mix.enterprise,
        midMarketPct: mix.midMarket,
        smbPct: mix.smb,
        acvEnterprise: acvByTier.enterprise,
        acvMidMarket: acvByTier.midMarket,
        acvSmb: acvByTier.smb,
        arrMultiple,
      },
      outputs: {
        blendedAcv: Math.round(blendedAcv),
        totalArr: Math.round(totalArr),
        impliedValuation: Math.round(valuation),
      },
      valuationImpact: {
        current: 0,
        projected: Math.round(valuation),
        delta: Math.round(valuation),
      },
      summary: `With ${totalLogos} logos at a blended ACV of £${Math.round(blendedAcv).toLocaleString()}, total ARR reaches £${Math.round(totalArr).toLocaleString()}, valued at £${Math.round(valuation).toLocaleString()}.`,
      methodology:
        'blendedAcv = Σ(tierPct × acvByTier[tier]); totalArr = totalLogos × blendedAcv; valuation = totalArr × arrMultiple',
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Dilution Waterfall Scenario
// ─────────────────────────────────────────────────────────────────────────────

export function calculateDilutionWaterfallScenario(
  currentOwnershipPct: number,
  rounds: RoundDefinition[],
): PreRevenueScenarioResult {
  let ownership = currentOwnershipPct;
  const steps: Array<{ round: string; dilution: number; ownershipAfter: number }> = [];

  for (const round of rounds) {
    const preDilution = ownership;
    ownership = ownership * (round.preMoneyValuation / (round.preMoneyValuation + round.amount));
    const dilution = preDilution - ownership;
    steps.push({
      round: round.name,
      dilution: Math.round(dilution * 100) / 100,
      ownershipAfter: Math.round(ownership * 100) / 100,
    });
  }

  const totalDilution = currentOwnershipPct - ownership;

  return {
    scenarioName: 'Dilution waterfall',
    inputs: {
      startingOwnership: currentOwnershipPct,
      numberOfRounds: rounds.length,
    },
    outputs: {
      finalOwnership: Math.round(ownership * 100) / 100,
      totalDilution: Math.round(totalDilution * 100) / 100,
      steps: JSON.stringify(steps),
    },
    summary: `Starting at ${currentOwnershipPct}% ownership, after ${rounds.length} rounds you retain ${(Math.round(ownership * 100) / 100).toFixed(1)}% (diluted ${(Math.round(totalDilution * 100) / 100).toFixed(1)} percentage points).`,
    methodology:
      'ownershipAfterRound = prevOwnership × (preMoneyVal / (preMoneyVal + roundAmount))',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Time-to-Exit Sensitivity Scenario
// ─────────────────────────────────────────────────────────────────────────────

export function calculateTimeToExitSensitivityScenario(
  targetExitValue: number,
  horizonOptions: number[],
  irrTarget: number,
  dilutionToExit: number,
): PreRevenueScenarioResult[] {
  return horizonOptions.map((horizon) => {
    const todayPostMoney =
      targetExitValue / Math.pow(1 + irrTarget, horizon) / (1 - dilutionToExit);

    return {
      scenarioName: `${horizon}-year exit horizon`,
      inputs: {
        targetExitValue,
        horizonYears: horizon,
        irrTarget,
        dilutionToExit,
      },
      outputs: {
        impliedPostMoney: Math.round(todayPostMoney),
        impliedPreMoney: Math.round(todayPostMoney * (1 - dilutionToExit)),
      },
      valuationImpact: {
        current: Math.round(todayPostMoney),
        projected: targetExitValue,
        delta: targetExitValue - Math.round(todayPostMoney),
      },
      summary: `Hitting your £${targetExitValue.toLocaleString()} exit in ${horizon} years implies a pre-money of £${Math.round(todayPostMoney).toLocaleString()} today.`,
      methodology:
        'todayPostMoney = targetExitValue / (1 + irrTarget)^horizon / (1 - dilutionToExit)',
    };
  });
}
