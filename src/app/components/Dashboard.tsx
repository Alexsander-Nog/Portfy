import { useEffect, useRef, useState } from 'react';
import { DashboardLayout } from './DashboardLayout';
import { Card } from './Card';
import { Button } from './Button';
import { CVCreator } from './CVCreator';
import { Appearance } from './Appearance';
import { Subscription } from './Subscription';
import {
  createArticle,
  createExperience,
  createProject,
  deleteArticle,
  deleteExperience,
  deleteProject,
  updateArticle,
  updateExperience,
  updateProject,
  uploadPortfolioAsset,
  upsertUserProfile,
} from '../data/portfolio';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';
import type {
  CV,
  Experience,
  FeaturedVideo,
  Locale,
  Project,
  ScientificArticle,
  ScientificArticleTranslations,
  Subscription as SubscriptionType,
  SubscriptionPlan,
  UserProfile,
  UserTheme,
} from '../types';
import { useLocale } from '../i18n';
import { 
  Eye, 
  TrendingUp, 
  FolderOpen, 
  Plus,
  ExternalLink,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Globe,
  Github,
  Linkedin,
  Instagram,
  Youtube,
  Music,
  Link as LinkIcon,
  Upload,
  GripVertical,
  X,
  Check,
  Palette,
  BookOpen,
} from 'lucide-react';
import { PLAN_LIMITS, resolvePlanName } from '../data/plans';

interface DashboardProps {
  onLogout?: () => void;
  onViewPublicPortfolio?: () => void;
  userTheme: UserTheme;
  onThemeChange: (theme: UserTheme) => Promise<void> | void;
  featuredVideos: FeaturedVideo[];
  onVideosChange: (videos: FeaturedVideo[]) => void;
  projects: Project[];
  onProjectsChange: (projects: Project[]) => void;
  experiences: Experience[];
  onExperiencesChange: (experiences: Experience[]) => void;
  articles: ScientificArticle[];
  onArticlesChange: (articles: ScientificArticle[]) => void;
  cvs: CV[];
  onCvsChange: (cvs: CV[]) => void;
  userId?: string;
  userProfile: UserProfile;
  onProfileChange: (profile: UserProfile) => void;
  subscription?: SubscriptionType;
  userEmail?: string;
  accountCreatedAt?: string;
  onLocalePersist?: (locale: Locale) => Promise<void> | void;
}

