import { useState } from 'react';
import type { AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { Logo } from './Logo';
import { Button } from './Button';
import { Card } from './Card';
import { Mail, Lock, User, Github, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useLocale } from '../i18n';

interface AuthProps {
  onLogin?: () => void;
  onBack?: () => void;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export function Auth({ onLogin, onBack }: AuthProps) {
  const { t } = useLocale();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;

  const handleAuthError = (authError: AuthError | null) => {
    if (!authError) {
      return;
    }

    console.error('Supabase auth error', authError);
    const lowered = authError.message?.toLowerCase() ?? '';

    if (lowered.includes('invalid login credentials')) {
      setErrorMessage(t('auth.error.invalidCredentials'));
      return;
    }

    if (lowered.includes('already registered')) {
      setErrorMessage(t('auth.error.emailExists'));
      return;
    }

    setErrorMessage(t('auth.error.generic'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isSupabaseConfigured) {
      setErrorMessage(t('auth.error.supabaseMissing'));
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = fullName.trim();

    setEmail(normalizedEmail);

    if (!normalizedEmail || !password) {
      setErrorMessage(t('auth.error.missingCredentials'));
      return;
    }

    if (!emailPattern.test(normalizedEmail)) {
      setErrorMessage(t('auth.error.emailInvalid'));
      return;
    }

    if (!isLogin) {
      setFullName(normalizedName);

      if (normalizedName.length < 3) {
        setErrorMessage(t('auth.error.fullNameRequired'));
        return;
      }

      if (!passwordPattern.test(password)) {
        setErrorMessage(t('auth.error.passwordWeak'));
        return;
      }

      if (password !== confirmPassword) {
        setErrorMessage(t('auth.error.passwordMismatch'));
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (error) {
          handleAuthError(error);
          return;
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              full_name: normalizedName,
            },
            emailRedirectTo: redirectTo,
          },
        });

        if (error) {
          handleAuthError(error);
          return;
        }
      }

      onLogin?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    setErrorMessage(null);

    if (!isSupabaseConfigured) {
      setErrorMessage(t('auth.error.supabaseMissing'));
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: redirectTo ? { redirectTo } : undefined,
    });

    if (error) {
      handleAuthError(error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0b1f] via-[#1a1534] to-[#2d2550] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated stars background */}
      <div className="absolute inset-0">
        <div className="absolute w-1 h-1 bg-white rounded-full top-[10%] left-[20%] animate-pulse"></div>
        <div className="absolute w-1 h-1 bg-white rounded-full top-[30%] left-[80%] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute w-1 h-1 bg-white rounded-full top-[60%] left-[15%] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute w-1 h-1 bg-white rounded-full top-[80%] left-[70%] animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute w-1 h-1 bg-white rounded-full top-[45%] left-[50%] animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute w-1 h-1 bg-white rounded-full top-[25%] left-[40%] animate-pulse" style={{ animationDelay: '0.8s' }}></div>
        <div className="absolute w-1 h-1 bg-white rounded-full top-[70%] left-[90%] animate-pulse" style={{ animationDelay: '2.2s' }}></div>
      </div>

      {/* Gradient orbs */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-[#a21d4c] rounded-full blur-3xl opacity-20"></div>
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-[#c92563] rounded-full blur-3xl opacity-20"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block mb-6">
            <Logo size="lg" inverted />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isLogin ? t('auth.welcome') : t('auth.create')}
          </h1>
          <p className="text-[#e8e3f0]">
            {isLogin 
              ? t('auth.subtitle.login')
              : t('auth.subtitle.signup')}
          </p>
        </div>

        {/* Auth Card */}
        <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-2xl">
          {!isLogin && (
            <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-[#a21d4c]/10 to-[#c92563]/10 border border-[#a21d4c]/20">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-[#a21d4c]" />
                <p className="text-sm text-[#2d2550]">
                  <strong>15 dias grátis</strong> • Sem cartão de crédito • Cancele quando quiser
                </p>
              </div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label className="block text-sm text-[#6b5d7a] mb-2">{t('auth.fullName')}</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b5d7a]" />
                  <input
                    type="text"
                    placeholder="Seu nome completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                    minLength={3}
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c] transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm text-[#6b5d7a] mb-2">{t('auth.email')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b5d7a]" />
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#6b5d7a] mb-2">{t('auth.password')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b5d7a]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  required
                  minLength={isLogin ? undefined : 8}
                  className="w-full pl-11 pr-11 py-3 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b5d7a] hover:text-[#a21d4c] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm text-[#6b5d7a] mb-2">{t('auth.confirm')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b5d7a]" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    className="w-full pl-11 pr-11 py-3 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b5d7a] hover:text-[#a21d4c] transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {isLogin && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-[#6b5d7a] cursor-pointer">
                  <input type="checkbox" className="rounded text-[#a21d4c] focus:ring-[#a21d4c]" />
                  <span>Lembrar de mim</span>
                </label>
                <a href="#" className="text-[#a21d4c] hover:text-[#c92563] transition-colors">
                  Esqueceu a senha?
                </a>
              </div>
            )}

            {errorMessage && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            <Button variant="primary" className="w-full" size="lg" type="submit" disabled={isSubmitting}>
              {isLogin ? t('auth.login') : t('auth.signup')}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#e8e3f0]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-[#6b5d7a]">{t('auth.or')}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleOAuth('google')}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-[#e8e3f0] hover:border-[#a21d4c] hover:bg-[#f8f7fa] transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="text-sm text-[#2d2550]">Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleOAuth('github')}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-[#e8e3f0] hover:border-[#a21d4c] hover:bg-[#f8f7fa] transition-all"
              >
                <Github className="w-5 h-5 text-[#2d2550]" />
                <span className="text-sm text-[#2d2550]">Github</span>
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#6b5d7a]">
              {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}{' '}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-[#a21d4c] hover:text-[#c92563] font-medium transition-colors"
              >
                {isLogin ? 'Criar conta grátis' : 'Fazer login'}
              </button>
            </p>
          </div>

          {!isLogin && (
            <div className="mt-6 text-center text-xs text-[#6b5d7a]">
              Ao criar uma conta, você concorda com nossos{' '}
              <a href="#" className="text-[#a21d4c] hover:underline">
                Termos de Uso
              </a>{' '}
              e{' '}
              <a href="#" className="text-[#a21d4c] hover:underline">
                Política de Privacidade
              </a>
            </div>
          )}
        </Card>

        {/* Back to home */}
        <div className="text-center mt-6">
          <button 
            onClick={onBack}
            className="text-[#e8e3f0] hover:text-white text-sm transition-colors"
          >
            ← {t('auth.back')}
          </button>
        </div>
      </div>
    </div>
  );
}