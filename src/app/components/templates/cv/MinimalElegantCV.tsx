import type { ReactNode } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { buildPalette, type CVTemplateProps } from "../types";
import { CV_SECTION_LABELS } from "../labels";

const formatPeriod = (start?: string, end?: string, fallback?: string): string => {
  if (start && end) {
    return `${start} – ${end}`;
  }
  if (start) {
    return start;
  }
  if (end) {
    return end;
  }
  return fallback ?? "";
};

export function MinimalElegantCV({ profile, experiences, projects, articles, locale, theme }: CVTemplateProps) {
  const palette = buildPalette(theme);
  const labels = CV_SECTION_LABELS[locale];
  const safeName = profile.fullName?.trim() || "Nome não informado";
  const headline = profile.title?.trim() || "Especialista multidisciplinar";
  const summary = profile.bio?.trim() || "Preencha este campo para criar uma introdução concisa sobre seu perfil.";
  const showPhoto = profile.photoUrl && profile.showCvPhoto !== false;

  const topExperiences = experiences.slice(0, 4);
  const topProjects = projects.slice(0, 4);
  const topArticles = articles.slice(0, 2);
  const skillList = (profile.skills ?? []).slice(0, 16);

  const contactItems = [
    profile.email ? { icon: <Mail className="h-4 w-4" />, value: profile.email } : null,
    profile.phone ? { icon: <Phone className="h-4 w-4" />, value: profile.phone } : null,
    profile.location ? { icon: <MapPin className="h-4 w-4" />, value: profile.location } : null,
  ].filter((entry): entry is { icon: ReactNode; value: string } => entry !== null);

  return (
    <div
      className="mx-auto w-full max-w-[210mm] overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_18px_32px_rgba(25,21,52,0.12)]"
      style={{ fontFamily: theme?.fontFamily ?? "Inter, system-ui, sans-serif" }}
    >
      <div className="grid gap-6 px-12 pb-12 pt-14 md:grid-cols-[280px_1fr]">
        <aside className="flex flex-col items-center gap-6 text-center md:items-start md:text-left">
          {showPhoto ? (
            <div className="h-36 w-36 overflow-hidden rounded-3xl border-4 border-white shadow-[0_20px_35px_rgba(45,37,80,0.25)]">
              <img src={profile.photoUrl!} alt={safeName} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="flex h-36 w-36 items-center justify-center rounded-3xl bg-gradient-to-br from-[#f1edf8] to-white text-3xl font-bold text-[#2d2550]">
              {safeName
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((chunk) => chunk[0]?.toUpperCase())
                .join("") || "CV"}
            </div>
          )}
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-[#211a3c]">{safeName}</h1>
            <p className="text-lg text-[#6b5d7a]">{headline}</p>
          </div>
          <p className="text-sm leading-relaxed text-[#5a4d6d]">{summary}</p>

          {contactItems.length > 0 ? (
            <div className="w-full rounded-2xl border border-slate-200 bg-[#f9f7fc] p-5 text-left">
              <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-[#8b7dad]">{labels.contact}</h2>
              <div className="mt-3 space-y-2 text-sm text-[#5a4d6d]">
                {contactItems.map((item, index) => (
                  <div key={`${item.value}-${index}`} className="flex items-center gap-3">
                    <span className="text-[#a21d4c]">{item.icon}</span>
                    <span className="break-words">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {skillList.length > 0 ? (
            <div className="w-full rounded-2xl border border-slate-200 bg-white p-5 text-left">
              <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-[#8b7dad]">{labels.skills}</h2>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-[#5a4d6d]">
                {skillList.map((skill) => (
                  <span key={skill} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#6b5d7a]">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </aside>

        <main className="space-y-10">
          {topExperiences.length > 0 ? (
            <section className="space-y-5">
              <header className="border-b border-slate-200 pb-3">
                <h2 className="text-sm font-semibold uppercase tracking-[0.4em] text-[#8b7dad]">{labels.experience}</h2>
              </header>
              <div className="space-y-6">
                {topExperiences.map((experience) => (
                  <article key={experience.id} className="grid gap-2 border-b border-slate-100 pb-4 last:border-b-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="text-lg font-semibold text-[#2d2550]">{experience.title}</h3>
                      <span className="text-xs uppercase tracking-[0.3em] text-[#a498c1]">{experience.period}</span>
                    </div>
                    {experience.company ? (
                      <p className="text-sm font-medium text-[#6b5d7a]">{experience.company}</p>
                    ) : null}
                    {experience.description ? (
                      <p className="text-sm leading-relaxed text-[#5a4d6d]">{experience.description}</p>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {topProjects.length > 0 ? (
            <section className="space-y-5">
              <header className="border-b border-slate-200 pb-3">
                <h2 className="text-sm font-semibold uppercase tracking-[0.4em] text-[#8b7dad]">{labels.projects}</h2>
              </header>
              <div className="space-y-4">
                {topProjects.map((project) => (
                  <article key={project.id} className="rounded-2xl border border-slate-200 bg-[#f9f7fc] p-4">
                    <h3 className="text-base font-semibold text-[#2d2550]">{project.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#5a4d6d]">{project.description}</p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {profile.education && profile.education.length > 0 ? (
            <section className="space-y-5">
              <header className="border-b border-slate-200 pb-3">
                <h2 className="text-sm font-semibold uppercase tracking-[0.4em] text-[#8b7dad]">{labels.education}</h2>
              </header>
              <ul className="space-y-4 text-sm text-[#5a4d6d]">
                {profile.education.slice(0, 4).map((education, index) => (
                  <li key={`${education.institution}-${index}`} className="grid gap-1 md:grid-cols-[auto_1fr] md:items-baseline">
                    <span className="text-xs uppercase tracking-[0.3em] text-[#a498c1]">
                      {formatPeriod(education.startYear, education.endYear, education.period)}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#2d2550]">{education.institution}</p>
                      <p>{education.degree}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {topArticles.length > 0 ? (
            <section className="space-y-4">
              <header className="border-b border-slate-200 pb-3">
                <h2 className="text-sm font-semibold uppercase tracking-[0.4em] text-[#8b7dad]">{labels.articles}</h2>
              </header>
              <div className="grid gap-4 md:grid-cols-2">
                {topArticles.map((article) => (
                  <article key={article.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <h3 className="text-sm font-semibold text-[#2d2550]">{article.title}</h3>
                    {article.publication ? (
                      <p className="text-xs uppercase tracking-[0.35em] text-[#a498c1]">{article.publication}</p>
                    ) : null}
                    {article.summary ? (
                      <p className="mt-2 text-xs leading-relaxed text-[#5a4d6d]">{article.summary}</p>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </main>
      </div>

      <footer className="border-t border-slate-200 bg-[#f9f7fc] px-12 py-5 text-xs uppercase tracking-[0.4em] text-[#8b7dad]">
        {safeName} · {labels.contact}
        {contactItems.length > 0 && ` · ${contactItems.map((item) => item.value).join(" · ")}`}
      </footer>
    </div>
  );
}
