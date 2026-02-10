import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  Ban,
  Calendar,
  Check,
  Clock,
  CreditCard,
  Crown,
  Key,
  Mail,
  Shield,
  Star,
  TrendingUp,
  User,
} from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';
import type { Subscription as SubscriptionType, SubscriptionPlan, UserProfile } from '../types';
import type { PlanLimits } from '../data/plans';

type PlanCatalogEntry = {
  id: SubscriptionPlan;
  name: string;
  price: string;
  period: string;
  icon: LucideIcon;
  color: string;
  features: string[];
  highlight?: string;
  popular?: boolean;
};

type PlanUsageStat = {
  key: string;
  label: string;
  value: string;
  progress: number;
};

type StatusCallout = {
  title: string;
  description: string;
  icon: LucideIcon;
  className: string;
  iconClass: string;
};

const PLAN_CATALOG: Record<SubscriptionPlan, PlanCatalogEntry> = {
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 'R$ 19',
    period: '/mês',
    icon: Shield,
    color: 'from-[#6b5d7a] to-[#9b8da8]',
    highlight: 'Ideal para começar a construir seu portfólio.',
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
    icon: Star,
    color: 'from-[#a21d4c] to-[#c92563]',
    highlight: 'Recursos avançados para profissionais.',
    popular: true,
    features: [
      '3 portfólios profissionais',
      'Projetos ilimitados',
      'CV em até 3 idiomas',
      '3 vídeos em destaque',
      '4 cores personalizadas',
      'Personalização de tipografia',
      'Análises completas',
    ],
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 'R$ 69',
    period: '/mês',
    icon: Crown,
    color: 'from-[#2d2550] to-[#5a4570]',
    highlight: 'Experiência completa e suporte dedicado.',
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

const STATUS_LABELS: Record<SubscriptionType['status'], string> = {
  trialing: 'Em teste',
  active: 'Ativa',
  past_due: 'Pagamento pendente',
  canceled: 'Cancelada',
  blocked: 'Suspensa',
};

const STATUS_CALLOUTS: Partial<Record<SubscriptionType['status'], StatusCallout>> = {
  trialing: {
    title: 'Você está aproveitando o período de teste',
    description: 'Quando o trial terminar, seu acesso será renovado automaticamente caso o pagamento seja confirmado.',
    icon: Clock,
    className: 'bg-[#fff3cd] border border-[#f5c16c]',
    iconClass: 'text-[#d69a20]',
  },
  past_due: {
    title: 'Pagamento pendente',
    description: 'Não conseguimos processar sua última cobrança. Atualize o método de pagamento para evitar a suspensão do plano.',
    icon: AlertTriangle,
    className: 'bg-[#fff1f0] border border-[#f5a5a0]',
    iconClass: 'text-[#d6453d]',
  },
  canceled: {
    title: 'Assinatura cancelada',
    description: 'Você mantém acesso ao plano até o fim do período atual. Renovar é possível a qualquer momento.',
    icon: Ban,
    className: 'bg-[#f0f4ff] border border-[#98b4f5]',
    iconClass: 'text-[#415fc1]',
  },
  blocked: {
    title: 'Assinatura suspensa',
    description: 'Entre em contato com o suporte para regularizar sua situação e recuperar o acesso aos recursos do plano.',
    icon: Ban,
    className: 'bg-[#f0f4ff] border border-[#98b4f5]',
    iconClass: 'text-[#415fc1]',
  },
};

const formatDate = (isoDate?: string | null, fallback = 'Não disponível') => {
  if (!isoDate) {
    return fallback;
  }
  try {
    const parsed = new Date(isoDate);
    if (Number.isNaN(parsed.getTime())) {
      return fallback;
    }
    return parsed.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return fallback;
  }
};

const formatTrialLabel = (isTrial: boolean, trialEndsAt?: string | null) => {
  if (!isTrial) {
    return 'Não está em período de teste';
  }
  if (!trialEndsAt) {
    return 'Trial em andamento';
  }
  const now = new Date();
  const end = new Date(trialEndsAt);
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff > 1) {
    return `Faltam ${diff} dias`;
  }
  if (diff === 1) {
    return 'Falta 1 dia';
  }
  if (diff === 0) {
    return 'Termina hoje';
  }
  return 'Trial encerrado';
};

const computeProgress = (current: number, limit: number | null) => {
  if (limit === null) {
    return current > 0 ? 100 : 0;
  }
  if (limit <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((current / limit) * 100));
};

const formatUsageValue = (current: number, limit: number | null) => {
  if (limit === null) {
    return `${current} ilimitado`;
  }
  return `${Math.min(current, limit)} de ${limit}`;
};

