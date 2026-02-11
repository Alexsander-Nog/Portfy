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

export function CreativeAccentCV({ profile, experiences, projects, articles, locale, theme }: CVTemplateProps) {
  const palette = buildPalette(theme);
  const labels = CV_SECTION_LABELS[locale];
  const safeName = profile.fullName?.trim() || "Nome não informado";
  const headline = profile.title?.trim() || "Criador de experiências memoráveis";
  const summary = profile.bio?.trim() || "Conte sua história de maneira envolvente para destacar sua criatividade.";
  const showPhoto = profile.photoUrl && profile.showCvPhoto !== false;

  const topExperiences = experiences.slice(0, 4);
  const topProjects = projects.slice(0, 4);
  const topArticles = articles.slice(0, 2);
  const skillList = (profile.skills ?? []).slice(0, 14);

  const contactItems = [
    profile.email ? { icon: <Mail className="h-4 w-4" />, value: profile.email } : null,
    profile.phone ? { icon: <Phone className="h-4 w-4" />, value: profile.phone } : null,
    profile.location ? { icon: <MapPin className="h-4 w-4" />, value: profile.location } : null,
  ].filter((entry): entry is { icon: ReactNode; value: string } => entry !== null);

  return (
    <div
      className="mx-auto w-full max-w-[210mm] overflow-hidden rounded-[36px] border border-[#efdff0] bg-white shadow-[0_25px_60px_rgba(194,33,99,0.25)]"
      style={{ fontFamily: theme?.fontFamily ?? "Inter, system-ui, sans-serif" }}
    >
      <header
        className="relative overflow-hidden px-12 pb-12 pt-14 text-white"
        style={{ background: `linear-gradient(120deg, ${palette.accent}, ${palette.primary})` }}
      >
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/70">Portfólio Criativo</p>
            <h1 className="mt-3 text-4xl font-semibold leading-snug">{safeName}</h1>
            <p className="mt-2 text-lg text-white/80">{headline}</p>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/80">{summary}</p>
          </div>
          {showPhoto ? (
            <div className="h-32 w-32 overflow-hidden rounded-[28px] border-4 border-white/40 shadow-[0_18px_36px_rgba(0,0,0,0.25)]">
              <img src={profile.photoUrl!} alt={safeName} className="h-full w-full object-cover" />
            </div>
          ) : null}
        </div>
        {contactItems.length > 0 ? (
          <div className="relative mt-6 flex flex-wrap gap-3 text-sm text-white/85">
            {contactItems.map((item, index) => (
              <div key={`${item.value}-${index}`} className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5">
                <span>{item.icon}</span>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        ) : null}
      </header>

      <main className="grid gap-10 px-12 py-12 lg:grid-cols-[1.7fr_1fr]">
        <section className="space-y-8">
          {topExperiences.length > 0 ? (
            <div className="space-y-5">
              <header className="flex items-center gap-3">
                <span className="h-10 w-10 rounded-xl" style={{ backgroundColor: `${palette.accent}1f` }} />
                <h2 className="text-sm font-semibold uppercase tracking-[0.4em] text-[#9d85b1]">{labels.experience}</h2>
              </header>
              <div className="space-y-5">
                {topExperiences.map((experience) => (
                  <article key={experience.id} className="rounded-[26px] border border-[#efdff0] bg-white p-6 shadow-[0_14px_30px_rgba(210,199,230,0.35)]">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-[#2c1741]">{experience.title}</h3>
                        {experience.company ? (
                          <p className="text-sm font-medium text-[#6b5d7a]">{experience.company}</p>
                        ) : null}
                      </div>
                      <span className="text-xs uppercase tracking-[0.3em] text-[#b7a6c9]">{experience.period}</span>
                    </div>
                    {experience.description ? (
                      <p className="mt-4 text-sm leading-relaxed text-[#5b4b74]">{truncate(experience.description, 320)}</p>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {topProjects.length > 0 ? (
            <div className="space-y-5">
              <header className="flex items-center gap-3">
                <span className="h-10 w-10 rounded-xl" style={{ backgroundColor: `${palette.primary}1f` }} />
                <h2 className="text-sm font-semibold uppercase tracking-[0.4em] text-[#9d85b1]">{labels.projects}</h2>
              </header>
              <div className="grid gap-4 md:grid-cols-2">
                {topProjects.map((project) => (
                  <article key={project.id} className="rounded-[22px] border border-[#efdff0] bg-gradient-to-br from-[#fdf9ff] to-white p-4">
                    <h3 className="text-base font-semibold text-[#2c1741]">{project.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#5b4b74]">{truncate(project.description, 200)}</p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <aside className="space-y-8">
          {skillList.length > 0 ? (
            <div className="rounded-[28px] border border-[#efdff0] bg-[#fdf9ff] p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-[#9d85b1]">{labels.skills}</h2>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#5b4b74]">
                {skillList.map((skill) => (
                  <span key={skill} className="rounded-full bg-white px-3 py-1 shadow">{skill}</span>
                ))}
              </div>
            </div>
          ) : null}

          {profile.education && profile.education.length > 0 ? (
            <div className="rounded-[28px] border border-[#efdff0] bg-white p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-[#9d85b1]">{labels.education}</h2>
              <div className="mt-4 space-y-3 text-sm text-[#5b4b74]">
                {profile.education.slice(0, 3).map((education, index) => (
                  <article key={`${education.institution}-${index}`} className="rounded-2xl bg-gradient-to-r from-white to-[#fdf9ff] p-4">
                    <p className="text-sm font-semibold text-[#2c1741]">{education.institution}</p>
                    <p>{education.degree}</p>
                    <p className="text-xs uppercase tracking-[0.3em] text-[#b7a6c9]">
                      {[education.startYear, education.endYear].filter(Boolean).join(" – ") || education.period}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {topArticles.length > 0 ? (
            <div className="rounded-[28px] border border-[#efdff0] bg-white p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-[#9d85b1]">{labels.articles}</h2>
              <div className="mt-3 space-y-3 text-sm text-[#5b4b74]">
                {topArticles.map((article) => (
                  <article key={article.id} className="rounded-2xl border border-[#efdff0] bg-[#fdf9ff] p-4">
                    <h3 className="text-sm font-semibold text-[#2c1741]">{article.title}</h3>
                    {article.publication ? (
                      <p className="text-xs uppercase tracking-[0.3em] text-[#b7a6c9]">{article.publication}</p>
                    ) : null}
                    {article.summary ? (
                      <p className="mt-2 text-xs leading-relaxed text-[#5b4b74]">{truncate(article.summary, 160)}</p>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </main>

      <footer className="bg-gradient-to-r from-[#fdf9ff] to-white px-12 py-5 text-xs uppercase tracking-[0.4em] text-[#9d85b1]">
        {safeName} · {labels.contact}
      </footer>
    </div>
  );
}
