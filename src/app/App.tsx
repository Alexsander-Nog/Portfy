import { useCallback, useEffect, useState } from 'react';
import { Logo } from './components/Logo';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { 
  Sparkles, 
  FileText, 
  Globe, 
  Palette, 
  Upload, 
  Link as LinkIcon,
  Music,
  Paintbrush,
  Code,
  Briefcase,
  Check,
  Star,
  Zap,
  Shield,
  Menu,
  X
} from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import {
  fetchCvs,
  fetchExperiences,
  fetchFeaturedVideos,
  fetchScientificArticles,
  fetchProjects,
  fetchUserProfile,
  fetchSubscription,
  fetchUserTheme,
  ensureSubscription,
  upsertUserProfile,
  upsertUserTheme,
  updatePreferredLocale,
} from './data/portfolio';
import type {
  CV,
  Experience,
  FeaturedVideo,
  Locale,
  Project,
  ScientificArticle,
  Subscription,
  SubscriptionPlan,
  UserProfile,
  UserTheme,
} from './types';

// Import other components
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { PublicPortfolio } from './components/PublicPortfolio';
import { useLocale } from './i18n';

const DEFAULT_THEME: UserTheme = {
  primaryColor: '#a21d4c',
  secondaryColor: '#c92563',
  accentColor: '#e94d7a',
  backgroundColor: '#ffffff',
  fontFamily: 'Inter, system-ui, sans-serif',
  themeMode: 'light',
  layout: 'modern',
};

const TRIAL_DURATION_DAYS = 15;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const EMPTY_PROFILE: UserProfile = {
  id: '',
  fullName: '',
  preferredLocale: undefined,
  title: undefined,
  bio: undefined,
  location: undefined,
  email: undefined,
  phone: undefined,
  photoUrl: undefined,
  skills: [],
  education: [],
  socialLinks: {},
  portfolioTemplate: 'modern',
  cvTemplate: 'modern',
  trialStart: undefined,
  trialEnd: undefined,
  trialDaysRemaining: undefined,
};

