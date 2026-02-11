import type { ReactNode } from "react";
import { Mail, Phone, Linkedin, Dribbble, Github, Globe } from "lucide-react";
import { buildPalette, type CVTemplateProps } from "../types";
import { CV_SECTION_LABELS } from "../labels";

const resolveSocialLinks = (profile: CVTemplateProps["profile"]): Array<{ icon: ReactNode; label: string; url: string }> => {
  const socials = profile.socialLinks ?? {};
  const entries: Array<{ icon: ReactNode; label: string; url: string }> = [];

  if (socials.linkedin) {
    entries.push({ icon: <Linkedin className="h-4 w-4" />, label: "LinkedIn", url: socials.linkedin });
  }
  if (socials.github) {
    entries.push({ icon: <Github className="h-4 w-4" />, label: "GitHub", url: socials.github });
  }
  if (socials.instagram) {
    entries.push({ icon: <Dribbble className="h-4 w-4" />, label: "Instagram", url: socials.instagram });
  }
  if (socials.website) {
    entries.push({ icon: <Globe className="h-4 w-4" />, label: "Website", url: socials.website });
  }

  return entries;
};

function GlowingCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-[0_25px_50px_-20px_rgba(255,255,255,0.35)] backdrop-blur">
      <h3 className="text-xs font-semibold uppercase tracking-[0.4em] text-white/70">{title}</h3>
      <div className="mt-4 space-y-3 text-sm text-white/80">{children}</div>
    </div>
  );
}

export function CreativeCV({ profile, experiences, projects, articles, locale, theme }: CVTemplateProps) {
  const palette = buildPalette(theme);
  const labels = CV_SECTION_LABELS[locale];
  const safeName = profile.fullName?.trim() || "Nome não informado";
  const headline = profile.title?.trim() || "Criando experiências memoráveis";
  const summary = profile.bio?.trim() || "Descreva como você combina criatividade e estratégia para gerar impacto real.";

  const contactItems = [
    profile.email ? { icon: <Mail className="h-4 w-4" />, label: labels.contact, value: profile.email } : null,
    profile.phone ? { icon: <Phone className="h-4 w-4" />, label: "Phone", value: profile.phone } : null,
  ].filter((entry): entry is { icon: ReactNode; label: string; value: string } => entry !== null);

  const socialEntries = resolveSocialLinks(profile);
  const topExperiences = experiences.slice(0, 3);
  const topProjects = projects.slice(0, 3);
  const topArticles = articles.slice(0, 2);
  const skills = (profile.skills ?? []).slice(0, 9);

  return (
    <div
      className="mx-auto w-full max-w-[210mm] overflow-hidden rounded-[34px] border border-transparent bg-gradient-to-br from-[#0f172a] via-[#312e81] to-[#7c3aed] p-[1.5px] shadow-[0_30px_80px_-25px_rgba(15,23,42,0.6)]"
      style={{ fontFamily: theme?.fontFamily ?? "Poppins, system-ui, sans-serif" }}
    >
      <div className="rounded-[32px] bg-gradient-to-br from-[#111827]/80 via-[#1f2937]/85 to-[#312e81]/70">
        <header className="px-12 pt-14 pb-10 text-white/95">
          <div className="max-w-xl">
            <span className="text-xs uppercase tracking-[0.5em] text-white/50">Portfolio & CV</span>
            <h1 className="mt-6 text-5xl font-semibold tracking-tight">{safeName}</h1>
            <p className="mt-3 text-lg text-white/70">{headline}</p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <GlowingCard title={labels.summary}>
              <p>{summary}</p>
            </GlowingCard>
            {skills.length > 0 ? (
              <GlowingCard title={labels.skills}>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </GlowingCard>
            ) : null}
            {socialEntries.length > 0 ? (
              <GlowingCard title="Networking">
                <div className="space-y-2">
                  {socialEntries.map((entry) => (
                    <div key={entry.label} className="flex items-center gap-2">
                      <span className="text-white/70">{entry.icon}</span>
                      <span className="text-white/90">{entry.url}</span>
                    </div>
                  ))}
                </div>
              </GlowingCard>
            ) : null}
          </div>
        </header>

        <main className="grid gap-8 px-12 pb-14 md:grid-cols-[2fr_1fr]">
          <section className="space-y-6">
            {topExperiences.length > 0 ? (
              <div className="space-y-4">
                <h2 className="text-xs font-semibold uppercase tracking-[0.4em] text-white/50">{labels.experience}</h2>
                <div className="space-y-4">
                  {topExperiences.map((experience) => (
                    <article key={experience.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                      <div className="flex flex-wrap items-baseline justify-between gap-3">
                        <h3 className="text-lg font-semibold text-white/95">{experience.title}</h3>
                        <span className="text-xs uppercase tracking-[0.3em] text-white/40">{experience.period}</span>
                      </div>
                      {experience.company ? (
                        <p className="text-sm font-medium text-white/60">{experience.company}</p>
                      ) : null}
                      <p className="mt-3 text-sm leading-relaxed text-white/75">{experience.description}</p>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {topProjects.length > 0 ? (
              <div className="space-y-4">
                <h2 className="text-xs font-semibold uppercase tracking-[0.4em] text-white/50">{labels.projects}</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {topProjects.map((project) => (
                    <article key={project.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                      <h3 className="text-base font-semibold text-white/90">{project.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-white/70">{project.description}</p>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <aside className="space-y-5">
            {contactItems.length > 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-xs font-semibold uppercase tracking-[0.4em] text-white/50">{labels.contact}</h2>
                <div className="mt-4 space-y-2 text-sm text-white/80">
                  {contactItems.map((item, index) => (
                    <div key={`${item.value}-${index}`} className="flex items-center gap-3">
                      <span>{item.icon}</span>
                      <span>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {profile.education && profile.education.length > 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-xs font-semibold uppercase tracking-[0.4em] text-white/50">{labels.education}</h2>
                <div className="mt-4 space-y-3 text-sm text-white/80">
                  {profile.education.slice(0, 3).map((education, index) => (
                    <div key={`${education.institution}-${index}`}>
                      <p className="font-semibold text-white/90">{education.institution}</p>
                      <p>{education.degree}</p>
                      <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                        {[education.startYear, education.endYear].filter(Boolean).join(" – ")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {topArticles.length > 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-xs font-semibold uppercase tracking-[0.4em] text-white/50">{labels.articles}</h2>
                <div className="mt-4 space-y-3 text-sm text-white/75">
                  {topArticles.map((article) => (
                    <div key={article.id} className="space-y-1">
                      <p className="font-semibold text-white/90">{article.title}</p>
                      {article.publication ? (
                        <p className="text-xs uppercase tracking-[0.3em] text-white/50">{article.publication}</p>
                      ) : null}
                      {article.summary ? <p className="text-xs text-white/60">{article.summary}</p> : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        </main>
      </div>
    </div>
  );
}
