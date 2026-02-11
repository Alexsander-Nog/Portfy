import type { ReactNode } from "react";
import { ExternalLink, PlayCircle, Github, Linkedin, Globe } from "lucide-react";
import { buildPalette, type PortfolioTemplateProps } from "../types";
import { PORTFOLIO_SECTION_LABELS } from "../labels";

const SocialBadge = ({ icon, label }: { icon: ReactNode; label: string }) => (
  <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm text-white/80">
    <span className="text-white/60">{icon}</span>
    <span>{label}</span>
  </div>
);

export function DarkPortfolio({ profile, projects, experiences, featuredVideos, articles, locale, theme }: PortfolioTemplateProps) {
  const palette = buildPalette(theme);
  const labels = PORTFOLIO_SECTION_LABELS[locale];
  const safeName = profile.fullName?.trim() || "Nome não informado";
  const headline = profile.title?.trim() || "Profissional multidisciplinar";
  const summary = profile.bio?.trim() || "Atualize esta seção com resultados e impacto de projetos recentes.";

  const socialLinks = profile.socialLinks ?? {};
  const socials: Array<{ icon: ReactNode; label: string }> = [];
  if (socialLinks.github) socials.push({ icon: <Github className="h-4 w-4" />, label: socialLinks.github });
  if (socialLinks.linkedin) socials.push({ icon: <Linkedin className="h-4 w-4" />, label: socialLinks.linkedin });
  if (socialLinks.website) socials.push({ icon: <Globe className="h-4 w-4" />, label: socialLinks.website });

  const topProjects = projects.slice(0, 4);
  const topExperiences = experiences.slice(0, 3);
  const topArticles = articles.slice(0, 2);
  const topVideos = featuredVideos.slice(0, 2);

  return (
    <div
      className="mx-auto w-full max-w-6xl overflow-hidden rounded-[44px] border border-slate-800 bg-[#0f172a]"
      style={{ fontFamily: theme?.fontFamily ?? "Inter, system-ui, sans-serif" }}
    >
      <header className="relative px-14 pt-16 pb-20 text-white">
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(circle at top left, ${palette.primary}, transparent 60%)` }}
        />
        <div className="relative z-10 space-y-6">
          <span className="rounded-full border border-white/20 px-4 py-1 text-xs uppercase tracking-[0.4em] text-white/60">
            {labels.about}
          </span>
          <h1 className="text-5xl font-semibold text-white">{safeName}</h1>
          <p className="text-xl text-white/80">{headline}</p>
          <p className="max-w-3xl text-base leading-relaxed text-white/70">{summary}</p>
          {socials.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {socials.map((social) => (
                <SocialBadge key={social.label} icon={social.icon} label={social.label} />
              ))}
            </div>
          ) : null}
        </div>
      </header>

      <main className="relative z-10 space-y-16 bg-[#111827] px-14 py-16 text-white/85">
        {topExperiences.length > 0 ? (
          <section className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold uppercase tracking-[0.4em] text-white/40">{labels.experience}</h2>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            <div className="space-y-6">
              {topExperiences.map((experience) => (
                <article key={experience.id} className="rounded-[30px] border border-white/10 bg-white/5 px-8 py-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-xl font-semibold text-white">{experience.title}</h3>
                    <span className="text-xs uppercase tracking-[0.35em] text-white/40">{experience.period}</span>
                  </div>
                  {experience.company ? (
                    <p className="text-sm font-medium text-white/60">{experience.company}</p>
                  ) : null}
                  <p className="mt-3 text-sm leading-relaxed text-white/70">{experience.description}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {topProjects.length > 0 ? (
          <section className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold uppercase tracking-[0.4em] text-white/40">{labels.projects}</h2>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {topProjects.map((project) => (
                <article key={project.id} className="group relative overflow-hidden rounded-[30px] border border-white/10 bg-white/5 px-8 py-6">
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-white">{project.title}</h3>
                    <p className="text-sm leading-relaxed text-white/70">{project.description}</p>
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

        {topVideos.length > 0 ? (
          <section className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold uppercase tracking-[0.4em] text-white/40">{labels.videos}</h2>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {topVideos.map((video) => (
                <article key={video.id} className="flex items-center gap-4 rounded-[28px] border border-white/10 bg-[#0f172a] px-6 py-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white">
                    <PlayCircle className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-white">{video.title}</h3>
                    <p className="text-xs uppercase tracking-[0.35em] text-white/40">{video.platform}</p>
                    <p className="text-sm text-white/70">{video.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {topArticles.length > 0 ? (
          <section className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold uppercase tracking-[0.4em] text-white/40">{labels.articles}</h2>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {topArticles.map((article) => (
                <article key={article.id} className="rounded-[28px] border border-white/10 bg-white/5 px-6 py-5">
                  <h3 className="text-lg font-semibold text-white">{article.title}</h3>
                  {article.publication ? (
                    <p className="text-xs uppercase tracking-[0.35em] text-white/40">{article.publication}</p>
                  ) : null}
                  {article.summary ? <p className="mt-2 text-sm text-white/70">{article.summary}</p> : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
