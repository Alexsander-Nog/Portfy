import type { ReactNode } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { buildPalette, type CVTemplateProps } from "../types";
import { CV_SECTION_LABELS } from "../labels";

const truncate = (value: string, limit: number): string => {
  if (value.length <= limit) {
    return value;
  }
  return `${value.slice(0, limit)}…`;
};

export function ModernCV({ profile, experiences, projects, articles, locale, theme }: CVTemplateProps) {
  const palette = buildPalette(theme);
  const labels = CV_SECTION_LABELS[locale];
  const safeName = profile.fullName?.trim() || "Nome não informado";
  const headline = profile.title?.trim() || "Profissional multidisciplinar";
  const summary = profile.bio?.trim() || "Atualize seu resumo profissional para destacar conquistas e objetivos.";

  const topExperiences = experiences.slice(0, 3);
  const topProjects = projects.slice(0, 3);
  const topArticles = articles.slice(0, 2);
  const skillList = (profile.skills ?? []).slice(0, 10);

  const contactItems = [
    profile.email ? { icon: <Mail className="h-4 w-4" />, value: profile.email } : null,
    profile.phone ? { icon: <Phone className="h-4 w-4" />, value: profile.phone } : null,
    profile.location ? { icon: <MapPin className="h-4 w-4" />, value: profile.location } : null,
  ].filter((entry): entry is { icon: ReactNode; value: string } => entry !== null);

  return (
    <div
      className="mx-auto w-full max-w-[210mm] overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_25px_60px_-20px_rgba(42,16,79,0.35)]"
      style={{ fontFamily: theme?.fontFamily ?? "Inter, system-ui, sans-serif" }}
    >
      <header
        className="px-12 py-10 text-white"
        style={{ background: `linear-gradient(125deg, ${palette.primary}, ${palette.accent})` }}
      >
        <p className="text-sm uppercase tracking-[0.3em] opacity-80">Curriculum Vitae</p>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight">{safeName}</h1>
        <p className="mt-1 text-lg opacity-90">{headline}</p>
        {contactItems.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-4 text-sm opacity-80">
            {contactItems.map((item, index) => (
              <div key={`${item.value}-${index}`} className="flex items-center gap-2 rounded-full border border-white/20 px-4 py-1.5">
                <span className="opacity-80">{item.icon}</span>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        ) : null}
      </header>

      <main className="grid grid-cols-5 gap-0">
        <section className="col-span-3 space-y-10 px-12 py-10">
          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">{labels.summary}</h2>
            <p className="text-sm leading-relaxed text-slate-600">{summary}</p>
          </div>

          {topExperiences.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">{labels.experience}</h2>
              <div className="space-y-5">
                {topExperiences.map((experience) => (
                  <article key={experience.id} className="rounded-2xl border border-slate-200 bg-slate-50/50 px-6 py-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-base font-semibold text-slate-800">{experience.title}</h3>
                      <span className="text-xs font-medium uppercase tracking-[0.25em] text-slate-400">{experience.period}</span>
                    </div>
                    {experience.company ? (
                      <p className="text-sm font-medium text-slate-500">{experience.company}</p>
                    ) : null}
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">
                      {truncate(experience.description ?? "", 320)}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {topProjects.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">{labels.projects}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {topProjects.map((project) => (
                  <article key={project.id} className="rounded-2xl border border-slate-200 px-5 py-4 shadow-inner">
                    <h3 className="text-base font-semibold text-slate-800">{project.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {truncate(project.description, 150)}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <aside className="col-span-2 space-y-10 border-l border-slate-100 bg-slate-50/40 px-10 py-12">
          {skillList.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">{labels.skills}</h2>
              <div className="flex flex-wrap gap-2">
                {skillList.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600"
                    style={{ backgroundColor: `${palette.primary}12`, color: palette.primary }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {topArticles.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">{labels.articles}</h2>
              <div className="space-y-3">
                {topArticles.map((article) => (
                  <article key={article.id} className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-700">{article.title}</h3>
                    {article.publication ? (
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{article.publication}</p>
                    ) : null}
                    {article.summary ? (
                      <p className="mt-2 text-xs leading-relaxed text-slate-500">{truncate(article.summary, 120)}</p>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {profile.education && profile.education.length > 0 ? (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">{labels.education}</h2>
              <ul className="space-y-2">
                {profile.education.slice(0, 3).map((education, index) => (
                  <li key={`${education.institution}-${index}`} className="text-sm text-slate-600">
                    <p className="font-semibold text-slate-700">{education.institution}</p>
                    <p>{education.degree}</p>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                      {[education.startYear, education.endYear].filter(Boolean).join(" – ")}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {contactItems.length > 0 ? (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">{labels.contact}</h2>
              <div className="space-y-2 text-sm text-slate-600">
                {contactItems.map((item, index) => (
                  <div key={`${item.value}-sidebar-${index}`} className="flex items-center gap-3">
                    <span className="text-slate-400">{item.icon}</span>
                    <span>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </main>
    </div>
  );
}
