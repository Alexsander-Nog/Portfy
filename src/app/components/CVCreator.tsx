import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import {
  FileText,
  Download,
  Eye,
  Check,
  Trash2,
  Loader2,
} from 'lucide-react';
import { CVRenderer } from './templates';
import type { CV, CvTemplateId, EducationItem, Experience, Project, ScientificArticle, SubscriptionPlan, UserProfile } from '../types';
import { useLocale } from '../i18n';
import { createCv, deleteCv, updateCv, upsertUserProfile } from '../data/portfolio';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { PLAN_LIMITS, isLanguageAllowed } from '../data/plans';

type ArticleTranslationField = 'title' | 'summary' | 'publication';

type CvLanguage = CV['language'];

type TemplateOption = {
  id: CvTemplateId;
  name: string;
  description: string;
};

type CvDraft = {
  summary: Record<CvLanguage, string>;
  skills: string;
  education: string;
  includePhoto: boolean;
  template: TemplateOption['id'];
};

const NEW_CV_ID = '__new__';

type PreviewRenderOptions = {
  attachRef?: boolean;
};

const languageOptions: Array<{ value: CvLanguage; label: string; flag: string }> = [
  { value: 'pt', label: 'Portuguese', flag: '🇧🇷' },
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'es', label: 'Spanish', flag: '🇪🇸' },
];

const CV_SECTION_LABELS: Record<CvLanguage, {
  summary: string;
  experience: string;
  projects: string;
  articles: string;
  skills: string;
  education: string;
  contact: string;
}> = {
  pt: {
    summary: 'Resumo profissional',
    experience: 'Experiências profissionais',
    projects: 'Projetos em destaque',
    articles: 'Artigos científicos',
    skills: 'Habilidades',
    education: 'Formação acadêmica',
    contact: 'Contato',
  },
  en: {
    summary: 'Professional summary',
    experience: 'Professional experience',
    projects: 'Featured projects',
    articles: 'Scientific articles',
    skills: 'Skills',
    education: 'Education',
    contact: 'Contact',
  },
  es: {
    summary: 'Resumen profesional',
    experience: 'Experiencia profesional',
    projects: 'Proyectos destacados',
    articles: 'Artículos científicos',
    skills: 'Habilidades',
    education: 'Formación académica',
    contact: 'Contacto',
  },
};

const CV_NAME_DEFAULTS: Record<CvLanguage, string> = {
  pt: 'Curriculo',
  en: 'Resume',
  es: 'Curriculum',
};

function generateDefaultName(cvs: CV[], language: CvLanguage): string {
  const base = CV_NAME_DEFAULTS[language];
  const count = cvs.filter((cv) => cv.language === language).length;
  return count === 0 ? base : `${base} ${count + 1}`;
}

function getProfileField(profile: UserProfile, field: 'title' | 'bio', lang: CvLanguage): string {
  const fallback = field === 'title' ? profile.title ?? '' : profile.bio ?? '';
  if (lang === 'en') {
    const value = profile.translations?.en?.[field];
    if (value) {
      return value;
    }
  }
  if (lang === 'es') {
    const value = profile.translations?.es?.[field];
    if (value) {
      return value;
    }
  }
  return fallback;
}

function getProjectField(project: Project, field: 'title' | 'description', lang: CvLanguage): string {
  const fallback = field === 'title' ? project.title : project.description;
  if (lang === 'en') {
    const value = project.translations?.en?.[field];
    if (value) {
      return value;
    }
  }
  if (lang === 'es') {
    const value = project.translations?.es?.[field];
    if (value) {
      return value;
    }
  }
  return fallback;
}

function getExperienceField(
  experience: Experience,
  field: 'title' | 'company' | 'description',
  lang: CvLanguage,
): string {
  const fallback = experience[field] ?? '';
  if (lang === 'en') {
    const value = experience.translations?.en?.[field];
    if (value) {
      return value;
    }
  }
  if (lang === 'es') {
    const value = experience.translations?.es?.[field];
    if (value) {
      return value;
    }
  }
  return fallback;
}

function getTranslatedArticle(
  article: ScientificArticle,
  field: ArticleTranslationField,
  lang: CvLanguage,
): string {
  const fallback = field === 'title'
    ? article.title
    : field === 'summary'
      ? article.summary ?? ''
      : article.publication ?? '';

  if (lang === 'pt') {
    return fallback;
  }

  const directValue = article.translations?.[lang]?.[field];
  if (directValue && directValue.trim().length > 0) {
    return directValue;
  }

  return fallback;
}

