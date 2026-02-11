import type { ReactNode } from "react";
import { Mail, Phone, MapPin } from "lucide-react";
import { buildPalette, type CVTemplateProps } from "../types";
import { CV_SECTION_LABELS } from "../labels";

export function MinimalCV({ profile, experiences, projects, articles, locale, theme }: CVTemplateProps) {
  const palette = buildPalette(theme);
  const labels = CV_SECTION_LABELS[locale];
  const safeName = profile.fullName?.trim() || "Nome não informado";
  const headline = profile.title?.trim() || "Profissional multidisciplinar";
  const summary = profile.bio?.trim() || "Atualize seu resumo profissional para destacar competências.";

  const contactItems = [
    profile.email ? { icon: <Mail className="h-4 w-4" />, value: profile.email } : null,
    profile.phone ? { icon: <Phone className="h-4 w-4" />, value: profile.phone } : null,
    profile.location ? { icon: <MapPin className="h-4 w-4" />, value: profile.location } : null,
  ].filter((entry): entry is { icon: ReactNode; value: string } => entry !== null);

  const topExperiences = experiences.slice(0, 4);
  const topProjects = projects.slice(0, 2);
  const topArticles = articles.slice(0, 2);
  const education = profile.education?.slice(0, 2) ?? [];
  const skills = (profile.skills ?? []).slice(0, 8);

  return (
    <div
      className="mx-auto w-full max-w-[210mm] rounded-[28px] border border-slate-200 bg-white p-14 shadow-[0_20px_80px_-30px_rgba(21,24,33,0.35)]"
      style={{ fontFamily: theme?.fontFamily ?? "Inter, system-ui, sans-serif" }}
    >
      <header className="flex flex-col gap-6 border-b border-slate-200 pb-8">
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.4em] text-slate-400">Curriculum Vitae</span>
          <h1 className="text-4xl font-semibold text-slate-900">{safeName}</h1>
          <p className="text-lg text-slate-500">{headline}</p>
        </div>
        {contactItems.length > 0 ? (
          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
            {contactItems.map((item, index) => (
              <div key={`${item.value}-${index}`} className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-1.5">
                <span className="text-slate-400">{item.icon}</span>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        ) : null}
      </header>

      <main className="mt-10 grid gap-12">
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">{labels.summary}</h2>
          <p className="text-sm leading-relaxed text-slate-600">{summary}</p>
        </section>

        {skills.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">{labels.skills}</h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-600"
                  style={{ backgroundColor: `${palette.primary}18`, color: palette.primary }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {topExperiences.length > 0 ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">{labels.experience}</h2>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
            <div className="space-y-6">
              {topExperiences.map((experience) => (
                <article key={experience.id} className="space-y-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <h3 className="text-base font-semibold text-slate-800">{experience.title}</h3>
                    <span className="text-xs uppercase tracking-[0.25em] text-slate-400">{experience.period}</span>
                  </div>
                  {experience.company ? <p className="text-sm font-medium text-slate-500">{experience.company}</p> : null}
                  <p className="text-sm leading-relaxed text-slate-600">{experience.description}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {education.length > 0 ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">{labels.education}</h2>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
            <ul className="space-y-3">
              {education.map((item, index) => (
                <li key={`${item.institution}-${index}`} className="text-sm text-slate-600">
                  <p className="font-semibold text-slate-700">{item.institution}</p>
                  <p>{item.degree}</p>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                    {[item.startYear, item.endYear].filter(Boolean).join(" – ")}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {topProjects.length > 0 ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">{labels.projects}</h2>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {topProjects.map((project) => (
                <article key={project.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 px-5 py-4">
                  <h3 className="text-base font-semibold text-slate-800">{project.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{project.description}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {topArticles.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">{labels.articles}</h2>
            <div className="space-y-2">
              {topArticles.map((article) => (
                <article key={article.id} className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                  <p className="font-semibold text-slate-700">{article.title}</p>
                  {article.publication ? (
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{article.publication}</p>
                  ) : null}
                  {article.summary ? <p className="mt-2 text-xs text-slate-500">{article.summary}</p> : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {contactItems.length > 0 ? (
          <section className="flex flex-wrap gap-4 border-t border-slate-200 pt-6 text-xs uppercase tracking-[0.35em] text-slate-400">
            {contactItems.map((item, index) => (
              <div key={`${item.value}-footer-${index}`} className="flex items-center gap-2">
                <span className="text-slate-400">{item.icon}</span>
                <span>{item.value}</span>
              </div>
            ))}
          </section>
        ) : null}
      </main>
    </div>
  );
}
