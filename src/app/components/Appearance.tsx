import { useCallback, useEffect, useMemo, useState } from 'react';
import { Palette, Type, Layout, Sun, Moon, Check } from 'lucide-react';

import { Card } from './Card';
import { Button } from './Button';
import { PublicPortfolio } from './PublicPortfolio';
import type { CV, Experience, FeaturedVideo, Project, ScientificArticle, SubscriptionPlan, UserProfile, UserTheme } from '../types';
import type { PlanLimits } from '../data/plans';
import { useLocale } from '../i18n';

interface AppearanceProps {
  userTheme: UserTheme;
  onThemeChange: (theme: UserTheme) => Promise<void> | void;
  userProfile: UserProfile;
  projects: Project[];
  experiences: Experience[];
  featuredVideos: FeaturedVideo[];
  articles: ScientificArticle[];
  cvs: CV[];
  planTier: SubscriptionPlan;
  planLimits: PlanLimits;
}

type LayoutId = NonNullable<UserTheme['layout']>;
type ThemeMode = NonNullable<UserTheme['themeMode']>;

const fontFamilies = {
  inter: 'Inter, system-ui, sans-serif',
  roboto: 'Roboto, system-ui, sans-serif',
  poppins: 'Poppins, system-ui, sans-serif',
  playfair: '"Playfair Display", Georgia, serif',
  montserrat: 'Montserrat, system-ui, sans-serif',
  lora: 'Lora, Georgia, serif',
} as const;

type FontId = keyof typeof fontFamilies;

interface AppearanceColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

interface AppearanceFormState {
  colors: AppearanceColors;
  fontId: FontId;
  layout: LayoutId;
  themeMode: ThemeMode;
}

const DEFAULT_COLORS: AppearanceColors = {
  primary: '#a21d4c',
  secondary: '#2d2550',
  accent: '#c92563',
  background: '#ffffff',
};

const colorFields: Array<{ key: keyof AppearanceColors; label: string }> = [
  { key: 'primary', label: 'Cor Principal' },
  { key: 'secondary', label: 'Cor Secundária' },
  { key: 'accent', label: 'Cor de Destaque' },
  { key: 'background', label: 'Cor de Fundo' },
];

const COLOR_KEY_ORDER: Array<keyof AppearanceColors> = ['primary', 'secondary', 'accent', 'background'];

const colorPresets: Array<{ name: string; colors: AppearanceColors }> = [
  { name: 'Galaxy Wine (Padrão)', colors: { ...DEFAULT_COLORS } },
  { name: 'Ocean Blue', colors: { primary: '#0077b6', secondary: '#023e8a', accent: '#00b4d8', background: '#ffffff' } },
  { name: 'Forest Green', colors: { primary: '#2d6a4f', secondary: '#1b4332', accent: '#52b788', background: '#ffffff' } },
  { name: 'Sunset Orange', colors: { primary: '#e85d04', secondary: '#6a040f', accent: '#faa307', background: '#ffffff' } },
  { name: 'Purple Dream', colors: { primary: '#7209b7', secondary: '#3c096c', accent: '#b185db', background: '#ffffff' } },
  { name: 'Minimalist Gray', colors: { primary: '#495057', secondary: '#212529', accent: '#6c757d', background: '#ffffff' } },
  { name: 'Coral Reef', colors: { primary: '#ff6b6b', secondary: '#ee5a6f', accent: '#ffa07a', background: '#ffffff' } },
  { name: 'Mint Fresh', colors: { primary: '#06d6a0', secondary: '#118ab2', accent: '#73d2de', background: '#ffffff' } },
  { name: 'Royal Navy', colors: { primary: '#001233', secondary: '#33415c', accent: '#5c677d', background: '#ffffff' } },
  { name: 'Rose Gold', colors: { primary: '#b76e79', secondary: '#8b5a5e', accent: '#e8c4c4', background: '#ffffff' } },
  { name: 'Cyberpunk', colors: { primary: '#ff006e', secondary: '#8338ec', accent: '#3a86ff', background: '#ffffff' } },
  { name: 'Earth Tones', colors: { primary: '#8b5e3c', secondary: '#52392e', accent: '#a67c52', background: '#ffffff' } },
  { name: 'Neon Night', colors: { primary: '#00ff9f', secondary: '#00b8d4', accent: '#00e5ff', background: '#0a0e27' } },
  { name: 'Lavender Dream', colors: { primary: '#9d84b7', secondary: '#6c5b7b', accent: '#c8b8db', background: '#ffffff' } },
  { name: 'Fire & Ice', colors: { primary: '#ff4d4d', secondary: '#1e3a8a', accent: '#60a5fa', background: '#ffffff' } },
];

