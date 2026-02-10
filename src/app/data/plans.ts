import type { SubscriptionPlan } from '../types';

export type PlanLanguageAllowance = 'all' | ReadonlyArray<'pt' | 'en' | 'es'>;

export interface PlanLimits {
  id: SubscriptionPlan;
  name: string;
  maxProjects: number | null;
  maxFeaturedVideos: number | null;
  maxPortfolios: number | null;
  maxCvs: number | null;
  allowedCvLanguages: PlanLanguageAllowance;
  maxCustomColors: number | null;
  allowCustomFonts: boolean;
  allowAdvancedLayouts: boolean;
}

export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  basic: {
    id: 'basic',
    name: 'Basic',
    maxProjects: 10,
    maxFeaturedVideos: 1,
    maxPortfolios: 1,
    maxCvs: 1,
    allowedCvLanguages: ['pt'],
    maxCustomColors: 2,
    allowCustomFonts: false,
    allowAdvancedLayouts: false,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    maxProjects: null,
    maxFeaturedVideos: 3,
    maxPortfolios: 3,
    maxCvs: 3,
    allowedCvLanguages: ['pt', 'en', 'es'],
    maxCustomColors: 4,
    allowCustomFonts: true,
    allowAdvancedLayouts: true,
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    maxProjects: null,
    maxFeaturedVideos: null,
    maxPortfolios: 10,
    maxCvs: null,
    allowedCvLanguages: 'all',
    maxCustomColors: null,
    allowCustomFonts: true,
    allowAdvancedLayouts: true,
  },
};

export const isLanguageAllowed = (plan: SubscriptionPlan, language: 'pt' | 'en' | 'es'): boolean => {
  const allowance = PLAN_LIMITS[plan].allowedCvLanguages;
  if (allowance === 'all') {
    return true;
  }
  return allowance.includes(language);
};

export const resolvePlanName = (plan: SubscriptionPlan): string => PLAN_LIMITS[plan].name;
