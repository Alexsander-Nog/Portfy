import { Check, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { Button } from './Button';
import type { SubscriptionPlan } from '../types';

const PLAN_STYLES: Record<SubscriptionPlan, {
  card: string;
  border: string;
  heading: string;
  subheading: string;
  price: string;
  feature: string;
  badge: string;
  button: string;
}> = {
  basic: {
    card: 'bg-white/90 backdrop-blur-lg',
    border: 'border-[#e5dcf3]',
    heading: 'text-[#2d2550]',
    subheading: 'text-[#6b5d7a]',
    price: 'text-[#2d2550]',
    feature: 'text-[#6b5d7a]',
    badge: 'bg-[#ece9ff] text-[#4338ca]',
    button: '!bg-[#4338ca] !hover:bg-[#3730a3] !text-white',
  },
  pro: {
    card: 'bg-white shadow-[0_30px_90px_-35px_rgba(162,29,76,0.65)] backdrop-blur-lg',
    border: 'border-transparent',
    heading: 'text-white',
    subheading: 'text-white/80',
    price: 'text-white',
    feature: 'text-white/85',
    badge: 'bg-white/20 text-white',
    button: '!bg-white !text-[#a21d4c] !hover:bg-white/90',
  },
  premium: {
    card: 'bg-white/90 backdrop-blur-lg',
    border: 'border-[#d8d1ff]',
    heading: 'text-[#312e81]',
    subheading: 'text-[#4c1d95]',
    price: 'text-[#312e81]',
    feature: 'text-[#4c1d95]',
    badge: 'bg-[#ede9fe] text-[#312e81]',
    button: '!bg-[#312e81] !hover:bg-[#1f1b4b] !text-white',
  },
};

export interface PlanCardProps {
  planId: SubscriptionPlan;
  name: string;
  description?: string;
  price: string;
  period: string;
  features: string[];
  highlight?: string;
  badge?: string;
  isPopular?: boolean;
  ctaLabel: string;
  ctaLoading?: boolean;
  ctaDisabled?: boolean;
  onSelect?: (planId: SubscriptionPlan) => void;
  footnote?: string;
  className?: string;
}

export function PlanCard(props: PlanCardProps) {
  const {
    planId,
    name,
    description,
    price,
    period,
    features,
    highlight,
    badge,
    isPopular = false,
    ctaLabel,
    ctaLoading = false,
    ctaDisabled = false,
    onSelect,
    footnote,
    className,
  } = props;

  const style = PLAN_STYLES[planId];
  const isDisabled = ctaDisabled || ctaLoading;

  const handleClick = () => {
    if (isDisabled) {
      return;
    }
    onSelect?.(planId);
  };

  return (
    <article
      className={clsx(
        'relative flex h-full flex-col overflow-hidden rounded-3xl border transition-transform duration-300 hover:-translate-y-1',
        isPopular
          ? 'bg-gradient-to-br from-[#2d2550] via-[#a21d4c] to-[#c92563] text-white shadow-[0_35px_120px_-40px_rgba(162,29,76,0.7)]'
          : style.card,
        isPopular ? 'border-transparent' : style.border,
        className,
      )}
    >
      {isPopular ? (
        <div className="absolute right-6 top-6 flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-sm font-semibold text-white backdrop-blur">
          <Sparkles className="h-4 w-4" />
          <span>{badge}</span>
        </div>
      ) : badge ? (
        <span className={clsx('absolute right-6 top-6 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide', style.badge)}>
          {badge}
        </span>
      ) : null}

      <div className={clsx('flex flex-1 flex-col gap-6 p-8', isPopular ? 'text-white' : style.feature)}>
        <div className="space-y-3">
          <h3 className={clsx('text-2xl font-bold', isPopular ? 'text-white' : style.heading)}>{name}</h3>
          {description ? <p className={clsx('text-sm leading-relaxed', isPopular ? 'text-white/80' : style.subheading)}>{description}</p> : null}
        </div>

        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className={clsx('text-4xl font-semibold', isPopular ? 'text-white' : style.price)}>{price}</span>
            <span className={clsx('text-sm font-medium', isPopular ? 'text-white/80' : style.subheading)}>{period}</span>
          </div>
          {highlight ? <p className={clsx('text-sm', isPopular ? 'text-white/80' : style.subheading)}>{highlight}</p> : null}
        </div>

        <ul className="space-y-3 text-sm">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <Check className={clsx('mt-1 h-4 w-4', isPopular ? 'text-white' : 'text-[#a21d4c]')} />
              <span className={clsx('leading-relaxed', isPopular ? 'text-white/90' : style.feature)}>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto px-8 pb-8">
        <Button
          variant="primary"
          size="md"
          className={clsx('w-full shadow-lg shadow-black/10', isPopular ? style.button : PLAN_STYLES[planId].button)}
          onClick={handleClick}
          disabled={isDisabled}
        >
          {ctaLoading ? 'Carregando...' : ctaLabel}
        </Button>
        {footnote ? (
          <p className={clsx('mt-3 text-center text-xs', isPopular ? 'text-white/80' : style.subheading)}>{footnote}</p>
        ) : null}
      </div>
    </article>
  );
}