const fontOptions: Array<{ id: FontId; name: string; style: string }> = [
  { id: 'inter', name: 'Inter', style: 'font-sans' },
  { id: 'roboto', name: 'Roboto', style: 'font-sans' },
  { id: 'poppins', name: 'Poppins', style: 'font-sans' },
  { id: 'playfair', name: 'Playfair Display', style: 'font-serif' },
  { id: 'montserrat', name: 'Montserrat', style: 'font-sans' },
  { id: 'lora', name: 'Lora', style: 'font-serif' },
];

const layoutOptions: Array<{ id: LayoutId; name: string; description: string }> = [
  { id: 'modern', name: 'Moderno', description: 'Visual equilibrado com destaque para cards e métricas' },
  { id: 'minimal', name: 'Minimalista', description: 'Hero centralizado e conteúdo claro e objetivo' },
  { id: 'masonry', name: 'Masonry', description: 'Seções em grade fluida com efeito vitrine' },
  { id: 'list', name: 'Lista', description: 'Estrutura linear inspirada em currículos' },
  { id: 'spotlight', name: 'Spotlight', description: 'Look cinematográfico com foco no herói' },
  { id: 'editorial', name: 'Editorial', description: 'Layout estilo magazine com tipografia forte' },
];

const resolveFontId = (fontFamily?: string): FontId => {
  if (!fontFamily) {
    return 'inter';
  }

  const normalized = fontFamily.toLowerCase();

  if (normalized.includes('roboto')) return 'roboto';
  if (normalized.includes('poppins')) return 'poppins';
  if (normalized.includes('playfair')) return 'playfair';
  if (normalized.includes('montserrat')) return 'montserrat';
  if (normalized.includes('lora')) return 'lora';

  return 'inter';
};

const createDefaultState = (): AppearanceFormState => ({
  colors: { ...DEFAULT_COLORS },
  fontId: 'inter',
  layout: 'modern',
  themeMode: 'light',
});

const mapThemeToState = (theme: UserTheme | undefined): AppearanceFormState => {
  if (!theme) {
    return createDefaultState();
  }

  return {
    colors: {
      primary: theme.primaryColor ?? DEFAULT_COLORS.primary,
      secondary: theme.secondaryColor ?? DEFAULT_COLORS.secondary,
      accent: theme.accentColor ?? DEFAULT_COLORS.accent,
      background: theme.backgroundColor ?? DEFAULT_COLORS.background,
    },
    fontId: resolveFontId(theme.fontFamily),
    layout: (theme.layout ?? 'modern') as LayoutId,
    themeMode: (theme.themeMode ?? 'light') as ThemeMode,
  };
};

const buildThemePayload = (state: AppearanceFormState): UserTheme => ({
  primaryColor: state.colors.primary,
  secondaryColor: state.colors.secondary,
  accentColor: state.colors.accent,
  backgroundColor: state.colors.background,
  fontFamily: fontFamilies[state.fontId],
  themeMode: state.themeMode,
  layout: state.layout,
});

const isStateEqual = (current: AppearanceFormState, baseline: AppearanceFormState): boolean =>
  current.colors.primary === baseline.colors.primary &&
  current.colors.secondary === baseline.colors.secondary &&
  current.colors.accent === baseline.colors.accent &&
  current.colors.background === baseline.colors.background &&
  current.fontId === baseline.fontId &&
  current.layout === baseline.layout &&
  current.themeMode === baseline.themeMode;

const renderLayoutPreview = (layout: LayoutId) => {
  switch (layout) {
    case 'modern':
      return (
        <div className="grid grid-cols-2 gap-1 h-full">
          <div className="bg-[#e8e3f0] rounded" />
          <div className="bg-[#e8e3f0] rounded" />
          <div className="bg-[#e8e3f0] rounded col-span-2 h-2" />
        </div>
      );
    case 'minimal':
      return (
        <div className="space-y-2 h-full">
          <div className="bg-[#e8e3f0] rounded h-1/3" />
          <div className="bg-[#e8e3f0] rounded h-1/3" />
          <div className="bg-[#e8e3f0] rounded h-1/6" />
        </div>
      );
    case 'masonry':
      return (
        <div className="grid grid-cols-3 gap-1 h-full">
          <div className="bg-[#e8e3f0] rounded" />
          <div className="bg-[#e8e3f0] rounded row-span-2" />
          <div className="bg-[#e8e3f0] rounded" />
          <div className="col-span-3 bg-[#e8e3f0] rounded h-1" />
        </div>
      );
    case 'list':
      return (
        <div className="space-y-1 h-full">
          <div className="bg-[#e8e3f0] rounded h-1/4" />
          <div className="bg-[#e8e3f0] rounded h-1/4" />
          <div className="bg-[#e8e3f0] rounded h-1/4" />
        </div>
      );
    case 'spotlight':
      return (
        <div className="relative h-full overflow-hidden rounded">
          <div className="absolute inset-0 bg-gradient-to-br from-[#e8e3f0] to-white" />
          <div className="relative h-1/2 bg-[#d6cfe6] rounded-b-lg" />
          <div className="relative h-2 w-3/4 mx-auto mt-2 bg-[#e8e3f0] rounded" />
        </div>
      );
    case 'editorial':
      return (
        <div className="grid grid-cols-3 gap-1 h-full">
          <div className="col-span-2 bg-[#e8e3f0] rounded" />
          <div className="bg-[#d6cfe6] rounded" />
          <div className="col-span-3 bg-[#e8e3f0] rounded h-1/4" />
        </div>
      );
    default:
      return <div className="bg-[#e8e3f0] rounded h-full" />;
  }
};

