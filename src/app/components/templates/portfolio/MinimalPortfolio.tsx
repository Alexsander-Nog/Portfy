import type { ReactNode } from "react";
import { ExternalLink, Mail, Phone } from "lucide-react";
import { buildPalette, type PortfolioTemplateProps } from "../types";
import { PORTFOLIO_SECTION_LABELS } from "../labels";

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="space-y-4">
    <h2 className="text-sm font-semibold uppercase tracking-[0.4em] text-slate-400">{title}</h2>
    <div className="space-y-4">{children}</div>
  </section>
);

export function MinimalPortfolio({ profile, projects, experiences, articles, locale, theme }: PortfolioTemplateProps) {
  const palette = buildPalette(theme);
  const labels = PORTFOLIO_SECTION_LABELS[locale];
  const safeName = profile.fullName?.trim() || "Nome não informado";
  const headline = profile.title?.trim() || "Profissional multidisciplinar";
  const summary = profile.bio?.trim() || "Use este espaço para contar sua trajetória e diferenciais.";

  const contactItems = [
    profile.email ? { icon: <Mail className="h-4 w-4" />, value: profile.email } : null,
    profile.phone ? { icon: <Phone className="h-4 w-4" />, value: profile.phone } : null,
  ].filter((entry): entry is { icon: ReactNode; value: string } => entry !== null);

  const topProjects = projects.slice(0, 3);
  const topExperiences = experiences.slice(0, 3);
  const topArticles = articles.slice(0, 2);

  return (
    <div
      className="mx-auto w-full max-w-4xl rounded-[36px] border border-slate-200 bg-white/85 p-14 shadow-[0_35px_120px_-60px_rgba(8,15,30,0.5)] backdrop-blur"
      style={{ fontFamily: theme?.fontFamily ?? "Inter, system-ui, sans-serif" }}
    >
      <header className="space-y-4 border-b border-slate-200 pb-10">
        <span className="rounded-full border border-slate-200 px-4 py-1 text-xs uppercase tracking-[0.4em] text-slate-400">
          {labels.about}
        </span>
        <h1 className="text-4xl font-semibold text-slate-900">{safeName}</h1>
        <p className="text-lg text-slate-500">{headline}</p>
        <p className="text-sm leading-relaxed text-slate-600">{summary}</p>
        {contactItems.length > 0 ? (
          <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.35em] text-slate-400">
            {contactItems.map((item, index) => (
              <div key={`${item.value}-${index}`} className="flex items-center gap-2">
                <span>{item.icon}</span>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        ) : null}
      </header>

      <main className="mt-12 space-y-12">
        {topExperiences.length > 0 ? (
          <Section title={labels.experience}>
            {topExperiences.map((experience) => (
              <article key={experience.id} className="space-y-2">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h3 className="text-base font-semibold text-slate-900">{experience.title}</h3>
                  <span className="text-xs uppercase tracking-[0.3em] text-slate-400">{experience.period}</span>
                </div>
                {experience.company ? <p className="text-sm font-medium text-slate-500">{experience.company}</p> : null}
                <p className="text-sm leading-relaxed text-slate-600">{experience.description}</p>
              </article>
            ))}
          </Section>
        ) : null}

        {topProjects.length > 0 ? (
          <Section title={labels.projects}>
            {topProjects.map((project) => (
              <article key={project.id} className="flex flex-col gap-2 rounded-3xl border border-slate-200 px-6 py-5">
                <h3 className="text-lg font-semibold text-slate-900">{project.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{project.description}</p>
                {project.link ? (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em]"
                    style={{ color: palette.primary }}
                  >
                    <span>{locale === "pt" ? "Abrir projeto" : locale === "es" ? "Abrir proyecto" : "Open project"}</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : null}
              </article>
            ))}
          </Section>
        ) : null}

        {topArticles.length > 0 ? (
          <Section title={labels.articles}>
            {topArticles.map((article) => (
              <article key={article.id} className="rounded-3xl border border-slate-200 bg-slate-50/70 px-6 py-4">
                <h3 className="text-base font-semibold text-slate-900">{article.title}</h3>
                {article.publication ? (
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{article.publication}</p>
                ) : null}
                {article.summary ? <p className="mt-2 text-sm text-slate-600">{article.summary}</p> : null}
              </article>
            ))}
          </Section>
        ) : null}
      </main>
    </div>
  );
}
