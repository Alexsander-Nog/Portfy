export interface ScientificArticleTranslations {
  en?: {
    title?: string;
    summary?: string;
    publication?: string;
  };
  es?: {
    title?: string;
    summary?: string;
    publication?: string;
  };
}

export interface ScientificArticle {
  id: string;
  title: string;
  publication?: string;
  publicationDate?: string;
  summary?: string;
  link?: string;
  doi?: string;
  authors?: string[];
  showInPortfolio?: boolean;
  showInCv?: boolean;
  position?: number;
  translations?: ScientificArticleTranslations;
}
export type Locale = "pt" | "en" | "es";

export interface UserTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  fontFamily: string;
  themeMode?: "light" | "dark";
  layout?: "modern" | "minimal" | "masonry" | "list" | "spotlight" | "editorial";
}

export type PortfolioTemplateId =
  | "modern"
  | "minimal"
  | "dark"
  | "gradient";

export type CvTemplateId =
  | "modern"
  | "minimal"
  | "creative"
  | "executive"
  | "modernClassic"
  | "minimalElegant"
  | "corporate"
  | "creativeAccent";

export interface FeaturedVideo {
  id: string;
  url: string;
  platform: "youtube" | "instagram";
  title: string;
  description: string;
  tags: string[];
  position?: number;
}

export type ProjectType = "standard" | "github" | "media" | "professional";

export interface ProjectTranslations {
  en?: {
    title?: string;
    description?: string;
    category?: string;
  };
  es?: {
    title?: string;
    description?: string;
    category?: string;
  };
}

export interface Project {
  id: string;
  title: string;
  description: string;
  image?: string;
  tags?: string[];
  link?: string;
  category?: string;
  type?: ProjectType;
  repoUrl?: string;
  mediaUrl?: string;
  pdfUrl?: string;
  company?: string;
  results?: string;
  position?: number;
  translations?: ProjectTranslations;
}

export interface ExperienceTranslations {
  en?: {
    title?: string;
    company?: string;
    description?: string;
  };
  es?: {
    title?: string;
    company?: string;
    description?: string;
  };
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  period: string;
  description: string;
  location?: string;
  current?: boolean;
  certificateUrl?: string;
  showCertificate?: boolean;
  position?: number;
  translations?: ExperienceTranslations;
}

export interface CV {
  id: string;
  name: string;
  language: "pt" | "en" | "es";
  selectedProjects: string[];
  selectedExperiences: string[];
  selectedArticles: string[];
  showCvPhoto?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EducationItem {
  institution: string;
  degree: string;
  startYear?: string;
  endYear?: string;
  period?: string;
  description?: string;
}

export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "blocked";
export type SubscriptionPlan = "basic" | "pro" | "premium";
export type SubscriptionPlanType = "trial" | "paid";

export interface Subscription {
  id: string;
  userId: string;
  status: SubscriptionStatus;
  planType: SubscriptionPlanType;
  planTier: SubscriptionPlan;
  subscriptionActive: boolean;
  trialStart?: string;
  trialEndsAt?: string;
  currentPeriodEnd?: string;
  graceDays?: number;
  trialDaysRemaining?: number;
  trialExpired?: boolean;
  updatedAt: string;
}

export interface ProfileTranslations {
  en?: {
    bio?: string;
    title?: string;
  };
  es?: {
    bio?: string;
    title?: string;
  };
}

export interface UserProfile {
  id: string;
  fullName: string;
  slug?: string;
  preferredLocale?: Locale;
  title?: string;
  bio?: string;
  location?: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  skills?: string[];
  education?: EducationItem[];
  translations?: ProfileTranslations;
  socialLinks?: {
    website?: string;
    linkedin?: string;
    github?: string;
    instagram?: string;
    youtube?: string;
    spotify?: string;
    soundcloud?: string;
  };
  portfolioTemplate?: PortfolioTemplateId;
  cvTemplate?: CvTemplateId;
  showCvPhoto?: boolean;
  trialStart?: string;
  trialEnd?: string;
  trialDaysRemaining?: number;
}