export function Appearance({
  userTheme,
  onThemeChange,
  userProfile,
  projects,
  experiences,
  featuredVideos,
  articles,
  cvs,
  planTier,
  planLimits,
}: AppearanceProps) {
  const { t } = useLocale();
  const baselineState = useMemo(() => mapThemeToState(userTheme), [userTheme]);
  const [formState, setFormState] = useState<AppearanceFormState>(baselineState);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const editableColorKeys = useMemo(() => {
    if (planLimits.maxCustomColors === null) {
      return COLOR_KEY_ORDER;
    }
    return COLOR_KEY_ORDER.slice(0, Math.max(0, planLimits.maxCustomColors));
  }, [planLimits.maxCustomColors]);

  const isColorEditable = useCallback(
    (key: keyof AppearanceColors) => editableColorKeys.includes(key),
    [editableColorKeys],
  );

  const canChangeFonts = planLimits.allowCustomFonts;

  useEffect(() => {
    setFormState(baselineState);
    setSaveError(null);
  }, [baselineState]);

  const isDirty = useMemo(() => !isStateEqual(formState, baselineState), [formState, baselineState]);

  const previewTheme = useMemo(() => buildThemePayload(formState), [formState]);

  const previewScrollStyle = useMemo(
    () => ({
      backgroundColor: previewTheme.backgroundColor,
      maxHeight: 'min(1080px, calc(100vh - 200px))',
      minHeight: 'min(680px, calc(100vh - 260px))',
      aspectRatio: '16 / 10',
    }),
    [previewTheme.backgroundColor],
  );

  const updateColor = (key: keyof AppearanceColors, value: string) => {
    if (!isColorEditable(key)) {
      return;
    }
    setFormState((prev) => ({
      ...prev,
      colors: {
        ...prev.colors,
        [key]: value,
      },
    }));
  };

  const applyPreset = (colors: AppearanceColors) => {
    setFormState((prev) => ({
      ...prev,
      colors: { ...colors },
    }));
  };

  const handleSave = async () => {
    setSaveError(null);
    setSaving(true);

    try {
      await onThemeChange(buildThemePayload(formState));
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Falha ao salvar tema.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFormState(createDefaultState());
  };

  return (
    <div className="px-8 pt-8 pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1a1534] mb-2">Aparência</h1>
        <p className="text-[#6b5d7a]">Personalize as cores e o estilo visual do seu portfólio.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#a21d4c] to-[#c92563] flex items-center justify-center">
                <Palette className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-[#1a1534]">Cores</h2>
            </div>

            <div className="space-y-4">
              {colorFields.map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-sm text-[#6b5d7a] mb-2">{label}</label>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <input
                        type="color"
                        value={formState.colors[key]}
                        onChange={(event) => updateColor(key, event.target.value)}
                        disabled={!isColorEditable(key)}
                        className={`w-14 h-14 rounded-full border-4 border-white shadow-lg ${
                          isColorEditable(key) ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                        }`}
                        style={{ boxShadow: `0 0 0 2px ${formState.colors[key]}30` }}
                      />
                    </div>
                    <input
                      type="text"
                      value={formState.colors[key]}
                      onChange={(event) => updateColor(key, event.target.value)}
                      disabled={!isColorEditable(key)}
                      className={`flex-1 px-4 py-2 rounded-lg border border-[#e8e3f0] bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#a21d4c] ${
                        isColorEditable(key) ? '' : 'cursor-not-allowed opacity-60'
                      }`}
                    />
                  </div>
                  {!isColorEditable(key) ? (
                    <p className="mt-2 text-xs text-[#a21d4c]">
                      {t('plan.usage.colors', { limit: planLimits.maxCustomColors ?? colorFields.length })}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-[#e8e3f0]">
              <p className="text-sm text-[#6b5d7a] mb-3 font-semibold">Paletas Pré-definidas</p>
              <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyPreset(preset.colors)}
                    className="group relative flex flex-col gap-2 p-3 rounded-xl border-2 border-[#e8e3f0] hover:border-[#a21d4c] hover:shadow-md transition-all text-left overflow-hidden"
                  >
                    <div className="flex gap-1.5">
                      <div className="w-6 h-6 rounded-full shadow-sm" style={{ backgroundColor: preset.colors.primary }} />
                      <div className="w-6 h-6 rounded-full shadow-sm" style={{ backgroundColor: preset.colors.secondary }} />
                      <div className="w-6 h-6 rounded-full shadow-sm" style={{ backgroundColor: preset.colors.accent }} />
                      <div className="w-6 h-6 rounded-full shadow-sm" style={{ backgroundColor: preset.colors.background }} />
                    </div>
                    <span className="text-xs text-[#6b5d7a] group-hover:text-[#a21d4c] font-medium transition-colors">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#2d2550] to-[#5a4570] flex items-center justify-center">
                <Type className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-[#1a1534]">Tipografia</h2>
            </div>

            <div className="space-y-2">
              {fontOptions.map((font) => (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => {
                    if (!canChangeFonts && font.id !== formState.fontId) {
                      return;
                    }
                    setFormState((prev) => ({ ...prev, fontId: font.id }));
                  }}
                  disabled={!canChangeFonts && font.id !== formState.fontId}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all ${
                    formState.fontId === font.id
                      ? 'border-[#a21d4c] bg-[#a21d4c]/5'
                      : 'border-[#e8e3f0] hover:border-[#a21d4c]/50'
                  } ${!canChangeFonts && font.id !== formState.fontId ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className={`text-[#1a1534] ${font.style}`}>{font.name}</span>
                  {formState.fontId === font.id && <Check className="w-5 h-5 text-[#a21d4c]" />}
                </button>
              ))}
              {!canChangeFonts ? (
                <p className="text-xs text-[#a21d4c] mt-3">{t('plan.limit.fonts')}</p>
              ) : null}
            </div>
          </Card>

          <Card>
            <h3 className="font-bold text-[#1a1534] mb-4">Tema</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormState((prev) => ({ ...prev, themeMode: 'light' }))}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  formState.themeMode === 'light'
                    ? 'border-[#a21d4c] bg-[#a21d4c]/5'
                    : 'border-[#e8e3f0] hover:border-[#a21d4c]/50'
                }`}
              >
                <Sun className="w-5 h-5" />
                <span className="text-sm">Claro</span>
              </button>
              <button
                type="button"
                onClick={() => setFormState((prev) => ({ ...prev, themeMode: 'dark' }))}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  formState.themeMode === 'dark'
                    ? 'border-[#a21d4c] bg-[#a21d4c]/5'
                    : 'border-[#e8e3f0] hover:border-[#a21d4c]/50'
                }`}
              >
                <Moon className="w-5 h-5" />
                <span className="text-sm">Escuro</span>
              </button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#7a1538] to-[#a21d4c] flex items-center justify-center">
                <Layout className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-[#1a1534]">Template do Portfólio</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {layoutOptions.map((layout) => (
                <button
                  key={layout.id}
                  type="button"
                  onClick={() => setFormState((prev) => ({ ...prev, layout: layout.id }))}
                  className={`text-left p-4 rounded-lg border-2 transition-all ${
                    formState.layout === layout.id
                      ? 'border-[#a21d4c] bg-[#a21d4c]/5'
                      : 'border-[#e8e3f0] hover:border-[#a21d4c]/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-[#1a1534]">{layout.name}</h3>
                    {formState.layout === layout.id && <Check className="w-5 h-5 text-[#a21d4c]" />}
                  </div>
                  <p className="text-sm text-[#6b5d7a]">{layout.description}</p>
                  <div className="mt-4 h-24 bg-gradient-to-br from-[#f8f7fa] to-white rounded border border-[#e8e3f0] p-2">
                    {renderLayoutPreview(layout.id)}
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="pb-0">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#1a1534]">Pré-visualização ao Vivo</h2>
              <span className="text-sm text-[#6b5d7a]">Veja como ficará seu portfólio</span>
            </div>

            <p className="text-xs text-[#9b8da8] mb-3">Role dentro da prévia para navegar pelo site completo.</p>

            <div className="rounded-xl border-2 border-[#e8e3f0] shadow-lg overflow-hidden">
              <div className="preview-scroll overflow-x-hidden overflow-y-auto" style={previewScrollStyle}>
                <PublicPortfolio
                  userTheme={previewTheme}
                  userProfile={userProfile}
                  projects={projects}
                  experiences={experiences}
                  articles={articles}
                  featuredVideos={featuredVideos}
                  cvs={cvs}
                  previewMode
                />
              </div>
            </div>
          </Card>

          <div className="space-y-2">
            {saveError && <p className="text-sm text-red-600">{saveError}</p>}
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={handleReset} disabled={saving}>
                Restaurar Padrão
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={!isDirty || saving}>
                {saving ? 'Salvando...' : isDirty ? 'Salvar Personalização' : 'Salvo ✓'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
