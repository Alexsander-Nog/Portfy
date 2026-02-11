import { ReactNode, useState } from 'react';
import { Logo } from './Logo';
import { Button } from './Button';
import { 
  LayoutDashboard, 
  FolderOpen, 
  Briefcase, 
  FileText, 
  Palette, 
  Globe, 
  CreditCard, 
  Settings,
  LogOut,
  Menu,
  X,
  BookOpen,
} from 'lucide-react';
import { useLocale } from '../i18n';
import type { Subscription, SubscriptionPlan, UserProfile } from '../types';

interface DashboardLayoutProps {
  children: ReactNode;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
  onLogout?: () => void;
  userProfile?: UserProfile;
  subscription?: Subscription;
  onStartCheckout?: (plan: SubscriptionPlan) => void;
}

export function DashboardLayout({
  children,
  activeSection = 'dashboard',
  onSectionChange,
  onLogout,
  userProfile,
  subscription,
  onStartCheckout,
}: DashboardLayoutProps) {
  const { t } = useLocale();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const initials = userProfile?.fullName
    ? userProfile.fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((chunk) => chunk[0]?.toUpperCase())
      .join('')
    : 'US';
  const TRIAL_TOTAL_DAYS = 15;
  const trialDaysRemaining = subscription?.trialDaysRemaining ?? null;
  const trialExpired = subscription?.trialExpired ?? false;
  const trialProgressBase = trialDaysRemaining === null
    ? 0
    : Math.min(
        100,
        Math.max(0, ((TRIAL_TOTAL_DAYS - Math.min(trialDaysRemaining, TRIAL_TOTAL_DAYS)) / TRIAL_TOTAL_DAYS) * 100),
      );
  const trialProgress = trialExpired ? 100 : trialProgressBase;
  const planLabel = subscription?.planType === 'trial'
    ? t('subscription.badge.trial')
    : t('subscription.badge.active');
  const trialSidebarLabel = trialExpired
    ? t('subscription.trialBanner.expiredChip')
    : trialDaysRemaining !== null
    ? t('subscription.trialBanner.chip', { count: trialDaysRemaining })
    : t('subscription.trialBanner.missing');
  const trialBannerClass = trialExpired
    ? 'bg-[#fef2f2] border border-[#fecaca] text-[#7f1d1d]'
    : trialDaysRemaining !== null && trialDaysRemaining <= 3
    ? 'bg-[#fff7ed] border border-[#fed7aa] text-[#92400e]'
    : 'bg-[#f5f3ff] border border-[#ddd6fe] text-[#312e81]';
  const trialBannerPrimary = trialExpired
    ? t('subscription.trialBanner.expired')
    : t('subscription.trialBanner.active');
  const trialBannerSecondary = trialExpired
    ? t('subscription.trialBanner.expiredSecondary')
    : trialDaysRemaining === null
    ? t('subscription.trialBanner.generic')
    : trialDaysRemaining === 1
    ? t('subscription.trialBanner.oneDay')
    : t('subscription.trialBanner.days', { count: trialDaysRemaining });
  const trialButtonClass = trialExpired
    ? '!bg-[#be123c] !hover:bg-[#9f1239] !text-white'
    : trialDaysRemaining !== null && trialDaysRemaining <= 3
    ? '!bg-[#f97316] !hover:bg-[#ea580c] !text-white'
    : '!bg-[#4338ca] !hover:bg-[#3730a3] !text-white';
  const handleSectionChange = (section: string) => {
    onSectionChange?.(section);
    setSidebarOpen(false);
  };
  const menuItems = [
    { id: 'dashboard', label: t('menu.dashboard'), icon: LayoutDashboard },
    { id: 'portfolio', label: t('menu.portfolio'), icon: FolderOpen },
    { id: 'projects', label: t('menu.projects'), icon: Briefcase },
    { id: 'articles', label: t('menu.articles'), icon: BookOpen },
    { id: 'experiences', label: t('menu.experiences'), icon: Briefcase },
    { id: 'cv', label: t('menu.cv'), icon: FileText },
    { id: 'appearance', label: t('menu.appearance'), icon: Palette },
    { id: 'language', label: t('menu.language'), icon: Globe },
    { id: 'subscription', label: t('menu.subscription'), icon: CreditCard },
    { id: 'settings', label: t('menu.settings'), icon: Settings },
  ];

  const SidebarContent = ({ closeable }: { closeable?: boolean }) => (
    <div className="flex h-full flex-col bg-[#0f0b1f] text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
        <Logo variant="full" size="sm" inverted />
        {closeable ? (
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-md border border-white/10 p-2 text-white/70 hover:text-white"
          >
            <span className="sr-only">Fechar menu</span>
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSectionChange(item.id)}
                className={`w-full rounded-lg px-4 py-3 text-left text-sm transition-all flex items-center gap-3 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#a21d4c] to-[#c92563] text-white shadow-lg'
                    : 'text-[#e8e3f0] hover:bg-[#1a1534]'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-white/10 px-4 py-5">
        <div className="mb-3 rounded-lg bg-[#1a1534] p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-[#a21d4c] to-[#c92563]">
              {userProfile?.photoUrl ? (
                <img src={userProfile.photoUrl} alt="Foto" className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-bold">{initials}</span>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{userProfile?.fullName || 'Usuario'}</p>
              <p className="text-xs text-[#9b8da8]">{planLabel}</p>
            </div>
          </div>
          <div className="text-xs text-[#9b8da8]">
            <div className="mb-1 flex items-center justify-between gap-4">
              <span>{t('subscription.badge.trial')}</span>
              <span
                className={
                  trialExpired
                    ? 'text-[#fca5a5] font-semibold'
                    : trialDaysRemaining !== null && trialDaysRemaining <= 3
                    ? 'text-[#facc15] font-semibold'
                    : 'text-[#e8e3f0]'
                }
              >
                {trialSidebarLabel}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/10">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  trialExpired
                    ? 'bg-[#f87171]'
                    : trialDaysRemaining !== null && trialDaysRemaining <= 3
                    ? 'bg-[#f97316]'
                    : 'bg-[#c4b5fd]'
                }`}
                style={{ width: `${trialProgress}%` }}
              ></div>
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-[#e8e3f0] transition-all hover:bg-[#1a1534]"
        >
          <LogOut className="h-5 w-5" />
          <span>{t('menu.logout')}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative flex h-full min-h-full w-full flex-1 bg-[#f8f7fa] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden w-72 lg:flex">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 shadow-2xl transition-transform duration-200 ease-in-out lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent closeable />
      </aside>
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></button>
      ) : null}

      {/* Content area */}
      <div className="flex flex-1 flex-col min-h-0">
        <header className="flex items-center justify-between border-b border-[#e8e3f0] bg-white px-4 py-3 shadow-sm lg:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-md border border-[#e8e3f0] p-2 text-[#2d2550] hover:bg-[#f5f3f7]"
            >
              <span className="sr-only">Abrir menu</span>
              <Menu className="h-5 w-5" />
            </button>
            <Logo size="sm" />
          </div>
          {onLogout ? (
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-2 rounded-md border border-[#e8e3f0] px-3 py-2 text-sm text-[#2d2550] hover:bg-[#f5f3f7]"
            >
              <LogOut className="h-4 w-4" />
              <span>{t('menu.logout')}</span>
            </button>
          ) : null}
        </header>

        {subscription?.planType === 'trial' ? (
          <div className="border-b border-[#e8e3f0] bg-white px-4 py-4 shadow-sm lg:px-8">
            <div className={`flex flex-col gap-4 rounded-2xl px-5 py-4 md:flex-row md:items-center md:justify-between ${trialBannerClass}`}>
              <div className="space-y-1 text-left">
                <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                  {t('subscription.trialBanner.headline')}
                </p>
                <p className="text-lg font-semibold leading-tight">{trialBannerPrimary}</p>
                <p className="text-sm opacity-80">{trialBannerSecondary}</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                className={`w-full md:w-auto shadow-md shadow-black/10 ${trialButtonClass}`}
                onClick={() => onStartCheckout?.('pro')}
              >
                {t('subscription.trialBanner.cta')}
              </Button>
            </div>
          </div>
        ) : null}

        <main className="flex-1 overflow-y-auto min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
}