interface SubscriptionProps {
  subscription?: SubscriptionType | null;
  planTier: SubscriptionPlan;
  planLimits: PlanLimits;
  counts: {
    portfolios: number;
    projects: number;
    featuredVideos: number;
    cvs: number;
    cvLanguages: number;
  };
  userId?: string;
  userProfile?: UserProfile;
  userEmail?: string;
  accountCreatedAt?: string;
}

export function Subscription(props: SubscriptionProps) {
  const { subscription, planTier, planLimits, counts, userId, userProfile, userEmail, accountCreatedAt } = props;
  const [checkoutLoading, setCheckoutLoading] = useState<SubscriptionPlan | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const currentPlan = PLAN_CATALOG[planTier];
  const PlanIcon = currentPlan.icon;
  const statusLabel = subscription ? STATUS_LABELS[subscription.status] ?? 'Indefinido' : 'Sem assinatura';
  const isTrial = subscription?.status === 'trialing';
  const trialLabel = formatTrialLabel(isTrial, subscription?.trialEndsAt);
  const nextBillingLabel = subscription?.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd, 'Não agendado') : 'Não agendado';
  const statusCallout = subscription ? STATUS_CALLOUTS[subscription.status] ?? null : null;
  const StatusIcon = statusCallout?.icon;

  const languageLimit = planLimits.allowedCvLanguages === 'all' ? null : planLimits.allowedCvLanguages.length;
  const usageStats: PlanUsageStat[] = [
    { key: 'portfolios', label: 'Portfólios', value: formatUsageValue(counts.portfolios, planLimits.maxPortfolios), progress: computeProgress(counts.portfolios, planLimits.maxPortfolios) },
    { key: 'projects', label: 'Projetos', value: formatUsageValue(counts.projects, planLimits.maxProjects), progress: computeProgress(counts.projects, planLimits.maxProjects) },
    { key: 'cvs', label: 'CVs', value: formatUsageValue(counts.cvs, planLimits.maxCvs), progress: computeProgress(counts.cvs, planLimits.maxCvs) },
    { key: 'cvLanguages', label: 'Idiomas do CV', value: formatUsageValue(counts.cvLanguages, languageLimit), progress: computeProgress(counts.cvLanguages, languageLimit) },
    { key: 'featuredVideos', label: 'Vídeos em destaque', value: formatUsageValue(counts.featuredVideos, planLimits.maxFeaturedVideos), progress: computeProgress(counts.featuredVideos, planLimits.maxFeaturedVideos) },
  ];

  const handleCheckout = async (planId: SubscriptionPlan) => {
    if (planId === planTier) {
      return;
    }
    if (!userId) {
      setCheckoutError('Faça login para continuar.');
      return;
    }

    setCheckoutLoading(planId);
    setCheckoutError(null);

    try {
      const response = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, userId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Falha ao iniciar pagamento');
      }

      const data = await response.json();
      const redirectUrl = data.init_point || data.sandbox_init_point;
      if (!redirectUrl) {
        throw new Error('URL de pagamento não disponível');
      }
      window.location.href = redirectUrl;
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : 'Falha no pagamento');
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1a1534] mb-2">Assinatura & Conta</h1>
        <p className="text-[#6b5d7a]">Visualize seu plano atual, acompanhe limites e atualize a assinatura quando precisar.</p>
      </div>

      <Card className="mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#2d2550] to-[#6b5d7a] flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1a1534]">Informações da Conta</h2>
            <p className="text-sm text-[#6b5d7a]">Dados básicos da sua conta Portfy.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-[#f5f3f7] rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#a21d4c] to-[#c92563] flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-[#6b5d7a] mb-1">Nome Completo</p>
                <p className="font-semibold text-[#1a1534]">{userProfile?.fullName ?? 'Não informado'}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#f5f3f7] rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#a21d4c] to-[#c92563] flex items-center justify-center">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-[#6b5d7a] mb-1">Email</p>
                <p className="font-semibold text-[#1a1534] text-sm break-all">{userEmail ?? 'Não disponível'}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#f5f3f7] rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#a21d4c] to-[#c92563] flex items-center justify-center">
                <Key className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-[#6b5d7a] mb-1">ID da Conta</p>
                <p className="font-mono text-xs text-[#1a1534] break-all">{userId ?? 'Não disponível'}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#f5f3f7] rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#a21d4c] to-[#c92563] flex items-center justify-center">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-[#6b5d7a] mb-1">Conta criada em</p>
                <p className="font-semibold text-[#1a1534] text-sm">{formatDate(accountCreatedAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {userProfile?.title && (
          <div className="mt-4 bg-[#f5f3f7] rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#2d2550] to-[#6b5d7a] flex items-center justify-center">
                <Star className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-[#6b5d7a] mb-1">Título profissional</p>
                <p className="font-semibold text-[#1a1534]">{userProfile.title}</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card className="mb-6 bg-gradient-to-r from-[#2d2550] to-[#a21d4c] border-none text-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <PlanIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-sm text-white/80">Plano atual</p>
              <h2 className="text-3xl font-bold">{currentPlan.name}</h2>
              {currentPlan.highlight && <p className="text-sm text-white/70 max-w-xs">{currentPlan.highlight}</p>}
            </div>
          </div>

          <div className="text-right">
            <p className="text-4xl font-bold">{currentPlan.price}</p>
            <p className="text-sm text-white/80">{currentPlan.period}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5" />
              <p className="text-sm text-white/80">Período de teste</p>
            </div>
            <p className="text-2xl font-bold">{trialLabel}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5" />
              <p className="text-sm text-white/80">Status</p>
            </div>
            <p className="text-2xl font-bold">{statusLabel}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-5 h-5" />
              <p className="text-sm text-white/80">Próxima cobrança</p>
            </div>
            <p className="text-base font-bold">{nextBillingLabel}</p>
          </div>
        </div>

        {statusCallout && (
          <div className={`${statusCallout.className} rounded-lg p-4`}>
            <div className="flex items-start gap-3">
              {StatusIcon && <StatusIcon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${statusCallout.iconClass}`} />}
              <div>
                <p className="font-medium mb-1 text-[#1a1534]">{statusCallout.title}</p>
                <p className="text-sm text-[#1a1534]/80">{statusCallout.description}</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card className="mb-6">
        <h3 className="text-xl font-bold text-[#1a1534] mb-6">Uso do plano</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
          {usageStats.map((stat) => (
            <div key={stat.key}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#6b5d7a]">{stat.label}</span>
                <span className="text-sm font-bold text-[#1a1534]">{stat.value}</span>
              </div>
              <div className="w-full bg-[#e8e3f0] rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-[#a21d4c] to-[#c92563] h-2 rounded-full transition-all"
                  style={{ width: `${stat.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#1a1534] mb-2">Planos disponíveis</h2>
        <p className="text-[#6b5d7a] mb-6">Compare os planos e faça upgrade quando quiser.</p>

        <div className="grid md:grid-cols-3 gap-6">
          {Object.values(PLAN_CATALOG).map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = plan.id === planTier;

            return (
              <Card
                key={plan.id}
                className={`relative ${plan.popular ? 'border-2 border-[#a21d4c] shadow-xl' : ''} ${
                  isCurrentPlan ? 'ring-2 ring-[#a21d4c] ring-offset-2' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#a21d4c] to-[#c92563] text-white px-4 py-1 rounded-full text-sm flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    Mais Popular
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#2d2550] to-[#5a4570] text-white px-4 py-1 rounded-full text-sm flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    Plano atual
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-r ${plan.color} flex items-center justify-center`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#1a1534] mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-[#2d2550]">{plan.price}</span>
                    <span className="text-[#6b5d7a]">{plan.period}</span>
                  </div>
                  {plan.highlight && <p className="text-sm text-[#6b5d7a]">{plan.highlight}</p>}
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-[#6b5d7a]">
                      <Check className="w-5 h-5 text-[#a21d4c] flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.popular ? 'primary' : 'outline'}
                  className="w-full"
                  onClick={() => handleCheckout(plan.id)}
                  disabled={isCurrentPlan || Boolean(checkoutLoading)}
                >
                  {isCurrentPlan ? 'Plano atual' : plan.id === 'premium' ? 'Fazer upgrade' : 'Selecionar plano'}
                </Button>
              </Card>
            );
          })}
        </div>

        {checkoutError && <p className="mt-4 text-sm text-red-600">{checkoutError}</p>}
      </div>

      <Card className="mb-6">
        <h3 className="text-xl font-bold text-[#1a1534] mb-3">Pagamento e cobrança</h3>
        <p className="text-sm text-[#6b5d7a] mb-4">
          A integração com o Mercado Pago está em fase final. Avisaremos por email quando o gerenciamento de pagamento estiver disponível.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" disabled>
            Atualizar método (em breve)
          </Button>
          <Button variant="outline" className="flex-1" disabled>
            Adicionar método (em breve)
          </Button>
        </div>
      </Card>

      <Card className="mb-6">
        <h3 className="text-xl font-bold text-[#1a1534] mb-3">Histórico de cobrança</h3>
        <p className="text-sm text-[#6b5d7a]">
          Nenhum pagamento registrado ainda. Quando cobranças forem realizadas elas aparecerão aqui.
        </p>
      </Card>

      <div className="mt-6 pt-6 border-t border-[#e8e3f0] text-center">
        <p className="text-sm text-[#6b5d7a] mb-3">Precisando de ajuda com a assinatura?</p>
        <Button variant="ghost" className="text-[#a21d4c]" disabled>
          Contatar suporte (em breve)
        </Button>
      </div>
    </div>
  );
}
