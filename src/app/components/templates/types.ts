import type { Locale, UserProfile, UserTheme } from "../../types";

export interface TemplatePalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

export const buildPalette = (theme?: UserTheme): TemplatePalette => ({
  primary: theme?.primaryColor ?? "#6a0dad",
  secondary: theme?.secondaryColor ?? "#2d2550",
  accent: theme?.accentColor ?? "#c92563",
  background: theme?.backgroundColor ?? "#ffffff",
});

export interface TemplateExperience {
  id: string;
  title: string;
  company?: string;
  description?: string;
  period?: string;
}

export interface TemplateProject {
  id: string;
  title: string;
  description: string;
  link?: string;
}

export interface TemplateArticle {
  id: string;
  title: string;
  summary?: string;
  publication?: string;
}

export interface TemplateVideo {
  id: string;
  title: string;
  description: string;
  platform: string;
}

export interface CVTemplateProps {
  profile: UserProfile;
  experiences: TemplateExperience[];
  projects: TemplateProject[];
  articles: TemplateArticle[];
  locale: Locale;
  theme?: UserTheme;
}

export interface PortfolioTemplateProps {
  profile: UserProfile;
  experiences: TemplateExperience[];
  projects: TemplateProject[];
  featuredVideos: TemplateVideo[];
  articles: TemplateArticle[];
  locale: Locale;
  theme?: UserTheme;
}
