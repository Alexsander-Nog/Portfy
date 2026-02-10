import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Globe,
  Github,
  Linkedin,
  Instagram,
  Music,
  Youtube,
  Link as LinkIcon,
  Download,
  Menu,
  ExternalLink,
  Briefcase,
  Calendar,
  Award,
  BookOpen,
  Users,
  X,
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { useLocale } from '../i18n';
import type { CV, EducationItem, Experience, FeaturedVideo, Project, ScientificArticle, UserProfile, UserTheme } from '../types';

type LanguageStyle = {
  backgroundColor: string;
  color: string;
  borderColor?: string;
  opacity?: number;
};

type ButtonStyle = {
  border: string;
  color: string;
  backgroundColor: string;
};

type MediaEmbed = {
  src: string;
  platform: 'youtube' | 'instagram';
};

interface PublicPortfolioProps {
  featuredVideos?: FeaturedVideo[];
  userTheme?: UserTheme;
  userProfile?: UserProfile;
  projects?: Project[];
  experiences?: Experience[];
  articles?: ScientificArticle[];
  cvs?: CV[];
  onBackToDashboard?: () => void;
  previewMode?: boolean;
}

const resolveMediaEmbed = (url?: string): MediaEmbed | null => {
  if (!url) {
    return null;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  const youtubeMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
  if (youtubeMatch?.[1]) {
    return {
      src: `https://www.youtube.com/embed/${youtubeMatch[1]}`,
      platform: 'youtube',
    };
  }

  return null;
};

const formatEducationTimeline = (item?: EducationItem): string => {
  if (!item) {
    return '';
  }
  const start = item.startYear?.trim() ?? '';
  const end = item.endYear?.trim() ?? '';
  if (start && end) {
    return `${start} - ${end}`;
  }
  if (start) {
    return start;
  }
  if (end) {
    return end;
  }
  return item.period ?? '';
};

const cvLabels: Record<CV['language'], {
  title: string;
  summary: string;
  experience: string;
  projects: string;
  articles: string;
  education: string;
  skills: string;
  contact: string;
}> = {
  pt: {
    title: 'Currículo',
    summary: 'Resumo Profissional',
    experience: 'Experiência',
    projects: 'Projetos',
    articles: 'Artigos Cientificos',
    education: 'Formação',
    skills: 'Habilidades',
    contact: 'Contato',
  },
  en: {
    title: 'Resume',
    summary: 'Professional Summary',
    experience: 'Experience',
    projects: 'Projects',
    articles: 'Scientific Articles',
    education: 'Education',
    skills: 'Skills',
    contact: 'Contact',
  },
  es: {
    title: 'Currículum',
    summary: 'Resumen Profesional',
    experience: 'Experiencia',
    projects: 'Proyectos',
    articles: 'Articulos Cientificos',
    education: 'Formación',
    skills: 'Habilidades',
    contact: 'Contacto',
  },
};

export function PublicPortfolio({
  featuredVideos = [],
  userTheme,
  userProfile,
  projects = [],
  experiences = [],
  articles = [],
  cvs = [],
  onBackToDashboard,
  previewMode = false,
}: PublicPortfolioProps) {
  const { locale, setLocale, t } = useLocale();
  const [cvLanguage, setCvLanguage] = useState<CV['language']>(locale as CV['language']);
  const cvRef = useRef<HTMLDivElement | null>(null);
  const [portfolioTranslations, setPortfolioTranslations] = useState<Record<string, string>>({});
  const [cvTranslations, setCvTranslations] = useState<Record<string, string>>({});
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  useEffect(() => {
    if (previewMode) {
      setMobileNavOpen(false);
    }
  }, [previewMode]);
  const configuredTranslateEndpoint = (import.meta.env.VITE_TRANSLATE_ENDPOINT ?? '').trim();
  const translateEndpoint = configuredTranslateEndpoint || '/api/translate';
  const rawTranslateFlag = import.meta.env.VITE_ENABLE_TRANSLATIONS ?? '';
  const translateEnabled = import.meta.env.PROD || rawTranslateFlag.toLowerCase() === 'true';

  const primaryColor = userTheme?.primaryColor ?? '#c92563';
  const secondaryColor = userTheme?.secondaryColor ?? '#6b5d7a';
  const accentColor = userTheme?.accentColor ?? '#c92563';
  const backgroundColor = userTheme?.backgroundColor ?? '#ffffff';
  const fontFamily = userTheme?.fontFamily ?? 'Inter, system-ui, sans-serif';
  const themeMode = userTheme?.themeMode ?? 'light';
  const layout = userTheme?.layout ?? 'modern';
  const heroParticleLayouts = useMemo(() => new Set<UserTheme['layout']>(['modern', 'masonry', 'spotlight']), []);
  const heroSummaryLayouts = useMemo(
    () => new Set<UserTheme['layout']>(['minimal', 'list', 'masonry', 'spotlight', 'editorial']),
    [],
  );

  const preventPreviewClick = previewMode
    ? (event: MouseEvent<HTMLElement>) => {
        event.preventDefault();
        event.stopPropagation();
      }
    : undefined;

  const handleNavLinkClick = (event: MouseEvent<HTMLElement>) => {
    if (preventPreviewClick) {
      preventPreviewClick(event);
    }
    setMobileNavOpen(false);
  };

  let pageBackground = themeMode === 'dark' ? '#0f0b1f' : backgroundColor || '#ffffff';
  let pageTextColor = themeMode === 'dark' ? '#f7f3ff' : '#1a1534';
  let navBackground = themeMode === 'dark' ? 'rgba(12, 9, 24, 0.9)' : '#ffffffee';
  let navBorderColor = themeMode === 'dark' ? 'rgba(232,227,240,0.12)' : `${secondaryColor}20`;
  let navTextColor = themeMode === 'dark' ? '#f7f3ff' : '#1a1534';
  let navLanguageActiveStyle: LanguageStyle = {
    backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.18)' : `${primaryColor}20`,
    color: themeMode === 'dark' ? '#ffffff' : primaryColor,
    borderColor: 'transparent',
    opacity: 1,
  };
  let navLanguageInactiveStyle: LanguageStyle = {
    backgroundColor: 'transparent',
    color: themeMode === 'dark' ? 'rgba(255,255,255,0.7)' : `${primaryColor}90`,
    borderColor: 'transparent',
    opacity: 0.75,
  };
  let navBackButtonStyle: LanguageStyle = {
    backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : `${primaryColor}15`,
    color: navTextColor,
    borderColor: 'transparent',
    opacity: 1,
  };
  let navWrapperClass = 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between';
  let navLinksClass = 'hidden md:flex items-center gap-6 text-sm';
  let navLanguageGroupClass = 'hidden md:flex items-center gap-2 text-xs';
  let navNameClass = 'font-semibold tracking-wide';
  let navNameContainerClass = 'flex flex-col sm:flex-row sm:items-center gap-3';

  let heroSectionBackground = themeMode === 'dark'
    ? `linear-gradient(135deg, ${primaryColor}, #120d26)`
    : `linear-gradient(135deg, ${primaryColor}, ${accentColor})`;
  let heroContainerClass = 'max-w-6xl mx-auto relative z-10 grid md:grid-cols-[1.15fr_0.85fr] gap-12 items-center';
  let heroTextAlignmentClass = 'text-white';
  let heroButtonGroupClass = 'flex flex-wrap gap-4 mb-10 justify-center md:justify-start';
  let heroMetaAlignmentClass = 'flex flex-wrap items-center justify-center gap-3 text-sm md:justify-start';
  let heroHeadingColor = '#ffffff';
  let heroParagraphColor = 'rgba(255, 255, 255, 0.82)';
  let heroKickerColor = 'rgba(255, 255, 255, 0.7)';
  let heroMetaTextColor = 'rgba(255, 255, 255, 0.8)';
  let heroMetaLabelColor = 'rgba(255, 255, 255, 0.7)';
  let heroLanguageActiveStyle: LanguageStyle = {
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: '#ffffff',
    borderColor: 'transparent',
    opacity: 1,
  };
  let heroLanguageInactiveStyle: LanguageStyle = {
    backgroundColor: 'transparent',
    color: 'rgba(255,255,255,0.7)',
    borderColor: 'transparent',
    opacity: 0.75,
  };
  let heroSecondaryButtonStyle: ButtonStyle = {
    border: `2px solid ${accentColor}40`,
    color: '#ffffff',
    backgroundColor: 'transparent',
  };
  let heroCardVisible = true;
  let heroCardContainerClass = 'border rounded-3xl p-8 backdrop-blur-md shadow-2xl';
  let heroCardBackground = 'rgba(255,255,255,0.1)';
  let heroCardBorderColor = 'rgba(255,255,255,0.2)';
  let heroCardTextColor = 'rgba(255,255,255,0.85)';
  let heroCardHeadingColor = '#ffffff';
  let heroCardWrapperClass = 'flex flex-col items-center gap-6 text-center';
  let heroCardContentClass = 'flex flex-col items-center gap-5 w-full';
  let heroCardContactWrapperClass = 'space-y-4 text-sm w-full';
  let heroCardContactItemClass = 'flex items-center gap-2 justify-center';
  let heroCardSocialWrapperClass = 'flex flex-wrap justify-center gap-4 mt-6';
  let heroCardSocialButtonClass = 'w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110';
  let heroCardSocialButtonStyle: CSSProperties = { backgroundColor: 'rgba(255,255,255,0.08)' };
  let heroCardPhotoWrapperClass = 'w-40 h-40 rounded-full p-1.5 shadow-2xl';
  let heroCardPhotoWrapperStyle: CSSProperties = {
    background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
    boxShadow: `0 25px 50px -12px ${accentColor}50`,
  };
  let heroCardPhotoClass = 'w-full h-full rounded-full object-cover';
  let heroCardSummaryClass = 'text-sm leading-relaxed text-center opacity-90';
  let heroCardIconColor = '#ffffff';

  let sectionTitleColor = themeMode === 'dark' ? '#f7f3ff' : '#1a1534';
  let sectionBodyColor = themeMode === 'dark' ? '#dcd5f1' : secondaryColor;
  let surfaceBackground = themeMode === 'dark' ? 'rgba(22, 16, 40, 0.85)' : '#ffffff';
  let surfaceBorderColor = themeMode === 'dark' ? 'rgba(232,227,240,0.12)' : `${secondaryColor}18`;
  let softSurfaceBackground = themeMode === 'dark' ? 'rgba(232, 227, 240, 0.08)' : '#f5f3f7';
  let chipTextColor = themeMode === 'dark' ? '#f7f3ff' : secondaryColor;
  let chipBorderColor = themeMode === 'dark' ? 'rgba(232,227,240,0.2)' : `${secondaryColor}25`;
  let timelineBackground = themeMode === 'dark'
    ? 'linear-gradient(180deg, rgba(12,9,24,0.9) 0%, rgba(20,15,38,0.94) 100%)'
    : '#f8f7fa';
  let timelineLineColor = themeMode === 'dark' ? 'rgba(232,227,240,0.18)' : `${secondaryColor}25`;
  let aboutSectionBackground = themeMode === 'dark' ? 'rgba(15,11,31,0.88)' : '#ffffff';
  let contactSectionBackground = `linear-gradient(135deg, ${primaryColor}, ${backgroundColor || '#1a1534'})`;

  switch (layout) {
    case 'minimal': {
      pageBackground = themeMode === 'dark' ? '#080513' : '#fdfcff';
      pageTextColor = themeMode === 'dark' ? '#e8e3f0' : '#1a1534';
      navBackground = themeMode === 'dark' ? 'rgba(10, 6, 22, 0.85)' : '#ffffff';
      navBorderColor = themeMode === 'dark' ? 'rgba(232,227,240,0.1)' : 'rgba(45,37,80,0.08)';
      navTextColor = themeMode === 'dark' ? '#f7f3ff' : '#1a1534';
      navWrapperClass = 'max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between';
      navLinksClass = 'hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-[0.35em]';
      navLanguageGroupClass = 'hidden md:flex items-center gap-2 text-[11px] uppercase tracking-[0.35em] font-medium';
      navNameClass = 'font-semibold tracking-[0.45em] uppercase text-xs';
      navNameContainerClass = 'flex flex-col sm:flex-row sm:items-center gap-3 uppercase tracking-[0.2em]';
      navLanguageActiveStyle = {
        backgroundColor: themeMode === 'dark' ? 'rgba(247,243,255,0.15)' : `${primaryColor}12`,
        color: navTextColor,
        borderColor: 'transparent',
        opacity: 1,
      };
      navLanguageInactiveStyle = {
        backgroundColor: 'transparent',
        color: themeMode === 'dark' ? 'rgba(255,255,255,0.65)' : `${primaryColor}70`,
        borderColor: 'transparent',
        opacity: 0.7,
      };
      heroSectionBackground = themeMode === 'dark'
        ? `radial-gradient(circle at top, rgba(45,37,80,0.25), rgba(10,7,22,0.95))`
        : '#ffffff';
      heroTextAlignmentClass = themeMode === 'dark' ? 'text-white' : 'text-[#1a1534]';
      heroHeadingColor = themeMode === 'dark' ? '#f7f3ff' : '#1a1534';
      heroParagraphColor = themeMode === 'dark' ? '#d9d0f1' : '#4d415a';
      heroKickerColor = themeMode === 'dark' ? '#bfb4e5' : '#8a7ca0';
      heroMetaTextColor = themeMode === 'dark' ? 'rgba(247,243,255,0.8)' : '#4d415a';
      heroMetaLabelColor = themeMode === 'dark' ? 'rgba(247,243,255,0.65)' : '#6b5d7a';
      heroLanguageActiveStyle = {
        backgroundColor: themeMode === 'dark' ? 'rgba(247,243,255,0.15)' : `${primaryColor}12`,
        color: heroHeadingColor,
        borderColor: 'transparent',
        opacity: 1,
      };
      heroLanguageInactiveStyle = {
        backgroundColor: 'transparent',
        color: themeMode === 'dark' ? 'rgba(247,243,255,0.6)' : '#8a7ca0',
        borderColor: 'transparent',
        opacity: 0.7,
      };
      heroSecondaryButtonStyle = {
        border: `1px solid ${themeMode === 'dark' ? 'rgba(247,243,255,0.18)' : `${secondaryColor}30`}`,
        color: heroHeadingColor,
        backgroundColor: 'transparent',
      };
      heroCardBackground = themeMode === 'dark' ? 'rgba(18,14,32,0.85)' : '#ffffff';
      heroCardBorderColor = themeMode === 'dark' ? 'rgba(247,243,255,0.08)' : `${secondaryColor}20`;
      heroCardTextColor = themeMode === 'dark' ? 'rgba(247,243,255,0.8)' : '#4d415a';
      heroCardContainerClass = 'rounded-[32px] border p-8 shadow-xl';
      heroCardWrapperClass = 'flex flex-col md:flex-row items-center md:items-start gap-8 text-left w-full';
      heroCardContentClass = 'flex flex-col items-start gap-5 w-full';
      heroCardContactWrapperClass = 'space-y-3 text-sm w-full';
      heroCardContactItemClass = 'flex items-center gap-3 justify-start';
      heroCardSocialWrapperClass = 'flex flex-wrap gap-3 mt-4';
      heroCardSocialButtonClass = 'inline-flex items-center justify-center rounded-full px-3 py-2 text-xs font-semibold border transition-all hover:-translate-y-0.5';
      heroCardSocialButtonStyle = {
        backgroundColor: softSurfaceBackground,
        color: chipTextColor,
        borderColor: chipBorderColor,
      };
      heroCardPhotoWrapperClass = 'relative w-32 h-32 md:w-36 md:h-36 rounded-2xl overflow-hidden shadow-xl';
      heroCardPhotoWrapperStyle = {
        background: themeMode === 'dark' ? 'rgba(247,243,255,0.08)' : '#ffffff',
        boxShadow: `0 24px 50px -20px ${accentColor}45`,
        padding: 0,
      };
      heroCardPhotoClass = 'w-full h-full object-cover rounded-2xl';
      heroCardSummaryClass = 'text-sm leading-relaxed text-left';
      heroCardIconColor = accentColor;
      sectionTitleColor = themeMode === 'dark' ? '#f7f3ff' : '#1a1534';
      sectionBodyColor = themeMode === 'dark' ? '#dcd5f1' : '#4d415a';
      surfaceBackground = themeMode === 'dark' ? 'rgba(18,14,32,0.85)' : '#ffffff';
      surfaceBorderColor = themeMode === 'dark' ? 'rgba(247,243,255,0.08)' : `${secondaryColor}18`;
      softSurfaceBackground = themeMode === 'dark' ? 'rgba(247,243,255,0.06)' : '#f7f6fb';
      chipTextColor = themeMode === 'dark' ? '#f7f3ff' : secondaryColor;
      chipBorderColor = themeMode === 'dark' ? 'rgba(247,243,255,0.12)' : `${secondaryColor}18`;
      timelineBackground = themeMode === 'dark'
        ? 'linear-gradient(180deg, rgba(5,3,12,0.95) 0%, rgba(9,7,20,0.95) 100%)'
        : '#f8f7fa';
      timelineLineColor = themeMode === 'dark' ? 'rgba(247,243,255,0.12)' : `${secondaryColor}18`;
      aboutSectionBackground = themeMode === 'dark' ? 'rgba(8,6,20,0.92)' : '#ffffff';
      navBackButtonStyle = {
        backgroundColor: themeMode === 'dark' ? 'rgba(247,243,255,0.08)' : `${primaryColor}10`,
        color: navTextColor,
        borderColor: themeMode === 'dark' ? 'rgba(247,243,255,0.12)' : `${primaryColor}30`,
        opacity: 1,
      };
      break;
    }
    case 'list': {
      navWrapperClass = 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between';
      navLinksClass = 'hidden md:flex items-center gap-6 text-sm font-semibold';
      navLanguageGroupClass = 'flex items-center gap-2 text-xs font-medium';
      navNameClass = 'font-semibold text-lg tracking-tight';
      navNameContainerClass = 'flex flex-col sm:flex-row sm:items-center gap-3 order-1';
      navBackButtonStyle = {
        backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : `${primaryColor}12`,
        color: navTextColor,
        borderColor: themeMode === 'dark' ? 'rgba(255,255,255,0.14)' : `${primaryColor}20`,
        opacity: 1,
      };
      heroContainerClass = 'max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row gap-12 items-center';
      heroButtonGroupClass = 'flex flex-wrap gap-3 mb-8 justify-center md:justify-start';
      heroMetaAlignmentClass = 'flex flex-wrap items-center justify-center gap-2 text-sm md:justify-start';
      heroParagraphColor = themeMode === 'dark' ? 'rgba(247,243,255,0.82)' : '#4d415a';
      heroSecondaryButtonStyle = {
        border: `1px solid ${themeMode === 'dark' ? 'rgba(247,243,255,0.18)' : `${secondaryColor}25`}`,
        color: heroHeadingColor,
        backgroundColor: 'transparent',
      };
      heroCardContainerClass = themeMode === 'dark'
        ? 'rounded-[30px] border border-white/12 p-6 md:p-8 shadow-[0_45px_80px_-35px_rgba(5,3,12,0.9)] backdrop-blur-xl'
        : 'rounded-[30px] border border-[#2d255020] p-6 md:p-8 shadow-xl';
      heroCardWrapperClass = 'flex flex-col md:flex-row items-center md:items-start gap-8 text-left w-full';
      heroCardContentClass = 'flex flex-col items-start gap-5 w-full';
      heroCardContactWrapperClass = 'space-y-3 text-sm w-full';
      heroCardContactItemClass = 'flex items-center gap-3 justify-start';
      heroCardSocialWrapperClass = 'flex flex-wrap gap-3 mt-4';
      heroCardSocialButtonClass = 'inline-flex items-center justify-center rounded-full px-3 py-2 text-xs font-semibold transition-all hover:-translate-y-0.5';
      heroCardSocialButtonStyle = themeMode === 'dark'
        ? {
            backgroundColor: 'rgba(247,243,255,0.12)',
            color: '#f7f3ff',
            borderColor: 'rgba(247,243,255,0.2)',
          }
        : {
            backgroundColor: '#ffffff',
            color: accentColor,
            borderColor: `${accentColor}35`,
            boxShadow: `0 18px 40px -24px ${accentColor}70`,
          };
      heroCardPhotoWrapperClass = 'relative w-32 h-32 md:w-40 md:h-40 rounded-full p-1.5 shadow-xl';
      heroCardPhotoWrapperStyle = {
        background: `linear-gradient(135deg, ${accentColor}, ${primaryColor})`,
        boxShadow: `0 32px 60px -28px ${accentColor}65`,
        padding: 0,
      };
      heroCardPhotoClass = 'w-full h-full object-cover rounded-full';
      heroCardSummaryClass = 'text-sm leading-relaxed text-left';
      heroCardIconColor = themeMode === 'dark' ? '#f7f3ff' : accentColor;
      break;
    }
    case 'masonry': {
      navBackground = themeMode === 'dark' ? 'rgba(5,3,12,0.95)' : 'rgba(12,9,24,0.65)';
      navBorderColor = 'rgba(255,255,255,0.15)';
      navTextColor = '#ffffff';
      navWrapperClass = 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between uppercase tracking-[0.25em]';
      navLinksClass = 'hidden md:flex items-center gap-5 text-[11px] font-semibold uppercase tracking-[0.35em]';
      navLanguageGroupClass = 'hidden md:flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.35em]';
      navNameClass = 'font-semibold uppercase tracking-[0.45em]';
      navNameContainerClass = 'flex flex-col sm:flex-row sm:items-center gap-3 uppercase tracking-[0.25em]';
      navLanguageActiveStyle = {
        backgroundColor: 'rgba(255,255,255,0.16)',
        color: '#ffffff',
        borderColor: 'transparent',
        opacity: 1,
      };
      navLanguageInactiveStyle = {
        backgroundColor: 'transparent',
        color: 'rgba(255,255,255,0.68)',
        borderColor: 'transparent',
        opacity: 0.75,
      };
      navBackButtonStyle = {
        backgroundColor: 'rgba(255,255,255,0.12)',
        color: '#ffffff',
        borderColor: 'transparent',
        opacity: 1,
      };
      heroContainerClass = 'max-w-6xl mx-auto relative z-10 grid md:grid-cols-[1.1fr_0.9fr] gap-12 items-center';
      heroSecondaryButtonStyle = {
        border: `2px solid rgba(255,255,255,0.25)`,
        color: '#ffffff',
        backgroundColor: 'transparent',
      };
      heroCardContainerClass = 'rounded-[36px] border border-white/18 p-8 shadow-[0_45px_85px_-35px_rgba(8,5,18,0.92)] backdrop-blur-2xl';
      heroCardWrapperClass = 'flex flex-col items-center gap-6 text-center w-full';
      heroCardContentClass = 'flex flex-col items-center gap-5 w-full';
      heroCardContactWrapperClass = 'space-y-3 text-sm w-full';
      heroCardContactItemClass = 'flex items-center gap-2 justify-center';
      heroCardSocialWrapperClass = 'flex flex-wrap justify-center gap-3 mt-6';
      heroCardSocialButtonClass = 'inline-flex items-center justify-center rounded-full w-12 h-12 transition-all hover:-translate-y-1';
      heroCardSocialButtonStyle = {
        backgroundColor: 'rgba(255,255,255,0.12)',
        color: '#ffffff',
        border: '1px solid rgba(255,255,255,0.22)',
      };
      heroCardPhotoWrapperClass = 'relative w-40 h-48 rounded-[32px] overflow-hidden shadow-[0_40px_75px_-32px_rgba(5,3,12,0.95)]';
      heroCardPhotoWrapperStyle = {
        background: `linear-gradient(135deg, ${accentColor}, ${primaryColor})`,
        boxShadow: `0 40px 75px -32px ${accentColor}85`,
        padding: 0,
      };
      heroCardPhotoClass = 'w-full h-full object-cover rounded-[28px]';
      heroCardSummaryClass = 'text-sm leading-relaxed text-center text-white/80';
      heroCardIconColor = '#ffffff';
      break;
    }
    case 'spotlight': {
      pageBackground = themeMode === 'dark' ? '#05020c' : '#faf7ff';
      pageTextColor = themeMode === 'dark' ? '#f7f3ff' : '#1c1538';
      navBackground = themeMode === 'dark' ? 'rgba(10,6,20,0.95)' : '#fff6fb';
      navBorderColor = themeMode === 'dark' ? 'rgba(232,227,240,0.12)' : 'rgba(28,21,56,0.12)';
      navTextColor = themeMode === 'dark' ? '#f7f3ff' : '#1c1538';
      navWrapperClass = 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4';
      navLinksClass = 'hidden md:flex md:justify-end items-center gap-6 text-xs font-semibold uppercase tracking-[0.4em]';
      navLanguageGroupClass = 'flex items-center gap-2 text-[11px] uppercase tracking-[0.35em]';
      navNameClass = 'font-semibold uppercase tracking-[0.4em] text-sm';
      navNameContainerClass = 'flex flex-col sm:flex-row sm:items-center justify-between w-full md:w-auto gap-3';
      navLanguageActiveStyle = {
        backgroundColor: themeMode === 'dark' ? 'rgba(247,243,255,0.2)' : 'rgba(28,21,56,0.12)',
        color: navTextColor,
        borderColor: 'transparent',
        opacity: 1,
      };
      navLanguageInactiveStyle = {
        backgroundColor: 'transparent',
        color: themeMode === 'dark' ? 'rgba(247,243,255,0.65)' : '#7a6a9a',
        borderColor: 'transparent',
        opacity: 0.75,
      };
      heroSectionBackground = themeMode === 'dark'
        ? `linear-gradient(135deg, rgba(20,15,38,0.95), rgba(10,6,20,0.94))`
        : `linear-gradient(135deg, ${primaryColor}, #fff6fb)`;
      heroHeadingColor = themeMode === 'dark' ? '#f7f3ff' : '#1c1538';
      heroParagraphColor = themeMode === 'dark' ? '#dcd5f1' : '#443356';
      heroKickerColor = themeMode === 'dark' ? '#bfb2e8' : '#8a7ca0';
      heroMetaTextColor = themeMode === 'dark' ? 'rgba(247,243,255,0.75)' : '#4d3e63';
      heroMetaLabelColor = themeMode === 'dark' ? 'rgba(247,243,255,0.6)' : '#6b5d7a';
      heroLanguageActiveStyle = {
        backgroundColor: themeMode === 'dark' ? 'rgba(247,243,255,0.18)' : 'rgba(28,21,56,0.12)',
        color: heroHeadingColor,
        borderColor: 'transparent',
        opacity: 1,
      };
      heroLanguageInactiveStyle = {
        backgroundColor: 'transparent',
        color: themeMode === 'dark' ? 'rgba(247,243,255,0.55)' : '#8373a8',
        borderColor: 'transparent',
        opacity: 0.7,
      };
      heroCardBackground = themeMode === 'dark' ? 'rgba(24,18,44,0.85)' : '#ffffff';
      heroCardBorderColor = themeMode === 'dark' ? 'rgba(247,243,255,0.08)' : 'rgba(28,21,56,0.12)';
      heroCardTextColor = themeMode === 'dark' ? 'rgba(247,243,255,0.8)' : '#4d3e63';
      sectionTitleColor = themeMode === 'dark' ? '#f7f3ff' : '#1c1538';
      sectionBodyColor = themeMode === 'dark' ? '#dcd5f1' : '#4d3e63';
      surfaceBackground = themeMode === 'dark' ? 'rgba(24,18,44,0.85)' : '#ffffff';
      surfaceBorderColor = themeMode === 'dark' ? 'rgba(247,243,255,0.08)' : 'rgba(28,21,56,0.12)';
      softSurfaceBackground = themeMode === 'dark' ? 'rgba(247,243,255,0.06)' : '#f4eefc';
      chipTextColor = themeMode === 'dark' ? '#f7f3ff' : '#1c1538';
      chipBorderColor = themeMode === 'dark' ? 'rgba(247,243,255,0.08)' : 'rgba(28,21,56,0.12)';
      timelineBackground = themeMode === 'dark'
        ? 'linear-gradient(180deg, rgba(14,10,32,0.95) 0%, rgba(9,6,20,0.95) 100%)'
        : '#f4f0fb';
      timelineLineColor = themeMode === 'dark' ? 'rgba(247,243,255,0.08)' : 'rgba(28,21,56,0.1)';
      aboutSectionBackground = themeMode === 'dark' ? 'rgba(18,13,37,0.92)' : '#ffffff';
      navBackButtonStyle = {
        backgroundColor: themeMode === 'dark' ? 'rgba(247,243,255,0.12)' : 'rgba(28,21,56,0.08)',
        color: navTextColor,
        borderColor: themeMode === 'dark' ? 'rgba(247,243,255,0.18)' : 'rgba(28,21,56,0.12)',
        opacity: 1,
      };
      heroCardContainerClass = 'rounded-[36px] border border-white/14 p-8 shadow-[0_55px_90px_-45px_rgba(10,6,25,0.9)] backdrop-blur-2xl';
      heroCardWrapperClass = 'flex flex-col md:flex-row items-center md:items-start gap-8 text-left w-full';
      heroCardContentClass = 'flex flex-col items-start gap-5 w-full';
      heroCardContactWrapperClass = 'space-y-3 text-sm w-full';
      heroCardContactItemClass = 'flex items-center gap-3 justify-start';
      heroCardSocialWrapperClass = 'flex flex-wrap gap-3 mt-4';
      heroCardSocialButtonClass = 'inline-flex items-center justify-center rounded-full px-3 py-2 text-xs font-semibold transition-all hover:-translate-y-0.5';
      heroCardSocialButtonStyle = {
        backgroundColor: 'rgba(247,243,255,0.16)',
        color: '#f7f3ff',
        borderColor: 'rgba(247,243,255,0.24)',
      };
      heroCardPhotoWrapperClass = 'relative w-36 h-36 md:w-40 md:h-40 rounded-[28px] overflow-hidden shadow-2xl';
      heroCardPhotoWrapperStyle = {
        background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
        boxShadow: `0 38px 85px -40px ${accentColor}85`,
        padding: 0,
      };
      heroCardPhotoClass = 'w-full h-full object-cover rounded-[24px]';
      heroCardSummaryClass = 'text-sm leading-relaxed text-left text-white/85';
      heroCardIconColor = '#f7f3ff';
      break;
    }
    case 'editorial': {
      pageBackground = themeMode === 'dark' ? '#0c0818' : '#faf8f2';
      pageTextColor = themeMode === 'dark' ? '#f7f3ff' : '#1c1538';
      navBackground = themeMode === 'dark' ? '#140e28f2' : '#ffffff';
      navBorderColor = themeMode === 'dark' ? 'rgba(232,227,240,0.1)' : 'rgba(28,21,56,0.12)';
      navTextColor = themeMode === 'dark' ? '#f7f3ff' : '#1c1538';
      navWrapperClass = 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5';
      navLinksClass = 'hidden md:flex items-center gap-7 text-sm font-semibold uppercase tracking-[0.3em]';
      navLanguageGroupClass = 'hidden md:flex items-center gap-2 text-[11px] uppercase tracking-[0.3em]';
      navNameClass = 'font-semibold uppercase tracking-[0.35em] text-sm';
      navNameContainerClass = 'flex flex-col sm:flex-row sm:items-center gap-3 uppercase tracking-[0.25em]';
      navLanguageActiveStyle = {
        backgroundColor: themeMode === 'dark' ? 'rgba(247,243,255,0.18)' : 'rgba(28,21,56,0.12)',
        color: navTextColor,
        borderColor: 'transparent',
        opacity: 1,
      };
      navLanguageInactiveStyle = {
        backgroundColor: 'transparent',
        color: themeMode === 'dark' ? 'rgba(247,243,255,0.65)' : '#6b5d7a',
        borderColor: 'transparent',
        opacity: 0.75,
      };
      heroSectionBackground = themeMode === 'dark' ? '#120d25' : '#fffdfa';
      heroContainerClass = 'max-w-6xl mx-auto relative z-10 grid md:grid-cols-[1.05fr_0.95fr] gap-12 items-center';
      heroHeadingColor = themeMode === 'dark' ? '#f7f3ff' : '#1a1534';
      heroParagraphColor = themeMode === 'dark' ? '#d9d0f1' : '#4d415a';
      heroKickerColor = themeMode === 'dark' ? '#c5bbeb' : '#8a7ca0';
      heroMetaTextColor = themeMode === 'dark' ? 'rgba(247,243,255,0.8)' : '#4d415a';
      heroMetaLabelColor = themeMode === 'dark' ? 'rgba(247,243,255,0.6)' : '#6b5d7a';
      heroLanguageActiveStyle = {
        backgroundColor: themeMode === 'dark' ? 'rgba(247,243,255,0.18)' : 'rgba(28,21,56,0.12)',
        color: heroHeadingColor,
        borderColor: 'transparent',
        opacity: 1,
      };
      heroLanguageInactiveStyle = {
        backgroundColor: 'transparent',
        color: themeMode === 'dark' ? 'rgba(247,243,255,0.6)' : '#8374a6',
        borderColor: 'transparent',
        opacity: 0.7,
      };
      heroSecondaryButtonStyle = {
        border: `2px solid ${themeMode === 'dark' ? 'rgba(247,243,255,0.18)' : 'rgba(28,21,56,0.18)'}`,
        color: heroHeadingColor,
        backgroundColor: 'transparent',
      };
      heroCardBackground = themeMode === 'dark' ? '#1a1534' : '#ffffff';
      heroCardBorderColor = themeMode === 'dark' ? 'rgba(247,243,255,0.08)' : 'rgba(28,21,56,0.12)';
      heroCardTextColor = themeMode === 'dark' ? '#dcd5f1' : '#4d415a';
      heroCardHeadingColor = themeMode === 'dark' ? '#f7f3ff' : '#1a1534';
      sectionTitleColor = themeMode === 'dark' ? '#f7f3ff' : '#1a1534';
      sectionBodyColor = themeMode === 'dark' ? '#dcd5ef' : '#3e3358';
      surfaceBackground = themeMode === 'dark' ? '#161129' : '#ffffff';
      surfaceBorderColor = themeMode === 'dark' ? 'rgba(232,227,240,0.08)' : 'rgba(28,21,56,0.12)';
      softSurfaceBackground = themeMode === 'dark' ? 'rgba(232,227,240,0.05)' : '#f2efe9';
      chipTextColor = themeMode === 'dark' ? '#f7f3ff' : '#1c1538';
      chipBorderColor = themeMode === 'dark' ? 'rgba(232,227,240,0.12)' : 'rgba(28,21,56,0.12)';
      aboutSectionBackground = themeMode === 'dark' ? 'rgba(18, 13, 37, 0.92)' : '#ffffff';
      timelineBackground = themeMode === 'dark'
        ? 'linear-gradient(180deg, rgba(14,10,32,0.95) 0%, rgba(9,6,20,0.95) 100%)'
        : '#f4f1ea';
      timelineLineColor = themeMode === 'dark' ? 'rgba(232,227,240,0.08)' : 'rgba(28,21,56,0.1)';
      contactSectionBackground = `linear-gradient(135deg, ${primaryColor}, ${backgroundColor || '#f0ebe0'})`;
      navBackButtonStyle = {
        backgroundColor: themeMode === 'dark' ? 'rgba(247,243,255,0.12)' : 'rgba(28,21,56,0.08)',
        color: navTextColor,
        borderColor: themeMode === 'dark' ? 'rgba(247,243,255,0.2)' : 'rgba(28,21,56,0.15)',
        opacity: 1,
      };
      heroCardContainerClass = 'rounded-[40px] border p-8 shadow-[0_55px_95px_-40px_rgba(26,21,54,0.45)]';
      heroCardWrapperClass = 'flex flex-col md:flex-row items-center md:items-start gap-9 text-left w-full';
      heroCardContentClass = 'flex flex-col items-start gap-5 w-full';
      heroCardContactWrapperClass = 'space-y-3 text-sm w-full';
      heroCardContactItemClass = 'flex items-center gap-3 justify-start';
      heroCardSocialWrapperClass = 'flex flex-wrap gap-3 mt-5';
      heroCardSocialButtonClass = 'inline-flex items-center justify-center rounded-full px-3 py-2 text-xs font-semibold border transition-all hover:-translate-y-0.5';
      heroCardSocialButtonStyle = themeMode === 'dark'
        ? {
            backgroundColor: 'rgba(247,243,255,0.12)',
            color: '#f7f3ff',
            borderColor: 'rgba(247,243,255,0.24)',
          }
        : {
            backgroundColor: '#fff4ea',
            color: accentColor,
            borderColor: `${accentColor}32`,
          };
      heroCardPhotoWrapperClass = 'relative w-36 h-44 rounded-[28px] overflow-hidden shadow-2xl';
      heroCardPhotoWrapperStyle = {
        background: themeMode === 'dark' ? 'rgba(247,243,255,0.08)' : '#ffffff',
        boxShadow: `0 38px 80px -38px ${accentColor}40`,
        padding: 0,
      };
      heroCardPhotoClass = 'w-full h-full object-cover rounded-[24px]';
      heroCardSummaryClass = 'text-sm leading-relaxed text-left';
      heroCardIconColor = themeMode === 'dark' ? '#f7f3ff' : accentColor;
      break;
    }
    default:
      break;
  }

  const resolvedProfile = useMemo(() => {
    const socialLinks: Required<NonNullable<UserProfile['socialLinks']>> = {
      website: userProfile?.socialLinks?.website?.trim() ?? '',
      linkedin: userProfile?.socialLinks?.linkedin?.trim() ?? '',
      github: userProfile?.socialLinks?.github?.trim() ?? '',
      instagram: userProfile?.socialLinks?.instagram?.trim() ?? '',
      youtube: userProfile?.socialLinks?.youtube?.trim() ?? '',
      spotify: userProfile?.socialLinks?.spotify?.trim() ?? '',
      soundcloud: userProfile?.socialLinks?.soundcloud?.trim() ?? '',
    };

    const skills = Array.isArray(userProfile?.skills) ? [...userProfile.skills] : [];
    const education = Array.isArray(userProfile?.education) ? [...userProfile.education] : [];

    return {
      name: userProfile?.fullName?.trim() || 'Seu Nome',
      title: userProfile?.title?.trim() ?? '',
      bio: userProfile?.bio?.trim() ?? '',
      email: userProfile?.email?.trim() ?? '',
      phone: userProfile?.phone?.trim() ?? '',
      location: userProfile?.location?.trim() ?? '',
      photo: userProfile?.photoUrl ?? '',
      skills,
      education,
      socialLinks,
      translations: userProfile?.translations ?? {},
    };
  }, [userProfile]);

  type ProfileTranslationField = 'title' | 'bio';
  type ProjectTranslationField = 'title' | 'description' | 'category';
  type ExperienceTranslationField = 'title' | 'company' | 'description';
  type ArticleTranslationField = 'title' | 'summary' | 'publication';

  const getTranslationMapForLanguage = (language: CV['language']) => {
    if (language === 'pt') {
      return undefined;
    }
    if (language === cvLanguage) {
      return cvTranslations;
    }
    if (language === locale) {
      return portfolioTranslations;
    }
    return undefined;
  };

  const getTranslatedField = (
    field: ProfileTranslationField,
    language: CV['language'] = locale as CV['language'],
  ) => {
    const baseValue = field === 'title' ? resolvedProfile.title : resolvedProfile.bio;
    if (language === 'pt') {
      return baseValue;
    }

    const directValue = resolvedProfile.translations?.[language]?.[field];
    if (directValue && directValue.trim().length > 0) {
      return directValue;
    }

    const translationMap = getTranslationMapForLanguage(language);
    if (translationMap) {
      const key = `profile.${field}`;
      const translated = translationMap[key];
      if (translated && translated.trim().length > 0) {
        return translated;
      }
    }

    return baseValue;
  };

  const getTranslatedProject = (
    project: Project,
    field: ProjectTranslationField,
    language: CV['language'] = locale as CV['language'],
  ) => {
    const baseValue = (project[field] ?? '') as string;
    if (language === 'pt') {
      return baseValue;
    }

    const directValue = project.translations?.[language]?.[field];
    if (directValue && directValue.trim().length > 0) {
      return directValue;
    }

    const translationMap = getTranslationMapForLanguage(language);
    if (translationMap) {
      const key = `project.${project.id}.${field}`;
      const translated = translationMap[key];
      if (translated && translated.trim().length > 0) {
        return translated;
      }
    }

    return baseValue;
  };

  const getTranslatedExperience = (
    experience: Experience,
    field: ExperienceTranslationField,
    language: CV['language'] = locale as CV['language'],
  ) => {
    const baseValue = (experience[field] ?? '') as string;
    if (language === 'pt') {
      return baseValue;
    }

    const directValue = experience.translations?.[language]?.[field];
    if (directValue && directValue.trim().length > 0) {
      return directValue;
    }

    const translationMap = getTranslationMapForLanguage(language);
    if (translationMap) {
      const key = `experience.${experience.id}.${field}`;
      const translated = translationMap[key];
      if (translated && translated.trim().length > 0) {
        return translated;
      }
    }

    return baseValue;
  };

  const getTranslatedArticle = (
    article: ScientificArticle,
    field: ArticleTranslationField,
    language: CV['language'] = locale as CV['language'],
  ) => {
    const baseValue = field === 'title'
      ? article.title
      : field === 'summary'
        ? article.summary ?? ''
        : article.publication ?? '';

    if (language === 'pt') {
      return baseValue;
    }

    const directValue = article.translations?.[language]?.[field];
    if (directValue && directValue.trim().length > 0) {
      return directValue;
    }

    const translationMap = getTranslationMapForLanguage(language);
    if (translationMap) {
      const key = `article.${article.id}.${field}`;
      const translated = translationMap[key];
      if (translated && translated.trim().length > 0) {
        return translated;
      }
    }

    return baseValue;
  };

  const fallbackProjects: Project[] = [];
  const fallbackExperiences: Experience[] = [];
  const fallbackEducation: UserProfile['education'] = [];

  const projectsToShow = useMemo(
    () => (projects.length > 0 ? projects : fallbackProjects),
    [projects],
  );
  const experiencesToShow = useMemo(
    () => (experiences.length > 0 ? experiences : fallbackExperiences),
    [experiences],
  );
  const articlesToShow = useMemo(
    () => articles.filter((article) => article.showInPortfolio !== false),
    [articles],
  );
  const cvArticles = useMemo(
    () => articles.filter((article) => article.showInCv !== false),
    [articles],
  );
  const profileSkills = useMemo(
    () => (resolvedProfile.skills.length ? resolvedProfile.skills : []),
    [resolvedProfile.skills],
  );
  const educationToShow = useMemo(
    () => (resolvedProfile.education.length ? resolvedProfile.education : fallbackEducation),
    [resolvedProfile.education],
  );
  const projectTags = useMemo(
    () =>
      Array.from(new Set(projectsToShow.flatMap((project) => project.tags ?? []))),
    [projectsToShow],
  );
  const highlightTags = useMemo(() => projectTags.slice(0, 8), [projectTags]);

  const certificates = useMemo(
    () => experiencesToShow.filter((exp) => exp.certificateUrl && exp.showCertificate),
    [experiencesToShow],
  );

  const availableCvLanguages = useMemo(() => {
    const unique = Array.from(new Set(cvs.map((cv) => cv.language)));
    return unique.length > 0 ? unique : (['pt', 'en', 'es'] as CV['language'][]);
  }, [cvs]);

  useEffect(() => {
    if (availableCvLanguages.length === 0) {
      return;
    }

    if (availableCvLanguages.includes(locale as CV['language'])) {
      setCvLanguage(locale as CV['language']);
      return;
    }

    setCvLanguage(availableCvLanguages[0]);
  }, [availableCvLanguages, locale]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const langParam = params.get('cvLang');
    if (langParam === 'pt' || langParam === 'en' || langParam === 'es') {
      if (availableCvLanguages.includes(langParam as CV['language']) && cvLanguage !== langParam) {
        setCvLanguage(langParam as CV['language']);
      }
    }
  }, [availableCvLanguages, cvLanguage]);

  const translatableItems = useMemo(() => {
    const items: Array<{ key: string; text: string }> = [];
    const seen = new Set<string>();
    const pushItem = (key: string, text?: string | null) => {
      const trimmed = typeof text === 'string' ? text.trim() : '';
      if (!trimmed || seen.has(key)) {
        return;
      }
      seen.add(key);
      items.push({ key, text: trimmed });
    };

    pushItem('profile.title', resolvedProfile.title);
    pushItem('profile.bio', resolvedProfile.bio);

    projectsToShow.forEach((project) => {
      pushItem(`project.${project.id}.title`, project.title);
      pushItem(`project.${project.id}.description`, project.description);
      pushItem(`project.${project.id}.category`, project.category);
      pushItem(`project.${project.id}.company`, project.company);
      pushItem(`project.${project.id}.results`, project.results);
    });

    experiencesToShow.forEach((exp) => {
      pushItem(`experience.${exp.id}.title`, exp.title);
      pushItem(`experience.${exp.id}.company`, exp.company);
      pushItem(`experience.${exp.id}.description`, exp.description);
    });

    educationToShow.forEach((edu, index) => {
      pushItem(`education.${index}.degree`, edu.degree);
      pushItem(`education.${index}.institution`, edu.institution);
      pushItem(`education.${index}.description`, edu.description);
    });

    const articlePool = new Map<string, ScientificArticle>();
    articlesToShow.forEach((article) => articlePool.set(article.id, article));
    cvArticles.forEach((article) => articlePool.set(article.id, article));

    articlePool.forEach((article) => {
      pushItem(`article.${article.id}.title`, article.title);
      pushItem(`article.${article.id}.summary`, article.summary);
      pushItem(`article.${article.id}.publication`, article.publication);
    });

    return items;
  }, [articlesToShow, cvArticles, educationToShow, experiencesToShow, projectsToShow, resolvedProfile.bio, resolvedProfile.title]);

  useEffect(() => {
    if (translatableItems.length === 0) {
      setPortfolioTranslations({});
      return;
    }

    if (!translateEnabled) {
      setPortfolioTranslations({});
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const fetchTranslations = async () => {
      try {
        const response = await fetch(translateEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target: locale,
            texts: translatableItems.map((item) => item.text),
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const payload = await response.json() as { translations?: string[] };
        if (cancelled) {
          return;
        }

        const mapped: Record<string, string> = {};
        const results = Array.isArray(payload.translations) ? payload.translations : [];
        results.forEach((value, index) => {
          const key = translatableItems[index]?.key;
          if (key && typeof value === 'string' && value.trim().length > 0) {
            mapped[key] = value;
          }
        });

        setPortfolioTranslations(mapped);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Failed to translate portfolio content', error);
        }
      }
    };

    fetchTranslations();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [locale, translatableItems, translateEnabled, translateEndpoint]);

  useEffect(() => {
    if (translatableItems.length === 0) {
      setCvTranslations({});
      return;
    }

    if (cvLanguage === 'pt') {
      setCvTranslations({});
      return;
    }

    if (cvLanguage === locale) {
      setCvTranslations({ ...portfolioTranslations });
      return;
    }

    if (!translateEnabled) {
      setCvTranslations({});
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const fetchTranslations = async () => {
      try {
        const response = await fetch(translateEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target: cvLanguage,
            texts: translatableItems.map((item) => item.text),
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const payload = await response.json() as { translations?: string[] };
        if (cancelled) {
          return;
        }

        const mapped: Record<string, string> = {};
        const results = Array.isArray(payload.translations) ? payload.translations : [];
        results.forEach((value, index) => {
          const key = translatableItems[index]?.key;
          if (key && typeof value === 'string' && value.trim().length > 0) {
            mapped[key] = value;
          }
        });

        setCvTranslations(mapped);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Failed to translate CV content', error);
        }
      }
    };

    fetchTranslations();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [cvLanguage, locale, portfolioTranslations, translatableItems, translateEnabled, translateEndpoint]);

  const translateForLocale = (key: string, fallback: string) => {
    if (locale === 'pt') {
      return fallback;
    }
    const translationMap = getTranslationMapForLanguage(locale as CV['language']);
    const translated = translationMap?.[key];
    return translated && translated.trim().length > 0 ? translated : fallback;
  };

  const translateForCv = (key: string, fallback: string) => {
    if (cvLanguage === 'pt') {
      return fallback;
    }
    const translationMap = getTranslationMapForLanguage(cvLanguage);
    const translated = translationMap?.[key];
    return translated && translated.trim().length > 0 ? translated : fallback;
  };

  const fullBio = getTranslatedField('bio');
  const aboutBio = fullBio;
  const aboutParagraphs = useMemo(() => {
    if (!aboutBio.trim()) {
      return [] as string[];
    }

    const segments = aboutBio
      .split(/\r?\n{2,}|\r\n\r\n/)
      .map((segment: string) => segment.trim())
      .filter(Boolean);

    if (segments.length > 0) {
      return segments;
    }

    return [aboutBio.trim()];
  }, [aboutBio]);

  const heroBio = useMemo(() => {
    const normalized = fullBio.replace(/\s+/g, ' ').trim();
    if (!normalized) {
      return '';
    }
    const limit = layout === 'editorial' || layout === 'spotlight' ? 260 : 200;
    if (normalized.length <= limit) {
      return normalized;
    }
    return `${normalized.slice(0, limit).trimEnd()}…`;
  }, [fullBio, layout]);

  const heroCardShouldShowSummary = heroSummaryLayouts.has(layout) && heroBio.length > 0;

  const hasSocialLinks = useMemo(
    () => Object.values(resolvedProfile.socialLinks).some((value) => Boolean(value)),
    [resolvedProfile.socialLinks],
  );

  const handleCvDownload = () => {
    if (typeof window === 'undefined' || !cvRef.current) {
      return;
    }

    const cleanup = (iframe: HTMLIFrameElement) => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    };

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);

    const cvHtml = cvRef.current.innerHTML;
    const cvDocument = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${cvLabels[cvLanguage].title} - ${resolvedProfile.name}</title>
    <style>
      :root { color-scheme: light; }
      @page { size: A4; margin: 20mm 18mm; }
      body { font-family: ${fontFamily}; margin: 0; background: #ffffff; color: #1a1534; }
      main { max-width: 720px; margin: 0 auto; padding: 24px 16px; }
      h1 { font-size: 28px; font-weight: 700; margin: 0 0 6px; color: #1a1534; }
      h2 { font-size: 16px; margin: 24px 0 8px; color: ${primaryColor}; letter-spacing: 0.12em; text-transform: uppercase; }
      p { line-height: 1.6; margin: 6px 0; color: #3e3358; }
      .section { margin-top: 20px; }
      .meta { font-size: 13px; color: #6b5d7a; letter-spacing: 0.1em; text-transform: uppercase; }
      ul { padding-left: 18px; margin: 10px 0; }
      li { margin-bottom: 6px; line-height: 1.5; }
      strong { font-weight: 600; color: #1a1534; }
      @media print {
        body { background: #ffffff; }
        main { padding: 0; }
        a { color: inherit; text-decoration: none; }
      }
    </style>
  </head>
  <body>
    <main>${cvHtml}</main>
  </body>
</html>`;

    iframe.srcdoc = cvDocument;

    iframe.onload = () => {
      const iframeWindow = iframe.contentWindow;
      if (!iframeWindow) {
        cleanup(iframe);
        return;
      }

      const afterPrint = () => {
        cleanup(iframe);
      };

      iframeWindow.addEventListener('afterprint', afterPrint, { once: true });

      const triggerPrint = () => {
        try {
          iframeWindow.focus();
        } catch (error) {
          console.error('Failed to focus CV print frame', error);
        }
        iframeWindow.print();
      };

      window.setTimeout(triggerPrint, 0);
      window.setTimeout(triggerPrint, 250);
    };

    window.setTimeout(() => cleanup(iframe), 12000);
  };

  const projectGridClass = (() => {
    switch (layout) {
      case 'list':
        return 'space-y-6';
      case 'masonry':
        return 'columns-1 md:columns-2 lg:columns-3 gap-6 [column-gap:2rem]';
      case 'minimal':
        return 'grid md:grid-cols-2 gap-8';
      case 'spotlight':
        return 'grid md:grid-cols-2 gap-10';
      case 'editorial':
        return 'space-y-10';
      default:
        return 'grid md:grid-cols-2 lg:grid-cols-3 gap-6';
    }
  })();

  const navItems = [
    { href: '#about', label: t('public.nav.about') },
    { href: '#education', label: t('public.nav.education') },
    ...(articlesToShow.length > 0
      ? [{ href: '#articles', label: t('public.nav.articles') }]
      : []),
    { href: '#projects', label: t('public.nav.projects') },
    { href: '#experience', label: t('public.nav.experience') },
    { href: '#contact', label: t('public.nav.contact') },
  ];

  const rootClassName = previewMode ? 'w-full' : 'min-h-screen';

  return (
    <div className={rootClassName} style={{ backgroundColor: pageBackground, color: pageTextColor, fontFamily }}>
      <header
        className="sticky top-0 z-20 border-b backdrop-blur-sm"
        style={{ background: navBackground, borderColor: navBorderColor }}
      >
        <div className={navWrapperClass} style={{ color: navTextColor }}>
          <div className="flex w-full items-center justify-between gap-3">
            <div className={`${navNameContainerClass} flex-1 sm:flex-none`}>
              {onBackToDashboard && (
                <button
                  onClick={previewMode ? undefined : onBackToDashboard}
                  className="px-2 py-1 md:px-3 md:py-1.5 rounded transition-all flex items-center gap-1 text-xs md:text-sm"
                  style={{
                    backgroundColor: navBackButtonStyle.backgroundColor,
                    color: navBackButtonStyle.color,
                    borderColor: navBackButtonStyle.borderColor,
                    opacity: navBackButtonStyle.opacity,
                  }}
                >
                  ← Dashboard
                </button>
              )}
              <div className={navNameClass}>{resolvedProfile.name}</div>
            </div>

            <div className="flex items-center gap-3">
              <nav className={navLinksClass}>
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="hover:opacity-80 transition-opacity"
                    style={{ color: navTextColor }}
                    onClick={preventPreviewClick}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>

              <div className={navLanguageGroupClass}>
                {(['pt', 'en', 'es'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={previewMode ? undefined : () => setLocale(lang)}
                    className="px-2 py-1 rounded transition-all"
                    disabled={previewMode}
                    style={{
                      backgroundColor: locale === lang
                        ? navLanguageActiveStyle.backgroundColor
                        : navLanguageInactiveStyle.backgroundColor,
                      color: locale === lang
                        ? navLanguageActiveStyle.color
                        : navLanguageInactiveStyle.color,
                      borderColor: locale === lang
                        ? navLanguageActiveStyle.borderColor
                        : navLanguageInactiveStyle.borderColor,
                      opacity: locale === lang
                        ? navLanguageActiveStyle.opacity
                        : navLanguageInactiveStyle.opacity,
                    }}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md border px-3 py-2 md:hidden"
                style={{
                  borderColor: navBorderColor,
                  color: navTextColor,
                  backgroundColor: themeMode === 'dark' ? 'rgba(15,11,31,0.9)' : '#ffffff',
                }}
                onClick={previewMode ? undefined : () => setMobileNavOpen((open) => !open)}
                disabled={previewMode}
                aria-expanded={mobileNavOpen}
                aria-label={mobileNavOpen ? 'Fechar menu' : 'Abrir menu'}
              >
                {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {!previewMode && mobileNavOpen ? (
            <div
              className="flex w-full flex-col gap-4 rounded-lg border px-4 py-4 md:hidden"
              style={{
                borderColor: navBorderColor,
                background: themeMode === 'dark' ? 'rgba(12, 9, 24, 0.96)' : '#ffffff',
              }}
            >
              <nav className="flex flex-col gap-3 text-sm">
                {navItems.map((item) => (
                  <a
                    key={`mobile-${item.href}`}
                    href={item.href}
                    className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 transition-opacity hover:opacity-80"
                    style={{ color: navTextColor }}
                    onClick={handleNavLinkClick}
                  >
                    <span>{item.label}</span>
                    <ExternalLink className="h-4 w-4 opacity-60" />
                  </a>
                ))}
              </nav>
              <div className="flex flex-wrap gap-2">
                {(['pt', 'en', 'es'] as const).map((lang) => (
                  <button
                    key={`mobile-lang-${lang}`}
                    onClick={() => {
                      if (previewMode) {
                        return;
                      }
                      setLocale(lang);
                      setMobileNavOpen(false);
                    }}
                    className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
                    style={{
                      backgroundColor: locale === lang
                        ? navLanguageActiveStyle.backgroundColor
                        : navLanguageInactiveStyle.backgroundColor,
                      color: locale === lang
                        ? navLanguageActiveStyle.color
                        : navLanguageInactiveStyle.color,
                      borderColor: locale === lang
                        ? navLanguageActiveStyle.borderColor
                        : navLanguageInactiveStyle.borderColor,
                      opacity: locale === lang
                        ? navLanguageActiveStyle.opacity
                        : navLanguageInactiveStyle.opacity,
                    }}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </header>

      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden" style={{ background: heroSectionBackground }}>
        {heroParticleLayouts.has(layout) && (
          <div className="absolute inset-0 opacity-40">
            <div className="absolute w-1 h-1 bg-white rounded-full top-[12%] left-[18%] animate-pulse" />
            <div
              className="absolute w-1 h-1 bg-white rounded-full top-[34%] left-[78%] animate-pulse"
              style={{ animationDelay: '1s' }}
            />
            <div
              className="absolute w-1 h-1 bg-white rounded-full top-[62%] left-[12%] animate-pulse"
              style={{ animationDelay: '2s' }}
            />
            <div
              className="absolute w-2 h-2"
              style={{ backgroundColor: accentColor, borderRadius: '999px', top: '44%', left: '58%', animationDelay: '1.2s' }}
            />
          </div>
        )}

        <div className={heroContainerClass}>
          <div className={heroTextAlignmentClass}>
            <p className="text-sm uppercase tracking-[0.3em] mb-4" style={{ color: heroKickerColor }}>
              {t('public.badge')}
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4" style={{ color: heroHeadingColor }}>
              {resolvedProfile.name}
            </h1>
            <p
              className="text-xl md:text-2xl lg:text-3xl bg-clip-text text-transparent mb-6"
              style={{ backgroundImage: `linear-gradient(90deg, ${accentColor}, ${primaryColor})` }}
            >
              {getTranslatedField('title')}
            </p>
            {heroBio && (
              <p className="text-base md:text-lg leading-relaxed mb-8" style={{ color: heroParagraphColor }}>
                {heroBio}
              </p>
            )}

            <div className={heroButtonGroupClass}>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium shadow-lg transition-all hover:scale-105"
                style={{ backgroundColor: accentColor, color: '#fff' }}
              >
                {t('public.cta.talk')}
              </a>
              <a
                href="#projects"
                className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors"
                style={heroSecondaryButtonStyle}
              >
                {t('public.cta.projects')}
              </a>
              <button
                type="button"
                onClick={handleCvDownload}
                className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium shadow-2xl transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  backgroundColor: accentColor,
                  color: '#ffffff',
                  boxShadow: `0 20px 45px -12px ${accentColor}66`,
                }}
              >
                <Download className="w-5 h-5 mr-2" />
                {t('public.downloadCv')}
              </button>
            </div>

            <div className={`${heroMetaAlignmentClass} mb-8`} style={{ color: heroMetaTextColor }}>
              <span style={{ color: heroMetaLabelColor }}>{t('public.language')}</span>
              {(['pt', 'en', 'es'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLocale(lang)}
                  className="px-3 py-1 rounded-full border transition-all"
                  style={{
                    backgroundColor: locale === lang
                      ? heroLanguageActiveStyle.backgroundColor
                      : heroLanguageInactiveStyle.backgroundColor,
                    color: locale === lang
                      ? heroLanguageActiveStyle.color
                      : heroLanguageInactiveStyle.color,
                    borderColor: locale === lang
                      ? heroLanguageActiveStyle.borderColor
                      : heroLanguageInactiveStyle.borderColor,
                    opacity: locale === lang
                      ? heroLanguageActiveStyle.opacity
                      : heroLanguageInactiveStyle.opacity,
                  }}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

            <div className={heroMetaAlignmentClass} style={{ color: heroMetaTextColor }}>
              <span style={{ color: heroMetaLabelColor }}>{t('public.cvLanguage')}</span>
              <select
                value={cvLanguage}
                onChange={(e) => setCvLanguage(e.target.value as CV['language'])}
                className="rounded-lg border px-3 py-2 text-sm"
                style={{
                  backgroundColor: heroLanguageInactiveStyle.backgroundColor === 'transparent'
                    ? 'transparent'
                    : heroLanguageInactiveStyle.backgroundColor,
                  color: heroLanguageInactiveStyle.color,
                  borderColor: heroLanguageInactiveStyle.borderColor ?? 'rgba(255,255,255,0.2)',
                }}
              >
                {availableCvLanguages.map((lang) => (
                  <option key={lang} value={lang} className="text-[#1a1534]">
                    {lang.toUpperCase()}
                  </option>
                ))}
              </select>
              <button
                onClick={previewMode ? undefined : handleCvDownload}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium shadow-lg transition-all hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: accentColor, color: '#fff' }}
                disabled={previewMode}
                title={previewMode ? 'Disponível apenas no portfólio publicado' : undefined}
              >
                <Download className="w-4 h-4" />
                {t('public.downloadCvShort')}
              </button>
            </div>

            <div className="flex flex-wrap gap-6 text-sm" style={{ color: heroMetaTextColor }}>
              {resolvedProfile.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{resolvedProfile.location}</span>
                </div>
              )}
              {resolvedProfile.email && (
                <a
                  href={`mailto:${resolvedProfile.email}`}
                  className="flex items-center gap-2 hover:opacity-80"
                  style={{ color: heroMetaTextColor }}
                  onClick={preventPreviewClick}
                >
                  <Mail className="w-4 h-4" />
                  <span>{resolvedProfile.email}</span>
                </a>
              )}
              {resolvedProfile.phone && (
                <a
                  href={`tel:${resolvedProfile.phone}`}
                  className="flex items-center gap-2 hover:opacity-80"
                  style={{ color: heroMetaTextColor }}
                  onClick={preventPreviewClick}
                >
                  <Phone className="w-4 h-4" />
                  <span>{resolvedProfile.phone}</span>
                </a>
              )}
            </div>
          </div>

          {heroCardVisible && (
            <div
              className={heroCardContainerClass}
              style={{
                background: heroCardBackground,
                borderColor: heroCardBorderColor,
                color: heroCardTextColor,
              }}
            >
              <div className={heroCardWrapperClass}>
                <div className={heroCardPhotoWrapperClass} style={heroCardPhotoWrapperStyle}>
                  <ImageWithFallback
                    src={resolvedProfile.photo}
                    alt={resolvedProfile.name}
                    className={heroCardPhotoClass}
                  />
                </div>

                <div className={heroCardContentClass}>
                  {heroCardShouldShowSummary && heroBio && (
                    <p className={heroCardSummaryClass}>{heroBio}</p>
                  )}

                  <div className={heroCardContactWrapperClass}>
                    {resolvedProfile.email && (
                      <a
                        href={`mailto:${resolvedProfile.email}`}
                        className={heroCardContactItemClass}
                        style={{ color: 'inherit' }}
                        onClick={preventPreviewClick}
                      >
                        <Mail className="w-4 h-4" style={{ color: heroCardIconColor }} />
                        <span>{resolvedProfile.email}</span>
                      </a>
                    )}
                    {resolvedProfile.phone && (
                      <a
                        href={`tel:${resolvedProfile.phone}`}
                        className={heroCardContactItemClass}
                        style={{ color: 'inherit' }}
                        onClick={preventPreviewClick}
                      >
                        <Phone className="w-4 h-4" style={{ color: heroCardIconColor }} />
                        <span>{resolvedProfile.phone}</span>
                      </a>
                    )}
                    {resolvedProfile.location && (
                      <div className={heroCardContactItemClass} style={{ color: 'inherit' }}>
                        <MapPin className="w-4 h-4" style={{ color: heroCardIconColor }} />
                        <span>{resolvedProfile.location}</span>
                      </div>
                    )}
                  </div>

                  {hasSocialLinks && (
                    <div className={heroCardSocialWrapperClass}>
                      {resolvedProfile.socialLinks.website && (
                        <a
                          href={resolvedProfile.socialLinks.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Website"
                          className={heroCardSocialButtonClass}
                          style={heroCardSocialButtonStyle}
                          onClick={preventPreviewClick}
                        >
                          <Globe className="w-4 h-4" />
                        </a>
                      )}
                      {resolvedProfile.socialLinks.linkedin && (
                        <a
                          href={resolvedProfile.socialLinks.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="LinkedIn"
                          className={heroCardSocialButtonClass}
                          style={heroCardSocialButtonStyle}
                          onClick={preventPreviewClick}
                        >
                          <Linkedin className="w-4 h-4" />
                        </a>
                      )}
                      {resolvedProfile.socialLinks.github && (
                        <a
                          href={resolvedProfile.socialLinks.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="GitHub"
                          className={heroCardSocialButtonClass}
                          style={heroCardSocialButtonStyle}
                          onClick={preventPreviewClick}
                        >
                          <Github className="w-4 h-4" />
                        </a>
                      )}
                      {resolvedProfile.socialLinks.instagram && (
                        <a
                          href={resolvedProfile.socialLinks.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Instagram"
                          className={heroCardSocialButtonClass}
                          style={heroCardSocialButtonStyle}
                          onClick={preventPreviewClick}
                        >
                          <Instagram className="w-4 h-4" />
                        </a>
                      )}
                      {resolvedProfile.socialLinks.youtube && (
                        <a
                          href={resolvedProfile.socialLinks.youtube}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="YouTube"
                          className={heroCardSocialButtonClass}
                          style={heroCardSocialButtonStyle}
                          onClick={preventPreviewClick}
                        >
                          <Youtube className="w-4 h-4" />
                        </a>
                      )}
                      {resolvedProfile.socialLinks.spotify && (
                        <a
                          href={resolvedProfile.socialLinks.spotify}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Spotify"
                          className={heroCardSocialButtonClass}
                          style={heroCardSocialButtonStyle}
                          onClick={preventPreviewClick}
                        >
                          <Music className="w-4 h-4" />
                        </a>
                      )}
                      {resolvedProfile.socialLinks.soundcloud && (
                        <a
                          href={resolvedProfile.socialLinks.soundcloud}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="SoundCloud"
                          className={heroCardSocialButtonClass}
                          style={heroCardSocialButtonStyle}
                          onClick={preventPreviewClick}
                        >
                          <LinkIcon className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {featuredVideos.length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-[#f8f7fa]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4" style={{ color: sectionTitleColor }}>
                {t('public.featured')}
              </h2>
              <p className="text-lg" style={{ color: sectionBodyColor }}>
                {t('public.featured.subtitle')}
              </p>
            </div>

            <div className="space-y-8">
              {featuredVideos.map((video) => {
                const embed = resolveMediaEmbed(video.url);
                return (
                  <article
                    key={video.id}
                    className="rounded-2xl border overflow-hidden bg-white shadow-lg"
                    style={{ borderColor: `${secondaryColor}20` }}
                  >
                    <div className="relative aspect-video bg-black">
                      {embed ? (
                        <iframe
                          src={embed.src}
                          title={video.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full"
                        />
                      ) : (
                        <ImageWithFallback
                          src={video.platform === 'youtube' ? `https://img.youtube.com/vi/${video.id}/hqdefault.jpg` : undefined}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="text-2xl font-semibold mb-3" style={{ color: sectionTitleColor }}>
                        {video.title}
                      </h3>
                      <p className="text-sm mb-4" style={{ color: sectionBodyColor }}>
                        {video.description}
                      </p>
                      {video.tags?.length ? (
                        <div className="flex flex-wrap gap-2">
                          {video.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-3 py-1 rounded-full text-xs bg-[#f5f3f7]"
                              style={{ color: secondaryColor }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {((aboutBio && aboutBio.trim().length > 0) || profileSkills.length > 0) && (
        <section
          id="about"
          className="py-20 px-4 sm:px-6 lg:px-8"
          style={{ background: aboutSectionBackground }}
        >
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-start">
            <div>
              <p
                className="text-sm uppercase tracking-[0.2em] mb-3"
                style={{ color: themeMode === 'dark' ? '#ffffff' : secondaryColor }}
              >
                {t('public.about.kicker')}
              </p>
              <h2 className="text-4xl font-bold mb-4" style={{ color: sectionTitleColor }}>
                {t('public.about.title')}
              </h2>
              <div className="space-y-4 mb-6">
                {aboutParagraphs.length > 0 ? (
                  aboutParagraphs.map((paragraph, index) => (
                    <p key={index} className="leading-relaxed" style={{ color: sectionBodyColor }}>
                      {paragraph}
                    </p>
                  ))
                ) : (
                  <p className="leading-relaxed" style={{ color: sectionBodyColor }}>
                    {aboutBio}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {profileSkills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 rounded-full text-sm border"
                    style={{
                      backgroundColor: softSurfaceBackground,
                      color: chipTextColor,
                      borderColor: chipBorderColor,
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div
                className="rounded-2xl border p-6 shadow-sm"
                style={{ backgroundColor: surfaceBackground, borderColor: surfaceBorderColor }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Award className="w-5 h-5" style={{ color: accentColor }} />
                  <h3 className="text-lg font-semibold" style={{ color: sectionTitleColor }}>
                    {t('public.about.skillsTitle')}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {highlightTags.length > 0 ? (
                    highlightTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 rounded text-xs"
                        style={{ backgroundColor: softSurfaceBackground, color: chipTextColor }}
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm" style={{ color: sectionBodyColor }}>
                      {t('public.about.emptyTags')}
                    </span>
                  )}
                </div>
              </div>

              <div
                className="rounded-2xl border p-6 shadow-sm"
                style={{ backgroundColor: surfaceBackground, borderColor: surfaceBorderColor }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Briefcase className="w-5 h-5" style={{ color: accentColor }} />
                  <h3 className="text-lg font-semibold" style={{ color: sectionTitleColor }}>
                    {t('public.about.focusTitle')}
                  </h3>
                </div>
                <p className="text-sm" style={{ color: sectionBodyColor }}>
                  {t('public.about.focusDesc')}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {educationToShow.length > 0 && (
        <section id="education" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#f8f7fa] to-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-[#1a1534] mb-4">{t('public.education.title')}</h2>
              <p className="text-lg" style={{ color: secondaryColor }}>{t('public.education.subtitle')}</p>
            </div>

            <div className="space-y-6">
              {educationToShow.map((edu, index) => {
                const timeline = formatEducationTimeline(edu);
                return (
                  <div key={`${edu.institution}-${index}`} className="bg-white rounded-xl p-6 border shadow-sm" style={{ borderColor: `${secondaryColor}20` }}>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-[#1a1534] mb-1">
                          {translateForLocale(`education.${index}.degree`, edu.degree)}
                        </h3>
                        <p className="text-sm font-medium" style={{ color: accentColor }}>
                          {translateForLocale(`education.${index}.institution`, edu.institution)}
                        </p>
                      </div>
                      {timeline ? (
                        <span className="text-sm" style={{ color: secondaryColor }}>{timeline}</span>
                      ) : null}
                    </div>
                    {edu.description && (
                      <p className="text-sm mt-3" style={{ color: sectionBodyColor }}>
                        {translateForLocale(`education.${index}.description`, edu.description)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {articlesToShow.length > 0 && (
        <section id="articles" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-[#1a1534] mb-4">{t('public.articles.title')}</h2>
              <p className="text-lg" style={{ color: secondaryColor }}>{t('public.articles.subtitle')}</p>
            </div>

            <div className="space-y-6">
              {articlesToShow.map((article) => {
                const title = getTranslatedArticle(article, 'title');
                const summary = getTranslatedArticle(article, 'summary');
                const summaryText = summary.trim();
                const publication = getTranslatedArticle(article, 'publication');
                const authors = (article.authors ?? []).map((author) => author.trim()).filter(Boolean);
                const doiText = article.doi?.trim() ?? '';
                const doiUrl = doiText
                  ? doiText.startsWith('http://') || doiText.startsWith('https://')
                    ? doiText
                    : `https://doi.org/${doiText}`
                  : undefined;

                return (
                  <article
                    key={article.id}
                    className="rounded-2xl border p-6 shadow-sm transition-transform duration-200 hover:-translate-y-1"
                    style={{ backgroundColor: surfaceBackground, borderColor: surfaceBorderColor }}
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-2">
                        <h3 className="text-2xl font-semibold" style={{ color: sectionTitleColor }}>
                          {title}
                        </h3>
                        <div
                          className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm"
                          style={{ color: sectionBodyColor }}
                        >
                          {publication && (
                            <span className="inline-flex items-center gap-2">
                              <BookOpen className="w-4 h-4" style={{ color: accentColor }} />
                              <span>
                                {t('public.articles.publication')}: {publication}
                              </span>
                            </span>
                          )}
                          {article.publicationDate && (
                            <span className="inline-flex items-center gap-2">
                              <Calendar className="w-4 h-4" style={{ color: accentColor }} />
                              <span>
                                {t('public.articles.year')}: {article.publicationDate}
                              </span>
                            </span>
                          )}
                          {authors.length > 0 && (
                            <span className="inline-flex items-center gap-2">
                              <Users className="w-4 h-4" style={{ color: accentColor }} />
                              <span>
                                {t('public.articles.authors')}: {authors.join(', ')}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>

                      {summaryText.length > 0 && (
                        <p className="text-sm leading-relaxed" style={{ color: sectionBodyColor }}>
                          {summaryText}
                        </p>
                      )}

                      {(article.link || doiUrl) && (
                        <div className="flex flex-wrap items-center gap-4 pt-2 text-sm">
                          {article.link && (
                            <a
                              href={article.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 font-semibold"
                              style={{ color: accentColor }}
                              onClick={preventPreviewClick}
                            >
                              <ExternalLink className="w-4 h-4" />
                              {t('public.articles.readMore')}
                            </a>
                          )}
                          {doiUrl && (
                            <a
                              href={doiUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2"
                              style={{ color: secondaryColor }}
                              onClick={preventPreviewClick}
                            >
                              <LinkIcon className="w-4 h-4" />
                              <span>
                                {t('public.articles.doi')}: {doiText}
                              </span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {projectsToShow.length > 0 && (
        <section id="projects" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-[#1a1534] mb-4">{t('public.projects')}</h2>
              <p className="text-lg" style={{ color: secondaryColor }}>{t('public.projects.subtitle')}</p>
              {highlightTags.length > 0 && (
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {highlightTags.map((tag) => (
                    <span key={tag} className="px-3 py-1 rounded-full text-xs bg-[#f5f3f7]" style={{ color: secondaryColor }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className={projectGridClass}>
              {projectsToShow.map((project) => {
                const mediaEmbed = resolveMediaEmbed(project.mediaUrl ?? undefined);
                const isListLayout = layout === 'list';

                return (
                  <div
                    key={project.id}
                    onClick={previewMode ? undefined : () => setSelectedProject(project)}
                    className={`group bg-white rounded-xl overflow-hidden border transition-all duration-300 hover:shadow-lg cursor-pointer ${
                      layout === 'masonry' ? 'mb-8 break-inside-avoid' : ''
                    } ${isListLayout ? 'flex flex-col md:flex-row' : ''}`}
                    style={{ borderColor: `${secondaryColor}20` }}
                  >
                    <div className={`relative overflow-hidden bg-[#f5f3f7] ${isListLayout ? 'md:w-2/5 h-64 md:h-auto' : 'h-56'}`}>
                      {mediaEmbed ? (
                        <iframe
                          src={mediaEmbed.src}
                          title={project.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full"
                        />
                      ) : (
                        <ImageWithFallback
                          src={project.image}
                          alt={project.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0f0b1f]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <div className="absolute top-4 right-4">
                        {project.category && (
                          <span
                            className="px-3 py-1 rounded-full text-xs text-white shadow-lg"
                            style={{ background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})` }}
                          >
                            {getTranslatedProject(project, 'category')}
                          </span>
                        )}
                      </div>

                      {!isListLayout && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button
                            type="button"
                            className="pointer-events-none inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-2xl"
                            style={{
                              backgroundColor: accentColor,
                              color: '#ffffff',
                              boxShadow: `0 18px 40px -15px ${accentColor}80`,
                            }}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            {t('public.viewDetails')}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className={`p-6 ${isListLayout ? 'md:w-3/5 flex flex-col justify-center' : ''}`}>
                      <h3 className="text-xl font-bold text-[#1a1534] mb-2">
                        {getTranslatedProject(project, 'title')}
                      </h3>
                      <p className="mb-4" style={{ color: secondaryColor }}>
                        {getTranslatedProject(project, 'description')}
                      </p>

                      {project.tags && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {project.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 rounded text-xs bg-[#f5f3f7]"
                              style={{ color: secondaryColor }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm font-medium" style={{ color: accentColor }}>
                        <span>{t('public.clickDetails')}</span>
                        <ExternalLink className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <Dialog
        open={!previewMode && selectedProject !== null}
        onOpenChange={(open) => {
          if (previewMode) {
            return;
          }
          if (!open) {
            setSelectedProject(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedProject && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">
                  {getTranslatedProject(selectedProject, 'title')}
                </DialogTitle>
                {selectedProject.category && (
                  <DialogDescription className="text-base">
                    {getTranslatedProject(selectedProject, 'category')}
                  </DialogDescription>
                )}
              </DialogHeader>

              <div className="space-y-6">
                <div className="relative w-full rounded-lg overflow-hidden bg-gray-100">
                  {(() => {
                    const mediaEmbed = resolveMediaEmbed(selectedProject.mediaUrl ?? undefined);
                    if (mediaEmbed) {
                      return (
                        <div className="aspect-video">
                          <iframe
                            src={mediaEmbed.src}
                            title={selectedProject.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full"
                          />
                        </div>
                      );
                    }
                    if (selectedProject.image) {
                      return (
                        <ImageWithFallback
                          src={selectedProject.image}
                          alt={selectedProject.title}
                          className="w-full h-auto"
                        />
                      );
                    }
                    return null;
                  })()}
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">{t('public.description')}</h3>
                  <p className="text-gray-700 whitespace-pre-line">
                    {getTranslatedProject(selectedProject, 'description')}
                  </p>
                </div>

                {selectedProject.company && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{t('public.company')}</h3>
                    <p className="text-gray-700">{selectedProject.company}</p>
                  </div>
                )}

                {selectedProject.results && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{t('public.results')}</h3>
                    <p className="text-gray-700 whitespace-pre-line">{selectedProject.results}</p>
                  </div>
                )}

                {selectedProject.tags && selectedProject.tags.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{t('public.technologies')}</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 rounded-full text-sm bg-gray-100"
                          style={{ color: secondaryColor }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 pt-4 border-t">
                  {selectedProject.link && (
                    <a
                      href={selectedProject.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-opacity hover:opacity-90"
                      style={{ backgroundColor: accentColor }}
                    >
                      <Globe className="w-4 h-4" />
                      {t('public.visitWebsite')}
                    </a>
                  )}
                  {selectedProject.repoUrl && (
                    <a
                      href={selectedProject.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border font-medium transition-colors hover:bg-gray-50"
                      style={{ borderColor: secondaryColor, color: secondaryColor }}
                    >
                      <Github className="w-4 h-4" />
                      {t('public.viewCode')}
                    </a>
                  )}
                  {selectedProject.pdfUrl && (
                    <a
                      href={selectedProject.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border font-medium transition-colors hover:bg-gray-50"
                      style={{ borderColor: secondaryColor, color: secondaryColor }}
                    >
                      <Download className="w-4 h-4" />
                      {t('public.downloadPdf')}
                    </a>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {experiencesToShow.length > 0 && (
        <section
          id="experience"
          className="py-20 px-4 sm:px-6 lg:px-8"
          style={{ background: timelineBackground }}
        >
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4" style={{ color: sectionTitleColor }}>
                {t('public.experiences')}
              </h2>
              <p className="text-lg" style={{ color: sectionBodyColor }}>
                {t('public.experiences.subtitle')}
              </p>
            </div>

            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px" style={{ backgroundColor: timelineLineColor }} />
              <div className="space-y-8">
                {experiencesToShow.map((exp, index) => (
                  <div key={index} className="relative pl-12">
                    <div
                      className="absolute left-0 top-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
                      style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
                    >
                      <Briefcase className="w-4 h-4 text-white" />
                    </div>
                    <div
                      className="rounded-xl p-6 border shadow-sm"
                      style={{ backgroundColor: surfaceBackground, borderColor: surfaceBorderColor }}
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h3 className="text-xl font-bold" style={{ color: sectionTitleColor }}>
                            {getTranslatedExperience(exp, 'title')}
                          </h3>
                          <p className="text-sm font-medium" style={{ color: accentColor }}>
                            {getTranslatedExperience(exp, 'company')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm" style={{ color: sectionBodyColor }}>
                          <Calendar className="w-4 h-4" />
                          <span>{exp.period}</span>
                        </div>
                      </div>

                      <p className="text-sm leading-relaxed" style={{ color: sectionBodyColor }}>
                        {getTranslatedExperience(exp, 'description')}
                      </p>

                      {exp.location && (
                        <div className="flex items-center gap-2 mt-4 text-xs uppercase tracking-wide" style={{ color: sectionBodyColor }}>
                          <MapPin className="w-3 h-3" />
                          <span>{exp.location}</span>
                        </div>
                      )}

                      {exp.certificateUrl && exp.showCertificate && (
                        <a
                          href={exp.certificateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-flex items-center gap-2 text-sm font-medium"
                          style={{ color: accentColor }}
                          onClick={preventPreviewClick}
                        >
                          <ExternalLink className="w-4 h-4" />
                          {t('public.viewCertificate')}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {certificates.length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-[#1a1534] mb-4">{t('public.certificates')}</h2>
              <p className="text-lg" style={{ color: secondaryColor }}>{t('public.certificates.subtitle')}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {certificates.map((certificate) => (
                <a
                  key={certificate.id}
                  href={certificate.certificateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-xl border px-6 py-5 bg-white shadow-sm transition-all hover:shadow-lg"
                  style={{ borderColor: `${secondaryColor}20` }}
                  onClick={preventPreviewClick}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-[#1a1534]">
                        {getTranslatedExperience(certificate, 'title')}
                      </h3>
                      <p className="text-sm" style={{ color: secondaryColor }}>
                        {getTranslatedExperience(certificate, 'company')}
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 mt-1 text-[#c92563]" />
                  </div>
                  <p className="text-sm mt-3" style={{ color: secondaryColor }}>
                    {certificate.period}
                  </p>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      <section
        id="contact"
        className={`relative px-4 sm:px-6 lg:px-8 text-white overflow-hidden ${previewMode ? 'pt-20 pb-8' : 'py-20'}`}
        style={{ background: contactSectionBackground }}
      >
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -top-16 -right-16 w-72 h-72 border-4 border-white/20 rounded-full" />
          <div className="absolute bottom-10 left-12 w-20 h-20 bg-white/10 rounded-full" />
        </div>

        <div className="max-w-5xl mx-auto relative z-10 grid md:grid-cols-[1.2fr_0.8fr] gap-12 items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-white/70 mb-4">{t('public.contact.kicker')}</p>
            <h2 className="text-4xl font-bold mb-4">{t('public.contact.title')}</h2>
            <p className="text-lg text-white/80 leading-relaxed mb-8">{t('public.contact.subtitle')}</p>

            <div className="space-y-4 text-sm">
              {resolvedProfile.email && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-white/70 text-xs uppercase tracking-wide mb-1">Email</p>
                    <a
                      href={`mailto:${resolvedProfile.email}`}
                      className="text-white hover:underline"
                      onClick={preventPreviewClick}
                    >
                      {resolvedProfile.email}
                    </a>
                  </div>
                </div>
              )}
              {resolvedProfile.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-white/70 text-xs uppercase tracking-wide mb-1">Phone</p>
                    <a
                      href={`tel:${resolvedProfile.phone}`}
                      className="text-white hover:underline"
                      onClick={preventPreviewClick}
                    >
                      {resolvedProfile.phone}
                    </a>
                  </div>
                </div>
              )}
              {resolvedProfile.location && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-white/70 text-xs uppercase tracking-wide mb-1">{t('public.location')}</p>
                    <p className="text-white">{resolvedProfile.location}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8">
            <h3 className="text-lg font-semibold mb-4 text-white">{t('public.contact.socialTitle')}</h3>
            <p className="text-sm text-white/80 mb-6">{t('public.contact.socialSubtitle')}</p>

            <div className="grid grid-cols-2 gap-4">
              {resolvedProfile.socialLinks.website && (
                <a
                  href={resolvedProfile.socialLinks.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center gap-2 transition-all"
                  onClick={preventPreviewClick}
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-sm">Website</span>
                </a>
              )}
              {resolvedProfile.socialLinks.linkedin && (
                <a
                  href={resolvedProfile.socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center gap-2 transition-all"
                  onClick={preventPreviewClick}
                >
                  <Linkedin className="w-4 h-4" />
                  <span className="text-sm">LinkedIn</span>
                </a>
              )}
              {resolvedProfile.socialLinks.github && (
                <a
                  href={resolvedProfile.socialLinks.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center gap-2 transition-all"
                  onClick={preventPreviewClick}
                >
                  <Github className="w-4 h-4" />
                  <span className="text-sm">GitHub</span>
                </a>
              )}
              {resolvedProfile.socialLinks.instagram && (
                <a
                  href={resolvedProfile.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center gap-2 transition-all"
                  onClick={preventPreviewClick}
                >
                  <Instagram className="w-4 h-4" />
                  <span className="text-sm">Instagram</span>
                </a>
              )}
              {resolvedProfile.socialLinks.youtube && (
                <a
                  href={resolvedProfile.socialLinks.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center gap-2 transition-all"
                  onClick={preventPreviewClick}
                >
                  <Youtube className="w-4 h-4" />
                  <span className="text-sm">YouTube</span>
                </a>
              )}
              {resolvedProfile.socialLinks.spotify && (
                <a
                  href={resolvedProfile.socialLinks.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center gap-2 transition-all"
                  onClick={preventPreviewClick}
                >
                  <Music className="w-4 h-4" />
                  <span className="text-sm">Spotify</span>
                </a>
              )}
              {resolvedProfile.socialLinks.soundcloud && (
                <a
                  href={resolvedProfile.socialLinks.soundcloud}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center gap-2 transition-all"
                  onClick={preventPreviewClick}
                >
                  <LinkIcon className="w-4 h-4" />
                  <span className="text-sm">SoundCloud</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="sr-only" ref={cvRef}>
        <div>
          <h1>{resolvedProfile.name}</h1>
          <p className="meta">{getTranslatedField('title')}</p>
        </div>

        <div className="section">
          <h2>{cvLabels[cvLanguage].summary}</h2>
          <p>{translateForCv('profile.bio', resolvedProfile.bio)}</p>
        </div>

        {experiencesToShow.length > 0 && (
          <div className="section">
            <h2>{cvLabels[cvLanguage].experience}</h2>
            <ul>
              {experiencesToShow.map((exp) => (
                <li key={exp.id}>
                  <strong>{getTranslatedExperience(exp, 'title', cvLanguage)}</strong> · {getTranslatedExperience(exp, 'company', cvLanguage)} ({exp.period})
                </li>
              ))}
            </ul>
          </div>
        )}

        {projectsToShow.length > 0 && (
          <div className="section">
            <h2>{cvLabels[cvLanguage].projects}</h2>
            <ul>
              {projectsToShow.map((project) => (
                <li key={project.id}>
                  <strong>{getTranslatedProject(project, 'title', cvLanguage)}</strong> · {getTranslatedProject(project, 'description', cvLanguage)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {cvArticles.length > 0 && (
          <div className="section">
            <h2>{cvLabels[cvLanguage].articles}</h2>
            <ul>
              {cvArticles.map((article) => {
                const title = getTranslatedArticle(article, 'title', cvLanguage);
                const summary = getTranslatedArticle(article, 'summary', cvLanguage);
                const publication = getTranslatedArticle(article, 'publication', cvLanguage);
                const metadata: string[] = [];
                if (Array.isArray(article.authors) && article.authors.length > 0) {
                  metadata.push(article.authors.join(', '));
                }
                if (publication) {
                  metadata.push(publication);
                }
                if (article.publicationDate) {
                  metadata.push(article.publicationDate);
                }

                return (
                  <li key={article.id}>
                    <strong>{title}</strong>
                    {metadata.length > 0 ? ` · ${metadata.join(' • ')}` : ''}
                    {summary ? ` — ${summary}` : ''}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {educationToShow.length > 0 && (
          <div className="section">
            <h2>{cvLabels[cvLanguage].education}</h2>
            <ul>
              {educationToShow.map((edu, index) => {
                const timeline = formatEducationTimeline(edu);
                const degree = translateForCv(`education.${index}.degree`, edu.degree);
                const institution = translateForCv(`education.${index}.institution`, edu.institution);
                return (
                  <li key={`${edu.institution}-${index}`}>
                    <strong>{degree}</strong> · {institution}
                    {timeline ? ` (${timeline})` : ''}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {profileSkills.length > 0 && (
          <div className="section">
            <h2>{cvLabels[cvLanguage].skills}</h2>
            <p>{profileSkills.join(', ')}</p>
          </div>
        )}

        <div className="section">
          <h2>{cvLabels[cvLanguage].contact}</h2>
          <p className="meta">
            {[resolvedProfile.email, resolvedProfile.phone, resolvedProfile.location]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      </div>
    </div>
  );
}