export function Dashboard(props: DashboardProps) {
  const { locale, setLocale, t } = useLocale();
  const {
    onLogout,
    onViewPublicPortfolio,
    userTheme,
    onThemeChange,
    featuredVideos,
    onVideosChange,
    projects,
    onProjectsChange,
    experiences,
    onExperiencesChange,
    articles,
    onArticlesChange,
    userId,
    userProfile,
    onProfileChange,
    cvs,
    onCvsChange,
    subscription,
    userEmail,
    accountCreatedAt,
    onLocalePersist,
  } = props;
  const planTier = (subscription?.planTier ?? 'pro') as SubscriptionPlan;
  const planLimits = PLAN_LIMITS[planTier];
  const planName = resolvePlanName(planTier);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddExperience, setShowAddExperience] = useState(false);
  const [showAddArticle, setShowAddArticle] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [experienceError, setExperienceError] = useState<string | null>(null);
  const [articleError, setArticleError] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingExperienceId, setEditingExperienceId] = useState<string | null>(null);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [projectForm, setProjectForm] = useState({
    title: '',
    category: 'Design',
    description: '',
    link: '',
    imageUrl: '',
    type: 'standard',
    repoUrl: '',
    mediaUrl: '',
    pdfUrl: '',
    company: '',
    results: '',
    tags: '',
  });
  const [projectImageUploading, setProjectImageUploading] = useState(false);
  const [projectPdfUploading, setProjectPdfUploading] = useState(false);
  const [projectRepoLoading, setProjectRepoLoading] = useState(false);
  const [experienceForm, setExperienceForm] = useState({
    company: '',
    title: '',
    start: '',
    end: '',
    current: false,
    description: '',
    certificateUrl: '',
    showCertificate: true,
  });
  const [articleForm, setArticleForm] = useState({
    title: '',
    publication: '',
    publicationDate: '',
    summary: '',
    link: '',
    doi: '',
    authors: '',
    showInPortfolio: true,
    showInCv: true,
  });
  const [experienceCertUploading, setExperienceCertUploading] = useState(false);
  const [draggedExperienceId, setDraggedExperienceId] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    fullName: userProfile.fullName ?? '',
    title: userProfile.title ?? '',
    bio: userProfile.bio ?? '',
    location: userProfile.location ?? '',
    email: userProfile.email ?? '',
    phone: userProfile.phone ?? '',
    photoUrl: userProfile.photoUrl ?? '',
    skills: (userProfile.skills ?? []).join(', '),
    education: Array.isArray(userProfile.education) ? userProfile.education : [],
    socialLinks: {
      website: userProfile.socialLinks?.website ?? '',
      linkedin: userProfile.socialLinks?.linkedin ?? '',
      github: userProfile.socialLinks?.github ?? '',
      instagram: userProfile.socialLinks?.instagram ?? '',
      youtube: userProfile.socialLinks?.youtube ?? '',
      spotify: userProfile.socialLinks?.spotify ?? '',
      soundcloud: userProfile.socialLinks?.soundcloud ?? '',
    },
  });
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profilePhotoUploading, setProfilePhotoUploading] = useState(false);
  const [profilePhotoError, setProfilePhotoError] = useState<string | null>(null);
  const [enableTranslations, setEnableTranslations] = useState(false);
  const [translations, setTranslations] = useState({
    en: { bio: '', title: '' },
    es: { bio: '', title: '' },
  });
  
  const [enableProjectTranslations, setEnableProjectTranslations] = useState(false);
  const [projectTranslations, setProjectTranslations] = useState({
    en: { title: '', description: '', category: '' },
    es: { title: '', description: '', category: '' },
  });
  
  const [enableExperienceTranslations, setEnableExperienceTranslations] = useState(false);
  const [experienceTranslations, setExperienceTranslations] = useState({
    en: { title: '', company: '', description: '' },
    es: { title: '', company: '', description: '' },
  });

  const [enableArticleTranslations, setEnableArticleTranslations] = useState(false);
  const [articleTranslations, setArticleTranslations] = useState<ScientificArticleTranslations>({
    en: { title: '', summary: '', publication: '' },
    es: { title: '', summary: '', publication: '' },
  });

  const [localeSaving, setLocaleSaving] = useState(false);
  const [localeError, setLocaleError] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState('');
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const [shareLinkError, setShareLinkError] = useState<string | null>(null);
  const shareCopyTimeoutRef = useRef<number>();

  const sanitizeYearInput = (value: string) => value.replace(/[^0-9]/g, '').slice(0, 4);
  const deriveEducationPeriod = (start?: string | null, end?: string | null) => {
    const startYear = (start ?? '').trim();
    const endYear = (end ?? '').trim();
    if (startYear && endYear) {
      return `${startYear} - ${endYear}`;
    }
    if (startYear) {
      return startYear;
    }
    if (endYear) {
      return endYear;
    }
    return '';
  };
  const extractYearsFromPeriod = (raw?: string | null) => {
    if (!raw || typeof raw !== 'string') {
      return { start: '', end: '' };
    }
    const parts = raw.split(/[-–—]/);
    const start = sanitizeYearInput(parts[0] ?? '');
    const end = sanitizeYearInput(parts[1] ?? '');
    return { start, end };
  };

  useEffect(() => {
    setProfileForm({
      fullName: userProfile.fullName ?? '',
      title: userProfile.title ?? '',
      bio: userProfile.bio ?? '',
      location: userProfile.location ?? '',
      email: userProfile.email ?? '',
      phone: userProfile.phone ?? '',
      photoUrl: userProfile.photoUrl ?? '',
      skills: (userProfile.skills ?? []).join(', '),
      education: Array.isArray(userProfile.education) ? userProfile.education : [],
      socialLinks: {
        website: userProfile.socialLinks?.website ?? '',
        linkedin: userProfile.socialLinks?.linkedin ?? '',
        github: userProfile.socialLinks?.github ?? '',
        instagram: userProfile.socialLinks?.instagram ?? '',
        youtube: userProfile.socialLinks?.youtube ?? '',
        spotify: userProfile.socialLinks?.spotify ?? '',
        soundcloud: userProfile.socialLinks?.soundcloud ?? '',
      },
    });
    
    // Load translations if they exist
    if (userProfile.translations) {
      setEnableTranslations(true);
      setTranslations({
        en: {
          bio: userProfile.translations.en?.bio ?? '',
          title: userProfile.translations.en?.title ?? '',
        },
        es: {
          bio: userProfile.translations.es?.bio ?? '',
          title: userProfile.translations.es?.title ?? '',
        },
      });
    }
  }, [userProfile]);


  useEffect(() => {
    if (typeof window !== 'undefined' && userId) {
      setShareLink(`${window.location.origin}/p/${userId}`);
      return;
    }

    if (userId) {
      setShareLink(`/p/${userId}`);
      return;
    }

    setShareLink('');
  }, [userId]);

  useEffect(() => {
    return () => {
      if (shareCopyTimeoutRef.current) {
        window.clearTimeout(shareCopyTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setShareLinkCopied(false);
    setShareLinkError(null);
  }, [shareLink]);
  const resetProjectForm = () => {
    setProjectForm({
      title: '',
      category: 'Design',
      description: '',
      link: '',
      imageUrl: '',
      type: 'standard',
      repoUrl: '',
      mediaUrl: '',
      pdfUrl: '',
      company: '',
      results: '',
      tags: '',
    });
    setEnableProjectTranslations(false);
    setProjectTranslations({
      en: { title: '', description: '', category: '' },
      es: { title: '', description: '', category: '' },
    });
  };

  const resetExperienceForm = () => {
    setExperienceForm({
      company: '',
      title: '',
      start: '',
      end: '',
      current: false,
      description: '',
      certificateUrl: '',
      showCertificate: true,
    });
    setEnableExperienceTranslations(false);
    setExperienceTranslations({
      en: { title: '', company: '', description: '' },
      es: { title: '', company: '', description: '' },
    });
  };

  const resetArticleForm = () => {
    setArticleForm({
      title: '',
      publication: '',
      publicationDate: '',
      summary: '',
      link: '',
      doi: '',
      authors: '',
      showInPortfolio: true,
      showInCv: true,
    });
    setEnableArticleTranslations(false);
    setArticleTranslations({
      en: { title: '', summary: '', publication: '' },
      es: { title: '', summary: '', publication: '' },
    });
  };

  const renderSettings = () => (
    <div className="w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1a1534] mb-2">{t('settings.title')}</h1>
        <p className="text-[#6b5d7a]">{t('settings.subtitle')}</p>
      </div>

      <Card className="mb-6">
        <h2 className="text-xl font-bold text-[#1a1534] mb-4">{t('settings.accountSection')}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs text-[#6b5d7a] uppercase">{t('settings.accountName')}</p>
            <p className="text-sm font-medium text-[#1a1534]">
              {userProfile.fullName || t('settings.empty')}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#6b5d7a] uppercase">{t('settings.accountEmail')}</p>
            <p className="text-sm font-medium text-[#1a1534]">
              {userProfile.email || userEmail || t('settings.empty')}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#6b5d7a] uppercase">{t('settings.accountPlan')}</p>
            <p className="text-sm font-medium text-[#1a1534]">{planName}</p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-bold text-[#1a1534] mb-4">{t('settings.actionsSection')}</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => setActiveSection('appearance')}
          >
            <Palette className="w-5 h-5 mr-2" />
            {t('settings.actions.appearance')}
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => setActiveSection('language')}
          >
            <Globe className="w-5 h-5 mr-2" />
            {t('settings.actions.language')}
          </Button>
        </div>
      </Card>
    </div>
  );

  const handleCopyShareLink = async () => {
    if (!shareLink) {
      setShareLinkError(t('portfolio.share.unavailable'));
      return;
    }

    try {
      let copied = false;

      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareLink);
        copied = true;
      } else if (typeof document !== 'undefined') {
        const textArea = document.createElement('textarea');
        textArea.value = shareLink;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const result = document.execCommand('copy');
        document.body.removeChild(textArea);
        copied = result;
      }

      if (!copied) {
        throw new Error('Clipboard not supported');
      }

      setShareLinkCopied(true);
      setShareLinkError(null);

      if (shareCopyTimeoutRef.current) {
        window.clearTimeout(shareCopyTimeoutRef.current);
      }

      shareCopyTimeoutRef.current = window.setTimeout(() => {
        setShareLinkCopied(false);
        shareCopyTimeoutRef.current = undefined;
      }, 2000);
    } catch (error) {
      console.error('Falha ao copiar link do portfólio', error);
      setShareLinkError(t('portfolio.share.error'));
    }
  };

  const openNewProject = () => {
    if (planLimits.maxProjects !== null && projects.length >= planLimits.maxProjects) {
      setProjectError(t('plan.limit.projects', { limit: planLimits.maxProjects }));
      return;
    }

    setProjectError(null);
    setEditingProjectId(null);
    resetProjectForm();
    setShowAddProject(true);
  };

  const openNewExperience = () => {
    setExperienceError(null);
    setEditingExperienceId(null);
    resetExperienceForm();
    setShowAddExperience(true);
  };

  const openNewArticle = () => {
    setArticleError(null);
    setEditingArticleId(null);
    resetArticleForm();
    setShowAddArticle(true);
  };

  const openEditProject = (project: Project) => {
    setProjectError(null);
    setEditingProjectId(project.id);
    setProjectForm({
      title: project.title,
      category: project.category ?? 'Design',
      description: project.description,
      link: project.link ?? '',
      imageUrl: project.image ?? '',
      type: project.type ?? 'standard',
      repoUrl: project.repoUrl ?? '',
      mediaUrl: project.mediaUrl ?? '',
      pdfUrl: project.pdfUrl ?? '',
      company: project.company ?? '',
      results: project.results ?? '',
      tags: project.tags?.join(', ') ?? '',
    });
    
    // Load project translations if they exist
    if (project.translations) {
      setEnableProjectTranslations(true);
      setProjectTranslations({
        en: {
          title: project.translations.en?.title ?? '',
          description: project.translations.en?.description ?? '',
          category: project.translations.en?.category ?? '',
        },
        es: {
          title: project.translations.es?.title ?? '',
          description: project.translations.es?.description ?? '',
          category: project.translations.es?.category ?? '',
        },
      });
    }
    
    setShowAddProject(true);
  };

  const openEditExperience = (experience: Experience) => {
    const [startPart, endPartRaw] = experience.period.split(' - ');
    const endPart = endPartRaw?.trim() ?? '';
    const isCurrent = ['atual', 'presente', 'current', 'present'].includes(endPart.toLowerCase());

    setExperienceError(null);
    setEditingExperienceId(experience.id);
    setExperienceForm({
      company: experience.company,
      title: experience.title,
      start: startPart ?? '',
      end: isCurrent ? '' : endPart,
      current: isCurrent,
      description: experience.description,
      certificateUrl: experience.certificateUrl ?? '',
      showCertificate: experience.showCertificate ?? true,
    });
    
    // Load experience translations if they exist
    if (experience.translations) {
      setEnableExperienceTranslations(true);
      setExperienceTranslations({
        en: {
          title: experience.translations.en?.title ?? '',
          company: experience.translations.en?.company ?? '',
          description: experience.translations.en?.description ?? '',
        },
        es: {
          title: experience.translations.es?.title ?? '',
          company: experience.translations.es?.company ?? '',
          description: experience.translations.es?.description ?? '',
        },
      });
    }
    
    setShowAddExperience(true);
  };

  const openEditArticle = (article: ScientificArticle) => {
    setArticleError(null);
    setEditingArticleId(article.id);
    setArticleForm({
      title: article.title,
      publication: article.publication ?? '',
      publicationDate: article.publicationDate ?? '',
      summary: article.summary ?? '',
      link: article.link ?? '',
      doi: article.doi ?? '',
      authors: (article.authors ?? []).join(', '),
      showInPortfolio: article.showInPortfolio ?? true,
      showInCv: article.showInCv ?? true,
    });
    if (article.translations) {
      setEnableArticleTranslations(true);
      setArticleTranslations({
        en: {
          title: article.translations.en?.title ?? '',
          summary: article.translations.en?.summary ?? '',
          publication: article.translations.en?.publication ?? '',
        },
        es: {
          title: article.translations.es?.title ?? '',
          summary: article.translations.es?.summary ?? '',
          publication: article.translations.es?.publication ?? '',
        },
      });
    } else {
      setEnableArticleTranslations(false);
      setArticleTranslations({
        en: { title: '', summary: '', publication: '' },
        es: { title: '', summary: '', publication: '' },
      });
    }
    setShowAddArticle(true);
  };

  const handleProjectSave = async () => {
    setProjectError(null);

    if (!projectForm.title || !projectForm.description) {
      setProjectError('Preencha titulo e descricao.');
      return;
    }

    // Build translations object without undefined fields
    let translations: Project['translations'] = undefined;
    if (enableProjectTranslations) {
      const enTranslation: any = {};
      if (projectTranslations.en.title) enTranslation.title = projectTranslations.en.title;
      if (projectTranslations.en.description) enTranslation.description = projectTranslations.en.description;
      if (projectTranslations.en.category) enTranslation.category = projectTranslations.en.category;

      const esTranslation: any = {};
      if (projectTranslations.es.title) esTranslation.title = projectTranslations.es.title;
      if (projectTranslations.es.description) esTranslation.description = projectTranslations.es.description;
      if (projectTranslations.es.category) esTranslation.category = projectTranslations.es.category;

      // Only set translations if at least one field is filled
      if (Object.keys(enTranslation).length > 0 || Object.keys(esTranslation).length > 0) {
        translations = {
          en: Object.keys(enTranslation).length > 0 ? enTranslation : undefined,
          es: Object.keys(esTranslation).length > 0 ? esTranslation : undefined,
        };
      }
    }

    const payload: Omit<Project, 'id'> = {
      title: projectForm.title,
      description: projectForm.description,
      category: projectForm.category,
      link: projectForm.link || undefined,
      image: projectForm.imageUrl || undefined,
      type: projectForm.type as Project['type'],
      repoUrl: projectForm.repoUrl || undefined,
      mediaUrl: projectForm.mediaUrl || undefined,
      pdfUrl: projectForm.pdfUrl || undefined,
      company: projectForm.company || undefined,
      results: projectForm.results || undefined,
      tags: projectForm.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      translations,
    };

    if (editingProjectId) {
      if (userId && isSupabaseConfigured) {
        const updated = await updateProject(userId, editingProjectId, payload);
        if (!updated) {
          setProjectError('Nao foi possivel salvar o projeto.');
          return;
        }
        onProjectsChange(projects.map((project) => (project.id === updated.id ? updated : project)));
      } else {
        onProjectsChange(projects.map((project) => (
          project.id === editingProjectId ? { id: editingProjectId, ...payload } : project
        )));
      }
    } else if (userId && isSupabaseConfigured) {
      const created = await createProject(userId, payload);
      if (!created) {
        setProjectError('Nao foi possivel salvar o projeto.');
        return;
      }
      onProjectsChange([created, ...projects]);
    } else {
      const fallbackId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : String(Date.now());
      onProjectsChange([{ id: fallbackId, ...payload }, ...projects]);
    }

    setEditingProjectId(null);
    resetProjectForm();
    setShowAddProject(false);
  };

  const handleProjectImage = async (file: File | null) => {
    if (!file) {
      return;
    }

    setProjectImageUploading(true);

    if (userId && isSupabaseConfigured) {
      const url = await uploadPortfolioAsset(userId, file, 'projects');
      if (url) {
        setProjectForm({ ...projectForm, imageUrl: url });
        setProjectImageUploading(false);
        return;
      }
    }

    const localUrl = URL.createObjectURL(file);
    setProjectForm({ ...projectForm, imageUrl: localUrl });
    setProjectImageUploading(false);
  };

  const handleProjectPdf = async (file: File | null) => {
    if (!file) {
      return;
    }

    setProjectPdfUploading(true);

    if (userId && isSupabaseConfigured) {
      const url = await uploadPortfolioAsset(userId, file, 'documents');
      if (url) {
        setProjectForm({ ...projectForm, pdfUrl: url });
        setProjectPdfUploading(false);
        return;
      }
    }

    const localUrl = URL.createObjectURL(file);
    setProjectForm({ ...projectForm, pdfUrl: localUrl });
    setProjectPdfUploading(false);
  };

  const resolveMediaUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) {
      return null;
    }

    const youTubeMatch = trimmed.match(
      /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/i
    );
    if (youTubeMatch?.[1]) {
      return `https://www.youtube.com/embed/${youTubeMatch[1]}`;
    }

    const instaMatch = trimmed.match(/instagram\.com\/(p|reel|tv)\/([^/?#]+)/i);
    if (instaMatch?.[1] && instaMatch?.[2]) {
      return `https://www.instagram.com/${instaMatch[1]}/${instaMatch[2]}/embed`;
    }

    return null;
  };

  const handleProjectRepoImport = async () => {
    setProjectError(null);

    if (!projectForm.repoUrl) {
      setProjectError('Informe a URL do repositorio.');
      return;
    }

    const match = projectForm.repoUrl.match(/github\.com\/(.+?)\/(.+?)(?:\.|\/|$)/i);
    if (!match) {
      setProjectError('URL do GitHub invalida.');
      return;
    }

    const [, owner, repo] = match;
    setProjectRepoLoading(true);

    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
      if (!response.ok) {
        setProjectError('Repositorio nao encontrado.');
        setProjectRepoLoading(false);
        return;
      }
      const data = await response.json();
      setProjectForm({
        ...projectForm,
        title: data.name || projectForm.title,
        description: data.description || projectForm.description,
        link: data.html_url || projectForm.link,
        category: 'Desenvolvimento',
        type: 'github',
      });
    } catch {
      setProjectError('Falha ao importar dados do GitHub.');
    } finally {
      setProjectRepoLoading(false);
    }
  };

  const handleExperienceSave = async () => {
    setExperienceError(null);

    if (!experienceForm.company || !experienceForm.title || !experienceForm.start) {
      setExperienceError('Preencha empresa, cargo e data de inicio.');
      return;
    }

    const period = experienceForm.current
      ? `${experienceForm.start} - Atual`
      : `${experienceForm.start} - ${experienceForm.end || 'Presente'}`;

    // Build translations object without undefined fields
    let translations: Experience['translations'] = undefined;
    if (enableExperienceTranslations) {
      const enTranslation: any = {};
      if (experienceTranslations.en.title) enTranslation.title = experienceTranslations.en.title;
      if (experienceTranslations.en.company) enTranslation.company = experienceTranslations.en.company;
      if (experienceTranslations.en.description) enTranslation.description = experienceTranslations.en.description;

      const esTranslation: any = {};
      if (experienceTranslations.es.title) esTranslation.title = experienceTranslations.es.title;
      if (experienceTranslations.es.company) esTranslation.company = experienceTranslations.es.company;
      if (experienceTranslations.es.description) esTranslation.description = experienceTranslations.es.description;

      // Only set translations if at least one field is filled
      if (Object.keys(enTranslation).length > 0 || Object.keys(esTranslation).length > 0) {
        translations = {
          en: Object.keys(enTranslation).length > 0 ? enTranslation : undefined,
          es: Object.keys(esTranslation).length > 0 ? esTranslation : undefined,
        };
      }
    }

    const payload: Omit<Experience, 'id'> = {
      title: experienceForm.title,
      company: experienceForm.company,
      period,
      description: experienceForm.description || 'Sem descricao.',
      current: experienceForm.current,
      certificateUrl: experienceForm.certificateUrl || undefined,
      showCertificate: experienceForm.showCertificate,
      translations,
    };

    if (editingExperienceId) {
      if (userId && isSupabaseConfigured) {
        const updated = await updateExperience(userId, editingExperienceId, payload);
        if (!updated) {
          setExperienceError('Nao foi possivel salvar a experiencia.');
          return;
        }
        onExperiencesChange(experiences.map((experience) => (
          experience.id === updated.id ? updated : experience
        )));
      } else {
        onExperiencesChange(experiences.map((experience) => (
          experience.id === editingExperienceId ? { id: editingExperienceId, ...payload } : experience
        )));
      }
    } else if (userId && isSupabaseConfigured) {
      const created = await createExperience(userId, payload);
      if (!created) {
        setExperienceError('Nao foi possivel salvar a experiencia.');
        return;
      }
      onExperiencesChange([created, ...experiences]);
    } else {
      const fallbackId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : String(Date.now());
      onExperiencesChange([{ id: fallbackId, ...payload }, ...experiences]);
    }

    setEditingExperienceId(null);
    resetExperienceForm();
    setShowAddExperience(false);
  };

  const mapArticleFormToPayload = (): Omit<ScientificArticle, 'id'> => {
    const authors = articleForm.authors
      .split(',')
      .map((author) => author.trim())
      .filter(Boolean);

    let translations: ScientificArticle['translations'] = undefined;
    if (enableArticleTranslations) {
      const enTranslation: Record<string, string> = {};
      const esTranslation: Record<string, string> = {};

      const enTitle = articleTranslations.en?.title?.trim();
      const enSummary = articleTranslations.en?.summary?.trim();
      const enPublication = articleTranslations.en?.publication?.trim();
      if (enTitle) enTranslation.title = enTitle;
      if (enSummary) enTranslation.summary = enSummary;
      if (enPublication) enTranslation.publication = enPublication;

      const esTitle = articleTranslations.es?.title?.trim();
      const esSummary = articleTranslations.es?.summary?.trim();
      const esPublication = articleTranslations.es?.publication?.trim();
      if (esTitle) esTranslation.title = esTitle;
      if (esSummary) esTranslation.summary = esSummary;
      if (esPublication) esTranslation.publication = esPublication;

      if (Object.keys(enTranslation).length > 0 || Object.keys(esTranslation).length > 0) {
        translations = {
          en: Object.keys(enTranslation).length > 0 ? enTranslation : undefined,
          es: Object.keys(esTranslation).length > 0 ? esTranslation : undefined,
        };
      }
    }

    return {
      title: articleForm.title.trim(),
      publication: articleForm.publication.trim() || undefined,
      publicationDate: articleForm.publicationDate.trim() || undefined,
      summary: articleForm.summary.trim() || undefined,
      link: articleForm.link.trim() || undefined,
      doi: articleForm.doi.trim() || undefined,
      authors: authors.length > 0 ? authors : undefined,
      showInPortfolio: articleForm.showInPortfolio,
      showInCv: articleForm.showInCv,
      position: undefined,
      translations,
    };
  };

  const handleArticleSave = async () => {
    setArticleError(null);

    if (!articleForm.title.trim()) {
      setArticleError('Informe um titulo para o artigo.');
      return;
    }

    const payload = mapArticleFormToPayload();

    if (editingArticleId) {
      if (userId && isSupabaseConfigured) {
        const updated = await updateArticle(userId, editingArticleId, payload);
        if (!updated) {
          setArticleError('Nao foi possivel salvar o artigo.');
          return;
        }
        onArticlesChange(articles.map((article) => (article.id === updated.id ? updated : article)));
      } else {
        onArticlesChange(
          articles.map((article) => (
            article.id === editingArticleId ? { id: editingArticleId, ...payload } : article
          )),
        );
      }
    } else if (userId && isSupabaseConfigured) {
      const created = await createArticle(userId, payload);
      if (!created) {
        setArticleError('Nao foi possivel salvar o artigo.');
        return;
      }
      onArticlesChange([created, ...articles]);
    } else {
      const fallbackId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : String(Date.now());
      onArticlesChange([{ id: fallbackId, ...payload }, ...articles]);
    }

    setEditingArticleId(null);
    resetArticleForm();
    setShowAddArticle(false);
  };

  const handleArticleDelete = async (articleId: string) => {
    const confirmed = typeof window === 'undefined'
      ? true
      : window.confirm('Tem certeza que deseja excluir este artigo?');
    if (!confirmed) {
      return;
    }

    if (userId && isSupabaseConfigured) {
      const ok = await deleteArticle(userId, articleId);
      if (!ok) {
        setArticleError('Nao foi possivel excluir o artigo.');
        return;
      }
    }

    onArticlesChange(articles.filter((article) => article.id !== articleId));
  };

  const handleArticleVisibilityChange = async (
    article: ScientificArticle,
    field: 'showInPortfolio' | 'showInCv',
    value: boolean,
  ) => {
    if (article[field] === value) {
      return;
    }

    if (userId && isSupabaseConfigured) {
      const payload: Omit<ScientificArticle, 'id'> = {
        title: article.title,
        publication: article.publication ?? undefined,
        publicationDate: article.publicationDate ?? undefined,
        summary: article.summary ?? undefined,
        link: article.link ?? undefined,
        doi: article.doi ?? undefined,
        authors: article.authors ?? undefined,
        showInPortfolio: field === 'showInPortfolio' ? value : article.showInPortfolio ?? true,
        showInCv: field === 'showInCv' ? value : article.showInCv ?? true,
        position: article.position,
        translations: article.translations,
      };

      const updated = await updateArticle(userId, article.id, payload);
      if (!updated) {
        setArticleError('Nao foi possivel atualizar o artigo.');
        return;
      }
      onArticlesChange(articles.map((item) => (item.id === updated.id ? updated : item)));
      return;
    }

    onArticlesChange(
      articles.map((item) => (
        item.id === article.id
          ? { ...article, [field]: value }
          : item
      )),
    );
  };

  const handleProjectDelete = async (projectId: string) => {
    const confirmed = typeof window === 'undefined'
      ? true
      : window.confirm('Tem certeza que deseja excluir este projeto?');
    if (!confirmed) {
      return;
    }

    if (userId && isSupabaseConfigured) {
      const ok = await deleteProject(userId, projectId);
      if (!ok) {
        setProjectError('Nao foi possivel excluir o projeto.');
        return;
      }
    }

    onProjectsChange(projects.filter((project) => project.id !== projectId));
  };

  const handleExperienceDelete = async (experienceId: string) => {
    const confirmed = typeof window === 'undefined'
      ? true
      : window.confirm('Tem certeza que deseja excluir esta experiencia?');
    if (!confirmed) {
      return;
    }

    if (userId && isSupabaseConfigured) {
      const ok = await deleteExperience(userId, experienceId);
      if (!ok) {
        setExperienceError('Nao foi possivel excluir a experiencia.');
        return;
      }
    }

    onExperiencesChange(experiences.filter((experience) => experience.id !== experienceId));
  };

  const handleExperienceCertificate = async (file: File | null) => {
    if (!file) {
      return;
    }

    setExperienceCertUploading(true);

    if (userId && isSupabaseConfigured) {
      const url = await uploadPortfolioAsset(userId, file, 'documents');
      if (url) {
        setExperienceForm({ ...experienceForm, certificateUrl: url });
        setExperienceCertUploading(false);
        return;
      }
    }

    const localUrl = URL.createObjectURL(file);
    setExperienceForm({ ...experienceForm, certificateUrl: localUrl });
    setExperienceCertUploading(false);
  };

  const handleExperienceDrop = (targetId: string) => {
    if (!draggedExperienceId || draggedExperienceId === targetId) {
      return;
    }

    const sourceIndex = experiences.findIndex((exp) => exp.id === draggedExperienceId);
    const targetIndex = experiences.findIndex((exp) => exp.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) {
      return;
    }

    const updated = [...experiences];
    const [moved] = updated.splice(sourceIndex, 1);
    updated.splice(targetIndex, 0, moved);
    onExperiencesChange(updated);
    setDraggedExperienceId(null);
  };

  const handleProfileSave = async () => {
    console.log('=== INICIANDO SALVAMENTO DO PERFIL ===');
    setProfileError(null);

    if (!profileForm.fullName || !profileForm.email) {
      console.error('Validação falhou: nome ou email vazio');
      setProfileError('Preencha nome e email.');
      return;
    }

    const skills = profileForm.skills
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean);

    console.log('Skills processadas:', skills);

    // Build translations object without undefined fields
    let profileTranslations: UserProfile['translations'] = undefined;
    if (enableTranslations) {
      const enTranslation: any = {};
      if (translations.en.bio) enTranslation.bio = translations.en.bio;
      if (translations.en.title) enTranslation.title = translations.en.title;

      const esTranslation: any = {};
      if (translations.es.bio) esTranslation.bio = translations.es.bio;
      if (translations.es.title) esTranslation.title = translations.es.title;

      // Only set translations if at least one field is filled
      if (Object.keys(enTranslation).length > 0 || Object.keys(esTranslation).length > 0) {
        profileTranslations = {
          en: Object.keys(enTranslation).length > 0 ? enTranslation : undefined,
          es: Object.keys(esTranslation).length > 0 ? esTranslation : undefined,
        };
      }
    }

    const safeEducation = Array.isArray(profileForm.education)
      ? profileForm.education
      : [];

    const normalizedEducation = safeEducation
      .map((entry) => {
        const { start: periodStart, end: periodEnd } = extractYearsFromPeriod(entry.period);
        const startYear = sanitizeYearInput(entry.startYear ?? periodStart);
        const endYear = sanitizeYearInput(entry.endYear ?? periodEnd);
        const rawPeriod = typeof entry.period === 'string' ? entry.period.trim() : '';
        const normalizedPeriod = deriveEducationPeriod(startYear, endYear) || rawPeriod;
        const trimmedInstitution = entry.institution?.trim() ?? '';
        const trimmedDegree = entry.degree?.trim() ?? '';
        const trimmedDescription = entry.description?.trim();

        return {
          institution: trimmedInstitution,
          degree: trimmedDegree,
          description: trimmedDescription ? trimmedDescription : undefined,
          startYear: startYear || undefined,
          endYear: endYear || undefined,
          period: normalizedPeriod || undefined,
        };
      })
      .filter((entry) => entry.institution || entry.degree || entry.startYear || entry.endYear || entry.description);

    const payload: Omit<UserProfile, 'id'> = {
      fullName: profileForm.fullName,
      preferredLocale: userProfile.preferredLocale ?? locale,
      title: profileForm.title || undefined,
      bio: profileForm.bio || undefined,
      location: profileForm.location || undefined,
      email: profileForm.email || undefined,
      phone: profileForm.phone || undefined,
      photoUrl: profileForm.photoUrl || undefined,
      skills,
      education: normalizedEducation,
      translations: profileTranslations,
      socialLinks: {
        website: profileForm.socialLinks.website || undefined,
        linkedin: profileForm.socialLinks.linkedin || undefined,
        github: profileForm.socialLinks.github || undefined,
        instagram: profileForm.socialLinks.instagram || undefined,
        youtube: profileForm.socialLinks.youtube || undefined,
        spotify: profileForm.socialLinks.spotify || undefined,
        soundcloud: profileForm.socialLinks.soundcloud || undefined,
      },
    };

    console.log('Payload preparado:', payload);
    console.log('📸 photoUrl in payload:', payload.photoUrl);
    console.log('userId:', userId);
    console.log('isSupabaseConfigured:', isSupabaseConfigured);

    setProfileSaving(true);

    try {
      if (userId && isSupabaseConfigured) {
        console.log('Salvando no Supabase...');
        const saved = await upsertUserProfile(userId, payload);
        console.log('Resultado do Supabase:', saved);
        
        if (!saved) {
          console.error('upsertUserProfile retornou null');
          setProfileError('Nao foi possivel salvar o perfil. Verifique o console para mais detalhes.');
          setProfileSaving(false);
          return;
        }
        
        console.log('Perfil salvo com sucesso! Atualizando estado...');
        onProfileChange(saved);
        console.log('Estado atualizado!');
      } else {
        console.log('Salvando localmente (Supabase não configurado)');
        onProfileChange({ id: userProfile.id, ...payload });
      }

      setProfileSaving(false);
      console.log('=== SALVAMENTO CONCLUÍDO COM SUCESSO ===');
    } catch (error) {
      console.error('=== ERRO NO SALVAMENTO ===', error);
      setProfileError(`Erro ao salvar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setProfileSaving(false);
    }
  };

  const handleProfilePhoto = async (file: File | null) => {
    console.log('handleProfilePhoto chamado:', file);
    if (!file) {
      console.log('Nenhum arquivo selecionado');
      return;
    }

    setProfilePhotoError(null);
    setProfilePhotoUploading(true);
    console.log('Iniciando upload da foto...');

    if (userId && isSupabaseConfigured) {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const fileId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : String(Date.now());
      const path = `${userId}/avatars/${fileId}.${ext}`;

      const { error } = await supabase.storage
        .from('portfolio-assets')
        .upload(path, file, { upsert: true });

      if (error) {
        setProfilePhotoError('Nao foi possivel enviar a foto. Verifique suas permissoes do storage.');
      } else {
        const { data } = supabase.storage.from('portfolio-assets').getPublicUrl(path);
        if (data.publicUrl) {
          console.log('📸 Photo uploaded successfully:', data.publicUrl);
          setProfileForm({ ...profileForm, photoUrl: data.publicUrl });
          setProfilePhotoUploading(false);
          return;
        }
        setProfilePhotoError('Foto enviada, mas nao foi possivel obter a URL publica.');
      }
    }

    const localUrl = URL.createObjectURL(file);
    console.log('📸 Using local URL:', localUrl);
    setProfileForm({ ...profileForm, photoUrl: localUrl });
    setProfilePhotoUploading(false);
  };

  const handleLocaleSelect = async (nextLocale: Locale) => {
    if (locale === nextLocale || localeSaving) {
      return;
    }

    setLocaleError(null);
    setLocaleSaving(true);
    setLocale(nextLocale);

    try {
      if (onLocalePersist) {
        await onLocalePersist(nextLocale);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('dash.localeSaveError');
      setLocaleError(message);
    } finally {
      setLocaleSaving(false);
    }
  };

  const renderDashboard = () => (
    <div className="w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1a1534] mb-2">{t('dash.title')}</h1>
        <p className="text-[#6b5d7a]">{t('dash.subtitle')}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card gradient>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#a21d4c] to-[#c92563] flex items-center justify-center">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-[#6b5d7a]">{t('dash.metrics.period')}</span>
          </div>
          <p className="text-3xl font-bold text-[#1a1534] mb-1">342</p>
          <p className="text-sm text-[#6b5d7a]">{t('dash.metrics.views')}</p>
          <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
            <TrendingUp className="w-3 h-3" />
            <span>{t('dash.metrics.viewsChange')}</span>
          </div>
        </Card>

        <Card gradient>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#2d2550] to-[#5a4570] flex items-center justify-center">
              <FolderOpen className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-[#1a1534] mb-1">{projects.length}</p>
          <p className="text-sm text-[#6b5d7a]">{t('dash.metrics.projects')}</p>
        </Card>

        <Card gradient>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#7a1538] to-[#a21d4c] flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-[#1a1534] mb-1">{planName}</p>
          <p className="text-sm text-[#6b5d7a]">{t('dash.metrics.plan')}</p>
          <p className="text-xs text-[#a21d4c] mt-2">
            {planTier === 'basic'
              ? t('plan.badges.basic')
              : planTier === 'pro'
              ? t('plan.badges.pro')
              : t('plan.badges.premium')}
          </p>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 className="text-xl font-bold text-[#1a1534]">{t('dash.quickActions')}</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            className="justify-start"
            onClick={() => setActiveSection('portfolio')}
          >
            <Edit className="w-5 h-5 mr-2" />
            {t('dash.editPortfolio')}
          </Button>
          <Button 
            variant="outline" 
            className="justify-start"
            onClick={() => setActiveSection('projects')}
          >
            <Plus className="w-5 h-5 mr-2" />
            {t('dash.addProject')}
          </Button>
          <Button 
            variant="outline" 
            className="justify-start"
            onClick={() => setActiveSection('articles')}
          >
            <BookOpen className="w-5 h-5 mr-2" />
            {t('dash.addArticle')}
          </Button>
          <Button 
            variant="outline" 
            className="justify-start"
            onClick={onViewPublicPortfolio}
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            {t('dash.viewPublic')}
          </Button>
          <Button 
            variant="outline" 
            className="justify-start"
            onClick={() => setActiveSection('cv')}
          >
            <Edit className="w-5 h-5 mr-2" />
            {t('dash.editCv')}
          </Button>
        </div>
      </Card>
    </div>
  );

  const renderPortfolio = () => (
    <div className="w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1a1534] mb-2">{t('portfolio.title')}</h1>
        <p className="text-[#6b5d7a]">{t('portfolio.subtitle')}</p>
      </div>

      <Card className="mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-[#1a1534]">{t('portfolio.share.title')}</h2>
            <p className="text-sm text-[#6b5d7a]">
              {shareLink ? t('portfolio.share.description') : t('portfolio.share.unavailable')}
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 md:max-w-xl md:flex-row md:items-center">
            <input
              value={shareLink}
              onFocus={(event) => event.currentTarget.select()}
              readOnly
              className="w-full min-w-0 rounded-md border border-[#e8e3f0] bg-[#f7f5fb] px-3 py-2 text-sm text-[#2d2550] focus:outline-none focus:ring-2 focus:ring-[#c92563]"
            />
            <Button
              variant="outline"
              className="whitespace-nowrap"
              onClick={handleCopyShareLink}
              disabled={!shareLink}
            >
              <LinkIcon className="mr-2 h-4 w-4" />
              {shareLinkCopied ? t('portfolio.share.copied') : t('portfolio.share.copy')}
            </Button>
          </div>
        </div>
        {shareLinkError ? (
          <p className="mt-3 text-sm text-[#a21d4c]">{shareLinkError}</p>
        ) : null}
      </Card>

      <Card className="mb-6">
        <h2 className="text-xl font-bold text-[#1a1534] mb-6">{t('portfolio.profile')}</h2>
        {(() => {
          const initials = profileForm.fullName
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((chunk) => chunk[0]?.toUpperCase())
            .join('') || 'ME';

          return (
            <>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-6">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-r from-[#a21d4c] to-[#c92563] flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                        {profileForm.photoUrl ? (
                          <img src={profileForm.photoUrl} alt="Foto" className="w-full h-full object-cover" />
                        ) : (
                          initials
                        )}
                      </div>
                      <div>
                        <input
                          ref={(el) => {
                            if (el) {
                              (window as any).__profilePhotoInput = el;
                            }
                          }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            handleProfilePhoto(e.target.files?.[0] ?? null);
                            e.target.value = '';
                          }}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Botão de foto clicado!');
                            const input = (window as any).__profilePhotoInput;
                            console.log('Input encontrado:', input);
                            if (input) {
                              input.click();
                              console.log('Input.click() chamado');
                            } else {
                              console.error('Input não encontrado!');
                            }
                          }}
                          disabled={profilePhotoUploading}
                          className="inline-flex items-center justify-center gap-2 h-8 rounded-md px-3 text-sm font-medium transition-all border border-[#e8e3f0] bg-white text-[#1a1534] hover:bg-[#f5f3f7] hover:text-[#a21d4c] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Upload className="w-4 h-4" />
                          {profilePhotoUploading ? 'Enviando...' : t('portfolio.changePhoto')}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-[#6b5d7a] mb-2">
                          {t('portfolio.fullName')}
                        </label>
                        <input
                          type="text"
                          value={profileForm.fullName}
                          onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-[#6b5d7a] mb-2">
                          {t('portfolio.titleField')}
                        </label>
                        <input
                          type="text"
                          value={profileForm.title}
                          onChange={(e) => setProfileForm({ ...profileForm, title: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-[#6b5d7a] mb-2">
                          {t('portfolio.bio')}
                        </label>
                        <textarea
                          rows={4}
                          value={profileForm.bio}
                          onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c]"
                        />
                      </div>
                    </div>

                    <div className="border-t border-[#e8e3f0] pt-4 mt-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                        <div>
                          <label className="block text-sm font-medium text-[#1a1534] mb-1">
                            Traduções (Inglês/Espanhol)
                          </label>
                          <p className="text-xs text-[#6b5d7a]">
                            Adicione traduções do título e biografia para outros idiomas
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEnableTranslations(!enableTranslations)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            enableTranslations ? 'bg-[#a21d4c]' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              enableTranslations ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      {enableTranslations && (
                        <div className="space-y-4">
                          <div className="bg-[#f5f3f7] p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-[#1a1534] mb-3 flex items-center gap-2">
                              <Globe className="w-4 h-4" />
                              English
                            </h4>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs text-[#6b5d7a] mb-1">Title (English)</label>
                                <input
                                  type="text"
                                  value={translations.en.title}
                                  onChange={(e) => setTranslations({
                                    ...translations,
                                    en: { ...translations.en, title: e.target.value }
                                  })}
                                  placeholder="e.g., Full Stack Developer"
                                  className="w-full px-3 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c] text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-[#6b5d7a] mb-1">Bio (English)</label>
                                <textarea
                                  rows={3}
                                  value={translations.en.bio}
                                  onChange={(e) => setTranslations({
                                    ...translations,
                                    en: { ...translations.en, bio: e.target.value }
                                  })}
                                  placeholder="Describe yourself in English..."
                                  className="w-full px-3 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c] text-sm"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="bg-[#f5f3f7] p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-[#1a1534] mb-3 flex items-center gap-2">
                              <Globe className="w-4 h-4" />
                              Español
                            </h4>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs text-[#6b5d7a] mb-1">Título (Español)</label>
                                <input
                                  type="text"
                                  value={translations.es.title}
                                  onChange={(e) => setTranslations({
                                    ...translations,
                                    es: { ...translations.es, title: e.target.value }
                                  })}
                                  placeholder="ej., Desarrollador Full Stack"
                                  className="w-full px-3 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c] text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-[#6b5d7a] mb-1">Biografía (Español)</label>
                                <textarea
                                  rows={3}
                                  value={translations.es.bio}
                                  onChange={(e) => setTranslations({
                                    ...translations,
                                    es: { ...translations.es, bio: e.target.value }
                                  })}
                                  placeholder="Descríbete en español..."
                                  className="w-full px-3 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c] text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {(() => {
                      const educationList = Array.isArray(profileForm.education) ? profileForm.education : [];
                      if (educationList.length === 0) {
                        return <p className="text-sm text-[#6b5d7a]">Nenhuma formacao adicionada.</p>;
                      }

                      return (
                        <div className="space-y-4">
                          {educationList.map((item, index) => (
                            <div key={`${item.institution}-${index}`} className="rounded-lg border border-[#e8e3f0] p-4 bg-white">
                              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <div>
                                  <label className="block text-xs text-[#6b5d7a] mb-1">Instituicao</label>
                                  <input
                                    type="text"
                                    value={item.institution}
                                    onChange={(e) => {
                                      const next = [...educationList];
                                      next[index] = { ...next[index], institution: e.target.value };
                                      setProfileForm({ ...profileForm, education: next });
                                    }}
                                    className="w-full px-3 py-2 rounded-lg border border-[#e8e3f0] bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-[#6b5d7a] mb-1">Curso</label>
                                  <input
                                    type="text"
                                    value={item.degree}
                                    onChange={(e) => {
                                      const next = [...educationList];
                                      next[index] = { ...next[index], degree: e.target.value };
                                      setProfileForm({ ...profileForm, education: next });
                                    }}
                                    className="w-full px-3 py-2 rounded-lg border border-[#e8e3f0] bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-[#6b5d7a] mb-1">Inicio</label>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={4}
                                    value={item.startYear ?? ''}
                                    onChange={(e) => {
                                      const next = [...educationList];
                                      const sanitized = sanitizeYearInput(e.target.value);
                                      const current = next[index] as typeof item;
                                      const endYear = sanitizeYearInput(current?.endYear ?? '');
                                      next[index] = {
                                        ...current,
                                        startYear: sanitized,
                                        endYear,
                                        period: deriveEducationPeriod(sanitized, endYear),
                                      } as typeof item;
                                      setProfileForm({ ...profileForm, education: next });
                                    }}
                                    placeholder="2020"
                                    className="w-full px-3 py-2 rounded-lg border border-[#e8e3f0] bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-[#6b5d7a] mb-1">Conclusao</label>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={4}
                                    value={item.endYear ?? ''}
                                    onChange={(e) => {
                                      const next = [...educationList];
                                      const sanitized = sanitizeYearInput(e.target.value);
                                      const current = next[index] as typeof item;
                                      const startYear = sanitizeYearInput(current?.startYear ?? '');
                                      next[index] = {
                                        ...current,
                                        startYear,
                                        endYear: sanitized,
                                        period: deriveEducationPeriod(startYear, sanitized),
                                      } as typeof item;
                                      setProfileForm({ ...profileForm, education: next });
                                    }}
                                    placeholder="2024"
                                    className="w-full px-3 py-2 rounded-lg border border-[#e8e3f0] bg-white"
                                  />
                                </div>
                                <div className="md:col-span-2 lg:col-span-4">
                                  <label className="block text-xs text-[#6b5d7a] mb-1">Descricao</label>
                                  <input
                                    type="text"
                                    value={item.description ?? ''}
                                    onChange={(e) => {
                                      const next = [...educationList];
                                      next[index] = { ...next[index], description: e.target.value };
                                      setProfileForm({ ...profileForm, education: next });
                                    }}
                                    className="w-full px-3 py-2 rounded-lg border border-[#e8e3f0] bg-white"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end mt-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const next = educationList.filter((_, idx) => idx !== index);
                                    setProfileForm({ ...profileForm, education: next });
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Remover
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-[#6b5d7a] mb-2">Habilidades (separadas por virgula)</label>
                    <input
                      type="text"
                      placeholder="Ex: React, TypeScript, Design"
                      value={profileForm.skills}
                      onChange={(e) => {
                        console.log('Skills onChange:', e.target.value);
                        setProfileForm({ ...profileForm, skills: e.target.value });
                      }}
                      className="w-full px-4 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-[#6b5d7a] mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      {t('portfolio.location')}
                    </label>
                    <input
                      type="text"
                      value={profileForm.location}
                      onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-[#6b5d7a] mb-2">
                      <Mail className="w-4 h-4 inline mr-1" />
                      {t('portfolio.email')}
                    </label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-[#6b5d7a] mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      {t('portfolio.phone')}
                    </label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-[#6b5d7a] mb-4">{t('portfolio.social')}</label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-[#6b5d7a]" />
                        <input
                          type="url"
                          placeholder="https://seusite.com"
                          value={profileForm.socialLinks.website}
                          onChange={(e) => setProfileForm({
                            ...profileForm,
                            socialLinks: { ...profileForm.socialLinks, website: e.target.value }
                          })}
                          className="flex-1 px-4 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c]"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <Linkedin className="w-5 h-5 text-[#6b5d7a]" />
                        <input
                          type="url"
                          placeholder="linkedin.com/in/seuperfil"
                          value={profileForm.socialLinks.linkedin}
                          onChange={(e) => setProfileForm({
                            ...profileForm,
                            socialLinks: { ...profileForm.socialLinks, linkedin: e.target.value }
                          })}
                          className="flex-1 px-4 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c]"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <Github className="w-5 h-5 text-[#6b5d7a]" />
                        <input
                          type="url"
                          placeholder="github.com/seuperfil"
                          value={profileForm.socialLinks.github}
                          onChange={(e) => setProfileForm({
                            ...profileForm,
                            socialLinks: { ...profileForm.socialLinks, github: e.target.value }
                          })}
                          className="flex-1 px-4 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c]"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <Instagram className="w-5 h-5 text-[#6b5d7a]" />
                        <input
                          type="url"
                          placeholder="instagram.com/seuperfil"
                          value={profileForm.socialLinks.instagram}
                          onChange={(e) => setProfileForm({
                            ...profileForm,
                            socialLinks: { ...profileForm.socialLinks, instagram: e.target.value }
                          })}
                          className="flex-1 px-4 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c]"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <Youtube className="w-5 h-5 text-[#6b5d7a]" />
                        <input
                          type="url"
                          placeholder="youtube.com/@seucanal"
                          value={profileForm.socialLinks.youtube}
                          onChange={(e) => setProfileForm({
                            ...profileForm,
                            socialLinks: { ...profileForm.socialLinks, youtube: e.target.value }
                          })}
                          className="flex-1 px-4 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c]"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <Music className="w-5 h-5 text-[#6b5d7a]" />
                        <input
                          type="url"
                          placeholder="open.spotify.com/artist/..."
                          value={profileForm.socialLinks.spotify}
                          onChange={(e) => setProfileForm({
                            ...profileForm,
                            socialLinks: { ...profileForm.socialLinks, spotify: e.target.value }
                          })}
                          className="flex-1 px-4 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c]"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <LinkIcon className="w-5 h-5 text-[#6b5d7a]" />
                        <input
                          type="url"
                          placeholder="soundcloud.com/seuperfil"
                          value={profileForm.socialLinks.soundcloud}
                          onChange={(e) => setProfileForm({
                            ...profileForm,
                            socialLinks: { ...profileForm.socialLinks, soundcloud: e.target.value }
                          })}
                          className="flex-1 px-4 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end mt-6 pt-6 border-t border-[#e8e3f0]">
                <Button
                  variant="ghost"
                  onClick={() => setProfileForm({
                    fullName: userProfile.fullName ?? '',
                    title: userProfile.title ?? '',
                    bio: userProfile.bio ?? '',
                    location: userProfile.location ?? '',
                    email: userProfile.email ?? '',
                    phone: userProfile.phone ?? '',
                    photoUrl: userProfile.photoUrl ?? '',
                    skills: (userProfile.skills ?? []).join(', '),
                    education: Array.isArray(userProfile.education) ? userProfile.education : [],
                    socialLinks: {
                      website: userProfile.socialLinks?.website ?? '',
                      linkedin: userProfile.socialLinks?.linkedin ?? '',
                      github: userProfile.socialLinks?.github ?? '',
                      instagram: userProfile.socialLinks?.instagram ?? '',
                      youtube: userProfile.socialLinks?.youtube ?? '',
                      spotify: userProfile.socialLinks?.spotify ?? '',
                      soundcloud: userProfile.socialLinks?.soundcloud ?? '',
                    },
                  })}
                >
                  {t('portfolio.cancel')}
                </Button>
                <Button variant="primary" onClick={handleProfileSave} disabled={profileSaving}>
                  {profileSaving ? 'Salvando...' : t('portfolio.save')}
                </Button>
              </div>

              {profileError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {profileError}
                </div>
              )}
            </>
          );
        })()}
      </Card>

      <Card className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#1a1534]">Formacoes</h2>
            <p className="text-sm text-[#6b5d7a]">Adicione suas formacoes academicas e cursos.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const currentEducation = Array.isArray(profileForm.education)
                ? profileForm.education
                : [];
              setProfileForm({
                ...profileForm,
                education: [
                  ...currentEducation,
                  { institution: '', degree: '', startYear: '', endYear: '', period: '', description: '' }
                ],
              });
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar
          </Button>
        </div>

        {(() => {
          const educationList = Array.isArray(profileForm.education)
            ? profileForm.education
            : [];

          if (educationList.length === 0) {
            return <p className="text-sm text-[#6b5d7a]">Nenhuma formacao adicionada.</p>;
          }

          return (
            <div className="space-y-4">
              {educationList.map((item, index) => (
                <div key={`${item.institution}-${index}`} className="rounded-lg border border-[#e8e3f0] p-4 bg-white">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="block text-xs text-[#6b5d7a] mb-1">Instituicao</label>
                      <input
                        type="text"
                        value={item.institution}
                        onChange={(e) => {
                          const next = [...educationList];
                          next[index] = { ...next[index], institution: e.target.value };
                          setProfileForm({ ...profileForm, education: next });
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-[#e8e3f0] bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#6b5d7a] mb-1">Curso</label>
                      <input
                        type="text"
                        value={item.degree}
                        onChange={(e) => {
                          const next = [...educationList];
                          next[index] = { ...next[index], degree: e.target.value };
                          setProfileForm({ ...profileForm, education: next });
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-[#e8e3f0] bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#6b5d7a] mb-1">Inicio</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={4}
                        value={item.startYear ?? ''}
                        onChange={(e) => {
                          const next = [...educationList];
                          const sanitized = sanitizeYearInput(e.target.value);
                          const current = next[index] as typeof item;
                          const endYear = sanitizeYearInput(current?.endYear ?? '');
                          next[index] = {
                            ...current,
                            startYear: sanitized,
                            endYear,
                            period: deriveEducationPeriod(sanitized, endYear),
                          } as typeof item;
                          setProfileForm({ ...profileForm, education: next });
                        }}
                        placeholder="2020"
                        className="w-full px-3 py-2 rounded-lg border border-[#e8e3f0] bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#6b5d7a] mb-1">Conclusao</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={4}
                        value={item.endYear ?? ''}
                        onChange={(e) => {
                          const next = [...educationList];
                          const sanitized = sanitizeYearInput(e.target.value);
                          const current = next[index] as typeof item;
                          const startYear = sanitizeYearInput(current?.startYear ?? '');
                          next[index] = {
                            ...current,
                            startYear,
                            endYear: sanitized,
                            period: deriveEducationPeriod(startYear, sanitized),
                          } as typeof item;
                          setProfileForm({ ...profileForm, education: next });
                        }}
                        placeholder="2024"
                        className="w-full px-3 py-2 rounded-lg border border-[#e8e3f0] bg-white"
                      />
                    </div>
                    <div className="md:col-span-2 lg:col-span-4">
                      <label className="block text-xs text-[#6b5d7a] mb-1">Descricao</label>
                      <input
                        type="text"
                        value={item.description ?? ''}
                        onChange={(e) => {
                          const next = [...educationList];
                          next[index] = { ...next[index], description: e.target.value };
                          setProfileForm({ ...profileForm, education: next });
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-[#e8e3f0] bg-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const next = educationList.filter((_, idx) => idx !== index);
                        setProfileForm({ ...profileForm, education: next });
                      }}
                    >
                      Remover
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </Card>
    </div>
  );

  const renderProjects = () => (
    <div className="w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1534] mb-2">{t('projects.title')}</h1>
          <p className="text-[#6b5d7a]">Gerencie seus projetos e trabalhos realizados.</p>
          {planLimits.maxProjects !== null ? (
            <p className="text-xs text-[#a21d4c] mt-1">
              {t('plan.usage.projects', { used: projects.length, limit: planLimits.maxProjects })}
            </p>
          ) : null}
        </div>
        <Button variant="primary" onClick={openNewProject}>
          <Plus className="w-5 h-5 mr-2" />
          Adicionar Projeto
        </Button>
      </div>

      {showAddProject && (
        <Card className="mb-6 border-2 border-[#a21d4c]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 className="text-xl font-bold text-[#1a1534]">
              {editingProjectId ? 'Editar Projeto' : 'Novo Projeto'}
            </h2>
            <button onClick={() => setShowAddProject(false)}>
              <X className="w-5 h-5 text-[#6b5d7a] hover:text-[#1a1534]" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#6b5d7a] mb-2">Título do Projeto</label>
              <input
                type="text"
                placeholder="Ex: Website Corporativo"
                value={projectForm.title}
                onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c]"
              />
            </div>

            <div>
              <label className="block text-sm text-[#6b5d7a] mb-2">Categoria</label>
              <select
                value={projectForm.category}
                onChange={(e) => setProjectForm({ ...projectForm, category: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c]"
              >
                <option>Design</option>
                <option>Desenvolvimento</option>
                <option>Marketing</option>
                <option>Fotografia</option>
                <option>Vídeo</option>
                <option>Música</option>
                <option>Outro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-[#6b5d7a] mb-2">Tipo do Projeto</label>
              <select
                value={projectForm.type}
                onChange={(e) => setProjectForm({ ...projectForm, type: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c]"
              >
                <option value="standard">Projeto Padrão</option>
                <option value="media">Vídeo (YouTube/Instagram)</option>
                <option value="github">Repositório GitHub</option>
                <option value="professional">Projeto Profissional</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-[#6b5d7a] mb-2">Descrição</label>
              <textarea
                rows={4}
                placeholder="Descreva o projeto, seus objetivos e resultados..."
                value={projectForm.description}
                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c]"
              />
            </div>

            <div>
              <label className="block text-sm text-[#6b5d7a] mb-2">Tags (separadas por virgula)</label>
              <input
                type="text"
                placeholder="Ex: React, UX, Mobile"
                value={projectForm.tags}
                onChange={(e) => setProjectForm({ ...projectForm, tags: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c]"
              />
            </div>

            {projectForm.type === 'media' && (
              <div>
                <label className="block text-sm text-[#6b5d7a] mb-2">Link do Vídeo (YouTube ou Instagram)</label>
                <input
                  type="url"
                  placeholder="https://youtube.com/... ou https://instagram.com/reel/..."
                  value={projectForm.mediaUrl}
                  onChange={(e) => {
                    const next = e.target.value;
                    setProjectForm({
                      ...projectForm,
                      mediaUrl: next,
                      type: next.trim() ? 'media' : projectForm.type,
                    });
                  }}
                  className="w-full px-4 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c]"
                />
                {resolveMediaUrl(projectForm.mediaUrl) && (
                  <div className="mt-4 aspect-video overflow-hidden rounded-lg border border-[#e8e3f0] bg-[#0f0b1f]">
                    <iframe
                      src={resolveMediaUrl(projectForm.mediaUrl) ?? ''}
                      title="Preview do video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    ></iframe>
                  </div>
                )}
              </div>
            )}

            {projectForm.type === 'github' && (
              <div>
                <label className="block text-sm text-[#6b5d7a] mb-2">URL do Repositório GitHub</label>
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <input
                    type="url"
                    placeholder="https://github.com/usuario/repositorio"
                    value={projectForm.repoUrl}
                    onChange={(e) => setProjectForm({ ...projectForm, repoUrl: e.target.value })}
                    className="w-full flex-1 px-4 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c]"
                  />
                  <Button
                    variant="outline"
                    type="button"
                    onClick={handleProjectRepoImport}
                    disabled={projectRepoLoading}
                  >
                    {projectRepoLoading ? 'Importando...' : 'Importar Dados'}
                  </Button>
                </div>
              </div>
            )}

            {projectForm.type === 'professional' && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#6b5d7a] mb-2">Empresa</label>
                  <input
                    type="text"
                    placeholder="Nome da empresa"
                    value={projectForm.company}
                    onChange={(e) => setProjectForm({ ...projectForm, company: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#6b5d7a] mb-2">Resultados</label>
                  <input
                    type="text"
                    placeholder="Impacto ou resultados"
                    value={projectForm.results}
                    onChange={(e) => setProjectForm({ ...projectForm, results: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm text-[#6b5d7a] mb-2">Imagens</label>
              <label className="border-2 border-dashed border-[#e8e3f0] rounded-lg p-8 text-center hover:border-[#a21d4c] transition-colors cursor-pointer block">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleProjectImage(e.target.files?.[0] ?? null)}
                />
                <Upload className="w-8 h-8 text-[#6b5d7a] mx-auto mb-2" />
                <p className="text-sm text-[#6b5d7a]">
                  {projectImageUploading
                    ? 'Enviando imagem...'
                    : projectForm.imageUrl
                    ? 'Imagem selecionada'
                    : 'Clique para fazer upload ou arraste imagens'}
                </p>
              </label>
              {projectForm.imageUrl && (
                <img
                  src={projectForm.imageUrl}
                  alt="Preview"
                  className="mt-3 w-full max-h-48 rounded-lg object-cover border border-[#e8e3f0]"
                />
              )}
            </div>

            <div>
              <label className="block text-sm text-[#6b5d7a] mb-2">Anexo PDF (opcional)</label>
              <label className="border-2 border-dashed border-[#e8e3f0] rounded-lg p-6 text-center hover:border-[#a21d4c] transition-colors cursor-pointer block">
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => handleProjectPdf(e.target.files?.[0] ?? null)}
                />
                <p className="text-sm text-[#6b5d7a]">
                  {projectPdfUploading
                    ? 'Enviando PDF...'
                    : projectForm.pdfUrl
                    ? 'PDF anexado'
                    : 'Clique para anexar PDF'}
                </p>
              </label>
            </div>

            <div>
              <label className="block text-sm text-[#6b5d7a] mb-2">Link Externo (opcional)</label>
              <input
                type="url"
                placeholder="https://projeto.com"
                value={projectForm.link}
                onChange={(e) => {
                  const next = e.target.value;
                  const mediaEmbed = resolveMediaUrl(next);
                  setProjectForm({
                    ...projectForm,
                    link: next,
                    mediaUrl: mediaEmbed ? next : projectForm.mediaUrl,
                    type: mediaEmbed ? 'media' : projectForm.type,
                  });
                }}
                className="w-full px-4 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c]"
              />
            </div>

            {/* Project Translations Section */}
            <div className="border-t border-[#e8e3f0] pt-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                  <label className="block text-sm font-medium text-[#1a1534] mb-1">
                    Traduções (Inglês/Espanhol)
                  </label>
                  <p className="text-xs text-[#6b5d7a]">
                    Traduza o título, descrição e categoria para outros idiomas
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEnableProjectTranslations(!enableProjectTranslations)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    enableProjectTranslations ? 'bg-[#a21d4c]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      enableProjectTranslations ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {enableProjectTranslations && (
                <div className="space-y-4">
                  {/* English Translation */}
                  <div className="bg-[#f5f3f7] p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-[#1a1534] mb-3 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      English
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-[#6b5d7a] mb-1">Title (English)</label>
                        <input
                          type="text"
                          value={projectTranslations.en.title}
                          onChange={(e) => setProjectTranslations({
                            ...projectTranslations,
                            en: { ...projectTranslations.en, title: e.target.value }
                          })}
                          placeholder="e.g., Website Redesign"
                          className="w-full px-3 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#6b5d7a] mb-1">Description (English)</label>
                        <textarea
                          rows={3}
                          value={projectTranslations.en.description}
                          onChange={(e) => setProjectTranslations({
                            ...projectTranslations,
                            en: { ...projectTranslations.en, description: e.target.value }
                          })}
                          placeholder="Describe the project in English..."
                          className="w-full px-3 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#6b5d7a] mb-1">Category (English)</label>
                        <input
                          type="text"
                          value={projectTranslations.en.category}
                          onChange={(e) => setProjectTranslations({
                            ...projectTranslations,
                            en: { ...projectTranslations.en, category: e.target.value }
                          })}
                          placeholder="e.g., Design"
                          className="w-full px-3 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c] text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Spanish Translation */}
                  <div className="bg-[#f5f3f7] p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-[#1a1534] mb-3 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Español
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-[#6b5d7a] mb-1">Título (Español)</label>
                        <input
                          type="text"
                          value={projectTranslations.es.title}
                          onChange={(e) => setProjectTranslations({
                            ...projectTranslations,
                            es: { ...projectTranslations.es, title: e.target.value }
                          })}
                          placeholder="ej., Rediseño del Sitio Web"
                          className="w-full px-3 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#6b5d7a] mb-1">Descripción (Español)</label>
                        <textarea
                          rows={3}
                          value={projectTranslations.es.description}
                          onChange={(e) => setProjectTranslations({
                            ...projectTranslations,
                            es: { ...projectTranslations.es, description: e.target.value }
                          })}
                          placeholder="Describe el proyecto en español..."
                          className="w-full px-3 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#6b5d7a] mb-1">Categoría (Español)</label>
                        <input
                          type="text"
                          value={projectTranslations.es.category}
                          onChange={(e) => setProjectTranslations({
                            ...projectTranslations,
                            es: { ...projectTranslations.es, category: e.target.value }
                          })}
                          placeholder="ej., Diseño"
                          className="w-full px-3 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c] text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {projectError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {projectError}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end mt-6 pt-6 border-t border-[#e8e3f0]">
            <Button
              variant="ghost"
              onClick={() => {
                setShowAddProject(false);
                setEditingProjectId(null);
                resetProjectForm();
              }}
            >
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleProjectSave}>
              {editingProjectId ? 'Salvar Projeto' : 'Criar Projeto'}
            </Button>
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {projects.map((project) => (
          <Card key={project.id} hover>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {project.category && (
                    <span className="px-3 py-1 rounded-full text-xs bg-gradient-to-r from-[#a21d4c]/10 to-[#c92563]/10 text-[#a21d4c]">
                      {project.category}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-[#1a1534] mb-2">{project.title}</h3>
                <p className="text-sm text-[#6b5d7a] mb-4">{project.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditProject(project)}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
              {project.link && (
                <Button variant="ghost" size="sm">
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => handleProjectDelete(project.id)}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderExperiences = () => (
    <div className="w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1534] mb-2">{t('experiences.title')}</h1>
          <p className="text-[#6b5d7a]">Adicione suas experiências de trabalho e formação.</p>
        </div>
        <Button variant="primary" onClick={openNewExperience}>
          <Plus className="w-5 h-5 mr-2" />
          Adicionar Experiência
        </Button>
      </div>

      {showAddExperience && (
        <Card className="mb-6 border-2 border-[#a21d4c]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 className="text-xl font-bold text-[#1a1534]">
              {editingExperienceId ? 'Editar Experiência' : 'Nova Experiência'}
            </h2>
            <button onClick={() => setShowAddExperience(false)}>
              <X className="w-5 h-5 text-[#6b5d7a] hover:text-[#1a1534]" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#6b5d7a] mb-2">Empresa</label>
                <input
                  type="text"
                  placeholder="Nome da empresa"
                  value={experienceForm.company}
                  onChange={(e) => setExperienceForm({ ...experienceForm, company: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c]"
                />
              </div>
              <div>
                <label className="block text-sm text-[#6b5d7a] mb-2">Cargo</label>
                <input
                  type="text"
                  placeholder="Seu cargo"
                  value={experienceForm.title}
                  onChange={(e) => setExperienceForm({ ...experienceForm, title: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c]"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#6b5d7a] mb-2">Data de Início</label>
                <input
                  type="month"
                  value={experienceForm.start}
                  onChange={(e) => setExperienceForm({ ...experienceForm, start: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c]"
                />
              </div>
              <div>
                <label className="block text-sm text-[#6b5d7a] mb-2">Data de Término</label>
                <input
                  type="month"
                  value={experienceForm.end}
                  onChange={(e) => setExperienceForm({ ...experienceForm, end: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c]"
                />
                <label className="flex items-center gap-2 mt-2 text-sm text-[#6b5d7a]">
                  <input
                    type="checkbox"
                    checked={experienceForm.current}
                    onChange={(e) => setExperienceForm({ ...experienceForm, current: e.target.checked })}
                    className="rounded"
                  />
                  Trabalho aqui atualmente
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#6b5d7a] mb-2">Descrição</label>
              <textarea
                rows={4}
                placeholder="Descreva suas responsabilidades e conquistas..."
                value={experienceForm.description}
                onChange={(e) => setExperienceForm({ ...experienceForm, description: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c]"
              />
            </div>

            <div>
              <label className="block text-sm text-[#6b5d7a] mb-2">Certificado (PDF)</label>
              <label className="border-2 border-dashed border-[#e8e3f0] rounded-lg p-6 text-center hover:border-[#a21d4c] transition-colors cursor-pointer block">
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => handleExperienceCertificate(e.target.files?.[0] ?? null)}
                />
                <p className="text-sm text-[#6b5d7a]">
                  {experienceCertUploading
                    ? 'Enviando certificado...'
                    : experienceForm.certificateUrl
                    ? 'Certificado anexado'
                    : 'Clique para anexar certificado'}
                </p>
              </label>
            </div>

            <label className="flex items-center gap-3 text-sm text-[#6b5d7a]">
              <input
                type="checkbox"
                checked={experienceForm.showCertificate}
                onChange={(e) => setExperienceForm({ ...experienceForm, showCertificate: e.target.checked })}
                className="w-4 h-4 text-[#a21d4c] bg-white border-gray-300 rounded focus:ring-[#a21d4c]"
              />
              Mostrar certificado no portfólio público
            </label>

            {/* Experience Translations Section */}
            <div className="border-t border-[#e8e3f0] pt-4 mt-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                  <label className="block text-sm font-medium text-[#1a1534] mb-1">
                    Traduções (Inglês/Espanhol)
                  </label>
                  <p className="text-xs text-[#6b5d7a]">
                    Traduza o título, empresa e descrição para outros idiomas
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEnableExperienceTranslations(!enableExperienceTranslations)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    enableExperienceTranslations ? 'bg-[#a21d4c]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      enableExperienceTranslations ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {enableExperienceTranslations && (
                <div className="space-y-4">
                  {/* English Translation */}
                  <div className="bg-[#f5f3f7] p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-[#1a1534] mb-3 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      English
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-[#6b5d7a] mb-1">Title (English)</label>
                        <input
                          type="text"
                          value={experienceTranslations.en.title}
                          onChange={(e) => setExperienceTranslations({
                            ...experienceTranslations,
                            en: { ...experienceTranslations.en, title: e.target.value }
                          })}
                          placeholder="e.g., Senior Developer"
                          className="w-full px-3 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#6b5d7a] mb-1">Company (English)</label>
                        <input
                          type="text"
                          value={experienceTranslations.en.company}
                          onChange={(e) => setExperienceTranslations({
                            ...experienceTranslations,
                            en: { ...experienceTranslations.en, company: e.target.value }
                          })}
                          placeholder="e.g., Tech Company Inc."
                          className="w-full px-3 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#6b5d7a] mb-1">Description (English)</label>
                        <textarea
                          rows={3}
                          value={experienceTranslations.en.description}
                          onChange={(e) => setExperienceTranslations({
                            ...experienceTranslations,
                            en: { ...experienceTranslations.en, description: e.target.value }
                          })}
                          placeholder="Describe your responsibilities in English..."
                          className="w-full px-3 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c] text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Spanish Translation */}
                  <div className="bg-[#f5f3f7] p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-[#1a1534] mb-3 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Español
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-[#6b5d7a] mb-1">Título (Español)</label>
                        <input
                          type="text"
                          value={experienceTranslations.es.title}
                          onChange={(e) => setExperienceTranslations({
                            ...experienceTranslations,
                            es: { ...experienceTranslations.es, title: e.target.value }
                          })}
                          placeholder="ej., Desarrollador Senior"
                          className="w-full px-3 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#6b5d7a] mb-1">Empresa (Español)</label>
                        <input
                          type="text"
                          value={experienceTranslations.es.company}
                          onChange={(e) => setExperienceTranslations({
                            ...experienceTranslations,
                            es: { ...experienceTranslations.es, company: e.target.value }
                          })}
                          placeholder="ej., Empresa Tecnológica S.A."
                          className="w-full px-3 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#6b5d7a] mb-1">Descripción (Español)</label>
                        <textarea
                          rows={3}
                          value={experienceTranslations.es.description}
                          onChange={(e) => setExperienceTranslations({
                            ...experienceTranslations,
                            es: { ...experienceTranslations.es, description: e.target.value }
                          })}
                          placeholder="Describe tus responsabilidades en español..."
                          className="w-full px-3 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c] text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {experienceError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {experienceError}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end mt-6 pt-6 border-t border-[#e8e3f0]">
            <Button
              variant="ghost"
              onClick={() => {
                setShowAddExperience(false);
                setEditingExperienceId(null);
                resetExperienceForm();
              }}
            >
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleExperienceSave}>
              {editingExperienceId ? 'Salvar Experiência' : 'Adicionar Experiência'}
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {experiences.map((exp) => (
          <Card
            key={exp.id}
            hover
            className="cursor-grab active:cursor-grabbing"
            draggable
            onDragStart={() => setDraggedExperienceId(exp.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleExperienceDrop(exp.id)}
          >
            <div className="flex items-start gap-6">
              <div className="flex items-center gap-3">
                <GripVertical className="w-4 h-4 text-[#9b8da8]" />
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-[#2d2550] to-[#a21d4c] flex-shrink-0"></div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-[#1a1534]">{exp.title}</h3>
                    <p className="text-[#6b5d7a]">{exp.company}</p>
                  </div>
                  {exp.current && (
                    <span className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-700">
                      Atual
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-[#6b5d7a] mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {exp.period}
                </p>
                
                <p className="text-sm text-[#6b5d7a] mb-4">{exp.description}</p>

                {exp.certificateUrl && (
                  <a
                    href={exp.certificateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#a21d4c] hover:text-[#c92563]"
                  >
                    Ver certificado
                  </a>
                )}

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditExperience(exp)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleExperienceDelete(exp.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderArticles = () => (
    <div className="w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1534] mb-2">{t('articles.title')}</h1>
          <p className="text-[#6b5d7a]">{t('articles.subtitle')}</p>
        </div>
        <Button variant="primary" onClick={openNewArticle}>
          <Plus className="w-5 h-5 mr-2" />
          {t('articles.add')}
        </Button>
      </div>

      {showAddArticle && (
        <Card className="mb-6 border-2 border-[#a21d4c]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 className="text-xl font-bold text-[#1a1534]">
              {editingArticleId ? t('articles.edit') : t('articles.new')}
            </h2>
            <button
              type="button"
              onClick={() => {
                setShowAddArticle(false);
                setEditingArticleId(null);
                resetArticleForm();
              }}
            >
              <X className="w-5 h-5 text-[#6b5d7a] hover:text-[#1a1534]" />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-sm text-[#6b5d7a] mb-2">{t('articles.form.title')}</label>
              <input
                type="text"
                value={articleForm.title}
                onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                placeholder={t('articles.form.titlePlaceholder')}
                className="w-full px-4 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c]"
              />
            </div>

            <div>
              <label className="block text-sm text-[#6b5d7a] mb-2">{t('articles.form.publication')}</label>
              <input
                type="text"
                value={articleForm.publication}
                onChange={(e) => setArticleForm({ ...articleForm, publication: e.target.value })}
                placeholder={t('articles.form.publicationPlaceholder')}
                className="w-full px-4 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c]"
              />
            </div>

            <div>
              <label className="block text-sm text-[#6b5d7a] mb-2">{t('articles.form.publicationDate')}</label>
              <input
                type="text"
                value={articleForm.publicationDate}
                onChange={(e) => setArticleForm({ ...articleForm, publicationDate: e.target.value })}
                placeholder="2024"
                className="w-full px-4 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-[#6b5d7a] mb-2">{t('articles.form.summary')}</label>
              <textarea
                rows={4}
                value={articleForm.summary}
                onChange={(e) => setArticleForm({ ...articleForm, summary: e.target.value })}
                placeholder={t('articles.form.summaryPlaceholder')}
                className="w-full px-4 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c]"
              />
            </div>

            <div className="md:col-span-2 border-t border-[#e8e3f0] pt-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                  <label className="block text-sm font-medium text-[#1a1534] mb-1">
                    {t('articles.translations.heading')}
                  </label>
                  <p className="text-xs text-[#6b5d7a]">
                    {t('articles.translations.description')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEnableArticleTranslations(!enableArticleTranslations)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    enableArticleTranslations ? 'bg-[#a21d4c]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      enableArticleTranslations ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {enableArticleTranslations && (
                <div className="space-y-4">
                  <div className="bg-[#f5f3f7] p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-[#1a1534] mb-3 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      English
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-[#6b5d7a] mb-1">{t('articles.translations.fields.titleEn')}</label>
                        <input
                          type="text"
                          value={articleTranslations.en?.title ?? ''}
                          onChange={(e) => setArticleTranslations({
                            ...articleTranslations,
                            en: { ...(articleTranslations.en ?? {}), title: e.target.value },
                          })}
                          className="w-full px-3 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#6b5d7a] mb-1">{t('articles.translations.fields.summaryEn')}</label>
                        <textarea
                          rows={3}
                          value={articleTranslations.en?.summary ?? ''}
                          onChange={(e) => setArticleTranslations({
                            ...articleTranslations,
                            en: { ...(articleTranslations.en ?? {}), summary: e.target.value },
                          })}
                          className="w-full px-3 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#6b5d7a] mb-1">{t('articles.translations.fields.publicationEn')}</label>
                        <input
                          type="text"
                          value={articleTranslations.en?.publication ?? ''}
                          onChange={(e) => setArticleTranslations({
                            ...articleTranslations,
                            en: { ...(articleTranslations.en ?? {}), publication: e.target.value },
                          })}
                          className="w-full px-3 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c] text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#f5f3f7] p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-[#1a1534] mb-3 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Español
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-[#6b5d7a] mb-1">{t('articles.translations.fields.titleEs')}</label>
                        <input
                          type="text"
                          value={articleTranslations.es?.title ?? ''}
                          onChange={(e) => setArticleTranslations({
                            ...articleTranslations,
                            es: { ...(articleTranslations.es ?? {}), title: e.target.value },
                          })}
                          className="w-full px-3 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#6b5d7a] mb-1">{t('articles.translations.fields.summaryEs')}</label>
                        <textarea
                          rows={3}
                          value={articleTranslations.es?.summary ?? ''}
                          onChange={(e) => setArticleTranslations({
                            ...articleTranslations,
                            es: { ...(articleTranslations.es ?? {}), summary: e.target.value },
                          })}
                          className="w-full px-3 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#6b5d7a] mb-1">{t('articles.translations.fields.publicationEs')}</label>
                        <input
                          type="text"
                          value={articleTranslations.es?.publication ?? ''}
                          onChange={(e) => setArticleTranslations({
                            ...articleTranslations,
                            es: { ...(articleTranslations.es ?? {}), publication: e.target.value },
                          })}
                          className="w-full px-3 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c] text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm text-[#6b5d7a] mb-2">{t('articles.form.authors')}</label>
              <input
                type="text"
                value={articleForm.authors}
                onChange={(e) => setArticleForm({ ...articleForm, authors: e.target.value })}
                placeholder={t('articles.form.authorsPlaceholder')}
                className="w-full px-4 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c]"
              />
            </div>

            <div>
              <label className="block text-sm text-[#6b5d7a] mb-2">{t('articles.form.doi')}</label>
              <input
                type="text"
                value={articleForm.doi}
                onChange={(e) => setArticleForm({ ...articleForm, doi: e.target.value })}
                placeholder="10.xxxx/xxxx"
                className="w-full px-4 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-[#6b5d7a] mb-2">{t('articles.form.link')}</label>
              <input
                type="url"
                value={articleForm.link}
                onChange={(e) => setArticleForm({ ...articleForm, link: e.target.value })}
                placeholder="https://"
                className="w-full px-4 py-2 rounded-lg border border-[#e8e3f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#a21d4c]"
              />
            </div>

            <div className="md:col-span-2 grid sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-sm text-[#1a1534]">
                <input
                  type="checkbox"
                  checked={articleForm.showInPortfolio}
                  onChange={(e) => setArticleForm({ ...articleForm, showInPortfolio: e.target.checked })}
                  className="h-4 w-4 rounded border-[#e8e3f0] text-[#a21d4c] focus:ring-[#a21d4c]"
                />
                {t('articles.form.showPortfolio')}
              </label>
              <label className="flex items-center gap-2 text-sm text-[#1a1534]">
                <input
                  type="checkbox"
                  checked={articleForm.showInCv}
                  onChange={(e) => setArticleForm({ ...articleForm, showInCv: e.target.checked })}
                  className="h-4 w-4 rounded border-[#e8e3f0] text-[#a21d4c] focus:ring-[#a21d4c]"
                />
                {t('articles.form.showCv')}
              </label>
            </div>
          </div>

          {articleError ? (
            <p className="mt-4 text-sm text-[#a21d4c]">{articleError}</p>
          ) : null}

          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="ghost"
              onClick={() => {
                setShowAddArticle(false);
                setEditingArticleId(null);
                resetArticleForm();
              }}
            >
              {t('articles.actions.cancel')}
            </Button>
            <Button variant="primary" onClick={handleArticleSave}>
              {t('articles.actions.save')}
            </Button>
          </div>
        </Card>
      )}

      {!showAddArticle && articleError ? (
        <p className="mb-4 text-sm text-[#a21d4c]">{articleError}</p>
      ) : null}

      {articles.length === 0 ? (
        <Card>
          <div className="py-10 text-center">
            <BookOpen className="w-10 h-10 mx-auto text-[#c92563] mb-3" />
            <p className="text-[#6b5d7a]">{t('articles.empty')}</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {articles.map((article) => (
            <Card key={article.id} className="p-6 space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-5 h-5 text-[#c92563]" />
                    <h3 className="text-lg font-semibold text-[#1a1534] break-words">{article.title}</h3>
                  </div>
                  <div className="text-sm text-[#6b5d7a] space-y-1">
                    {article.publication ? (
                      <p>
                        <span className="font-medium text-[#1a1534]">{t('articles.labels.publication')}:</span>{' '}
                        {article.publication}
                        {article.publicationDate ? ` • ${article.publicationDate}` : ''}
                      </p>
                    ) : null}
                    {article.doi ? (
                      <p>
                        <span className="font-medium text-[#1a1534]">DOI:</span> {article.doi}
                      </p>
                    ) : null}
                    {article.authors && article.authors.length > 0 ? (
                      <p>
                        <span className="font-medium text-[#1a1534]">{t('articles.labels.authors')}:</span>{' '}
                        {article.authors.join(', ')}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => openEditArticle(article)}>
                    <Edit className="w-4 h-4 mr-1" />
                    {t('articles.actions.edit')}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleArticleDelete(article.id)}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    {t('articles.actions.delete')}
                  </Button>
                </div>
              </div>

            {article.summary ? (
                <p className="text-sm text-[#4d415a] leading-relaxed">{article.summary}</p>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant={article.showInPortfolio === false ? 'outline' : 'secondary'}
                  size="sm"
                  onClick={() => handleArticleVisibilityChange(article, 'showInPortfolio', !(article.showInPortfolio ?? true))}
                >
                  {article.showInPortfolio === false
                    ? t('articles.visibility.addPortfolio')
                    : t('articles.visibility.removePortfolio')}
                </Button>
                <Button
                  variant={article.showInCv === false ? 'outline' : 'secondary'}
                  size="sm"
                  onClick={() => handleArticleVisibilityChange(article, 'showInCv', !(article.showInCv ?? true))}
                >
                  {article.showInCv === false
                    ? t('articles.visibility.addCv')
                    : t('articles.visibility.removeCv')}
                </Button>
                {article.link ? (
                  <a
                    href={article.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-[#c92563] hover:text-[#a21d4c]"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {t('articles.links.view')}
                  </a>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderLanguage = () => (
    <div className="w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1a1534] mb-2">{t('language.title')}</h1>
        <p className="text-[#6b5d7a]">Defina o idioma padrao da plataforma.</p>
      </div>

      <Card className="max-w-md">
        <div className="space-y-3">
          {["pt", "en", "es"].map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => handleLocaleSelect(code as Locale)}
              disabled={localeSaving}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                locale === code
                  ? 'border-[#a21d4c] bg-[#a21d4c]/5'
                  : 'border-[#e8e3f0] hover:border-[#a21d4c]/50'
              }`}
            >
              <span className="text-[#1a1534]">
                {code === 'pt' ? 'Portugues' : code === 'en' ? 'English' : 'Espanol'}
              </span>
              {locale === code && <Check className="w-5 h-5 text-[#a21d4c]" />}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-1">
          {localeSaving && (
            <p className="text-sm text-[#6b5d7a]">Salvando preferencia de idioma...</p>
          )}
          {localeError && (
            <p className="text-sm text-red-600">{localeError}</p>
          )}
        </div>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboard();
      case 'portfolio':
        return renderPortfolio();
      case 'projects':
        return renderProjects();
      case 'articles':
        return renderArticles();
      case 'experiences':
        return renderExperiences();
      case 'cv':
        return (
          <CVCreator
            userId={userId}
            cvs={props.cvs}
            onCvsChange={props.onCvsChange}
            userProfile={userProfile}
            projects={projects}
            experiences={experiences}
            articles={articles}
            planTier={planTier}
          />
        );
      case 'appearance':
        return (
          <Appearance
            userTheme={userTheme}
            onThemeChange={onThemeChange}
            userProfile={userProfile}
            projects={projects}
            experiences={experiences}
            articles={articles}
            featuredVideos={featuredVideos}
            cvs={cvs}
            planTier={planTier}
            planLimits={planLimits}
          />
        );
      case 'language':
        return renderLanguage();
      case 'settings':
        return renderSettings();
      case 'subscription': {
        const cvLanguagesCount = new Set(cvs.map((cv) => cv.language)).size;
        const planUsage = {
          portfolios: 1,
          projects: projects.length,
          featuredVideos: featuredVideos.length,
          cvs: cvs.length,
          cvLanguages: cvLanguagesCount,
        };

        return (
          <Subscription
            userId={userId}
            userProfile={userProfile}
            userEmail={userEmail}
            accountCreatedAt={accountCreatedAt}
            subscription={subscription}
            planTier={planTier}
            planLimits={planLimits}
            counts={planUsage}
          />
        );
      }
      default:
        return renderDashboard();
    }
  };

  return (
    <DashboardLayout 
      activeSection={activeSection} 
      onSectionChange={setActiveSection}
      onLogout={onLogout}
      userProfile={userProfile}
      subscription={subscription}
    >
      {renderContent()}
    </DashboardLayout>
  );
}