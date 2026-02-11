import type { ReactNode } from "react";
import { Mail, Phone, MapPin, ExternalLink, PlayCircle } from "lucide-react";
import { buildPalette, type PortfolioTemplateProps } from "../types";
import { PORTFOLIO_SECTION_LABELS } from "../labels";

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="space-y-6">
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
    <div className="space-y-4">{children}</div>
  </section>
);

export function ModernPortfolio({ profile, projects, experiences, featuredVideos, articles, locale, theme }: PortfolioTemplateProps) {
  const palette = buildPalette(theme);
  const labels = PORTFOLIO_SECTION_LABELS[locale];
  const safeName = profile.fullName?.trim() || "Nome não informado";
  const headline = profile.title?.trim() || "Profissional multidisciplinar";
  const summary = profile.bio?.trim() || "Atualize sua descrição para apresentar sua proposta de valor.";

  const contactItems = [
    profile.email ? { icon: <Mail className="h-4 w-4" />, value: profile.email } : null,
    profile.phone ? { icon: <Phone className="h-4 w-4" />, value: profile.phone } : null,
    profile.location ? { icon: <MapPin className="h-4 w-4" />, value: profile.location } : null,
  ].filter((entry): entry is { icon: ReactNode; value: string } => entry !== null);

  const topProjects = projects.slice(0, 4);
  const topExperiences = experiences.slice(0, 3);
  const spotlightVideos = featuredVideos.slice(0, 2);
  const topArticles = articles.slice(0, 2);

  return (
    <div
      className="mx-auto w-full max-w-6xl rounded-[40px] border border-slate-200 bg-white shadow-[0_50px_120px_-45px_rgba(15,23,42,0.38)]"
      style={{ fontFamily: theme?.fontFamily ?? "Inter, system-ui, sans-serif" }}
    >
      <header
        className="rounded-t-[40px] px-12 py-16 text-white"
        style={{ background: `radial-gradient(circle at top left, ${palette.accent}, ${palette.primary})` }}
      >
        <div className="max-w-3xl space-y-6">
          <span className="rounded-full bg-white/15 px-4 py-1 text-xs uppercase tracking-[0.4em] text-white/80">{labels.about}</span>
          <h1 className="text-5xl font-semibold leading-tight">{safeName}</h1>
          <p className="text-lg text-white/90">{headline}</p>
          <p className="text-base leading-relaxed text-white/80">{summary}</p>
        </div>
        {contactItems.length > 0 ? (
          <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/85">
            {contactItems.map((item, index) => (
              <div key={`${item.value}-${index}`} className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5">
                <span>{item.icon}</span>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        ) : null}
      </header>

      <main className="space-y-14 px-12 py-14">
        {topExperiences.length > 0 ? (
          <Section title={labels.experience}>
            {topExperiences.map((experience) => (
              <article key={experience.id} className="rounded-3xl border border-slate-200 bg-slate-50/60 px-6 py-5">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-900">{experience.title}</h3>
                  <span className="text-xs uppercase tracking-[0.3em] text-slate-500">{experience.period}</span>
                </div>
                {experience.company ? <p className="text-sm font-medium text-slate-500">{experience.company}</p> : null}
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{experience.description}</p>
              </article>
            ))}
          </Section>
        ) : null}

        {topProjects.length > 0 ? (
          <Section title={labels.projects}>
            <div className="grid gap-5 lg:grid-cols-2">
              {topProjects.map((project) => (
                <article key={project.id} className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-[0_25px_60px_-40px_rgba(15,23,42,0.45)] transition hover:-translate-y-1">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-slate-900">{project.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-600">{project.description}</p>
                    {project.link ? (
                      <a
                        href={project.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 hover:text-slate-600"
                      >
                        <span>{locale === "pt" ? "Ver projeto" : locale === "es" ? "Ver proyecto" : "View project"}</span>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </Section>
        ) : null}

        {spotlightVideos.length > 0 ? (
          <Section title={labels.videos}>
            <div className="grid gap-4 md:grid-cols-2">
              {spotlightVideos.map((video) => (
                <article key={video.id} className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-4">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${palette.primary}15`, color: palette.primary }}
                  >
                    <PlayCircle className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-slate-900">{video.title}</h3>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{video.platform}</p>
                    <p className="text-sm text-slate-500">{video.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </Section>
        ) : null}

        {topArticles.length > 0 ? (
          <Section title={labels.articles}>
            <div className="grid gap-4 md:grid-cols-2">
              {topArticles.map((article) => (
                <article key={article.id} className="rounded-3xl border border-slate-200 bg-slate-50/70 px-5 py-4">
                  <h3 className="text-base font-semibold text-slate-900">{article.title}</h3>
                  {article.publication ? (
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{article.publication}</p>
                  ) : null}
                  {article.summary ? <p className="mt-2 text-sm text-slate-600">{article.summary}</p> : null}
                </article>
              ))}
            </div>
          </Section>
        ) : null}
      </main>
    </div>
  );
}
