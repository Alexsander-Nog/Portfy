import { supabase, isSupabaseConfigured } from "../../lib/supabaseClient";
import type { PostgrestError } from "@supabase/supabase-js";
import type {
  CV,
  EducationItem,
  Experience,
  FeaturedVideo,
  Locale,
  Project,
  ScientificArticle,
  ScientificArticleTranslations,
  Subscription,
  SubscriptionPlan,
  SubscriptionPlanType,
  PortfolioTemplateId,
  CvTemplateId,
  UserProfile,
  UserTheme,
} from "../types";

const TABLES = {
  profiles: "profiles",
  userThemes: "user_themes",
  featuredVideos: "featured_videos",
  projects: "projects",
  experiences: "experiences",
  cvs: "cvs",
  subscriptions: "subscriptions",
  articles: "articles",
} as const;

const TRIAL_DURATION_DAYS = 15;

const isMissingOptionalColumn = (error?: PostgrestError | null) => {
  if (!error) {
    return false;
  }

  if (error.code === "42703" || error.code === "PGRST204") {
    return true;
  }

  const message = (error.message ?? "").toLowerCase();
  if (!message) {
    return false;
  }

  return message.includes("column") && message.includes("does not exist");
};

const isMissingTable = (error?: PostgrestError | null) => {
  if (!error) {
    return false;
  }
  if (error.code === "42P01" || error.code === "42P07" || error.code === "404" || error.code === "PGRST205") {
    return true;
  }
  const message = (error.message ?? "").toLowerCase();
  if (!message) {
    return false;
  }
  return (
    message.includes("does not exist") ||
    message.includes("not found") ||
    message.includes("undefined table") ||
    (message.includes("relation") && message.includes("does not exist"))
  );
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const normalizePortfolioTemplateId = (value?: string | null): PortfolioTemplateId => {
  switch ((value ?? "").toLowerCase()) {
    case "minimal":
    case "minimal-elegant":
      return "minimal";
    case "dark":
    case "dark-professional":
      return "dark";
    case "gradient":
    case "creative-gradient":
      return "gradient";
    case "modern":
    case "dev-modern":
    default:
      return "modern";
  }
};

const normalizeCvTemplateId = (value?: string | null): CvTemplateId => {
  const normalized = (value ?? "").toLowerCase();
  const compact = normalized.replace(/[^a-z0-9]/g, "");

  switch (compact) {
    case "modernclassic":
    case "modernplus":
    case "moderno":
      return "modernClassic";
    case "minimalelegant":
    case "minimalista":
    case "minimalcolumns":
      return "minimalElegant";
    case "corporate":
    case "corporativo":
      return "corporate";
    case "creativeaccent":
    case "criativo":
    case "creativepulse":
      return "creativeAccent";
    case "minimal":
    case "minimalrecruiter":
      return "minimal";
    case "creative":
    case "creativedesigner":
      return "creative";
    case "executive":
    case "executivepro":
      return "executive";
    case "modernclean":
    case "modern":
    default:
      return "modern";
  }
};

const SUBSCRIPTION_SELECT_COLUMNS = [
  "id",
  "user_id",
  "status",
  "plan_type",
  "plan_tier",
  "subscription_active",
  "trial_start",
  "trial_end",
  "trial_ends_at",
  "current_period_end",
  "grace_days",
  "updated_at",
].join(", ");

type SubscriptionRow = {
  id: string;
  user_id: string;
  status: string;
  plan_type?: string | null;
  plan_tier?: string | null;
  subscription_active?: boolean | null;
  trial_start?: string | null;
  trial_end?: string | null;
  trial_ends_at?: string | null;
  current_period_end?: string | null;
  grace_days?: number | null;
  updated_at: string;
};

const normalizeSubscriptionRow = (row: SubscriptionRow): SubscriptionRow => {
  const now = new Date();
  const startSource = row.trial_start ? new Date(row.trial_start) : now;
  const validStart = Number.isNaN(startSource.getTime()) ? now : startSource;
  const endSource = row.trial_end ?? row.trial_ends_at;
  const derivedEnd = endSource ? new Date(endSource) : new Date(validStart.getTime() + TRIAL_DURATION_DAYS * DAY_IN_MS);
  const validEnd = Number.isNaN(derivedEnd.getTime())
    ? new Date(validStart.getTime() + TRIAL_DURATION_DAYS * DAY_IN_MS)
    : derivedEnd;

  return {
    ...row,
    plan_type: row.plan_type ?? "trial",
    plan_tier: row.plan_tier ?? "pro",
    subscription_active: row.subscription_active ?? true,
    trial_start: validStart.toISOString(),
    trial_end: validEnd.toISOString(),
    trial_ends_at: row.trial_ends_at ?? validEnd.toISOString(),
  };
};

const mapSubscriptionRow = (row: SubscriptionRow): Subscription => {
  const planType = (row.plan_type ?? "trial") as SubscriptionPlanType;
  const planTier = (row.plan_tier as SubscriptionPlan | null) ?? "pro";
  const subscriptionActive = row.subscription_active ?? true;
  const trialStart = row.trial_start ?? undefined;
  const trialEndsAt = row.trial_end ?? row.trial_ends_at ?? undefined;

  let trialDaysRemaining: number | undefined;
  let trialExpired = false;

  if (trialEndsAt) {
    const endDate = new Date(trialEndsAt);
    const endTime = endDate.getTime();
    if (!Number.isNaN(endTime)) {
      const diffMs = endTime - Date.now();
      if (diffMs <= 0) {
        trialDaysRemaining = 0;
        trialExpired = true;
      } else {
        trialDaysRemaining = Math.max(0, Math.ceil(diffMs / DAY_IN_MS));
      }
    }
  }

  if (planType === "trial" && (!subscriptionActive || trialExpired)) {
    trialExpired = true;
  }

  return {
    id: row.id,
    userId: row.user_id,
    status: row.status as Subscription["status"],
    planType,
    planTier,
    subscriptionActive,
    trialStart,
    trialEndsAt,
    currentPeriodEnd: row.current_period_end ?? undefined,
    graceDays: row.grace_days ?? undefined,
    trialDaysRemaining,
    trialExpired,
    updatedAt: row.updated_at,
  };
};

type ProjectRow = {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  tags: string[] | null;
  link: string | null;
  category: string | null;
  type: "standard" | "github" | "media" | "professional" | null;
  repo_url: string | null;
  media_url: string | null;
  pdf_url: string | null;
  company: string | null;
  results: string | null;
  position: number | null;
  translations?: Record<string, any> | null;
};

const mapProjectRow = (project: ProjectRow): Project => ({
  id: project.id,
  title: project.title,
  description: project.description,
  image: project.image_url ?? undefined,
  tags: project.tags ?? [],
  link: project.link ?? undefined,
  category: project.category ?? undefined,
  type: project.type ?? undefined,
  repoUrl: project.repo_url ?? undefined,
  mediaUrl: project.media_url ?? undefined,
  pdfUrl: project.pdf_url ?? undefined,
  company: project.company ?? undefined,
  results: project.results ?? undefined,
  position: project.position ?? undefined,
  translations: project.translations ?? undefined,
});

type ExperienceRow = {
  id: string;
  title: string;
  company: string;
  period: string;
  description: string;
  location: string | null;
  current: boolean | null;
  certificate_url: string | null;
  show_certificate: boolean | null;
  position: number | null;
  translations?: Record<string, any> | null;
};

const mapExperienceRow = (experience: ExperienceRow): Experience => ({
  id: experience.id,
  title: experience.title,
  company: experience.company,
  period: experience.period,
  description: experience.description,
  location: experience.location ?? undefined,
  current: experience.current ?? undefined,
  certificateUrl: experience.certificate_url ?? undefined,
  showCertificate: experience.show_certificate ?? true,
  position: experience.position ?? undefined,
  translations: experience.translations ?? undefined,
});

type ScientificArticleRow = {
  id: string;
  title: string;
  publication: string | null;
  publication_date: string | null;
  summary: string | null;
  link: string | null;
  doi: string | null;
  authors: string[] | null;
  show_in_portfolio: boolean | null;
  show_in_cv: boolean | null;
  position: number | null;
  translations?: Record<string, any> | null;
};

const mapScientificArticleRow = (article: ScientificArticleRow): ScientificArticle => ({
  id: article.id,
  title: article.title,
  publication: article.publication ?? undefined,
  publicationDate: article.publication_date ?? undefined,
  summary: article.summary ?? undefined,
  link: article.link ?? undefined,
  doi: article.doi ?? undefined,
  authors: article.authors ?? undefined,
  showInPortfolio: article.show_in_portfolio ?? undefined,
  showInCv: article.show_in_cv ?? undefined,
  position: article.position ?? undefined,
  translations: normalizeArticleTranslations(article.translations ?? null),
});

function normalizeArticleTranslations(
  translations: Record<string, any> | null,
): ScientificArticleTranslations | undefined {
  if (!translations) {
    return undefined;
  }

  const normalized: ScientificArticleTranslations = {};
  const locales: Array<keyof ScientificArticleTranslations> = ["en", "es"];

  for (const locale of locales) {
    const raw = translations[locale];
    if (!raw || typeof raw !== "object") {
      continue;
    }

    const cleaned: Record<string, string> = {};
    if (typeof raw.title === "string" && raw.title.trim()) {
      cleaned.title = raw.title.trim();
    }
    if (typeof raw.summary === "string" && raw.summary.trim()) {
      cleaned.summary = raw.summary.trim();
    }
    if (typeof raw.publication === "string" && raw.publication.trim()) {
      cleaned.publication = raw.publication.trim();
    }

    if (Object.keys(cleaned).length > 0) {
      normalized[locale] = cleaned;
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

// Helper function to remove undefined fields from objects (for JSONB columns)
function removeUndefinedFields<T extends Record<string, any>>(obj: T): Partial<T> {
  const cleaned: any = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  }
  return cleaned;
}

// Helper to ensure JSONB compatibility - parse and stringify to validate
function ensureValidJsonb(obj: any): any {
  if (!obj || Object.keys(obj).length === 0) {
    return {};
  }
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (e) {
    console.error('Invalid JSONB object:', e);
    return {};
  }
}

const isValidHttpUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (error) {
    return false;
  }
};

const sanitizeMediaUrl = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return isValidHttpUrl(trimmed) ? trimmed : null;
};

const sanitizeOptionalString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const sanitizeStringArray = (raw: unknown, maxItems = 50): string[] => {
  if (!Array.isArray(raw)) {
    return [];
  }

  const seen = new Set<string>();
  const sanitized: string[] = [];

  for (const entry of raw) {
    if (typeof entry !== "string") {
      continue;
    }

    const trimmed = entry.trim();
    if (!trimmed) {
      continue;
    }

    const dedupeKey = trimmed.toLowerCase();
    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
    sanitized.push(trimmed);

    if (sanitized.length >= maxItems) {
      break;
    }
  }

  return sanitized;
};

const sanitizeSocialLinks = (links: UserProfile["socialLinks"] | undefined): Record<string, string> | null => {
  if (!links) {
    return null;
  }

  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(links)) {
    if (typeof value !== "string") {
      continue;
    }

    const trimmed = value.trim();
    if (trimmed.length === 0) {
      continue;
    }

    sanitized[key] = trimmed;
  }

  return Object.keys(sanitized).length > 0 ? sanitized : null;
};

