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

export function CorporateCV({ profile, experiences, projects, articles, locale, theme }: CVTemplateProps) {
  const palette = buildPalette(theme);
  const labels = CV_SECTION_LABELS[locale];
  const safeName = profile.fullName?.trim() || "Nome não informado";
  const headline = profile.title?.trim() || "Líder em transformação digital";
  const summary = profile.bio?.trim() || "Resuma suas principais entregas e valores para cargos de liderança.";
  const showPhoto = profile.photoUrl && profile.showCvPhoto !== false;

  const topExperiences = experiences.slice(0, 5);
  const topProjects = projects.slice(0, 3);
  const topArticles = articles.slice(0, 2);
  const skillList = (profile.skills ?? []).slice(0, 12);

  const contactItems = [
    profile.email ? { icon: <Mail className="h-4 w-4" />, value: profile.email } : null,
    profile.phone ? { icon: <Phone className="h-4 w-4" />, value: profile.phone } : null,
    profile.location ? { icon: <MapPin className="h-4 w-4" />, value: profile.location } : null,
  ].filter((entry): entry is { icon: ReactNode; value: string } => entry !== null);

  return (
    <div
      className="mx-auto w-full max-w-[210mm] overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_20px_40px_rgba(0,0,0,0.15)]"
      style={{ fontFamily: theme?.fontFamily ?? "Inter, system-ui, sans-serif" }}
    >
      <div className="grid md:grid-cols-[260px_1fr]">
        <aside
          className="relative flex flex-col gap-6 px-8 pb-12 pt-14 text-white"
          style={{
            background: `linear-gradient(160deg, ${palette.secondary}, ${palette.primary})`,
          }}
        >
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/70">Curriculum Vitae</p>
            <h1 className="text-3xl font-semibold leading-snug">{safeName}</h1>
            <p className="text-lg text-white/80">{headline}</p>
          </div>

          {showPhoto ? (
            <div className="h-28 w-28 overflow-hidden rounded-2xl border-4 border-white/40 shadow-lg">
              <img src={profile.photoUrl!} alt={safeName} className="h-full w-full object-cover" />
            </div>
          ) : null}

          <p className="text-sm leading-relaxed text-white/80">{summary}</p>

          {contactItems.length > 0 ? (
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">{labels.contact}</h2>
              <div className="mt-3 space-y-2 text-sm">
                {contactItems.map((item, index) => (
                  <div key={`${item.value}-${index}`} className="flex items-center gap-3">
                    <span className="text-white/80">{item.icon}</span>
                    <span className="break-words text-white/90">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {skillList.length > 0 ? (
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">{labels.skills}</h2>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
                {skillList.map((skill) => (
                  <span key={skill} className="rounded-full border border-white/40 px-3 py-1">{skill}</span>
                ))}
              </div>
            </div>
          ) : null}

          {profile.education && profile.education.length > 0 ? (
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <h2 className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">{labels.education}</h2>
              <ul className="mt-3 space-y-3 text-sm text-white/85">
                {profile.education.slice(0, 4).map((education, index) => (
                  <li key={`${education.institution}-${index}`} className="border-l border-white/30 pl-3">
                    <p className="text-sm font-semibold">{education.institution}</p>
                    <p>{education.degree}</p>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                      {[education.startYear, education.endYear].filter(Boolean).join(" – ") || education.period}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>

        <main className="space-y-10 bg-white px-12 py-14">
          {topExperiences.length > 0 ? (
            <section className="space-y-4">
              <header>
                <h2 className="text-sm font-semibold uppercase tracking-[0.4em] text-[#8b7dad]">{labels.experience}</h2>
              </header>
              <div className="space-y-6">
                {topExperiences.map((experience) => (
                  <article key={experience.id} className="rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-[#221a3d]">{experience.title}</h3>
                        {experience.company ? (
                          <p className="text-sm font-medium text-[#6b5d7a]">{experience.company}</p>
                        ) : null}
                      </div>
                      <span className="text-xs uppercase tracking-[0.3em] text-[#a498c1]">{experience.period}</span>
                    </div>
                    {experience.description ? (
                      <p className="mt-3 text-sm leading-relaxed text-[#5a4d6d]">{truncate(experience.description, 360)}</p>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {topProjects.length > 0 ? (
            <section className="space-y-4">
              <header>
                <h2 className="text-sm font-semibold uppercase tracking-[0.4em] text-[#8b7dad]">{labels.projects}</h2>
              </header>
              <div className="grid gap-4 md:grid-cols-2">
                {topProjects.map((project) => (
                  <article key={project.id} className="rounded-2xl border border-slate-200 bg-[#f9f7fc] p-4">
                    <h3 className="text-base font-semibold text-[#221a3d]">{project.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#5a4d6d]">{truncate(project.description, 220)}</p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {topArticles.length > 0 ? (
            <section className="space-y-4">
              <header>
                <h2 className="text-sm font-semibold uppercase tracking-[0.4em] text-[#8b7dad]">{labels.articles}</h2>
              </header>
              <div className="space-y-3">
                {topArticles.map((article) => (
                  <article key={article.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <h3 className="text-sm font-semibold text-[#221a3d]">{article.title}</h3>
                    {article.publication ? (
                      <p className="text-xs uppercase tracking-[0.3em] text-[#a498c1]">{article.publication}</p>
                    ) : null}
                    {article.summary ? (
                      <p className="mt-2 text-xs leading-relaxed text-[#5a4d6d]">{truncate(article.summary, 160)}</p>
                    ) : null}
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
