import { supabase, isSupabaseConfigured } from "../../lib/supabaseClient";
import type { PostgrestError } from "@supabase/supabase-js";
import type { CV, Experience, FeaturedVideo, Locale, Project, Subscription, SubscriptionPlan, UserProfile, UserTheme } from "../types";

const TABLES = {
  profiles: "profiles",
  userThemes: "user_themes",
  featuredVideos: "featured_videos",
  projects: "projects",
  experiences: "experiences",
  cvs: "cvs",
  subscriptions: "subscriptions",
} as const;

const PRELAUNCH_PLAN_TIER: SubscriptionPlan = "pro";
const PRELAUNCH_STATUS: Subscription["status"] = "trialing";
const PRELAUNCH_GRACE_DAYS = 3;

const isMissingOptionalColumn = (error?: PostgrestError | null) => Boolean(error && error.code === "42703");

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
    // This will strip out any problematic values and ensure it's valid JSON
    return JSON.parse(JSON.stringify(obj));
  } catch (e) {
    console.error('Invalid JSONB object:', e);
    return {};
  }
}

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
  const row = data as Record<string, any>;
  const socialLinks = row.social_links && typeof row.social_links === 'object'
    ? row.social_links
    : undefined;
  const education = row.education && typeof row.education === 'object'
    ? row.education
    : undefined;
  const translations = row.translations && typeof row.translations === 'object'
    ? row.translations
    : undefined;
  const result = {
    id: row.id,
    fullName: row.full_name,
    title: row.title ?? undefined,
    bio: row.bio ?? undefined,
    location: row.location ?? undefined,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    photoUrl: row.photo_url ?? undefined,
    socialLinks,
    skills: Array.isArray(row.skills) ? row.skills : [],
    education,
    translations,
    preferredLocale: (row.preferred_locale as Locale | null) ?? undefined,
  };
  console.log('Resultado processado do fetchUserProfile:', result);
  console.log('=== fetchUserProfile CONCLUÍDO ===');
  return result;
}

export async function upsertUserProfile(userId: string, profile: Omit<UserProfile, "id">): Promise<UserProfile | null> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase não configurado em upsertUserProfile');
    return null;
  }

  // Clean translations object to remove undefined fields
  let cleanTranslations = null;
  if (profile.translations) {
    const cleaned: any = {};
    if (profile.translations.en) {
      const cleanedEn = removeUndefinedFields(profile.translations.en);
      if (Object.keys(cleanedEn).length > 0) {
        cleaned.en = cleanedEn;
      }
    }
    if (profile.translations.es) {
      const cleanedEs = removeUndefinedFields(profile.translations.es);
      if (Object.keys(cleanedEs).length > 0) {
        cleaned.es = cleanedEs;
      }
    }
    if (Object.keys(cleaned).length > 0) {
      cleanTranslations = cleaned;
    }
  }

  const payload: Record<string, any> = {
    id: userId,
    full_name: profile.fullName,
    title: profile.title ?? null,
    bio: profile.bio ?? null,
    location: profile.location ?? null,
    email: profile.email ?? null,
    phone: profile.phone ?? null,
    photo_url: profile.photoUrl ?? null,
    social_links: profile.socialLinks ?? null,
    skills: profile.skills ?? [],
    education: profile.education ?? null,
    translations: cleanTranslations,
  };

  if (profile.preferredLocale) {
    payload.preferred_locale = profile.preferredLocale;
  }

  console.log('Payload para Supabase (profiles):', payload);
  console.log('📸 photo_url being saved:', payload.photo_url);

  const { data, error } = await supabase
    .from(TABLES.profiles)
    .upsert(payload)
    .select("id, full_name, title, bio, location, email, phone, photo_url, social_links, skills, education, translations")
    .single();

  if (error) {
    console.error('Erro ao upsert profile (primeira tentativa):', error);
    if (isMissingOptionalColumn(error)) {
      console.warn('upsertUserProfile: coluna opcional ausente, aplicando payload básico. Erro original:', error);
      const legacyPayload: Record<string, any> = {
        id: userId,
        full_name: profile.fullName,
        title: profile.title ?? null,
        bio: profile.bio ?? null,
        location: profile.location ?? null,
        email: profile.email ?? null,
        phone: profile.phone ?? null,
        photo_url: profile.photoUrl ?? null,
        social_links: profile.socialLinks ?? null,
      };

      const fallback = await supabase
        .from(TABLES.profiles)
        .upsert(legacyPayload)
        .select("id, full_name, title, bio, location, email, phone, photo_url, social_links")
        .single();

      if (fallback.error || !fallback.data) {
        console.error('Erro no fallback de upsertUserProfile:', fallback.error);
        return null;
      }

      console.log('Perfil salvo com fallback básico:', fallback.data);
      return {
        id: fallback.data.id,
        fullName: fallback.data.full_name,
        title: fallback.data.title ?? undefined,
        bio: fallback.data.bio ?? undefined,
        location: fallback.data.location ?? undefined,
        email: fallback.data.email ?? undefined,
        phone: fallback.data.phone ?? undefined,
        photoUrl: fallback.data.photo_url ?? undefined,
        socialLinks: fallback.data.social_links ?? undefined,
        skills: [],
        education: undefined,
        translations: undefined,
        preferredLocale: profile.preferredLocale ?? undefined,
      };
    }

    return null;
  }

  if (!data) {
    console.error('Nenhum dado retornado após upsert no upsertUserProfile');
    return null;
  }

  console.log('Perfil salvo com sucesso no upsertUserProfile:', data);
  return {
    id: data.id,
    fullName: data.full_name,
    title: data.title ?? undefined,
    bio: data.bio ?? undefined,
    location: data.location ?? undefined,
    email: data.email ?? undefined,
    phone: data.phone ?? undefined,
    photoUrl: data.photo_url ?? undefined,
    socialLinks: data.social_links ?? undefined,
    skills: data.skills ?? [],
    education: data.education ?? undefined,
    translations: data.translations ?? undefined,
    preferredLocale: (data.preferred_locale as Locale | null) ?? undefined,
  };
}