function sanitizeArticleTranslations(
  translations?: ScientificArticleTranslations | null,
): Record<string, any> | null {
  if (!translations) {
    return null;
  }

  const locales: Array<keyof ScientificArticleTranslations> = ["en", "es"];
  const sanitized: ScientificArticleTranslations = {};

  for (const locale of locales) {
    const raw = translations[locale];
    if (!raw) {
      continue;
    }

    const cleaned = removeUndefinedFields({
      title: raw.title?.trim() || undefined,
      summary: raw.summary?.trim() || undefined,
      publication: raw.publication?.trim() || undefined,
    });

    if (Object.keys(cleaned).length > 0) {
      sanitized[locale] = cleaned;
    }
  }

  return Object.keys(sanitized).length > 0 ? ensureValidJsonb(sanitized) : null;
}

const generateLocalId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}`;
};

const buildLocalArticle = (
  article: Omit<ScientificArticle, "id">,
  id: string = generateLocalId(),
): ScientificArticle => ({
  id,
  title: article.title,
  publication: article.publication,
  publicationDate: article.publicationDate,
  summary: article.summary,
  link: article.link,
  doi: article.doi,
  authors: article.authors,
  showInPortfolio: article.showInPortfolio ?? true,
  showInCv: article.showInCv ?? true,
  position: article.position,
  translations: article.translations,
});

const sanitizeYearValue = (value: unknown): string => {
  if (typeof value === "number") {
    return String(value).replace(/[^0-9]/g, "").slice(0, 4);
  }
  if (typeof value !== "string") {
    return "";
  }
  return value.replace(/[^0-9]/g, "").slice(0, 4);
};

const parsePeriodYears = (raw: unknown): { start: string; end: string } => {
  if (typeof raw !== "string") {
    return { start: "", end: "" };
  }
  const parts = raw.split(/[-–—]/);
  const start = sanitizeYearValue(parts[0] ?? "");
  const end = sanitizeYearValue(parts[1] ?? "");
  return { start, end };
};

const buildEducationPeriod = (start: string, end: string, fallback?: string): string => {
  if (start && end) {
    return `${start} - ${end}`;
  }
  if (start) {
    return start;
  }
  if (end) {
    return end;
  }
  return fallback?.trim() ?? "";
};

const normalizeEducationEntries = (raw: any): EducationItem[] => {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((entry: any) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const institution = typeof entry.institution === "string" ? entry.institution : "";
      const degree = typeof entry.degree === "string" ? entry.degree : "";
      const description = typeof entry.description === "string" && entry.description.trim().length > 0
        ? entry.description.trim()
        : undefined;

      const { start: periodStart, end: periodEnd } = parsePeriodYears(entry.period);
      const startYear = sanitizeYearValue(entry.startYear ?? periodStart);
      const endYear = sanitizeYearValue(entry.endYear ?? periodEnd);
      const period = buildEducationPeriod(startYear, endYear, typeof entry.period === "string" ? entry.period : undefined);

      if (!institution && !degree && !startYear && !endYear && !description) {
        return null;
      }

      return {
        institution,
        degree,
        description,
        startYear: startYear || undefined,
        endYear: endYear || undefined,
        period: period || undefined,
      } as EducationItem;
    })
    .filter((entry): entry is EducationItem => entry !== null);
};

const mapProfileRow = (row: Record<string, any>): UserProfile => {
  const rawSocialLinks = row.social_links && typeof row.social_links === 'object'
    ? (row.social_links as UserProfile['socialLinks'])
    : undefined;
  const socialLinks = sanitizeSocialLinks(rawSocialLinks) ?? undefined;
  const education = normalizeEducationEntries(row.education);
  const translations = row.translations && typeof row.translations === 'object'
    ? row.translations
    : undefined;
  const trialStart = typeof row.trial_start === 'string' ? row.trial_start : undefined;
  const trialEnd = typeof row.trial_end === 'string' ? row.trial_end : undefined;
  const showCvPhoto = typeof row.show_cv_photo === 'boolean' ? row.show_cv_photo : undefined;
  const skills = sanitizeStringArray(row.skills);

  let trialDaysRemaining: number | undefined;
  if (trialEnd) {
    const endDate = new Date(trialEnd);
    const endTime = endDate.getTime();
    if (!Number.isNaN(endTime)) {
      const diffMs = endTime - Date.now();
      if (diffMs <= 0) {
        trialDaysRemaining = 0;
      } else {
        trialDaysRemaining = Math.max(0, Math.ceil(diffMs / DAY_IN_MS));
      }
    }
  }

  return {
    id: row.id,
    fullName: row.full_name,
    slug: row.slug ?? undefined,
    title: row.title ?? undefined,
    bio: row.bio ?? undefined,
    location: row.location ?? undefined,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    photoUrl: row.photo_url ?? undefined,
    socialLinks,
    skills,
    education,
    translations,
    preferredLocale: (row.preferred_locale as Locale | null) ?? undefined,
    portfolioTemplate: normalizePortfolioTemplateId(row.theme_template as string | null),
    cvTemplate: normalizeCvTemplateId(row.cv_template as string | null),
    showCvPhoto,
    trialStart,
    trialEnd,
    trialDaysRemaining,
  };
};

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  console.log('=== fetchUserProfile INICIADO ===');
  console.log('userId:', userId);
  
  if (!isSupabaseConfigured) {
    console.warn('Supabase não configurado no fetchUserProfile');
    return null;
  }

  const { data, error } = await supabase
    .from(TABLES.profiles)
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  console.log('Resposta do Supabase (fetchUserProfile):');
  console.log('  data:', data);
  console.log('  error:', error);

  if (error) {
    console.error('Erro não tratado no fetchUserProfile:', error);
    return null;
  }

  if (!data) {
    console.warn('Nenhum dado retornado no fetchUserProfile');
    return null;
  }

  console.log('Perfil carregado com sucesso do Supabase:', data);
  const result = mapProfileRow(data as Record<string, any>);
  console.log('Resultado processado do fetchUserProfile:', result);
  return result;
}

export async function fetchUserProfileBySlug(slug: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase não configurado no fetchUserProfileBySlug');
    return null;
  }

  const { data, error } = await supabase
    .from(TABLES.profiles)
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error('Erro no fetchUserProfileBySlug:', error);
    return null;
  }

  if (!data) {
    return null;
  }

  return mapProfileRow(data as Record<string, any>);
}

export async function upsertUserProfile(userId: string, profile: UserProfile): Promise<UserProfile | null> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase não configurado no upsertUserProfile');
    return null;
  }

  let cleanTranslations: Record<string, any> | null = null;
  if (profile.translations && typeof profile.translations === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [localeKey, value] of Object.entries(profile.translations)) {
      if (!value || typeof value !== 'object') {
        continue;
      }

      const trimmed: Record<string, string> = {};
      for (const [fieldKey, fieldValue] of Object.entries(value)) {
        if (typeof fieldValue === 'string') {
          const normalized = fieldValue.trim();
          if (normalized.length > 0) {
            trimmed[fieldKey] = normalized;
          }
        }
      }

      if (Object.keys(trimmed).length > 0) {
        cleaned[localeKey] = trimmed;
      }
    }

    if (Object.keys(cleaned).length > 0) {
      cleanTranslations = cleaned;
    }
  }

  const sanitizedTitle = sanitizeOptionalString(profile.title);
  const sanitizedBio = sanitizeOptionalString(profile.bio);
  const sanitizedLocation = sanitizeOptionalString(profile.location);
  const sanitizedEmail = sanitizeOptionalString(profile.email);
  const sanitizedPhone = sanitizeOptionalString(profile.phone);
  const sanitizedSkills = sanitizeStringArray(profile.skills);
  const sanitizedSocialLinks = sanitizeSocialLinks(profile.socialLinks);
  const normalizedEducation = normalizeEducationEntries(profile.education ?? []);
  const educationJson = normalizedEducation.length > 0 ? ensureValidJsonb(normalizedEducation) : null;
  const translationsJson = cleanTranslations ? ensureValidJsonb(cleanTranslations) : null;
  const normalizedFullName = (profile.fullName ?? '').trim();
  const fallbackFullName = normalizedFullName.length > 0 ? normalizedFullName : 'Portfolio User';
  const photoUrl = sanitizeMediaUrl(profile.photoUrl) ?? null;
  const socialLinksJson = sanitizedSocialLinks ? ensureValidJsonb(sanitizedSocialLinks) : null;

  const payload: Record<string, any> = {
    id: userId,
    full_name: fallbackFullName,
    title: sanitizedTitle,
    bio: sanitizedBio,
    location: sanitizedLocation,
    email: sanitizedEmail,
    phone: sanitizedPhone,
    photo_url: photoUrl,
    social_links: socialLinksJson,
    skills: sanitizedSkills,
    education: educationJson,
    translations: translationsJson,
    theme_template: normalizePortfolioTemplateId(profile.portfolioTemplate),
    cv_template: normalizeCvTemplateId(profile.cvTemplate),
  };

  if (typeof profile.showCvPhoto === 'boolean') {
    payload.show_cv_photo = profile.showCvPhoto;
  }

  if (profile.preferredLocale) {
    payload.preferred_locale = profile.preferredLocale;
  }

  if (profile.trialStart) {
    payload.trial_start = profile.trialStart;
  }

  if (profile.trialEnd) {
    payload.trial_end = profile.trialEnd;
  }

  if (typeof profile.slug === 'string') {
    const trimmedSlug = profile.slug.trim();
    if (trimmedSlug) {
      payload.slug = trimmedSlug;
    }
  }

  if (!payload.education) {
    payload.education = null;
  }

  if (!payload.translations) {
    payload.translations = null;
  }

  if (!payload.social_links) {
    payload.social_links = null;
  }

  if (!Array.isArray(payload.skills)) {
    payload.skills = [];
  }

  const upsertResult = await supabase
    .from(TABLES.profiles)
    .upsert(removeUndefinedFields(payload), { onConflict: 'id' })
    .select("id, full_name, title, bio, location, email, phone, photo_url, social_links, skills, education, translations, preferred_locale, theme_template, cv_template, show_cv_photo, trial_start, trial_end")
    .single();

  if (isMissingOptionalColumn(upsertResult.error)) {
    console.warn('Coluna opcional ausente em upsertUserProfile. Aplicando payload de fallback.', upsertResult.error);

    const fallbackPayload = removeUndefinedFields({
      id: userId,
      full_name: fallbackFullName,
      title: sanitizedTitle,
      bio: sanitizedBio,
      location: sanitizedLocation,
      email: sanitizedEmail,
      phone: sanitizedPhone,
      photo_url: photoUrl,
    });

    const fallbackResult = await supabase
      .from(TABLES.profiles)
      .upsert(fallbackPayload, { onConflict: 'id' })
      .select('id, full_name, title, bio, location, email, phone, photo_url')
      .maybeSingle();

    if (fallbackResult.error) {
      console.error('Erro ao executar fallback no upsertUserProfile:', fallbackResult.error);
      return null;
    }

    if (!fallbackResult.data) {
      console.error('Nenhum dado retornado após fallback no upsertUserProfile');
      return null;
    }

    return mapProfileRow(fallbackResult.data as Record<string, any>);
  }

  if (upsertResult.error) {
    console.error('Erro ao upsert profile:', upsertResult.error);
    return null;
  }

  const data = upsertResult.data;

  if (!data) {
    console.error('Nenhum dado retornado após upsert no upsertUserProfile');
    return null;
  }

  console.log('Perfil salvo com sucesso no upsertUserProfile:', data);
  return mapProfileRow(data as Record<string, any>);
}

export async function updatePreferredLocale(
  userId: string,
  preferredLocale: Locale,
  fallback?: { fullName?: string | null; email?: string | null },
): Promise<Locale | null> {
  if (!isSupabaseConfigured) {
    return preferredLocale;
  }
  const fallbackPayload: Record<string, any> = {
    id: userId,
    preferred_locale: preferredLocale,
    full_name: fallback?.fullName ?? null,
    email: fallback?.email ?? null,
  };

  const runFallbackUpsert = async (): Promise<Locale | null> => {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from(TABLES.profiles)
      .upsert(fallbackPayload, { onConflict: 'id' })
      .select('preferred_locale')
      .maybeSingle();

    if (fallbackError) {
      console.error('Erro no fallback de updatePreferredLocale:', fallbackError);
      return null;
    }

    return (fallbackData?.preferred_locale as Locale | null) ?? preferredLocale;
  };

  const { data, error } = await supabase
    .from(TABLES.profiles)
    .update({ preferred_locale: preferredLocale })
    .eq('id', userId)
    .select('preferred_locale')
    .maybeSingle();

  if (!error && data) {
    return (data.preferred_locale as Locale | null) ?? preferredLocale;
  }

  if (!error) {
    return await runFallbackUpsert();
  }

  if (isMissingOptionalColumn(error)) {
    console.warn('preferred_locale column ausente, aplicando fallback minimal update. Erro original:', error);
    return await runFallbackUpsert();
  }

  console.error('Erro ao atualizar preferred_locale:', error);
  return preferredLocale;
}

export async function fetchUserTheme(userId: string): Promise<UserTheme | null> {
  console.log('=== fetchUserTheme INICIADO ===');
  console.log('userId:', userId);
  
  if (!isSupabaseConfigured) {
    console.warn('Supabase não configurado no fetchUserTheme');
    return null;
  }

  const { data, error } = await supabase
    .from(TABLES.userThemes)
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  console.log('Resposta do Supabase (fetchUserTheme):');
  console.log('  data:', data);

  if (error) {
    console.error('Erro no fetchUserTheme:', error);
    return null;
  }

  if (!data) {
    console.warn('Nenhum tema encontrado no fetchUserTheme');
    return null;
  }

  console.log('Tema carregado com sucesso do Supabase:', data);
  const result = {
    primaryColor: data.primary_color,
    secondaryColor: data.secondary_color,
    accentColor: data.accent_color,
    backgroundColor: data.background_color,
    fontFamily: data.font_family,
    themeMode: (data.theme_mode as UserTheme["themeMode"]) ?? "light",
    layout: (data.layout as UserTheme["layout"]) ?? "modern",
  };
  console.log('Resultado processado do fetchUserTheme:', result);
  console.log('🔍 Layout do banco:', data.layout, '→ resultado:', result.layout);
  console.log('=== fetchUserTheme CONCLUÍDO ===');
  return result;
}

export async function fetchFeaturedVideos(userId: string): Promise<FeaturedVideo[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  const { data, error } = await supabase
    .from(TABLES.featuredVideos)
    .select("id, url, platform, title, description, tags, position")
    .eq("user_id", userId)
    .order("position", { ascending: true });

  if (error || !data) {
    return [];
  }

  const rows = data as Array<{
    id: string;
    url: string;
    platform: 'youtube' | 'instagram';
    title: string;
    description: string;
    tags: string[] | null;
    position: number | null;
  }>;

  return rows.map((video) => ({
    id: video.id,
    url: video.url,
    platform: video.platform,
    title: video.title,
    description: video.description,
    tags: video.tags ?? [],
    position: video.position ?? undefined,
  }));
}

export async function fetchProjects(userId: string): Promise<Project[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  const { data, error } = await supabase
    .from(TABLES.projects)
    .select("id, title, description, image_url, tags, link, category, type, repo_url, media_url, pdf_url, company, results, position, translations")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (isMissingOptionalColumn(error)) {
    const fallback = await supabase
      .from(TABLES.projects)
      .select("id, title, description, image_url, tags, link, category, type, repo_url, media_url, pdf_url, company, results, position")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (fallback.error || !fallback.data) {
      return [];
    }

    return (fallback.data as ProjectRow[]).map(mapProjectRow);
  }

  if (error || !data) {
    return [];
  }

  return (data as ProjectRow[]).map(mapProjectRow);
}

export async function fetchExperiences(userId: string): Promise<Experience[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  const { data, error } = await supabase
    .from(TABLES.experiences)
    .select("id, title, company, period, description, location, current, certificate_url, show_certificate, position, translations")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (isMissingOptionalColumn(error)) {
    const fallback = await supabase
      .from(TABLES.experiences)
      .select("id, title, company, period, description, location, current, certificate_url, show_certificate, position")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (fallback.error || !fallback.data) {
      return [];
    }

    return (fallback.data as ExperienceRow[]).map(mapExperienceRow);
  }

  if (error || !data) {
    return [];
  }

  return (data as ExperienceRow[]).map(mapExperienceRow);
}

export async function fetchScientificArticles(userId: string): Promise<ScientificArticle[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  const { data, error } = await supabase
    .from(TABLES.articles)
    .select(
      "id, title, publication, publication_date, summary, link, doi, authors, show_in_portfolio, show_in_cv, position, translations"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (isMissingOptionalColumn(error)) {
    const fallback = await supabase
      .from(TABLES.articles)
      .select(
        "id, title, publication, publication_date, summary, link, doi, authors, show_in_portfolio, show_in_cv, position"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (fallback.error || !fallback.data) {
      if (fallback.error && fallback.error.code !== "42P01") {
        console.error("Erro ao buscar artigos científicos (fallback):", fallback.error);
      }
      return [];
    }

    return (fallback.data as ScientificArticleRow[]).map(mapScientificArticleRow);
  }

  if (error || !data) {
    if (error && error.code !== "42P01") {
      console.error("Erro ao buscar artigos científicos:", error);
    }
    return [];
  }

  return (data as ScientificArticleRow[]).map(mapScientificArticleRow);
}

export async function fetchCvs(userId: string): Promise<CV[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  let { data, error } = await supabase
    .from(TABLES.cvs)
    .select("id, name, language, selected_projects, selected_experiences, selected_articles, show_cv_photo, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (isMissingOptionalColumn(error)) {
    const fallback = await supabase
      .from(TABLES.cvs)
      .select("id, name, language, selected_projects, selected_experiences, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    data = fallback.data;
    error = fallback.error;
  }

  if (error || !data) {
    return [];
  }

  const rows = data as Array<{
    id: string;
    name: string;
    language: 'pt' | 'en' | 'es';
    selected_projects: string[] | null;
    selected_experiences: string[] | null;
    selected_articles?: string[] | null;
    show_cv_photo?: boolean | null;
    created_at: string;
    updated_at: string;
  }>;

  return rows.map((cv) => ({
    id: cv.id,
    name: cv.name,
    language: cv.language,
    selectedProjects: cv.selected_projects ?? [],
    selectedExperiences: cv.selected_experiences ?? [],
    selectedArticles: cv.selected_articles ?? [],
    showCvPhoto: typeof cv.show_cv_photo === 'boolean' ? cv.show_cv_photo : undefined,
    createdAt: cv.created_at,
    updatedAt: cv.updated_at,
  }));
}

export async function fetchSubscription(userId: string): Promise<Subscription | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  let missingOptionalColumns = false;

  let { data, error } = await supabase
    .from(TABLES.subscriptions)
    .select(SUBSCRIPTION_SELECT_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();

  if (isMissingOptionalColumn(error)) {
    missingOptionalColumns = true;
    const fallback = await supabase
      .from(TABLES.subscriptions)
      .select("id, user_id, status, plan_tier, trial_ends_at, current_period_end, grace_days, updated_at")
      .eq("user_id", userId)
      .maybeSingle();

    data = fallback.data as typeof data;
    error = fallback.error;
  }

  if (error || !data) {
    return null;
  }

  const originalRow = data as SubscriptionRow;
  const normalizedRow = normalizeSubscriptionRow(originalRow);

  const updates: Record<string, unknown> = {};
  if (!missingOptionalColumns) {
    if (originalRow.plan_type !== normalizedRow.plan_type) {
      updates.plan_type = normalizedRow.plan_type;
    }
    if (originalRow.plan_tier !== normalizedRow.plan_tier) {
      updates.plan_tier = normalizedRow.plan_tier;
    }
    if (originalRow.subscription_active !== normalizedRow.subscription_active) {
      updates.subscription_active = normalizedRow.subscription_active;
    }
    if (originalRow.trial_start !== normalizedRow.trial_start) {
      updates.trial_start = normalizedRow.trial_start;
    }
    const originalTrialEnd = originalRow.trial_end ?? originalRow.trial_ends_at;
    if (originalTrialEnd !== normalizedRow.trial_end) {
      updates.trial_end = normalizedRow.trial_end;
      updates.trial_ends_at = normalizedRow.trial_end;
    }
  }

  let subscription = mapSubscriptionRow(normalizedRow);

  if (subscription.planType === "trial" && subscription.trialExpired) {
    if (subscription.subscriptionActive) {
      updates.subscription_active = false;
      subscription = { ...subscription, subscriptionActive: false };
    }
    if (subscription.status !== "blocked") {
      updates.status = "blocked";
      subscription = { ...subscription, status: "blocked" };
    }
    subscription = { ...subscription, trialDaysRemaining: 0, trialExpired: true };
  }

  if (!missingOptionalColumns && Object.keys(updates).length > 0) {
    await supabase
      .from(TABLES.subscriptions)
      .update(updates)
      .eq("id", normalizedRow.id);
  }

  return subscription;
}

export async function ensureSubscription(userId: string, trialDays = TRIAL_DURATION_DAYS): Promise<Subscription | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  const existing = await supabase
    .from(TABLES.subscriptions)
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing.error && !isMissingOptionalColumn(existing.error) && existing.error.code !== "PGRST116") {
    return null;
  }

  if (!existing.data) {
    const now = new Date();
    const startIso = now.toISOString();
    const endIso = new Date(now.getTime() + trialDays * DAY_IN_MS).toISOString();

    let insertResult = await supabase
      .from(TABLES.subscriptions)
      .insert({
        user_id: userId,
        status: "trialing",
        plan_type: "trial",
        plan_tier: "pro",
        subscription_active: true,
        trial_start: startIso,
        trial_end: endIso,
        trial_ends_at: endIso,
      })
      .select(SUBSCRIPTION_SELECT_COLUMNS)
      .single();

    if (isMissingOptionalColumn(insertResult.error)) {
      insertResult = await supabase
        .from(TABLES.subscriptions)
        .insert({
          user_id: userId,
          status: "trialing",
          plan_tier: "pro",
          trial_ends_at: endIso,
        })
        .select("id, user_id, status, plan_tier, trial_ends_at, current_period_end, grace_days, updated_at")
        .single();
    }

    if (insertResult.error || !insertResult.data) {
      return null;
    }

    const normalized = normalizeSubscriptionRow(insertResult.data as SubscriptionRow);
    return mapSubscriptionRow(normalized);
  }

  return fetchSubscription(userId);
}

export async function createCv(userId: string, cv: Omit<CV, "id" | "createdAt" | "updatedAt">): Promise<CV | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  const insertPayload: Record<string, any> = {
    user_id: userId,
    name: cv.name,
    language: cv.language,
    selected_projects: cv.selectedProjects ?? [],
    selected_experiences: cv.selectedExperiences ?? [],
    selected_articles: cv.selectedArticles ?? [],
  };

  if (typeof cv.showCvPhoto === 'boolean') {
    insertPayload.show_cv_photo = cv.showCvPhoto;
  }

  let { data, error } = await supabase
    .from(TABLES.cvs)
    .insert(insertPayload)
    .select("id, name, language, selected_projects, selected_experiences, selected_articles, show_cv_photo, created_at, updated_at")
    .single();

  if (isMissingOptionalColumn(error)) {
    const fallbackPayload = { ...insertPayload };
    delete fallbackPayload.selected_articles;
    delete fallbackPayload.show_cv_photo;

    const fallback = await supabase
      .from(TABLES.cvs)
      .insert(fallbackPayload)
      .select("id, name, language, selected_projects, selected_experiences, created_at, updated_at")
      .single();

    data = fallback.data;
    error = fallback.error;
  }

  if (error || !data) {
    return null;
  }

  const resolvedSelectedArticles = Array.isArray((data as any).selected_articles)
    ? ((data as any).selected_articles as string[])
    : cv.selectedArticles ?? [];
  const resolvedShowCvPhoto = typeof (data as any).show_cv_photo === 'boolean'
    ? (data as any).show_cv_photo
    : cv.showCvPhoto;

  return {
    id: data.id,
    name: data.name,
    language: data.language,
    selectedProjects: data.selected_projects ?? [],
    selectedExperiences: data.selected_experiences ?? [],
    selectedArticles: resolvedSelectedArticles,
    showCvPhoto: resolvedShowCvPhoto,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updateCv(
  userId: string,
  cvId: string,
  cv: Omit<CV, "id" | "createdAt" | "updatedAt">
): Promise<CV | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  const updatePayload: Record<string, any> = {
    name: cv.name,
    language: cv.language,
    selected_projects: cv.selectedProjects ?? [],
    selected_experiences: cv.selectedExperiences ?? [],
    selected_articles: cv.selectedArticles ?? [],
  };

  if (typeof cv.showCvPhoto === 'boolean') {
    updatePayload.show_cv_photo = cv.showCvPhoto;
  }

  let { data, error } = await supabase
    .from(TABLES.cvs)
    .update(updatePayload)
    .eq("id", cvId)
    .eq("user_id", userId)
    .select("id, name, language, selected_projects, selected_experiences, selected_articles, show_cv_photo, created_at, updated_at")
    .single();

  if (isMissingOptionalColumn(error)) {
    const fallbackPayload = { ...updatePayload };
    delete fallbackPayload.selected_articles;
    delete fallbackPayload.show_cv_photo;

    const fallback = await supabase
      .from(TABLES.cvs)
      .update(fallbackPayload)
      .eq("id", cvId)
      .eq("user_id", userId)
      .select("id, name, language, selected_projects, selected_experiences, created_at, updated_at")
      .single();

    data = fallback.data;
    error = fallback.error;
  }

  if (error || !data) {
    return null;
  }

  const resolvedSelectedArticles = Array.isArray((data as any).selected_articles)
    ? ((data as any).selected_articles as string[])
    : cv.selectedArticles ?? [];
  const resolvedShowCvPhoto = typeof (data as any).show_cv_photo === 'boolean'
    ? (data as any).show_cv_photo
    : cv.showCvPhoto;

  return {
    id: data.id,
    name: data.name,
    language: data.language,
    selectedProjects: data.selected_projects ?? [],
    selectedExperiences: data.selected_experiences ?? [],
    selectedArticles: resolvedSelectedArticles,
    showCvPhoto: resolvedShowCvPhoto,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function deleteCv(userId: string, cvId: string): Promise<boolean> {
  if (!isSupabaseConfigured) {
    return false;
  }

  const { error } = await supabase
    .from(TABLES.cvs)
    .delete()
    .eq("id", cvId)
    .eq("user_id", userId);

  if (error) {
    return false;
  }

  return true;
}

export async function uploadPortfolioAsset(
  userId: string,
  file: File,
  folder: "avatars" | "projects" | "documents"
): Promise<string | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  const ext = file.name.split(".").pop() ?? "bin";
  const fileId = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : String(Date.now());
  const path = `${userId}/${folder}/${fileId}.${ext}`;

  const { error } = await supabase.storage
    .from("portfolio-assets")
    .upload(path, file, { upsert: true });

  if (error) {
    return null;
  }

  const { data } = supabase.storage.from("portfolio-assets").getPublicUrl(path);
  return data.publicUrl ?? null;
}

export async function upsertUserTheme(userId: string, theme: UserTheme): Promise<UserTheme | null> {
  console.log('=== upsertUserTheme INICIADO ===');
  console.log('userId:', userId);
  console.log('theme:', theme);
  
  if (!isSupabaseConfigured) {
    console.warn('Supabase não configurado em upsertUserTheme');
    return null;
  }

  const payload = {
    user_id: userId,
    primary_color: theme.primaryColor,
    secondary_color: theme.secondaryColor,
    accent_color: theme.accentColor,
    background_color: theme.backgroundColor,
    font_family: theme.fontFamily,
    theme_mode: theme.themeMode ?? "light",
    layout: theme.layout ?? "modern",
  };

  console.log('Payload para Supabase (user_themes):', payload);

  const { data, error } = await supabase
    .from(TABLES.userThemes)
    .upsert(payload, { onConflict: "user_id" })
    .select("primary_color, secondary_color, accent_color, background_color, font_family, theme_mode, layout")
    .single();

  console.log('Resposta do Supabase (upsertUserTheme):');
  console.log('  data:', data);
  console.log('  error:', error);

  if (error) {
    console.error('Erro ao upsert theme (primeira tentativa):', error);
    const fallback = await supabase
      .from(TABLES.userThemes)
      .upsert({
        user_id: userId,
        primary_color: theme.primaryColor,
        secondary_color: theme.secondaryColor,
        accent_color: theme.accentColor,
        background_color: theme.backgroundColor,
        font_family: theme.fontFamily,
      }, { onConflict: "user_id" })
      .select("primary_color, secondary_color, accent_color, background_color, font_family")
      .single();

    if (fallback.error || !fallback.data) {
      console.error('Erro no fallback de upsertUserTheme:', fallback.error);
      return null;
    }

    console.log('Tema salvo com fallback (sem theme_mode/layout):', fallback.data);
    return {
      primaryColor: fallback.data.primary_color,
      secondaryColor: fallback.data.secondary_color,
      accentColor: fallback.data.accent_color,
      backgroundColor: fallback.data.background_color,
      fontFamily: fallback.data.font_family,
      themeMode: "light",
      layout: "modern",
    };
  }

  if (!data) {
    console.error('Nenhum dado retornado após upsert do tema');
    return null;
  }

  console.log('Tema salvo com sucesso:', data);
  const themeSaved = {
    primaryColor: data.primary_color,
    secondaryColor: data.secondary_color,
    accentColor: data.accent_color,
    backgroundColor: data.background_color,
    fontFamily: data.font_family,
    themeMode: (data.theme_mode as UserTheme["themeMode"]) ?? "light",
    layout: (data.layout as UserTheme["layout"]) ?? "modern",
  };
  console.log('Resultado processado do upsertUserTheme:', themeSaved);
  console.log('💾 Layout salvo no banco:', data.layout, '→ resultado:', themeSaved.layout);
  console.log('=== upsertUserTheme CONCLUÍDO ===');
  return themeSaved;
}

export async function createProject(userId: string, project: Omit<Project, "id">): Promise<Project | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  // Clean translations object to remove undefined fields
  let cleanTranslations = null;
  if (project.translations) {
    const cleaned: any = {};
    if (project.translations.en) {
      const cleanedEn = removeUndefinedFields(project.translations.en);
      if (Object.keys(cleanedEn).length > 0) {
        cleaned.en = cleanedEn;
      }
    }
    if (project.translations.es) {
      const cleanedEs = removeUndefinedFields(project.translations.es);
      if (Object.keys(cleanedEs).length > 0) {
        cleaned.es = cleanedEs;
      }
    }
    if (Object.keys(cleaned).length > 0) {
      cleanTranslations = cleaned;
    }
  }

  // Ensure JSONB compatibility
  const finalTranslations = ensureValidJsonb(cleanTranslations);

  console.log('🔍 Payload for createProject:', JSON.stringify({
    translations: finalTranslations,
    title: project.title,
    description: project.description,
  }, null, 2));

  const payload = {
    user_id: userId,
    title: project.title,
    description: project.description,
    image_url: project.image ?? null,
    tags: project.tags ?? [],
    link: project.link ?? null,
    category: project.category ?? null,
    type: project.type ?? "standard",
    repo_url: project.repoUrl ?? null,
    media_url: project.mediaUrl ?? null,
    pdf_url: project.pdfUrl ?? null,
    company: project.company ?? null,
    results: project.results ?? null,
    position: project.position ?? null,
    translations: finalTranslations,
  };

  console.log('📤 Full payload:', JSON.stringify(payload, null, 2));

  let { data, error } = await supabase
    .from(TABLES.projects)
    .insert(payload)
    .select("id, title, description, image_url, tags, link, category, type, repo_url, media_url, pdf_url, company, results, position, translations")
    .single();

  if (isMissingOptionalColumn(error)) {
    const { translations: _ignored, ...legacyPayload } = payload;
    const fallback = await supabase
      .from(TABLES.projects)
      .insert(legacyPayload)
      .select("id, title, description, image_url, tags, link, category, type, repo_url, media_url, pdf_url, company, results, position")
      .single();

    data = fallback.data;
    error = fallback.error;
  }

  if (error || !data) {
    if (error) {
      console.error('❌ Erro ao criar projeto:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    }
    return null;
  }

  return mapProjectRow(data as ProjectRow);
}

export async function updateProject(
  userId: string,
  projectId: string,
  project: Omit<Project, "id">
): Promise<Project | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  // Clean translations object to remove undefined fields
  let cleanTranslations = null;
  if (project.translations) {
    const cleaned: any = {};
    if (project.translations.en) {
      const cleanedEn = removeUndefinedFields(project.translations.en);
      if (Object.keys(cleanedEn).length > 0) {
        cleaned.en = cleanedEn;
      }
    }
    if (project.translations.es) {
      const cleanedEs = removeUndefinedFields(project.translations.es);
      if (Object.keys(cleanedEs).length > 0) {
        cleaned.es = cleanedEs;
      }
    }
    if (Object.keys(cleaned).length > 0) {
      cleanTranslations = cleaned;
    }
  }

  let { data, error } = await supabase
    .from(TABLES.projects)
    .update({
      title: project.title,
      description: project.description,
      image_url: project.image ?? null,
      tags: project.tags ?? [],
      link: project.link ?? null,
      category: project.category ?? null,
      type: project.type ?? "standard",
      repo_url: project.repoUrl ?? null,
      media_url: project.mediaUrl ?? null,
      pdf_url: project.pdfUrl ?? null,
      company: project.company ?? null,
      results: project.results ?? null,
      position: project.position ?? null,
      translations: cleanTranslations,
    })
    .eq("id", projectId)
    .eq("user_id", userId)
    .select("id, title, description, image_url, tags, link, category, type, repo_url, media_url, pdf_url, company, results, position, translations")
    .single();

  if (isMissingOptionalColumn(error)) {
    const updatePayload = {
      title: project.title,
      description: project.description,
      image_url: project.image ?? null,
      tags: project.tags ?? [],
      link: project.link ?? null,
      category: project.category ?? null,
      type: project.type ?? "standard",
      repo_url: project.repoUrl ?? null,
      media_url: project.mediaUrl ?? null,
      pdf_url: project.pdfUrl ?? null,
      company: project.company ?? null,
      results: project.results ?? null,
      position: project.position ?? null,
    };

    const fallback = await supabase
      .from(TABLES.projects)
      .update(updatePayload)
      .eq("id", projectId)
      .eq("user_id", userId)
      .select("id, title, description, image_url, tags, link, category, type, repo_url, media_url, pdf_url, company, results, position")
      .single();

    data = fallback.data;
    error = fallback.error;
  }

  if (error || !data) {
    return null;
  }

  return mapProjectRow(data as ProjectRow);
}

export async function deleteProject(userId: string, projectId: string): Promise<boolean> {
  if (!isSupabaseConfigured) {
    return false;
  }

  const { error } = await supabase
    .from(TABLES.projects)
    .delete()
    .eq("id", projectId)
    .eq("user_id", userId);

  return !error;
}

export async function createExperience(userId: string, experience: Omit<Experience, "id">): Promise<Experience | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  // Clean translations object to remove undefined fields
  let cleanTranslations = null;
  if (experience.translations) {
    const cleaned: any = {};
    if (experience.translations.en) {
      const cleanedEn = removeUndefinedFields(experience.translations.en);
      if (Object.keys(cleanedEn).length > 0) {
        cleaned.en = cleanedEn;
      }
    }
    if (experience.translations.es) {
      const cleanedEs = removeUndefinedFields(experience.translations.es);
      if (Object.keys(cleanedEs).length > 0) {
        cleaned.es = cleanedEs;
      }
    }
    if (Object.keys(cleaned).length > 0) {
      cleanTranslations = cleaned;
    }
  }

  let { data, error } = await supabase
    .from(TABLES.experiences)
    .insert({
      user_id: userId,
      title: experience.title,
      company: experience.company,
      period: experience.period,
      description: experience.description,
      location: experience.location ?? null,
      current: experience.current ?? false,
      certificate_url: experience.certificateUrl ?? null,
      show_certificate: experience.showCertificate ?? true,
      position: experience.position ?? null,
      translations: cleanTranslations,
    })
    .select("id, title, company, period, description, location, current, certificate_url, show_certificate, position, translations")
    .single();

  if (isMissingOptionalColumn(error)) {
    const fallback = await supabase
      .from(TABLES.experiences)
      .insert({
        user_id: userId,
        title: experience.title,
        company: experience.company,
        period: experience.period,
        description: experience.description,
        location: experience.location ?? null,
        current: experience.current ?? false,
        certificate_url: experience.certificateUrl ?? null,
        show_certificate: experience.showCertificate ?? true,
        position: experience.position ?? null,
      })
      .select("id, title, company, period, description, location, current, certificate_url, show_certificate, position")
      .single();

    data = fallback.data;
    error = fallback.error;
  }

  if (error || !data) {
    return null;
  }

  return mapExperienceRow(data as ExperienceRow);
}

export async function updateExperience(
  userId: string,
  experienceId: string,
  experience: Omit<Experience, "id">
): Promise<Experience | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  // Clean translations object to remove undefined fields
  let cleanTranslations = null;
  if (experience.translations) {
    const cleaned: any = {};
    if (experience.translations.en) {
      const cleanedEn = removeUndefinedFields(experience.translations.en);
      if (Object.keys(cleanedEn).length > 0) {
        cleaned.en = cleanedEn;
      }
    }
    if (experience.translations.es) {
      const cleanedEs = removeUndefinedFields(experience.translations.es);
      if (Object.keys(cleanedEs).length > 0) {
        cleaned.es = cleanedEs;
      }
    }
    if (Object.keys(cleaned).length > 0) {
      cleanTranslations = cleaned;
    }
  }

  let { data, error } = await supabase
    .from(TABLES.experiences)
    .update({
      title: experience.title,
      company: experience.company,
      period: experience.period,
      description: experience.description,
      location: experience.location ?? null,
      current: experience.current ?? false,
      certificate_url: experience.certificateUrl ?? null,
      show_certificate: experience.showCertificate ?? true,
      position: experience.position ?? null,
      translations: cleanTranslations,
    })
    .eq("id", experienceId)
    .eq("user_id", userId)
    .select("id, title, company, period, description, location, current, certificate_url, show_certificate, position, translations")
    .single();

  if (isMissingOptionalColumn(error)) {
    const fallback = await supabase
      .from(TABLES.experiences)
      .update({
        title: experience.title,
        company: experience.company,
        period: experience.period,
        description: experience.description,
        location: experience.location ?? null,
        current: experience.current ?? false,
        certificate_url: experience.certificateUrl ?? null,
        show_certificate: experience.showCertificate ?? true,
        position: experience.position ?? null,
      })
      .eq("id", experienceId)
      .eq("user_id", userId)
      .select("id, title, company, period, description, location, current, certificate_url, show_certificate, position")
      .single();

    data = fallback.data;
    error = fallback.error;
  }

  if (error || !data) {
    return null;
  }

  return mapExperienceRow(data as ExperienceRow);
}

export async function deleteExperience(userId: string, experienceId: string): Promise<boolean> {
  if (!isSupabaseConfigured) {
    return false;
  }

  const { error } = await supabase
    .from(TABLES.experiences)
    .delete()
    .eq("id", experienceId)
    .eq("user_id", userId);

  return !error;
}

export async function createArticle(userId: string, article: Omit<ScientificArticle, "id">): Promise<ScientificArticle | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  const sanitizedTranslations = sanitizeArticleTranslations(article.translations);

  const payload = {
    user_id: userId,
    title: article.title,
    publication: article.publication ?? null,
    publication_date: article.publicationDate ?? null,
    summary: article.summary ?? null,
    link: article.link ?? null,
    doi: article.doi ?? null,
    authors: article.authors ?? [],
    show_in_portfolio: article.showInPortfolio ?? true,
    show_in_cv: article.showInCv ?? true,
    position: article.position ?? null,
    translations: sanitizedTranslations,
  };

  let { data, error } = await supabase
    .from(TABLES.articles)
    .insert(payload)
    .select(
      "id, title, publication, publication_date, summary, link, doi, authors, show_in_portfolio, show_in_cv, position, translations"
    )
    .single();

  if (isMissingOptionalColumn(error)) {
    const { translations: _ignored, ...legacyPayload } = payload;
    const fallback = await supabase
      .from(TABLES.articles)
      .insert(legacyPayload)
      .select(
        "id, title, publication, publication_date, summary, link, doi, authors, show_in_portfolio, show_in_cv, position"
      )
      .single();

    data = fallback.data;
    error = fallback.error;
  }

  if (error && isMissingTable(error)) {
    console.warn("Tabela 'articles' ausente. Usando fallback local para criar artigo.");
    return buildLocalArticle(article);
  }

  if (error || !data) {
    console.error("Erro ao criar artigo científico:", error);
    return null;
  }

  return mapScientificArticleRow(data as ScientificArticleRow);
}

export async function updateArticle(
  userId: string,
  articleId: string,
  article: Omit<ScientificArticle, "id">
): Promise<ScientificArticle | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  const sanitizedTranslations = sanitizeArticleTranslations(article.translations);

  let { data, error } = await supabase
    .from(TABLES.articles)
    .update({
      title: article.title,
      publication: article.publication ?? null,
      publication_date: article.publicationDate ?? null,
      summary: article.summary ?? null,
      link: article.link ?? null,
      doi: article.doi ?? null,
      authors: article.authors ?? [],
      show_in_portfolio: article.showInPortfolio ?? true,
      show_in_cv: article.showInCv ?? true,
      position: article.position ?? null,
      translations: sanitizedTranslations,
    })
    .eq("id", articleId)
    .eq("user_id", userId)
    .select(
      "id, title, publication, publication_date, summary, link, doi, authors, show_in_portfolio, show_in_cv, position, translations"
    )
    .single();

  if (isMissingOptionalColumn(error)) {
    const fallbackPayload = {
      title: article.title,
      publication: article.publication ?? null,
      publication_date: article.publicationDate ?? null,
      summary: article.summary ?? null,
      link: article.link ?? null,
      doi: article.doi ?? null,
      authors: article.authors ?? [],
      show_in_portfolio: article.showInPortfolio ?? true,
      show_in_cv: article.showInCv ?? true,
      position: article.position ?? null,
    };

    const fallback = await supabase
      .from(TABLES.articles)
      .update(fallbackPayload)
      .eq("id", articleId)
      .eq("user_id", userId)
      .select(
        "id, title, publication, publication_date, summary, link, doi, authors, show_in_portfolio, show_in_cv, position"
      )
      .single();

    data = fallback.data;
    error = fallback.error;
  }

  if (error && isMissingTable(error)) {
    console.warn("Tabela 'articles' ausente. Usando fallback local para atualizar artigo.");
    return buildLocalArticle(article, articleId);
  }

  if (error || !data) {
    console.error("Erro ao atualizar artigo científico:", error);
    return null;
  }

  return mapScientificArticleRow(data as ScientificArticleRow);
}

export async function deleteArticle(userId: string, articleId: string): Promise<boolean> {
  if (!isSupabaseConfigured) {
    return false;
  }

  const { error } = await supabase
    .from(TABLES.articles)
    .delete()
    .eq("id", articleId)
    .eq("user_id", userId);

  if (error) {
    if (isMissingTable(error)) {
      console.warn("Tabela 'articles' ausente. Considerando exclusão concluída localmente.");
      return true;
    }
    console.error("Erro ao excluir artigo científico:", error);
    return false;
  }

  return true;
}
