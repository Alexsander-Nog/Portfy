import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL environment variable');
}

if (!serviceRoleKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

type JsonRecord = Record<string, any> | null;

type ProfileRow = {
  id: string;
  full_name: string | null;
  preferred_locale: string | null;
  title: string | null;
  bio: string | null;
  location: string | null;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  skills: string[] | null;
  education: JsonRecord;
  social_links: JsonRecord;
  translations: JsonRecord;
};

type ThemeRow = {
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  background_color: string | null;
  font_family: string | null;
  theme_mode: string | null;
  layout: string | null;
};

type ProjectRow = {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  tags: string[] | null;
  link: string | null;
  category: string | null;
  type: string | null;
  repo_url: string | null;
  media_url: string | null;
  pdf_url: string | null;
  company: string | null;
  results: string | null;
  position: number | null;
  translations: JsonRecord;
};

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
  translations: JsonRecord;
};

type VideoRow = {
  id: string;
  url: string;
  platform: 'youtube' | 'instagram';
  title: string;
  description: string;
  tags: string[] | null;
  position: number | null;
};

type CvRow = {
  id: string;
  name: string;
  language: 'pt' | 'en' | 'es';
  selected_projects: string[] | null;
  selected_experiences: string[] | null;
  created_at: string;
  updated_at: string;
};

const parseJson = <T>(value: JsonRecord): T | undefined => {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  return value as T;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { id } = req.query;
  const userId = Array.isArray(id) ? id[0] : id;

  if (!userId || typeof userId !== 'string') {
    res.status(400).json({ error: 'Missing portfolio identifier' });
    return;
  }

  try {
    const [{ data: profile, error: profileError }] = await Promise.all([
      supabase
        .from<ProfileRow>('profiles')
        .select(
          'id, full_name, preferred_locale, title, bio, location, email, phone, photo_url, skills, education, social_links, translations'
        )
        .eq('id', userId)
        .maybeSingle(),
    ]);

    if (profileError) {
      throw profileError;
    }

    if (!profile) {
      res.status(404).json({ error: 'Portfolio not found' });
      return;
    }

    const [themeResult, videosResult, projectsResult, experiencesResult, cvsResult] = await Promise.all([
      supabase
        .from<ThemeRow>('user_themes')
        .select('primary_color, secondary_color, accent_color, background_color, font_family, theme_mode, layout')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from<VideoRow>('featured_videos')
        .select('id, url, platform, title, description, tags, position')
        .eq('user_id', userId)
        .order('position', { ascending: true }),
      supabase
        .from<ProjectRow>('projects')
        .select(
          'id, title, description, image_url, tags, link, category, type, repo_url, media_url, pdf_url, company, results, position, translations'
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from<ExperienceRow>('experiences')
        .select(
          'id, title, company, period, description, location, current, certificate_url, show_certificate, position, translations'
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from<CvRow>('cvs')
        .select('id, name, language, selected_projects, selected_experiences, created_at, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false }),
    ]);

    if (themeResult.error) throw themeResult.error;
    if (videosResult.error) throw videosResult.error;
    if (projectsResult.error) throw projectsResult.error;
    if (experiencesResult.error) throw experiencesResult.error;
    if (cvsResult.error) throw cvsResult.error;

    const formattedProfile = {
      id: profile.id,
      fullName: profile.full_name ?? '',
      preferredLocale: profile.preferred_locale ?? undefined,
      title: profile.title ?? undefined,
      bio: profile.bio ?? undefined,
      location: profile.location ?? undefined,
      email: profile.email ?? undefined,
      phone: profile.phone ?? undefined,
      photoUrl: profile.photo_url ?? undefined,
      skills: Array.isArray(profile.skills) ? profile.skills : [],
      education: parseJson(profile.education),
      translations: parseJson(profile.translations),
      socialLinks: parseJson(profile.social_links),
    };

    const formattedTheme = themeResult.data
      ? {
          primaryColor: themeResult.data.primary_color ?? '#a21d4c',
          secondaryColor: themeResult.data.secondary_color ?? '#2d2550',
          accentColor: themeResult.data.accent_color ?? '#c92563',
          backgroundColor: themeResult.data.background_color ?? '#ffffff',
          fontFamily: themeResult.data.font_family ?? 'Inter, system-ui, sans-serif',
          themeMode: (themeResult.data.theme_mode as 'light' | 'dark') ?? 'light',
          layout: (themeResult.data.layout as any) ?? 'modern',
        }
      : null;

    const formattedVideos = Array.isArray(videosResult.data)
      ? videosResult.data.map((video) => ({
          id: video.id,
          url: video.url,
          platform: video.platform,
          title: video.title,
          description: video.description,
          tags: video.tags ?? [],
          position: video.position ?? undefined,
        }))
      : [];

    const formattedProjects = Array.isArray(projectsResult.data)
      ? projectsResult.data.map((project) => ({
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
          translations: parseJson(project.translations),
        }))
      : [];

    const formattedExperiences = Array.isArray(experiencesResult.data)
      ? experiencesResult.data.map((experience) => ({
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
          translations: parseJson(experience.translations),
        }))
      : [];

    const formattedCvs = Array.isArray(cvsResult.data)
      ? cvsResult.data.map((cv) => ({
          id: cv.id,
          name: cv.name,
          language: cv.language,
          selectedProjects: cv.selected_projects ?? [],
          selectedExperiences: cv.selected_experiences ?? [],
          createdAt: cv.created_at,
          updatedAt: cv.updated_at,
        }))
      : [];

    res.status(200).json({
      profile: formattedProfile,
      theme: formattedTheme,
      featuredVideos: formattedVideos,
      projects: formattedProjects,
      experiences: formattedExperiences,
      cvs: formattedCvs,
    });
  } catch (error) {
    console.error('[public-portfolio] Failed to build shared portfolio:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}