export async function updatePreferredLocale(
  userId: string,
  preferredLocale: Locale,
  fallback?: { fullName?: string | null; email?: string | null },
): Promise<Locale | null> {
  if (!isSupabaseConfigured) {
    return preferredLocale;
  }

  const { data, error } = await supabase
    .from(TABLES.profiles)
    .update({ preferred_locale: preferredLocale })
    .eq("id", userId)
    .select("preferred_locale")
    .maybeSingle();

  if (isMissingOptionalColumn(error)) {
    console.warn('preferred_locale column ausente, mantendo preferencia apenas em memória. Erro original:', error);
    return preferredLocale;
  }

  if (data?.preferred_locale) {
    return data.preferred_locale as Locale;
  }

  if (error && error.code !== "PGRST116") {
    console.error("Erro ao atualizar preferred_locale:", error);
  }

  const fullName = fallback?.fullName && fallback.fullName.trim().length > 0
    ? fallback.fullName
    : "Novo usuário";

  const insertPayload: Record<string, any> = {
    id: userId,
    full_name: fullName,
    email: fallback?.email ?? null,
  };

  if (!error || !isMissingOptionalColumn(error)) {
    insertPayload.preferred_locale = preferredLocale;
  }

  const insertResult = await supabase
    .from(TABLES.profiles)
    .upsert(insertPayload, { onConflict: "id" })
    .select("preferred_locale")
    .single();

  if (isMissingOptionalColumn(insertResult.error)) {
    console.warn('preferred_locale ausente durante upsert; preferencia não persistida no banco.');
    return preferredLocale;
  }

  if (insertResult.error) {
    console.error("Erro ao inserir preferred_locale:", insertResult.error);
    return null;
  }

  return (insertResult.data?.preferred_locale as Locale | null) ?? null;
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
  console.log('  error:', error);

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

export async function fetchCvs(userId: string): Promise<CV[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  const { data, error } = await supabase
    .from(TABLES.cvs)
    .select("id, name, language, selected_projects, selected_experiences, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  const rows = data as Array<{
    id: string;
    name: string;
    language: 'pt' | 'en' | 'es';
    selected_projects: string[] | null;
    selected_experiences: string[] | null;
    created_at: string;
    updated_at: string;
  }>;

  return rows.map((cv) => ({
    id: cv.id,
    name: cv.name,
    language: cv.language,
    selectedProjects: cv.selected_projects ?? [],
    selectedExperiences: cv.selected_experiences ?? [],
    createdAt: cv.created_at,
    updatedAt: cv.updated_at,
  }));
}

export async function fetchSubscription(userId: string): Promise<Subscription | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  const { data, error } = await supabase
    .from(TABLES.subscriptions)
    .select("id, user_id, status, plan_tier, trial_ends_at, current_period_end, grace_days, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const needsUpdate =
    data.plan_tier !== PRELAUNCH_PLAN_TIER ||
    data.status !== PRELAUNCH_STATUS ||
    data.trial_ends_at !== null ||
    data.grace_days !== PRELAUNCH_GRACE_DAYS;

  if (needsUpdate) {
    const { data: updated, error: updateError } = await supabase
      .from(TABLES.subscriptions)
      .update({
        plan_tier: PRELAUNCH_PLAN_TIER,
        status: PRELAUNCH_STATUS,
        trial_ends_at: null,
        grace_days: PRELAUNCH_GRACE_DAYS,
      })
      .eq("id", data.id)
      .select("id, user_id, status, plan_tier, trial_ends_at, current_period_end, grace_days, updated_at")
      .single();

    if (!updateError && updated) {
      data.plan_tier = updated.plan_tier;
      data.status = updated.status;
      data.trial_ends_at = updated.trial_ends_at;
      data.current_period_end = updated.current_period_end;
      data.grace_days = updated.grace_days;
      data.updated_at = updated.updated_at;
    }
  }

  return {
    id: data.id,
    userId: data.user_id,
    status: data.status as Subscription["status"],
    planTier: (data.plan_tier as SubscriptionPlan | null) ?? PRELAUNCH_PLAN_TIER,
    trialEndsAt: data.trial_ends_at ?? undefined,
    currentPeriodEnd: data.current_period_end ?? undefined,
    graceDays: data.grace_days ?? undefined,
    updatedAt: data.updated_at,
  };
}

export async function ensureSubscription(userId: string, _trialDays = 15): Promise<Subscription | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  const { data, error } = await supabase
    .from(TABLES.subscriptions)
    .upsert({
      user_id: userId,
      status: PRELAUNCH_STATUS,
      plan_tier: PRELAUNCH_PLAN_TIER,
      trial_ends_at: null,
      grace_days: PRELAUNCH_GRACE_DAYS,
    }, { onConflict: "user_id" })
    .select("id, user_id, status, plan_tier, trial_ends_at, current_period_end, grace_days, updated_at")
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    status: data.status as Subscription["status"],
    planTier: (data.plan_tier as SubscriptionPlan | null) ?? PRELAUNCH_PLAN_TIER,
    trialEndsAt: data.trial_ends_at ?? undefined,
    currentPeriodEnd: data.current_period_end ?? undefined,
    graceDays: data.grace_days ?? undefined,
    updatedAt: data.updated_at,
  };
}

export async function createCv(userId: string, cv: Omit<CV, "id" | "createdAt" | "updatedAt">): Promise<CV | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  const { data, error } = await supabase
    .from(TABLES.cvs)
    .insert({
      user_id: userId,
      name: cv.name,
      language: cv.language,
      selected_projects: cv.selectedProjects ?? [],
      selected_experiences: cv.selectedExperiences ?? [],
    })
    .select("id, name, language, selected_projects, selected_experiences, created_at, updated_at")
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    language: data.language,
    selectedProjects: data.selected_projects ?? [],
    selectedExperiences: data.selected_experiences ?? [],
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

  const { data, error } = await supabase
    .from(TABLES.cvs)
    .update({
      name: cv.name,
      language: cv.language,
      selected_projects: cv.selectedProjects ?? [],
      selected_experiences: cv.selectedExperiences ?? [],
    })
    .eq("id", cvId)
    .eq("user_id", userId)
    .select("id, name, language, selected_projects, selected_experiences, created_at, updated_at")
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    language: data.language,
    selectedProjects: data.selected_projects ?? [],
    selectedExperiences: data.selected_experiences ?? [],
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
