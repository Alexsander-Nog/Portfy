import type { ReactNode } from "react";
import { ExternalLink, Star, Sparkles } from "lucide-react";
import { buildPalette, type PortfolioTemplateProps } from "../types";
import { PORTFOLIO_SECTION_LABELS } from "../labels";

const Badge = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex items-center gap-2 rounded-full bg-white/25 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white">
    {children}
  </span>
);

export function GradientPortfolio({ profile, projects, experiences, articles, locale, theme }: PortfolioTemplateProps) {
  const palette = buildPalette(theme);
  const labels = PORTFOLIO_SECTION_LABELS[locale];
  const safeName = profile.fullName?.trim() || "Nome não informado";
  const headline = profile.title?.trim() || "Criando experiências inesquecíveis";
  const summary = profile.bio?.trim() || "Conte sua história com foco em impacto, inovação e resultados.";

  const highlightProjects = projects.slice(0, 4);
  const highlightExperience = experiences.slice(0, 2);
  const highlightArticles = articles.slice(0, 2);

  return (
    <div
      className="mx-auto w-full max-w-5xl overflow-hidden rounded-[42px] border border-transparent bg-gradient-to-br from-[#f97316] via-[#ec4899] to-[#8b5cf6] p-[1.6px] shadow-[0_45px_120px_-50px_rgba(249,115,22,0.5)]"
      style={{ fontFamily: theme?.fontFamily ?? "Poppins, system-ui, sans-serif" }}
    >
      <div className="rounded-[40px] bg-[#0f172a]/90 text-white">
        <header className="space-y-6 px-14 pt-16 pb-14">
          <Badge>
            <Sparkles className="h-3.5 w-3.5" />
            {labels.about}
          </Badge>
          <h1 className="text-5xl font-semibold leading-tight">{safeName}</h1>
          <p className="text-xl text-white/80">{headline}</p>
          <p className="max-w-3xl text-base leading-relaxed text-white/70">{summary}</p>
        </header>

        <main className="space-y-14 px-14 pb-16">
          {highlightExperience.length > 0 ? (
            <section className="space-y-6">
              <Badge>
                <Star className="h-3.5 w-3.5" />
                {labels.experience}
              </Badge>
              <div className="grid gap-6 md:grid-cols-2">
                {highlightExperience.map((experience) => (
                  <article key={experience.id} className="rounded-[32px] border border-white/10 bg-white/5 px-7 py-6">
                    <h3 className="text-lg font-semibold text-white">{experience.title}</h3>
                    {experience.company ? (
                      <p className="text-sm font-medium text-white/70">{experience.company}</p>
                    ) : null}
                    <p className="text-xs uppercase tracking-[0.3em] text-white/40">{experience.period}</p>
                    <p className="mt-3 text-sm leading-relaxed text-white/70">{experience.description}</p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {highlightProjects.length > 0 ? (
            <section className="space-y-6">
              <Badge>
                <Star className="h-3.5 w-3.5" />
                {labels.projects}
              </Badge>
              <div className="grid gap-6 md:grid-cols-2">
                {highlightProjects.map((project) => (
                  <article key={project.id} className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 px-7 py-6">
                    <div className="space-y-3">
                      <h3 className="text-xl font-semibold text-white">{project.title}</h3>
                      <p className="text-sm leading-relaxed text-white/75">{project.description}</p>
                      {project.link ? (
                        <a
                          href={project.link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white"
                        >
                          <span>{locale === "pt" ? "Ver projeto" : locale === "es" ? "Ver proyecto" : "View project"}</span>
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {highlightArticles.length > 0 ? (
            <section className="space-y-6">
              <Badge>
                <Star className="h-3.5 w-3.5" />
                {labels.articles}
              </Badge>
              <div className="grid gap-5 md:grid-cols-2">
                {highlightArticles.map((article) => (
                  <article key={article.id} className="rounded-[28px] border border-white/10 bg-white/5 px-6 py-5">
                    <h3 className="text-lg font-semibold text-white">{article.title}</h3>
                    {article.publication ? (
                      <p className="text-xs uppercase tracking-[0.3em] text-white/50">{article.publication}</p>
                    ) : null}
                    {article.summary ? <p className="mt-2 text-sm text-white/70">{article.summary}</p> : null}
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
