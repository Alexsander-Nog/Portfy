import type { SubscriptionPlan } from '../types';

export type PlanCatalogEntry = {
  id: SubscriptionPlan;
  name: string;
  price: string;
  period: string;
  highlight: string;
  features: string[];
  popular?: boolean;
};

export const PLAN_SEQUENCE: SubscriptionPlan[] = ['basic', 'pro', 'premium'];

export const PLAN_CATALOG: Record<SubscriptionPlan, PlanCatalogEntry> = {
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 'R$ 19',
    period: '/mês',
    highlight: 'Primeiro passo para um portfólio profissional.',
    features: [
      '1 portfólio profissional',
      'Até 10 projetos',
      'CV em 1 idioma',
      '1 vídeo em destaque',
      '2 cores personalizadas',
      'Suporte por email',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 'R$ 39',
    period: '/mês',
    highlight: 'Tudo que você precisa para se destacar online.',
    popular: true,
    features: [
      'Até 3 portfólios completos',
      'Projetos ilimitados',
      'CV em até 3 idiomas',
      '3 vídeos em destaque',
      '4 cores personalizadas',
      'Personalização de tipografia',
      'Analytics avançados',
    ],
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 'R$ 69',
    period: '/mês',
    highlight: 'Experiência completa com escalabilidade ilimitada.',
    features: [
      'Até 10 portfólios profissionais',
      'Projetos ilimitados',
      'CV em todos os idiomas',
      'Vídeos em destaque ilimitados',
      'Personalização total do tema',
      'Domínio personalizado',
      'Integrações avançadas',
      'Suporte prioritário 24/7',
    ],
  },
};