export default function App() {
  console.log('APP RENDER START');
  const { locale, setLocale, t } = useLocale();
  const [currentPage, setCurrentPage] = useState<'landing' | 'auth' | 'dashboard' | 'public'>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname.startsWith('/p/')) {
        return 'public';
      }

      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'public') {
        return 'public';
      }
    }

    return 'landing';
  });
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  
  // User theme state
  const [userTheme, setUserTheme] = useState<UserTheme>({ ...DEFAULT_THEME });
  const [userProfile, setUserProfile] = useState<UserProfile>({ ...EMPTY_PROFILE });

  // Featured videos state (up to 3)
  const [featuredVideos, setFeaturedVideos] = useState<FeaturedVideo[]>([]);

  // Projects state
  const [projects, setProjects] = useState<Project[]>([]);

  // Experiences state
  const [experiences, setExperiences] = useState<Experience[]>([]);

  // Scientific articles state
  const [articles, setArticles] = useState<ScientificArticle[]>([]);

  // CVs state
  const [cvs, setCvs] = useState<CV[]>([]);
  const [publicRouteId, setPublicRouteId] = useState<string | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    const match = window.location.pathname.match(/^\/p\/([^/?#]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const sessionUserId = session?.user?.id ?? null;

  useEffect(() => {
    if (publicRouteId) {
      return;
    }

    if (!isSupabaseConfigured) {
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }
      setSession(data.session ?? null);
      setIsLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!isMounted) {
        return;
      }
      setSession(newSession);
      
      // Se não há sessão (logout), limpar todos os dados
      if (!newSession) {
        setUserProfile({
          id: '',
          fullName: '',
          preferredLocale: undefined,
          title: undefined,
          bio: undefined,
          location: undefined,
          email: undefined,
          phone: undefined,
          photoUrl: undefined,
          skills: [],
          education: [],
          socialLinks: {},
          portfolioTemplate: 'modern',
          cvTemplate: 'modern',
          showCvPhoto: true,
          trialStart: undefined,
          trialEnd: undefined,
          trialDaysRemaining: undefined,
        });
        setUserTheme({
          primaryColor: '#2d2550',
          secondaryColor: '#6b5d7a',
          accentColor: '#a21d4c',
          backgroundColor: '#1a1534',
          fontFamily: 'Inter',
          themeMode: 'light',
          layout: 'modern',
        });
        setFeaturedVideos([]);
        setProjects([]);
        setExperiences([]);
        setArticles([]);
        setCvs([]);
        setSubscription(null);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [publicRouteId, isSupabaseConfigured]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const evaluateRoute = () => {
      const match = window.location.pathname.match(/^\/p\/([^/?#]+)/);
      if (match) {
        setPublicRouteId(decodeURIComponent(match[1]));
        setCurrentPage('public');
      } else {
        setPublicRouteId(null);
      }
    };

    evaluateRoute();
    window.addEventListener('popstate', evaluateRoute);
    return () => {
      window.removeEventListener('popstate', evaluateRoute);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (window.location.pathname.startsWith('/p/')) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    const lang = params.get('lang');
    if (lang === 'pt' || lang === 'en' || lang === 'es') {
      setLocale(lang);
    }
    if (view === 'public') {
      setCurrentPage('public');
    }
  }, [setLocale]);

  useEffect(() => {
    if (publicRouteId) {
      return;
    }

    if (!sessionUserId || !session || !isSupabaseConfigured) {
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setLoadError(null);

    // CRÍTICO: Limpar todos os estados ANTES de carregar dados do novo usuário
    // para evitar vazamento de dados entre contas diferentes
    setUserProfile({
      id: '',
      fullName: '',
      preferredLocale: undefined,
      title: undefined,
      bio: undefined,
      location: undefined,
      email: undefined,
      phone: undefined,
      photoUrl: undefined,
      skills: [],
      education: [],
      socialLinks: {},
      portfolioTemplate: 'modern',
      cvTemplate: 'modern',
      showCvPhoto: true,
      trialStart: undefined,
      trialEnd: undefined,
      trialDaysRemaining: undefined,
    });
    setUserTheme({
      primaryColor: '#2d2550',
      secondaryColor: '#6b5d7a',
      accentColor: '#a21d4c',
      backgroundColor: '#1a1534',
      fontFamily: 'Inter',
      themeMode: 'light',
      layout: 'modern',
    });
    setFeaturedVideos([]);
    setProjects([]);
    setExperiences([]);
    setArticles([]);
    setCvs([]);
    setSubscription(null);

    console.log('=== CARREGANDO DADOS DO USUÁRIO ===');
    console.log('Session user ID:', sessionUserId);
    
    Promise.all([
      fetchUserProfile(sessionUserId),
      fetchUserTheme(sessionUserId),
      fetchFeaturedVideos(sessionUserId),
      fetchProjects(sessionUserId),
      fetchExperiences(sessionUserId),
      fetchScientificArticles(sessionUserId),
      fetchCvs(sessionUserId),
      fetchSubscription(sessionUserId),
    ])
      .then(async ([profileData, themeData, videoData, projectData, experienceData, articleData, cvData, subscriptionData]) => {
        console.log('Dados recebidos do Supabase:');
        console.log('  profileData:', profileData);
        console.log('  themeData:', themeData);
        console.log('  videoData:', videoData);
        console.log('  projectData:', projectData);
        console.log('  experienceData:', experienceData);
        console.log('  cvData:', cvData);
        console.log('  subscriptionData:', subscriptionData);
        
        if (!isMounted) {
          return;
        }
        if (profileData) {
          console.log('Atualizando userProfile com:', profileData);
          setUserProfile(profileData);
        } else {
          console.warn('Nenhum profileData retornado, usando fallback');
          const fallbackName =
            (session.user.user_metadata?.full_name as string | undefined) ??
            (session.user.user_metadata?.name as string | undefined) ??
            '';
          const fallbackProfile = {
            id: sessionUserId,
            fullName: fallbackName,
            preferredLocale: locale,
            email: session.user.email ?? undefined,
            title: undefined,
            bio: undefined,
            location: undefined,
            phone: undefined,
            photoUrl: undefined,
            skills: [],
            education: [],
            socialLinks: {},
            portfolioTemplate: 'modern',
            cvTemplate: 'modern',
            showCvPhoto: true,
            trialStart: new Date().toISOString(),
            trialEnd: new Date(Date.now() + TRIAL_DURATION_DAYS * DAY_IN_MS).toISOString(),
            trialDaysRemaining: TRIAL_DURATION_DAYS,
          };
          console.log('Usando perfil fallback:', fallbackProfile);
          setUserProfile(fallbackProfile);

          try {
            const persistedProfile = await upsertUserProfile(sessionUserId, fallbackProfile);
            if (persistedProfile) {
              setUserProfile(persistedProfile);
            }
          } catch (fallbackError) {
            console.error('Não foi possível persistir o perfil fallback:', fallbackError);
          }
        }
        if (themeData) {
          console.log('Atualizando userTheme com:', themeData);
          setUserTheme(themeData);
        }
        console.log('Atualizando features, projects, experiences, cvs...');
        setFeaturedVideos(videoData);
        setProjects(projectData);
        setExperiences(experienceData);
        setArticles(articleData);
        setCvs(cvData);
        if (subscriptionData) {
          console.log('Atualizando subscription:', subscriptionData);
          setSubscription(subscriptionData);
        }
        console.log('=== CARREGAMENTO CONCLUÍDO COM SUCESSO ===');
      })
      .catch((error: Error) => {
        console.error('=== ERRO NO CARREGAMENTO ===', error);
        if (!isMounted) {
          return;
        }
        setLoadError(error.message);
      })
      .finally(() => {
        console.log('Finalizando carregamento, isMounted:', isMounted);
        if (!isMounted) {
          return;
        }
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [sessionUserId, session, isSupabaseConfigured, publicRouteId, locale]);

  useEffect(() => {
    if (session && currentPage === 'auth') {
      setCurrentPage('dashboard');
    }
  }, [session, currentPage]);

  useEffect(() => {
    if (currentPage !== 'landing') {
      setMobileNavOpen(false);
    }
  }, [currentPage]);

  useEffect(() => {
    if (publicRouteId) {
      return;
    }

    if (!session || !isSupabaseConfigured) {
      return;
    }

    if (subscription) {
      return;
    }

    ensureSubscription(session.user.id).then((ensured) => {
      if (ensured) {
        setSubscription(ensured);
      }
    });
  }, [session, subscription, publicRouteId]);

  useEffect(() => {
    if (publicRouteId) {
      return;
    }

    if (userProfile.preferredLocale && userProfile.preferredLocale !== locale) {
      setLocale(userProfile.preferredLocale);
    }
  }, [userProfile.preferredLocale, locale, setLocale, publicRouteId]);

  const handleThemeChange = async (nextTheme: UserTheme) => {
    if (session && isSupabaseConfigured) {
      try {
        const saved = await upsertUserTheme(session.user.id, nextTheme);
        if (!saved) {
          throw new Error('Não foi possível salvar o tema do portfólio.');
        }
        setUserTheme(saved);
        setLoadError(null);
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Não foi possível salvar o tema do portfólio.';
        setLoadError(message);
        throw (error instanceof Error ? error : new Error(message));
      }
    }

    setUserTheme(nextTheme);
  };

  const handlePreferredLocaleChange = async (nextLocale: Locale) => {
    if (session && isSupabaseConfigured) {
      try {
        const persisted = await updatePreferredLocale(session.user.id, nextLocale, {
          fullName:
            userProfile.fullName ||
            (session.user.user_metadata?.full_name as string | undefined) ||
            (session.user.user_metadata?.name as string | undefined) ||
            session.user.email,
          email: userProfile.email ?? session.user.email ?? null,
        });

        setUserProfile((prev) => ({
          ...prev,
          preferredLocale: persisted ?? nextLocale,
        }));
        setLoadError(null);
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Não foi possível salvar o idioma preferido.';
        setLoadError(message);
        throw (error instanceof Error ? error : new Error(message));
      }
    }

    setUserProfile((prev) => ({
      ...prev,
      preferredLocale: nextLocale,
    }));
  };

  const openPublicPortfolio = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const identifier = (userProfile.slug && userProfile.slug.trim()) || sessionUserId;
    if (!identifier) {
      return;
    }

    const url = new URL(`/p/${encodeURIComponent(identifier)}`, window.location.origin);
    const external = window.open(url.toString(), '_blank', 'noopener,noreferrer');
    if (!external) {
      window.location.assign(url.toString());
    }
  }, [sessionUserId, userProfile.slug]);

  const startCheckout = useCallback(async (planId: SubscriptionPlan = 'pro') => {
    if (!sessionUserId) {
      setCurrentPage('auth');
      return;
    }

    setCheckoutError(null);
    setCheckoutLoading(true);

    try {
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || t('subscription.errors.generic'));
      }

      const payload: { url?: string } = await response.json();
      if (payload.url) {
        window.location.href = payload.url;
        return;
      }

      throw new Error(t('subscription.errors.checkoutUnavailable'));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('subscription.errors.generic');
      setCheckoutError(message);
    } finally {
      setCheckoutLoading(false);
    }
  }, [sessionUserId, setCurrentPage, t]);

  const statusBanner = isSupabaseConfigured && !publicRouteId && (isLoading || loadError) ? (
    <div className="fixed top-4 right-4 z-50 rounded-lg border border-[#e8e3f0] bg-white px-4 py-2 text-sm text-[#2d2550] shadow-lg">
      {isLoading ? 'Sincronizando dados...' : loadError}
    </div>
  ) : null;

  const accessState = (() => {
    if (!subscription) {
      return 'active' as const;
    }

    if (subscription.planType === 'trial') {
      return subscription.trialExpired ? 'blocked' : 'trial';
    }

    if (!subscription.subscriptionActive || subscription.status === 'blocked') {
      return 'blocked' as const;
    }

    if (subscription.status === 'past_due') {
      return 'grace' as const;
    }

    return 'active' as const;
  })();

  const isBlocked = accessState === 'blocked';
  const isAuthPage = currentPage === 'auth';
  const isDashboardPage = currentPage === 'dashboard';
  const isPublicPage = currentPage === 'public';
  const isStandalonePublicView = Boolean(publicRouteId);

  if (isAuthPage) {
    console.log('APP RENDER END');
    return (
      <>
        {statusBanner}
        <Auth 
          onLogin={() => setCurrentPage('dashboard')}
          onBack={() => setCurrentPage('landing')}
        />
      </>
    );
  }

  if (isDashboardPage) {
    if (isBlocked) {
      console.log('APP RENDER END');
      return (
        <div className="min-h-screen bg-[#0f0b1f] flex items-center justify-center px-6">
          <div className="max-w-md w-full text-center bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 px-10 py-12 shadow-2xl space-y-6">
            <h1 className="text-3xl font-semibold text-white">{t('subscription.paywall.title')}</h1>
            <p className="text-white/70 text-base">{t('subscription.paywall.subtitle')}</p>
            <div className="flex flex-col gap-3">
              <Button
                variant="primary"
                size="lg"
                className="!bg-white !text-[#2d2550] !hover:bg-white/90 !hover:text-[#2d2550] shadow-lg shadow-white/10"
                onClick={() => startCheckout('pro')}
                disabled={checkoutLoading}
              >
                {checkoutLoading ? t('subscription.paywall.loading') : t('subscription.paywall.cta')}
              </Button>
              <p className="text-sm text-white/50">{t('subscription.paywall.note')}</p>
            </div>
            {checkoutError ? <p className="text-sm text-red-300">{checkoutError}</p> : null}
          </div>
        </div>
      );
    }
    console.log('APP RENDER END');
    return (
      <>
        {statusBanner}
        <Dashboard 
          onLogout={async () => {
            if (isSupabaseConfigured) {
              await supabase.auth.signOut();
            }
            // Limpar todos os estados para evitar vazamento de dados entre usuários
            setUserProfile({
              id: '',
              fullName: '',
              title: undefined,
              bio: undefined,
              location: undefined,
              email: undefined,
              phone: undefined,
              photoUrl: undefined,
              skills: [],
              education: [],
              socialLinks: {},
              portfolioTemplate: 'modern',
              cvTemplate: 'modern',
              showCvPhoto: true,
              trialStart: undefined,
              trialEnd: undefined,
              trialDaysRemaining: undefined,
            });
            setUserTheme({
              primaryColor: '#2d2550',
              secondaryColor: '#6b5d7a',
              accentColor: '#a21d4c',
              backgroundColor: '#1a1534',
              fontFamily: 'Inter',
              themeMode: 'light',
              layout: 'modern',
            });
            setFeaturedVideos([]);
            setProjects([]);
            setExperiences([]);
            setArticles([]);
            setCvs([]);
            setSubscription(null);
            setCurrentPage('landing');
          }}
          onViewPublicPortfolio={openPublicPortfolio}
          userTheme={userTheme}
          onThemeChange={handleThemeChange}
          featuredVideos={featuredVideos}
          onVideosChange={setFeaturedVideos}
          projects={projects}
          onProjectsChange={setProjects}
          experiences={experiences}
          onExperiencesChange={setExperiences}
          articles={articles}
          onArticlesChange={setArticles}
          cvs={cvs}
          onCvsChange={setCvs}
          userId={session?.user.id}
          userProfile={userProfile}
          onProfileChange={(newProfile) => {
            console.log('onProfileChange CHAMADO no App.tsx com:', newProfile);
            setUserProfile(newProfile);
            console.log('setUserProfile executado');
          }}
          subscription={subscription ?? undefined}
          userEmail={session?.user.email}
          accountCreatedAt={session?.user.created_at}
          onLocalePersist={handlePreferredLocaleChange}
          onStartCheckout={startCheckout}
        />
      </>
    );
  }

  if (isPublicPage) {
    if (isBlocked) {
      console.log('APP RENDER END');
      return (
        <div className="min-h-screen bg-white flex items-center justify-center px-6">
          <div className="max-w-lg text-center">
            <h1 className="text-3xl font-bold text-[#1a1534] mb-4">{t('public.offline.title')}</h1>
            <p className="text-[#6b5d7a]">
              {t('public.offline.subtitle')}
            </p>
          </div>
        </div>
      );
    }
    console.log('APP RENDER END');
    return (
      <>
        {statusBanner}
        <PublicPortfolio 
          previewMode={!isStandalonePublicView}
          publicPortfolioId={publicRouteId}
          userTheme={isStandalonePublicView ? undefined : userTheme}
          userProfile={isStandalonePublicView ? undefined : userProfile}
          featuredVideos={isStandalonePublicView ? undefined : featuredVideos}
          projects={isStandalonePublicView ? undefined : projects}
          experiences={isStandalonePublicView ? undefined : experiences}
          articles={isStandalonePublicView ? undefined : articles}
          cvs={isStandalonePublicView ? undefined : cvs}
          loading={isStandalonePublicView ? false : isLoading}
          error={isStandalonePublicView ? null : loadError}
          onSlugChange={isStandalonePublicView ? setPublicRouteId : undefined}
          onBackToDashboard={!isStandalonePublicView && session ? () => {
            setCurrentPage('dashboard');
            if (typeof window !== 'undefined') {
              const url = new URL(window.location.href);
              url.searchParams.delete('view');
              window.history.pushState({}, '', url.toString());
            }
          } : undefined}
        />
      </>
    );
  }

  // Landing Page
  console.log('APP RENDER END');
  return (
    <div className="min-h-screen bg-white">
      {statusBanner}
      {/* Navigation */}
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-gradient-to-r from-[#0f0b1f] via-[#1a1534] to-[#2d2550]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo size="sm" inverted />

          <div className="hidden md:flex items-center gap-8 text-white/90">
            <a href="#beneficios" className="transition-colors hover:text-[#c92563]" onClick={() => setMobileNavOpen(false)}>
              {t('nav.benefits')}
            </a>
            <a href="#exemplos" className="transition-colors hover:text-[#c92563]" onClick={() => setMobileNavOpen(false)}>
              {t('nav.examples')}
            </a>
            <a href="#planos" className="transition-colors hover:text-[#c92563]" onClick={() => setMobileNavOpen(false)}>
              {t('nav.plans')}
            </a>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2 border-l border-white/10 pl-6">
              <button
                onClick={() => setLocale('pt')}
                className={`px-3 py-1 text-sm transition-colors hover:text-[#c92563] ${locale === 'pt' ? 'text-white' : 'text-white/60'}`}
              >
                PT
              </button>
              <span className="text-white/10">|</span>
              <button
                onClick={() => setLocale('en')}
                className={`px-3 py-1 text-sm transition-colors hover:text-[#c92563] ${locale === 'en' ? 'text-white' : 'text-white/60'}`}
              >
                EN
              </button>
              <span className="text-white/10">|</span>
              <button
                onClick={() => setLocale('es')}
                className={`px-3 py-1 text-sm transition-colors hover:text-[#c92563] ${locale === 'es' ? 'text-white' : 'text-white/60'}`}
              >
                ES
              </button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage('auth')}
              className="text-white hover:bg-white/10 hover:text-white"
            >
              {t('nav.login')}
            </Button>
            <Button variant="primary" size="sm" onClick={() => setCurrentPage('auth')}>
              {t('nav.start')}
            </Button>
          </div>

          <div className="flex items-center gap-3 md:hidden">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setCurrentPage('auth');
                setMobileNavOpen(false);
              }}
            >
              {t('nav.start')}
            </Button>
            <button
              type="button"
              onClick={() => setMobileNavOpen((prev) => !prev)}
              className="inline-flex items-center justify-center rounded-md border border-white/20 p-2 text-white transition hover:bg-white/10"
            >
              <span className="sr-only">{mobileNavOpen ? 'Fechar menu' : 'Abrir menu'}</span>
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </nav>

      {mobileNavOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            aria-label="Fechar menu"
            onClick={() => setMobileNavOpen(false)}
          ></button>
          <div className="fixed top-16 left-0 right-0 z-50 border-b border-white/10 bg-[#1a1534] md:hidden">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
              <div className="flex flex-col gap-4 text-white/90">
                <a
                  href="#beneficios"
                  className="rounded-md px-2 py-2 hover:bg-white/10"
                  onClick={() => setMobileNavOpen(false)}
                >
                  {t('nav.benefits')}
                </a>
                <a
                  href="#exemplos"
                  className="rounded-md px-2 py-2 hover:bg-white/10"
                  onClick={() => setMobileNavOpen(false)}
                >
                  {t('nav.examples')}
                </a>
                <a
                  href="#planos"
                  className="rounded-md px-2 py-2 hover:bg-white/10"
                  onClick={() => setMobileNavOpen(false)}
                >
                  {t('nav.plans')}
                </a>
              </div>

              <div className="mt-6 flex items-center gap-2">
                <button
                  onClick={() => setLocale('pt')}
                  className={`flex-1 rounded-md border border-white/10 px-3 py-2 text-sm ${locale === 'pt' ? 'bg-white/10 text-white' : 'text-white/70'}`}
                >
                  PT
                </button>
                <button
                  onClick={() => setLocale('en')}
                  className={`flex-1 rounded-md border border-white/10 px-3 py-2 text-sm ${locale === 'en' ? 'bg-white/10 text-white' : 'text-white/70'}`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLocale('es')}
                  className={`flex-1 rounded-md border border-white/10 px-3 py-2 text-sm ${locale === 'es' ? 'bg-white/10 text-white' : 'text-white/70'}`}
                >
                  ES
                </button>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => {
                    setCurrentPage('auth');
                    setMobileNavOpen(false);
                  }}
                  className="w-full justify-center text-white hover:bg-white/10 hover:text-white"
                >
                  {t('nav.login')}
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    setCurrentPage('auth');
                    setMobileNavOpen(false);
                  }}
                  className="w-full justify-center"
                >
                  {t('nav.start')}
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#0f0b1f] via-[#1a1534] to-[#2d2550] relative overflow-hidden">
        {/* Stars background */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute w-1 h-1 bg-white rounded-full top-[10%] left-[20%] animate-pulse"></div>
          <div className="absolute w-1 h-1 bg-white rounded-full top-[30%] left-[80%] animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute w-1 h-1 bg-white rounded-full top-[60%] left-[15%] animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute w-1 h-1 bg-white rounded-full top-[80%] left-[70%] animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute w-2 h-2 bg-[#c92563] rounded-full top-[40%] left-[60%] animate-pulse" style={{ animationDelay: '1.2s' }}></div>
          <div className="absolute w-2 h-2 bg-[#a21d4c] rounded-full top-[70%] left-[30%] animate-pulse" style={{ animationDelay: '0.7s' }}></div>
        </div>

        {/* Gradient orbs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-[#a21d4c] rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#c92563] rounded-full blur-3xl opacity-20"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#a21d4c]/20 to-[#c92563]/20 border border-[#c92563]/30 mb-6">
                <Sparkles className="w-4 h-4 text-[#c92563]" />
                <span className="text-sm text-white">{t('hero.badge')}</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                {t('hero.title')}
              </h1>
              
              <p className="text-xl text-[#e8e3f0] mb-8 leading-relaxed">
                {t('hero.subtitle')}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button variant="primary" size="lg" onClick={() => setCurrentPage('auth')}>
                  <Zap className="w-5 h-5 mr-2" />
                  {t('hero.cta.start')}
                </Button>
                <Button variant="outline" size="lg" onClick={() => setCurrentPage('public')} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  {t('hero.cta.examples')}
                </Button>
              </div>

              <div className="flex flex-col gap-4 text-sm text-[#e8e3f0] sm:flex-row sm:items-center sm:gap-8">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-[#c92563]" />
                  <span>{t('hero.bullets.nocard')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-[#c92563]" />
                  <span>{t('hero.bullets.setup')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-[#c92563]" />
                  <span>{t('hero.bullets.support')}</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#a21d4c] to-[#c92563] rounded-3xl blur-3xl opacity-30"></div>
              <div className="relative bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl shadow-[#a21d4c]/30 p-8 border border-white/20">
                <div className="space-y-4">
                  {/* Mock Portfolio Preview */}
                  <div className="bg-gradient-to-br from-[#2d2550] to-[#5a4570] rounded-xl p-6 text-white">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#a21d4c] to-[#c92563]"></div>
                      <div>
                        <div className="h-4 w-32 bg-white/20 rounded mb-2"></div>
                        <div className="h-3 w-24 bg-white/10 rounded"></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-24 bg-white/10 rounded-lg"></div>
                      <div className="h-24 bg-white/10 rounded-lg"></div>
                      <div className="h-24 bg-white/10 rounded-lg"></div>
                      <div className="h-24 bg-white/10 rounded-lg"></div>
                    </div>
                  </div>
                  
                  {/* Mock CV Preview */}
                  <div className="bg-white rounded-xl p-4 border border-[#e8e3f0]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-3 w-20 bg-[#a21d4c] rounded"></div>
                      <FileText className="w-4 h-4 text-[#a21d4c]" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 w-full bg-[#f5f3f7] rounded"></div>
                      <div className="h-2 w-4/5 bg-[#f5f3f7] rounded"></div>
                      <div className="h-2 w-3/5 bg-[#f5f3f7] rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-[#f8f7fa] to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#1a1534] mb-4">
              {t('benefits.title').split(' ').slice(0, -2).join(' ')}{' '}
              <span className="bg-gradient-to-r from-[#a21d4c] to-[#7a1538] bg-clip-text text-transparent">
                {t('benefits.title').split(' ').slice(-2).join(' ')}
              </span>
            </h2>
            <p className="text-lg text-[#6b5d7a] max-w-2xl mx-auto">
              {t('benefits.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card hover gradient>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#a21d4c] to-[#c92563] flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#1a1534] mb-2">
                {t('benefits.card.portfolio.title')}
              </h3>
              <p className="text-[#6b5d7a]">
                {t('benefits.card.portfolio.desc')}
              </p>
            </Card>

            <Card hover gradient>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#2d2550] to-[#5a4570] flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#1a1534] mb-2">
                {t('benefits.card.cv.title')}
              </h3>
              <p className="text-[#6b5d7a]">
                {t('benefits.card.cv.desc')}
              </p>
            </Card>

            <Card hover gradient>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#7a1538] to-[#a21d4c] flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#1a1534] mb-2">
                {t('benefits.card.lang.title')}
              </h3>
              <p className="text-[#6b5d7a]">
                {t('benefits.card.lang.desc')}
              </p>
            </Card>

            <Card hover gradient>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#a21d4c] to-[#e94d7a] flex items-center justify-center mb-4">
                <Palette className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#1a1534] mb-2">
                {t('benefits.card.colors.title')}
              </h3>
              <p className="text-[#6b5d7a]">
                {t('benefits.card.colors.desc')}
              </p>
            </Card>

            <Card hover gradient>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#2d2550] to-[#a21d4c] flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#1a1534] mb-2">
                {t('benefits.card.uploads.title')}
              </h3>
              <p className="text-[#6b5d7a]">
                {t('benefits.card.uploads.desc')}
              </p>
            </Card>

            <Card hover gradient>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#7a1538] to-[#c92563] flex items-center justify-center mb-4">
                <LinkIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#1a1534] mb-2">
                {t('benefits.card.link.title')}
              </h3>
              <p className="text-[#6b5d7a]">
                {t('benefits.card.link.desc')}
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Examples Section */}
      <section id="exemplos" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#1a1534] mb-4">
              {t('examples.title').split(' ').slice(0, -2).join(' ')}{' '}
              <span className="bg-gradient-to-r from-[#a21d4c] to-[#7a1538] bg-clip-text text-transparent">
                {t('examples.title').split(' ').slice(-2).join(' ')}
              </span>
            </h2>
            <p className="text-lg text-[#6b5d7a] max-w-2xl mx-auto">
              {t('examples.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card hover className="group">
              <div className="relative h-48 rounded-lg overflow-hidden mb-4">
                    <img
                  src="https://images.unsplash.com/photo-1642974049412-0ed01a0176c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNpY2lhbiUyMHBsYXlpbmclMjBndWl0YXIlMjBzdHVkaW98ZW58MXx8fHwxNzcwNDgxODc4fDA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Músico"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1534]/60 to-transparent"></div>
                <Music className="absolute bottom-4 right-4 w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-[#1a1534] mb-2">{t('examples.card.musicians.title')}</h3>
              <p className="text-sm text-[#6b5d7a]">{t('examples.card.musicians.desc')}</p>
            </Card>

            <Card hover className="group">
              <div className="relative h-48 rounded-lg overflow-hidden mb-4">
                    <img
                  src="https://images.unsplash.com/photo-1732120529252-6829835e7468?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmFwaGljJTIwZGVzaWduZXIlMjB3b3Jrc3BhY2UlMjB0YWJsZXR8ZW58MXx8fHwxNzcwNDgxODc4fDA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Designer"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1534]/60 to-transparent"></div>
                <Paintbrush className="absolute bottom-4 right-4 w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-[#1a1534] mb-2">{t('examples.card.designers.title')}</h3>
              <p className="text-sm text-[#6b5d7a]">{t('examples.card.designers.desc')}</p>
            </Card>

            <Card hover className="group">
              <div className="relative h-48 rounded-lg overflow-hidden mb-4">
                    <img
                  src="https://images.unsplash.com/photo-1603575448878-868a20723f5d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXZlbG9wZXIlMjBjb2RpbmclMjBsYXB0b3B8ZW58MXx8fHwxNzcwNDM0NDQ3fDA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Desenvolvedor"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1534]/60 to-transparent"></div>
                <Code className="absolute bottom-4 right-4 w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-[#1a1534] mb-2">{t('examples.card.devs.title')}</h3>
              <p className="text-sm text-[#6b5d7a]">{t('examples.card.devs.desc')}</p>
            </Card>

            <Card hover className="group">
              <div className="relative h-48 rounded-lg overflow-hidden mb-4">
                    <img
                  src="https://images.unsplash.com/photo-1589979034086-5885b60c8f59?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBidXNpbmVzcyUyMG9mZmljZXxlbnwxfHx8fDE3NzA0ODE4Nzl8MA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Profissional"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1534]/60 to-transparent"></div>
                <Briefcase className="absolute bottom-4 right-4 w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-[#1a1534] mb-2">{t('examples.card.professionals.title')}</h3>
              <p className="text-sm text-[#6b5d7a]">{t('examples.card.professionals.desc')}</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planos" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#f5f3f7] to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#1a1534] mb-4">
              {t('pricing.title').split(' ').slice(0, -2).join(' ')}{' '}
              <span className="bg-gradient-to-r from-[#a21d4c] to-[#7a1538] bg-clip-text text-transparent">
                {t('pricing.title').split(' ').slice(-2).join(' ')}
              </span>
            </h2>
            <p className="text-lg text-[#6b5d7a] max-w-2xl mx-auto">
              {t('pricing.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="text-center">
              <h3 className="text-2xl font-bold text-[#1a1534] mb-2">{t('pricing.basic')}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-[#2d2550]">R$ 19</span>
                <span className="text-[#6b5d7a]">/mês</span>
              </div>
              <ul className="space-y-3 mb-8 text-left">
                <li className="flex items-center gap-2 text-[#6b5d7a]">
                  <Check className="w-5 h-5 text-[#a21d4c] flex-shrink-0" />
                  <span>{t('pricing.feature.basic.portfolio')}</span>
                </li>
                <li className="flex items-center gap-2 text-[#6b5d7a]">
                  <Check className="w-5 h-5 text-[#a21d4c] flex-shrink-0" />
                  <span>{t('pricing.feature.basic.cv')}</span>
                </li>
                <li className="flex items-center gap-2 text-[#6b5d7a]">
                  <Check className="w-5 h-5 text-[#a21d4c] flex-shrink-0" />
                  <span>{t('pricing.feature.basic.projects')}</span>
                </li>
                <li className="flex items-center gap-2 text-[#6b5d7a]">
                  <Check className="w-5 h-5 text-[#a21d4c] flex-shrink-0" />
                  <span>{t('pricing.feature.basic.colors')}</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full" onClick={() => setCurrentPage('auth')}>
                {t('pricing.startFree')}
              </Button>
            </Card>

            <Card className="text-center relative border-2 border-[#a21d4c] shadow-xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#a21d4c] to-[#c92563] text-white px-4 py-1 rounded-full text-sm flex items-center gap-1">
                <Star className="w-4 h-4" />
                {t('pricing.mostPopular')}
              </div>
              <h3 className="text-2xl font-bold text-[#1a1534] mb-2">{t('pricing.pro')}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-[#a21d4c]">R$ 39</span>
                <span className="text-[#6b5d7a]">/mês</span>
              </div>
              <ul className="space-y-3 mb-8 text-left">
                <li className="flex items-center gap-2 text-[#6b5d7a]">
                  <Check className="w-5 h-5 text-[#a21d4c] flex-shrink-0" />
                  <span>{t('pricing.feature.pro.portfolio')}</span>
                </li>
                <li className="flex items-center gap-2 text-[#6b5d7a]">
                  <Check className="w-5 h-5 text-[#a21d4c] flex-shrink-0" />
                  <span>{t('pricing.feature.pro.cv')}</span>
                </li>
                <li className="flex items-center gap-2 text-[#6b5d7a]">
                  <Check className="w-5 h-5 text-[#a21d4c] flex-shrink-0" />
                  <span>{t('pricing.feature.pro.projects')}</span>
                </li>
                <li className="flex items-center gap-2 text-[#6b5d7a]">
                  <Check className="w-5 h-5 text-[#a21d4c] flex-shrink-0" />
                  <span>{t('pricing.feature.pro.colors')}</span>
                </li>
                <li className="flex items-center gap-2 text-[#6b5d7a]">
                  <Check className="w-5 h-5 text-[#a21d4c] flex-shrink-0" />
                  <span>{t('pricing.feature.pro.analytics')}</span>
                </li>
              </ul>
              <Button variant="primary" className="w-full" onClick={() => setCurrentPage('auth')}>
                {t('pricing.startFree')}
              </Button>
            </Card>

            <Card className="text-center">
              <h3 className="text-2xl font-bold text-[#1a1534] mb-2">{t('pricing.premium')}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-[#2d2550]">R$ 69</span>
                <span className="text-[#6b5d7a]">/mês</span>
              </div>
              <ul className="space-y-3 mb-8 text-left">
                <li className="flex items-center gap-2 text-[#6b5d7a]">
                  <Check className="w-5 h-5 text-[#a21d4c] flex-shrink-0" />
                  <span>{t('pricing.feature.premium.portfolio')}</span>
                </li>
                <li className="flex items-center gap-2 text-[#6b5d7a]">
                  <Check className="w-5 h-5 text-[#a21d4c] flex-shrink-0" />
                  <span>{t('pricing.feature.premium.cv')}</span>
                </li>
                <li className="flex items-center gap-2 text-[#6b5d7a]">
                  <Check className="w-5 h-5 text-[#a21d4c] flex-shrink-0" />
                  <span>{t('pricing.feature.premium.projects')}</span>
                </li>
                <li className="flex items-center gap-2 text-[#6b5d7a]">
                  <Check className="w-5 h-5 text-[#a21d4c] flex-shrink-0" />
                  <span>{t('pricing.feature.premium.custom')}</span>
                </li>
                <li className="flex items-center gap-2 text-[#6b5d7a]">
                  <Check className="w-5 h-5 text-[#a21d4c] flex-shrink-0" />
                  <span>{t('pricing.feature.premium.domain')}</span>
                </li>
                <li className="flex items-center gap-2 text-[#6b5d7a]">
                  <Check className="w-5 h-5 text-[#a21d4c] flex-shrink-0" />
                  <span>{t('pricing.feature.premium.support')}</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full" onClick={() => setCurrentPage('auth')}>
                {t('pricing.startFree')}
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="text-center bg-gradient-to-r from-[#2d2550] via-[#a21d4c] to-[#7a1538] border-none p-12">
            <Shield className="w-16 h-16 text-white mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">
              {t('cta.title')}
            </h2>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              {t('cta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="secondary" 
                size="lg" 
                className="bg-white text-[#2d2550] hover:bg-white/90"
                onClick={() => setCurrentPage('auth')}
              >
                <Zap className="w-5 h-5 mr-2" />
                {t('cta.button')}
              </Button>
            </div>
            <p className="text-sm text-white/70 mt-6">
              {t('cta.disclaimer')}
            </p>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-[#e8e3f0]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <Logo size="sm" className="mb-4" />
              <p className="text-sm text-[#6b5d7a]">
                {t('footer.tagline')}
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-[#1a1534] mb-4">{t('footer.product')}</h4>
              <ul className="space-y-2 text-sm text-[#6b5d7a]">
                <li><a href="#" className="hover:text-[#a21d4c] transition-colors">{t('footer.links.features')}</a></li>
                <li><a href="#" className="hover:text-[#a21d4c] transition-colors">{t('footer.links.plans')}</a></li>
                <li><a href="#" className="hover:text-[#a21d4c] transition-colors">{t('footer.links.examples')}</a></li>
                <li><a href="#" className="hover:text-[#a21d4c] transition-colors">{t('footer.links.updates')}</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-[#1a1534] mb-4">{t('footer.company')}</h4>
              <ul className="space-y-2 text-sm text-[#6b5d7a]">
                <li><a href="#" className="hover:text-[#a21d4c] transition-colors">{t('footer.links.about')}</a></li>
                <li><a href="#" className="hover:text-[#a21d4c] transition-colors">{t('footer.links.blog')}</a></li>
                <li><a href="#" className="hover:text-[#a21d4c] transition-colors">{t('footer.links.careers')}</a></li>
                <li><a href="#" className="hover:text-[#a21d4c] transition-colors">{t('footer.links.contact')}</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-[#1a1534] mb-4">{t('footer.support')}</h4>
              <ul className="space-y-2 text-sm text-[#6b5d7a]">
                <li><a href="#" className="hover:text-[#a21d4c] transition-colors">{t('footer.links.help')}</a></li>
                <li><a href="#" className="hover:text-[#a21d4c] transition-colors">{t('footer.links.tutorials')}</a></li>
                <li><a href="#" className="hover:text-[#a21d4c] transition-colors">{t('footer.links.api')}</a></li>
                <li><a href="#" className="hover:text-[#a21d4c] transition-colors">{t('footer.links.status')}</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-[#e8e3f0] flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-[#6b5d7a]">
              © 2026 Portfy. {t('footer.rights')}
            </p>
            <div className="flex gap-6 text-sm text-[#6b5d7a]">
              <a href="#" className="hover:text-[#a21d4c] transition-colors">{t('footer.privacy')}</a>
              <a href="#" className="hover:text-[#a21d4c] transition-colors">{t('footer.terms')}</a>
              <a href="#" className="hover:text-[#a21d4c] transition-colors">{t('footer.cookies')}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}