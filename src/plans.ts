import type { PlanId } from './types';

export type Feature = 'simulator' | 'brandedReport' | 'subrecipes' | 'multiBranch' | 'aiInvoices' | 'posIntegration';

export interface Plan {
  id: PlanId;
  name: string;
  monthly: number;
  yearly: number;
  lifetime: number;
  maxRecipes: number;
  maxUsers: number;
  maxBranches: number;
  features: Feature[];
}

export const PLANS: Record<PlanId, Plan> = {
  pequeno: {
    id: 'pequeno',
    name: 'Pequeño',
    monthly: 19,
    yearly: 190,
    lifetime: 399,
    maxRecipes: 50,
    maxUsers: 1,
    maxBranches: 1,
    features: [],
  },
  mediano: {
    id: 'mediano',
    name: 'Mediano',
    monthly: 49,
    yearly: 490,
    lifetime: 999,
    maxRecipes: 300,
    maxUsers: 5,
    maxBranches: 5,
    features: ['simulator', 'brandedReport', 'subrecipes', 'multiBranch', 'aiInvoices'],
  },
  grande: {
    id: 'grande',
    name: 'Grande',
    monthly: 149,
    yearly: 1490,
    lifetime: 3000,
    maxRecipes: Infinity,
    maxUsers: Infinity,
    maxBranches: Infinity,
    features: ['simulator', 'brandedReport', 'subrecipes', 'multiBranch', 'aiInvoices', 'posIntegration'],
  },
};

export function hasFeature(plan: PlanId, feature: Feature): boolean {
  return PLANS[plan].features.includes(feature);
}

/** Plan más barato que incluye la función */
export function planFor(feature: Feature): Plan {
  return Object.values(PLANS).find((p) => p.features.includes(feature))!;
}
