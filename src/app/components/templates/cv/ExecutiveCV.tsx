import type { ReactNode } from "react";
import { Mail, Phone, MapPin } from "lucide-react";
import { buildPalette, type CVTemplateProps } from "../types";
import { CV_SECTION_LABELS } from "../labels";

export function ExecutiveCV({ profile, experiences, projects, articles, locale, theme }: CVTemplateProps) {
  const palette = buildPalette(theme);
  const labels = CV_SECTION_LABELS[locale];
  const safeName = profile.fullName?.trim() || "Nome não informado";
  const headline = profile.title?.trim() || "Executivo(a) de alto impacto";
  const summary = profile.bio?.trim() || "Atualize seu resumo executivo com resultados quantitativos e cases relevantes.";

  const contactItems = [
    profile.email ? { icon: <Mail className="h-4 w-4" />, value: profile.email } : null,
    profile.phone ? { icon: <Phone className="h-4 w-4" />, value: profile.phone } : null,
    profile.location ? { icon: <MapPin className="h-4 w-4" />, value: profile.location } : null,
  ].filter((entry): entry is { icon: ReactNode; value: string } => entry !== null);

  const topExperiences = experiences.slice(0, 4);
  const topProjects = projects.slice(0, 2);
  const topArticles = articles.slice(0, 2);
  const education = profile.education?.slice(0, 3) ?? [];
  const skills = (profile.skills ?? []).slice(0, 8);

  return (
    <div
      className="mx-auto w-full max-w-[210mm] overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_35px_90px_-40px_rgba(15,23,42,0.55)]"
      style={{ fontFamily: theme?.fontFamily ?? "Inter, system-ui, sans-serif" }}
    >
      <div className="grid grid-cols-[280px_1fr]">
        <aside
          className="flex h-full flex-col justify-between bg-slate-900 px-10 py-12 text-white/90"
          style={{ background: `linear-gradient(140deg, ${palette.secondary}, ${palette.primary})` }}
        >
          <div className="space-y-8">
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-[0.4em] text-white/50">Curriculum</span>
              <h1 className="text-3xl font-semibold leading-tight">{safeName}</h1>
              <p className="text-sm text-white/70">{headline}</p>
            </div>

            <div className="space-y-3 text-sm text-white/80">
              <h2 className="text-xs font-semibold uppercase tracking-[0.4em] text-white/50">{labels.contact}</h2>
              {contactItems.map((item, index) => (
                <div key={`${item.value}-${index}`} className="flex items-center gap-3">
                  <span>{item.icon}</span>
                  <span>{item.value}</span>
                </div>
              ))}
            </div>

            {skills.length > 0 ? (
              <div className="space-y-3 text-sm text-white/80">
                <h2 className="text-xs font-semibold uppercase tracking-[0.4em] text-white/50">{labels.skills}</h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span key={skill} className="rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {education.length > 0 ? (
              <div className="space-y-3 text-sm text-white/80">
                <h2 className="text-xs font-semibold uppercase tracking-[0.4em] text-white/50">{labels.education}</h2>
                <div className="space-y-2">
                  {education.map((item, index) => (
                    <div key={`${item.institution}-${index}`}>
                      <p className="font-semibold text-white/90">{item.institution}</p>
                      <p>{item.degree}</p>
                      <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                        {[item.startYear, item.endYear].filter(Boolean).join(" – ")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {topArticles.length > 0 ? (
            <div className="space-y-3 text-xs text-white/70">
              <h2 className="text-xs font-semibold uppercase tracking-[0.4em] text-white/50">{labels.articles}</h2>
              <div className="space-y-2">
                {topArticles.map((article) => (
                  <div key={article.id}>
                    <p className="font-semibold text-white/80">{article.title}</p>
                    {article.publication ? <p className="uppercase tracking-[0.3em] text-white/40">{article.publication}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </aside>

        <main className="space-y-10 px-12 py-12">
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">{labels.summary}</h2>
            <p className="text-sm leading-relaxed text-slate-600">{summary}</p>
          </section>

          {topExperiences.length > 0 ? (
            <section className="space-y-6">
              <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">{labels.experience}</h2>
              <div className="space-y-6">
                {topExperiences.map((experience) => (
                  <article key={experience.id} className="rounded-2xl border border-slate-200 px-6 py-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <h3 className="text-base font-semibold text-slate-800">{experience.title}</h3>
                      <span className="text-xs uppercase tracking-[0.25em] text-slate-400">{experience.period}</span>
                    </div>
                    {experience.company ? (
                      <p className="text-sm font-medium text-slate-500">{experience.company}</p>
                    ) : null}
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{experience.description}</p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {topProjects.length > 0 ? (
            <section className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">{labels.projects}</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {topProjects.map((project) => (
                  <article key={project.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                    <h3 className="text-base font-semibold text-slate-800">{project.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{project.description}</p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}