function formatEducationTimeline(item?: EducationItem): string {
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
}

const templates: TemplateOption[] = [
  { id: 'modern', name: 'Modern CV (Original)', description: 'Layout equilibrado com destaque visual.' },
  { id: 'minimal', name: 'Minimal CV (Original)', description: 'Estrutura limpa em duas colunas.' },
  { id: 'creative', name: 'Creative CV (Original)', description: 'Visual ousado com degradês e destaques.' },
  { id: 'executive', name: 'Executive CV (Original)', description: 'Estilo formal com barra lateral premium.' },
  { id: 'modernClassic', name: 'Moderno', description: 'Layout equilibrado com destaque visual e cartões modulares.' },
  { id: 'minimalElegant', name: 'Minimalista', description: 'Estrutura limpa com colunas sutis e foco no conteúdo.' },
  { id: 'corporate', name: 'Corporativo', description: 'Estilo formal com blocos estruturados e tons sóbrios.' },
  { id: 'creativeAccent', name: 'Criativo', description: 'Visual ousado com acentos de cor e gradientes.' },
];

interface CVCreatorProps {
  userId?: string;
  cvs: CV[];
  onCvsChange: (cvs: CV[]) => void;
  userProfile: UserProfile;
  onProfileChange?: (profile: UserProfile) => void;
  projects: Project[];
  experiences: Experience[];
  articles: ScientificArticle[];
  planTier: SubscriptionPlan;
}

