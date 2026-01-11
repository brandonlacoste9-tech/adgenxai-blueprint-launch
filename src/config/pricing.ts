// =====================================================
// ADGENXAI PREDATORY PRICING ARCHITECTURE
// Undercutting competitors with wholesale infrastructure
// =====================================================

export interface PricingTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  limits: {
    campaigns: number;
    apiCalls: number;
    storage: number; // GB
    teamMembers: number;
  };
  features: string[];
  modelAccess: string[];
  popular?: boolean;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'scout',
    name: 'The Scout',
    price: 0,
    currency: 'CAD',
    interval: 'month',
    limits: {
      campaigns: 5,
      apiCalls: 1000,
      storage: 1,
      teamMembers: 1
    },
    features: [
      '5 campaigns per month',
      'Basic AI models',
      'Standard export quality',
      'Email support',
      'AdgenXAI branding'
    ],
    modelAccess: ['gemini-flash-8b']
  },
  {
    id: 'voyageur',
    name: 'The Voyageur',
    price: 49,
    currency: 'CAD',
    interval: 'month',
    limits: {
      campaigns: 50,
      apiCalls: 10000,
      storage: 10,
      teamMembers: 3
    },
    features: [
      '50 campaigns per month',
      'Multi-model Neural Council',
      'Context caching included',
      'High-resolution exports',
      'Priority email support',
      'Basic analytics',
      'Custom branding options'
    ],
    modelAccess: ['gemini-flash', 'claude-haiku', 'gpt-3.5-turbo'],
    popular: true
  },
  {
    id: 'citadel',
    name: 'The Citadel',
    price: 199,
    currency: 'CAD',
    interval: 'month',
    limits: {
      campaigns: -1, // unlimited
      apiCalls: -1, // unlimited
      storage: 100,
      teamMembers: 10
    },
    features: [
      'Unlimited campaigns',
      'BYOA (Bring Your Own API) support',
      'White-label solution',
      'Priority routing & support',
      'Advanced analytics',
      'Custom integrations',
      'Dedicated account manager',
      'SOC2 compliance included',
      'Multi-region deployment'
    ],
    modelAccess: ['all-models', 'byoa-keys']
  }
];

export function getTierById(tierId: string): PricingTier | undefined {
  return PRICING_TIERS.find(tier => tier.id === tierId);
}

export function getRecommendedTier(usage: {
  campaignsPerMonth: number;
  teamSize: number;
  needsWhiteLabel: boolean;
}): PricingTier {
  if (usage.needsWhiteLabel || usage.teamSize > 5 || usage.campaignsPerMonth > 100) {
    return PRICING_TIERS.find(t => t.id === 'citadel')!;
  }
  if (usage.campaignsPerMonth > 10 || usage.teamSize > 1) {
    return PRICING_TIERS.find(t => t.id === 'voyageur')!;
  }
  return PRICING_TIERS.find(t => t.id === 'scout')!;
}

export function calculateSavings(currentSpending: number, newTier: PricingTier): {
  monthlySavings: number;
  yearlySavings: number;
  paybackPeriod: number;
} {
  const monthlyCost = newTier.price;
  const monthlySavings = Math.max(0, currentSpending - monthlyCost);
  const yearlySavings = monthlySavings * 12;
  const paybackPeriod = monthlySavings > 0 ? newTier.price / monthlySavings : 0;

  return {
    monthlySavings,
    yearlySavings,
    paybackPeriod
  };
}

// Competitive analysis
export const COMPETITIVE_PRICING = {
  jasper: { price: 499, campaigns: 50 },
  copyai: { price: 499, campaigns: 100 },
  agency: { price: 15000, campaigns: 30 },
  adgenxai_citadel: { price: 199, campaigns: -1 } // unlimited
};

export function getCompetitiveAdvantage(): {
  priceAdvantage: number;
  featureAdvantage: string[];
  scalabilityAdvantage: string;
} {
  return {
    priceAdvantage: 0.96, // 96% cheaper than competitors
    featureAdvantage: [
      'Physical hardware integration',
      'Autonomous self-healing loops',
      'Multi-model Neural Council',
      'Real-time cost optimization',
      'Canadian compliance built-in'
    ],
    scalabilityAdvantage: 'Unlimited campaigns vs. artificial limits'
  };
}