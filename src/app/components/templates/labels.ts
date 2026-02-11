import type { Locale } from "../../types";

export const CV_SECTION_LABELS: Record<Locale, {
  summary: string;
  experience: string;
  projects: string;
  articles: string;
  skills: string;
  education: string;
  contact: string;
}> = {
  pt: {
    summary: "Resumo profissional",
    experience: "Experiências",
    projects: "Projetos em destaque",
    articles: "Artigos científicos",
    skills: "Habilidades",
    education: "Formação",
    contact: "Contato",
  },
  en: {
    summary: "Professional summary",
    experience: "Experience",
    projects: "Featured projects",
    articles: "Scientific articles",
    skills: "Skills",
    education: "Education",
    contact: "Contact",
  },
  es: {
    summary: "Resumen profesional",
    experience: "Experiencia",
    projects: "Proyectos destacados",
    articles: "Artículos científicos",
    skills: "Habilidades",
    education: "Formación",
    contact: "Contacto",
  },
};

export const PORTFOLIO_SECTION_LABELS: Record<Locale, {
  about: string;
  experience: string;
  projects: string;
  articles: string;
  videos: string;
  contact: string;
}> = {
  pt: {
    about: "Sobre mim",
    experience: "Experiências",
    projects: "Projetos",
    articles: "Publicações",
    videos: "Destaques",
    contact: "Contato",
  },
  en: {
    about: "About",
    experience: "Experience",
    projects: "Projects",
    articles: "Articles",
    videos: "Highlights",
    contact: "Contact",
  },
  es: {
    about: "Sobre mí",
    experience: "Experiencia",
    projects: "Proyectos",
    articles: "Publicaciones",
    videos: "Destacados",
    contact: "Contacto",
  },
};