export function CVCreator({ userId, cvs, onCvsChange, userProfile, onProfileChange, projects, experiences, articles, planTier }: CVCreatorProps) {
  const { locale, t } = useLocale();
  const languageAllowance = PLAN_LIMITS[planTier].allowedCvLanguages;
  const maxCvAllowance = PLAN_LIMITS[planTier].maxCvs;
  const hasReachedCvLimit = typeof maxCvAllowance === 'number' && cvs.length >= maxCvAllowance;
  const [activeCvId, setActiveCvId] = useState<string>(cvs[0]?.id ?? NEW_CV_ID);
  const [cvName, setCvName] = useState('');
  const [cvLanguage, setCvLanguage] = useState<CvLanguage>(() => {
    const preferred = locale as CvLanguage;
    if (isLanguageAllowed(planTier, preferred)) {
      return preferred;
    }
    if (languageAllowance === 'all') {
      return preferred;
    }
    return languageAllowance[0] ?? 'pt';
  });
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [selectedExperienceIds, setSelectedExperienceIds] = useState<string[]>([]);
  const [selectedArticleIds, setSelectedArticleIds] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<Record<string, CvDraft>>({});
  const [cvSaving, setCvSaving] = useState(false);
  const [cvSaved, setCvSaved] = useState(false);
  const [cvDeletingId, setCvDeletingId] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [isPreviewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [languageNotice, setLanguageNotice] = useState<string | null>(null);
  const [cvNotice, setCvNotice] = useState<string | null>(null);

  const allowedLanguageOptions = useMemo(() => {
    if (languageAllowance === 'all') {
      return languageOptions;
    }
    return languageOptions.filter((option) => languageAllowance.includes(option.value));
  }, [languageAllowance]);

  const hasFullLanguageAccess = useMemo(() => (
    languageAllowance === 'all' ? true : languageAllowance.length >= languageOptions.length
  ), [languageAllowance]);

  const activeCv = activeCvId === NEW_CV_ID ? null : cvs.find((cv) => cv.id === activeCvId) ?? null;
  const activeDraftKey = activeCv ? activeCv.id : NEW_CV_ID;

  const createDefaultDraft = useCallback((options?: { includePhoto?: boolean }): CvDraft => ({
    summary: { pt: '', en: '', es: '' },
    skills: (userProfile.skills ?? []).join(', '),
    education: Array.isArray(userProfile.education)
      ? userProfile.education
          .map((item) => [item.institution, item.degree, formatEducationTimeline(item)].filter(Boolean).join(' • '))
          .filter((entry) => entry.length > 0)
          .join('\n')
      : '',
    includePhoto: options?.includePhoto ?? (userProfile.showCvPhoto !== false),
    template: userProfile.cvTemplate ?? 'modern',
  }), [userProfile]);

  useEffect(() => {
    if (activeCvId !== NEW_CV_ID && !cvs.some((cv) => cv.id === activeCvId)) {
      setActiveCvId(cvs[0]?.id ?? NEW_CV_ID);
    }
  }, [activeCvId, cvs]);

  useEffect(() => {
    const resolvedIncludePhoto = activeCv
      ? (typeof activeCv.showCvPhoto === 'boolean' ? activeCv.showCvPhoto : (userProfile.showCvPhoto !== false))
      : undefined;

    setDrafts((prev) => {
      const existing = prev[activeDraftKey];
      if (existing) {
        if (typeof resolvedIncludePhoto === 'boolean' && existing.includePhoto !== resolvedIncludePhoto) {
          return { ...prev, [activeDraftKey]: { ...existing, includePhoto: resolvedIncludePhoto } };
        }
        return prev;
      }

      return {
        ...prev,
        [activeDraftKey]: createDefaultDraft(typeof resolvedIncludePhoto === 'boolean' ? { includePhoto: resolvedIncludePhoto } : undefined),
      };
    });
  }, [activeDraftKey, activeCv, createDefaultDraft, userProfile.showCvPhoto]);

  const updateDraft = useCallback((updater: (draft: CvDraft) => CvDraft) => {
    setDrafts((prev) => {
      const base = prev[activeDraftKey] ?? createDefaultDraft();
      const nextDraft = updater(base);
      if (nextDraft === base) {
        return prev;
      }
      return { ...prev, [activeDraftKey]: nextDraft };
    });
  }, [activeDraftKey, createDefaultDraft]);

  const draft = useMemo(() => {
    const existing = drafts[activeDraftKey];
    if (existing) {
      return existing;
    }

    if (activeCv) {
      const includePhoto = typeof activeCv.showCvPhoto === 'boolean'
        ? activeCv.showCvPhoto
        : (userProfile.showCvPhoto !== false);
      return createDefaultDraft({ includePhoto });
    }

    return createDefaultDraft();
  }, [drafts, activeDraftKey, createDefaultDraft, activeCv, userProfile.showCvPhoto]);

  const articleOptions = useMemo(
    () => articles.filter((article) => article.showInCv !== false),
    [articles],
  );

  useEffect(() => {
    if (activeCv) {
      setCvName(activeCv.name);

      const allowedProjects = new Set(projects.map((project) => project.id));
      const allowedExperiences = new Set(experiences.map((experience) => experience.id));
      const allowedArticles = new Set(articleOptions.map((article) => article.id));

      setSelectedProjectIds(activeCv.selectedProjects.filter((id) => allowedProjects.has(id)));
      setSelectedExperienceIds(activeCv.selectedExperiences.filter((id) => allowedExperiences.has(id)));
      setSelectedArticleIds(activeCv.selectedArticles.filter((id) => allowedArticles.has(id)));

      if (languageAllowance === 'all' || languageAllowance.includes(activeCv.language)) {
        setCvLanguage(activeCv.language);
        setLanguageNotice(null);
      } else {
        const fallbackLanguage = languageAllowance[0] ?? 'pt';
        setCvLanguage(fallbackLanguage);
        setLanguageNotice(t('cv.languageLimit'));
      }
    } else {
      const preferredLanguage = locale as CvLanguage;
      const resolvedLanguage = (languageAllowance === 'all' || languageAllowance.includes(preferredLanguage))
        ? preferredLanguage
        : languageAllowance[0] ?? 'pt';
      setCvLanguage(resolvedLanguage);
      setLanguageNotice(resolvedLanguage === preferredLanguage ? null : t('cv.languageLimit'));
      setCvName(generateDefaultName(cvs, resolvedLanguage));
      setSelectedProjectIds(projects.map((project) => project.id));
      setSelectedExperienceIds(experiences.map((experience) => experience.id));
      setSelectedArticleIds(articleOptions.map((article) => article.id));
    }
  }, [activeCv, articleOptions, projects, experiences, locale, cvs, languageAllowance, t]);

  useEffect(() => {
    if (hasFullLanguageAccess) {
      setLanguageNotice(null);
      return;
    }
    setLanguageNotice((current) => (current === t('cv.languageLimit') ? current : t('cv.languageUpgrade')));
  }, [hasFullLanguageAccess, t]);

  useEffect(() => {
    if (typeof maxCvAllowance !== 'number') {
      setCvNotice(null);
      return;
    }
    if (cvs.length >= maxCvAllowance) {
      const message = t('cv.limitReached').replace('{count}', String(maxCvAllowance));
      setCvNotice(message);
      return;
    }
    setCvNotice(null);
  }, [cvs.length, maxCvAllowance, t]);

  const sectionLabels = CV_SECTION_LABELS[cvLanguage];

  const summaryText = draft.summary[cvLanguage]?.trim() || getProfileField(userProfile, 'bio', cvLanguage);

  const experiencesForPreview = useMemo(() => (
    experiences.filter((experience) => selectedExperienceIds.includes(experience.id)).map((experience) => ({
      id: experience.id,
      title: getExperienceField(experience, 'title', cvLanguage),
      company: getExperienceField(experience, 'company', cvLanguage),
      description: getExperienceField(experience, 'description', cvLanguage),
      period: experience.period,
    }))
  ), [experiences, selectedExperienceIds, cvLanguage]);

  const projectsForPreview = useMemo(() => (
    projects.filter((project) => selectedProjectIds.includes(project.id)).map((project) => ({
      id: project.id,
      title: getProjectField(project, 'title', cvLanguage),
      description: getProjectField(project, 'description', cvLanguage),
    }))
  ), [projects, selectedProjectIds, cvLanguage]);

  const articlesForPreview = useMemo(() => (
    articleOptions
      .filter((article) => selectedArticleIds.includes(article.id))
      .map((article) => ({
        id: article.id,
        title: getTranslatedArticle(article, 'title', cvLanguage),
        summary: getTranslatedArticle(article, 'summary', cvLanguage),
        publication: getTranslatedArticle(article, 'publication', cvLanguage),
      }))
  ), [articleOptions, selectedArticleIds, cvLanguage]);

  const skillsList = useMemo(() => {
    const raw = draft.skills.trim();
    if (raw) {
      return raw.split(',').map((item) => item.trim()).filter(Boolean);
    }
    return userProfile.skills ?? [];
  }, [draft.skills, userProfile.skills]);

  const educationForPreview = useMemo(() => {
    const raw = draft.education.trim();
    if (raw) {
      return raw
        .split(/\n+/)
        .map((item) => item.trim())
        .filter(Boolean)
        .map((entry) => ({ institution: entry, degree: '' }));
    }
    if (Array.isArray(userProfile.education) && userProfile.education.length > 0) {
      return userProfile.education;
    }
    return [];
  }, [draft.education, userProfile.education]);

  const selectedTemplate = draft.template;

  const profileForPreview = useMemo(() => {
    const localizedTitle = getProfileField(userProfile, 'title', cvLanguage);
    const previewProfile: UserProfile = {
      ...userProfile,
      title: localizedTitle,
      bio: summaryText,
      skills: skillsList,
      education: educationForPreview,
      showCvPhoto: draft.includePhoto,
    };

    if (!draft.includePhoto) {
      previewProfile.photoUrl = undefined;
    }

    return previewProfile;
  }, [userProfile, cvLanguage, summaryText, skillsList, educationForPreview, draft.includePhoto]);

  const persistShowCvPhotoPreference = useCallback(async (includePhoto: boolean) => {
    if (!onProfileChange) {
      return;
    }

    const optimisticProfile: UserProfile = { ...userProfile, showCvPhoto: includePhoto };
    onProfileChange(optimisticProfile);

    if (userId && isSupabaseConfigured) {
      try {
        const savedProfile = await upsertUserProfile(userId, optimisticProfile);
        if (savedProfile) {
          onProfileChange(savedProfile);
        }
      } catch (error) {
        console.error('Failed to persist CV photo preference', error);
      }
    }
  }, [onProfileChange, userProfile, userId]);

  const handleIncludePhotoToggle = useCallback((checked: boolean) => {
    updateDraft((current) => ({ ...current, includePhoto: checked }));
    const currentPreference = userProfile.showCvPhoto !== false;
    if (currentPreference === checked) {
      return;
    }
    persistShowCvPhotoPreference(checked);
  }, [updateDraft, userProfile.showCvPhoto, persistShowCvPhotoPreference]);

  const handleCreateNewCv = () => {
    if (typeof maxCvAllowance === 'number' && cvs.length >= maxCvAllowance) {
      const message = t('cv.limitReached').replace('{count}', String(maxCvAllowance));
      setCvNotice(message);
      return;
    }
    setActiveCvId(NEW_CV_ID);
  };

  const handleDeleteCv = async (cvId: string) => {
    const target = cvs.find((cv) => cv.id === cvId);
    if (!target) {
      return;
    }

    let confirmed = true;
    if (typeof window !== 'undefined') {
      const confirmMessage = t('cv.deleteConfirm').replace('{name}', target.name);
      confirmed = window.confirm(confirmMessage);
    }

    if (!confirmed) {
      return;
    }

    setCvDeletingId(cvId);
    setCvNotice(null);

    if (userId && isSupabaseConfigured) {
      const deleted = await deleteCv(userId, cvId);
      if (!deleted) {
        setCvDeletingId(null);
        setCvNotice(t('cv.deleteError'));
        return;
      }
    }

    const updatedCvs = cvs.filter((cv) => cv.id !== cvId);
    onCvsChange(updatedCvs);

    setDrafts((prev) => {
      const next = { ...prev };
      delete next[cvId];
      return next;
    });

    if (activeCvId === cvId) {
      setActiveCvId(updatedCvs[0]?.id ?? NEW_CV_ID);
    }

    setCvDeletingId(null);
  };

  const handleLanguageChange = (language: CvLanguage) => {
    if (!isLanguageAllowed(planTier, language)) {
      setLanguageNotice(t('cv.languageLimit'));
      return;
    }
    setLanguageNotice(hasFullLanguageAccess ? null : t('cv.languageUpgrade'));
    setCvLanguage(language);
    updateDraft((current) => ({
      ...current,
      summary: {
        ...current.summary,
        [language]: current.summary[language] ?? '',
      },
    }));
    if (!activeCv) {
      setCvName(generateDefaultName(cvs, language));
    }
  };

  const getPrintableTitle = () => {
    const trimmed = cvName.trim();
    return trimmed.length > 0 ? trimmed : generateDefaultName(cvs, cvLanguage);
  };

  const collectDocumentStyles = () => {
    if (typeof window === 'undefined') {
      return '';
    }

    return Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((element) => element.outerHTML)
      .join('\n');
  };

  const buildPrintableHtml = (content: string) => {
    const title = getPrintableTitle();
    const styles = collectDocumentStyles();

    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    ${styles}
    <style>
      :root { color-scheme: light; }
      *, *::before, *::after { box-sizing: border-box; }
      body { margin: 0; padding: 24px; background: #f6f5fb; color: #1a1534; font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      .cv-print-root { max-width: 960px; margin: 0 auto; }
      @media print {
        @page { size: A4; margin: 16mm; }
        body { padding: 0; background: #ffffff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .cv-print-root { box-shadow: none !important; margin: 0; }
      }
    </style>
  </head>
  <body>
    <div class="cv-print-root">${content}</div>
  </body>
</html>`;
  };

  const handleDownload = () => {
    if (typeof window === 'undefined') {
      return;
    }

    const previewNode = previewRef.current;
    if (!previewNode) {
      return;
    }

    const html = buildPrintableHtml(previewNode.outerHTML);
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('aria-hidden', 'true');

    const cleanup = () => {
      iframe.onload = null;
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    };

    iframe.onload = () => {
      const iframeWindow = iframe.contentWindow;
      if (!iframeWindow) {
        cleanup();
        return;
      }

      const afterPrint = () => {
        cleanup();
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

    iframe.srcdoc = html;
    document.body.appendChild(iframe);

    window.setTimeout(cleanup, 12000);
  };

  const handlePreview = () => {
    if (typeof window === 'undefined') {
      return;
    }

    setPreviewDialogOpen(true);
  };

  const handleSaveCv = async () => {
    const finalName = cvName.trim() || generateDefaultName(cvs, cvLanguage);
    const payload = {
      name: finalName,
      language: cvLanguage,
      selectedProjects: selectedProjectIds,
      selectedExperiences: selectedExperienceIds,
      selectedArticles: selectedArticleIds,
      showCvPhoto: draft.includePhoto,
    };

    if (!activeCv && typeof maxCvAllowance === 'number' && cvs.length >= maxCvAllowance) {
      const message = t('cv.limitReached').replace('{count}', String(maxCvAllowance));
      setCvNotice(message);
      return;
    }

    setCvSaving(true);
    setCvSaved(false);
    let saved: CV | null = null;

    if (userId && isSupabaseConfigured) {
      saved = activeCv
        ? await updateCv(userId, activeCv.id, payload)
        : await createCv(userId, payload);
    } else {
      const nowIso = new Date().toISOString();
      if (activeCv) {
        saved = {
          ...activeCv,
          ...payload,
          updatedAt: nowIso,
        };
        onCvsChange(cvs.map((cv) => (cv.id === activeCv.id ? saved as CV : cv)));
      } else {
        const fallbackId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : String(Date.now());
        saved = {
          id: fallbackId,
          ...payload,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        onCvsChange([saved, ...cvs]);
      }
    }

    if (!saved) {
      setCvSaving(false);
      return;
    }

    if (userId && isSupabaseConfigured) {
      if (activeCv) {
        onCvsChange(cvs.map((cv) => (cv.id === saved!.id ? saved! : cv)));
      } else {
        onCvsChange([saved, ...cvs]);
      }
    }

    if (!activeCv) {
      const currentDraft = draft;
      setDrafts((prev) => {
        const nextDrafts = { ...prev };
        delete nextDrafts[NEW_CV_ID];
        nextDrafts[saved!.id] = currentDraft;
        return nextDrafts;
      });
      setActiveCvId(saved.id);
    }

    setCvName(saved.name);
    setCvSaving(false);
    setCvSaved(true);
    if (typeof window !== 'undefined') {
      window.alert(t('cv.saved'));
    }
    setTimeout(() => setCvSaved(false), 2000);
  };


  const renderPreview = ({ attachRef }: PreviewRenderOptions = {}) => (
    <div ref={attachRef ? previewRef : undefined}>
      <CVRenderer
        template={selectedTemplate}
        profile={profileForPreview}
        experiences={experiencesForPreview}
        projects={projectsForPreview}
        articles={articlesForPreview}
        locale={cvLanguage}
        theme={undefined}
      />
    </div>
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1a1534] mb-2">{t('cv.title')}</h1>
        <p className="text-[#6b5d7a]">{t('cv.subtitle')}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#1a1534]">Meus CVs</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateNewCv}
                disabled={hasReachedCvLimit}
              >
                + Novo CV
              </Button>
            </div>
            <div className="space-y-2">
              {cvs.map((cv) => {
                const isActive = Boolean(activeCv && activeCv.id === cv.id);
                const isDeleting = cvDeletingId === cv.id;
                const deleteLabel = t('cv.deleteCvButton').replace('{name}', cv.name);

                return (
                  <div
                    key={cv.id}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                      isActive ? 'border-[#a21d4c] bg-[#a21d4c]/5' : 'border-[#e8e3f0] hover:border-[#a21d4c]/50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveCvId(cv.id)}
                      className="flex-1 flex items-center justify-between text-left"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#1a1534]">{cv.name}</p>
                        <span className="text-xs text-[#6b5d7a]">{cv.language.toUpperCase()}</span>
                      </div>
                      {isActive && <Check className="w-4 h-4 text-[#a21d4c]" />}
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDeleteCv(cv.id);
                      }}
                      className="p-2 rounded-md text-[#a21d4c] hover:bg-[#a21d4c]/10 transition-colors disabled:opacity-60"
                      disabled={isDeleting}
                      aria-label={deleteLabel}
                      title={deleteLabel}
                    >
                      {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                );
              })}
              {cvs.length === 0 && (
                <p className="text-sm text-[#9b8da8]">Nenhum CV salvo ainda.</p>
              )}
            </div>
            {cvNotice && (
              <p className="text-xs text-[#a21d4c] mt-4">{cvNotice}</p>
            )}
          </Card>

          <Card>
            <h2 className="text-xl font-bold text-[#1a1534] mb-6">{t('cv.settings')}</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm text-[#6b5d7a] mb-2">Nome do CV</label>
                <input
                  type="text"
                  value={cvName}
                  onChange={(event) => setCvName(event.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#e8e3f0]"
                  placeholder="Curriculo"
                />
              </div>

              <div>
                <label className="block text-sm text-[#6b5d7a] mb-3">{t('cv.language')}</label>
                <div className="space-y-2">
                  {allowedLanguageOptions.map((language) => (
                    <button
                      key={language.value}
                      onClick={() => handleLanguageChange(language.value)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${
                        cvLanguage === language.value
                          ? 'border-[#a21d4c] bg-[#a21d4c]/5'
                          : 'border-[#e8e3f0] hover:border-[#a21d4c]/50'
                      }`}
                    >
                      <span className="text-2xl">{language.flag}</span>
                      <span className="flex-1 text-left text-[#1a1534]">{language.label}</span>
                      {cvLanguage === language.value && <Check className="w-5 h-5 text-[#a21d4c]" />}
                    </button>
                  ))}
                  {languageNotice && (
                    <p className="text-xs text-[#a21d4c]">{languageNotice}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-[#6b5d7a]">{t('cv.includePhoto')}</span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={draft.includePhoto}
                      onChange={(event) => handleIncludePhotoToggle(event.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#a21d4c]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#a21d4c]"></div>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-sm text-[#6b5d7a] mb-2">{t('cv.summary')}</label>
                <textarea
                  rows={3}
                  value={draft.summary[cvLanguage] ?? ''}
                  onChange={(event) => updateDraft((current) => ({
                    ...current,
                    summary: { ...current.summary, [cvLanguage]: event.target.value },
                  }))}
                  className="w-full px-3 py-2 rounded-lg border border-[#e8e3f0]"
                  placeholder={sectionLabels.summary}
                />
              </div>

              <div>
                <label className="block text-sm text-[#6b5d7a] mb-2">{t('cv.education')}</label>
                <textarea
                  rows={3}
                  value={draft.education}
                  onChange={(event) => updateDraft((current) => ({ ...current, education: event.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-[#e8e3f0]"
                />
              </div>

              <div>
                <label className="block text-sm text-[#6b5d7a] mb-2">{t('cv.skills')}</label>
                <input
                  type="text"
                  value={draft.skills}
                  onChange={(event) => updateDraft((current) => ({ ...current, skills: event.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-[#e8e3f0]"
                  placeholder="UI Design, UX Research, React"
                />
              </div>

              <div>
                <label className="block text-sm text-[#6b5d7a] mb-2">{t('cv.selectProjects')}</label>
                <div className="space-y-2 max-h-40 overflow-auto">
                  {projects.map((project) => (
                    <label key={project.id} className="flex items-center gap-3 text-sm text-[#6b5d7a]">
                      <input
                        type="checkbox"
                        checked={selectedProjectIds.includes(project.id)}
                        onChange={(event) => setSelectedProjectIds((prev) => (
                          event.target.checked
                            ? [...prev, project.id]
                            : prev.filter((id) => id !== project.id)
                        ))}
                        className="w-4 h-4 text-[#a21d4c] bg-white border-gray-300 rounded focus:ring-[#a21d4c]"
                      />
                      {project.title}
                    </label>
                  ))}
                  {projects.length === 0 && (
                    <p className="text-sm text-[#9b8da8]">Nenhum projeto cadastrado.</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#6b5d7a] mb-2">{t('cv.selectExperiences')}</label>
                <div className="space-y-2 max-h-40 overflow-auto">
                  {experiences.map((experience) => (
                    <label key={experience.id} className="flex items-center gap-3 text-sm text-[#6b5d7a]">
                      <input
                        type="checkbox"
                        checked={selectedExperienceIds.includes(experience.id)}
                        onChange={(event) => setSelectedExperienceIds((prev) => (
                          event.target.checked
                            ? [...prev, experience.id]
                            : prev.filter((id) => id !== experience.id)
                        ))}
                        className="w-4 h-4 text-[#a21d4c] bg-white border-gray-300 rounded focus:ring-[#a21d4c]"
                      />
                      {experience.title}
                    </label>
                  ))}
                  {experiences.length === 0 && (
                    <p className="text-sm text-[#9b8da8]">Nenhuma experiencia registrada.</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#6b5d7a] mb-2">{t('cv.selectArticles')}</label>
                <div className="space-y-2 max-h-40 overflow-auto">
                  {articleOptions.map((article) => (
                    <label key={article.id} className="flex items-start gap-3 text-sm text-[#6b5d7a]">
                      <input
                        type="checkbox"
                        checked={selectedArticleIds.includes(article.id)}
                        onChange={(event) => setSelectedArticleIds((prev) => (
                          event.target.checked
                            ? [...prev, article.id]
                            : prev.filter((id) => id !== article.id)
                        ))}
                        className="mt-1 w-4 h-4 text-[#a21d4c] bg-white border-gray-300 rounded focus:ring-[#a21d4c]"
                      />
                      <span>
                        <span className="block">{getTranslatedArticle(article, 'title', cvLanguage)}</span>
                        {(article.publication || article.publicationDate) && (
                          <span className="block text-xs text-[#9b8da8]">
                            {[article.publication, article.publicationDate].filter(Boolean).join(' • ')}
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                  {articleOptions.length === 0 && (
                    <p className="text-sm text-[#9b8da8]">{t('cv.articlesEmpty')}</p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="font-bold text-[#1a1534] mb-4">{t('cv.actions')}</h3>
            <div className="space-y-3">
              <Button variant="primary" className="w-full" onClick={handleSaveCv} disabled={cvSaving}>
                <FileText className="w-5 h-5 mr-2" />
                {cvSaving ? 'Salvando...' : t('cv.save')}
              </Button>
              <Button variant="primary" className="w-full" onClick={handleDownload}>
                <Download className="w-5 h-5 mr-2" />
                {t('cv.download')}
              </Button>
              <Button variant="outline" className="w-full" onClick={handlePreview}>
                <Eye className="w-5 h-5 mr-2" />
                {t('cv.preview')}
              </Button>
              {cvSaved && (
                <p className="text-sm text-green-600">{t('cv.saved')}</p>
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="text-xl font-bold text-[#1a1534] mb-6">{t('cv.template')}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => updateDraft((current) => ({ ...current, template: template.id }))}
                  className={`text-left p-4 rounded-lg border-2 transition-all ${
                    selectedTemplate === template.id
                      ? 'border-[#a21d4c] bg-[#a21d4c]/5'
                      : 'border-[#e8e3f0] hover:border-[#a21d4c]/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-[#1a1534]">{template.name}</h3>
                    {selectedTemplate === template.id && <Check className="w-5 h-5 text-[#a21d4c]" />}
                  </div>
                  <p className="text-sm text-[#6b5d7a]">{template.description}</p>
                  <div className="mt-4 h-32 bg-gradient-to-br from-[#f8f7fa] to-white rounded border border-[#e8e3f0] p-3">
                    <div className="space-y-2">
                      <div className="h-2 w-3/4 bg-[#2d2550]/20 rounded"></div>
                      <div className="h-1.5 w-1/2 bg-[#a21d4c]/20 rounded"></div>
                      <div className="h-1 w-full bg-[#e8e3f0] rounded"></div>
                      <div className="h-1 w-5/6 bg-[#e8e3f0] rounded"></div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#1a1534]">{t('cv.previewTitle')}</h2>
              <span className="text-sm text-[#6b5d7a]">
                {t('cv.templateLabel')}: {templates.find((template) => template.id === selectedTemplate)?.name}
              </span>
            </div>
            <div className="relative">
              <div className="lg:sticky lg:top-16">
                {/* Keep the preview anchored while scrolling through the form */}
                <div className="relative mx-auto max-w-[230mm] px-2 sm:px-6 pb-10">
                  <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[48px] bg-gradient-to-br from-[#a21d4c]/14 via-transparent to-[#2d2550]/12 blur-3xl" />
                  <div className="relative">
                    {renderPreview({ attachRef: true })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isPreviewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="w-full max-w-[92vw] sm:max-w-[250mm] md:max-w-[260mm] max-h-[96vh] gap-0 overflow-hidden border-none bg-[#f8f7fa] p-0 shadow-2xl grid-rows-[auto_minmax(0,1fr)]">
          <DialogHeader className="border-b border-[#e8e3f0] px-6 py-4">
            <DialogTitle className="text-2xl font-bold text-[#1a1534]">{t('cv.previewTitle')}</DialogTitle>
          </DialogHeader>
          <div className="flex min-h-0 flex-col overflow-hidden px-6 py-8">
            <div className="flex-1 overflow-y-auto">
              <div className="pb-6">
                <div className="mx-auto max-w-[250mm] md:max-w-[255mm] lg:max-w-[260mm] origin-top scale-[1.04]">
                  {renderPreview()}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
