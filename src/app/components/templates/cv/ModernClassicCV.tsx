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

export function ModernClassicCV({ profile, experiences, projects, articles, locale, theme }: CVTemplateProps) {
  const palette = buildPalette(theme);
  const labels = CV_SECTION_LABELS[locale];
  const safeName = profile.fullName?.trim() || "Nome não informado";
  const headline = profile.title?.trim() || "Profissional multidisciplinar";
  const summary = profile.bio?.trim() || "Adicione um resumo para destacar seu valor profissional.";
  const showPhoto = profile.photoUrl && profile.showCvPhoto !== false;

  const topExperiences = experiences.slice(0, 4);
  const topProjects = projects.slice(0, 3);
  const topArticles = articles.slice(0, 2);
  const skillList = (profile.skills ?? []).slice(0, 12);

  const contactItems = [
    profile.email ? { icon: <Mail className="h-3.5 w-3.5" />, value: profile.email } : null,
    profile.phone ? { icon: <Phone className="h-3.5 w-3.5" />, value: profile.phone } : null,
    profile.location ? { icon: <MapPin className="h-3.5 w-3.5" />, value: profile.location } : null,
  ].filter((entry): entry is { icon: ReactNode; value: string } => entry !== null);

  return (
    <div
      className="mx-auto w-full max-w-[210mm] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(45,37,80,0.18)]"
      style={{ fontFamily: theme?.fontFamily ?? "Inter, system-ui, sans-serif" }}
    >
      <header className="flex flex-col gap-6 border-b border-slate-100 px-12 pb-10 pt-12 md:flex-row md:items-center">
        {showPhoto ? (
          <div className="mx-auto h-28 w-28 overflow-hidden rounded-full border-4 border-white shadow-lg md:mx-0" style={{ boxShadow: `0 22px 40px -18px ${palette.primary}` }}>
            <img src={profile.photoUrl!} alt={safeName} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div
            className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-[#e7e2f4] to-white text-2xl font-semibold text-[#2d2550] md:mx-0"
          >
            {safeName
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((chunk) => chunk.charAt(0).toUpperCase())
              .join("") || "CV"}
          </div>
        )}
        <div className="flex-1 text-center md:text-left">
          <p
            className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400"
          >
            Curriculum Vitae
          </p>
          <h1 className="mt-3 text-4xl font-bold text-[#1e1935]">{safeName}</h1>
          <p className="mt-2 text-lg text-[#5c4f78]">{headline}</p>
          <p className="mt-4 text-sm leading-relaxed text-[#6d5f89]">{summary}</p>
        </div>
        {contactItems.length > 0 ? (
          <div className="flex flex-col gap-3 text-sm text-[#5c4f78] md:w-64">
            {contactItems.map((item, index) => (
              <div key={`${item.value}-${index}`} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white/70 px-3 py-2 shadow-sm">
                <span className="text-[#a21d4c]">{item.icon}</span>
                <span className="truncate text-sm">{item.value}</span>
              </div>
            ))}
          </div>
        ) : null}
      </header>

      <main className="grid gap-8 px-12 py-10 md:grid-cols-[2fr_1fr]">
        <section className="space-y-8">
          {topExperiences.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl" style={{ backgroundColor: `${palette.primary}1f` }} />
                <h2 className="text-sm font-semibold uppercase tracking-[0.4em] text-[#75679c]">{labels.experience}</h2>
              </div>
              <div className="space-y-5">
                {topExperiences.map((experience) => (
                  <article key={experience.id} className="rounded-2xl border border-slate-200 p-5 shadow-sm shadow-slate-200/40">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-base font-semibold text-[#2d2550]">{experience.title}</h3>
                      <span className="text-xs uppercase tracking-[0.3em] text-[#a498c1]">{experience.period}</span>
                    </div>
                    {experience.company ? (
                      <p className="text-sm font-medium text-[#6d5f89]">{experience.company}</p>
                    ) : null}
                    {experience.description ? (
                      <p className="mt-3 text-sm leading-relaxed text-[#61557b]">{truncate(experience.description, 320)}</p>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {topProjects.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl" style={{ backgroundColor: `${palette.accent}1f` }} />
                <h2 className="text-sm font-semibold uppercase tracking-[0.4em] text-[#75679c]">{labels.projects}</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {topProjects.map((project) => (
                  <article key={project.id} className="rounded-2xl border border-slate-200 p-4">
                    <h3 className="text-base font-semibold text-[#2d2550]">{project.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#6d5f89]">{truncate(project.description, 180)}</p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <aside className="space-y-8">
          {skillList.length > 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-[#f8f7fb] p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-[#75679c]">{labels.skills}</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {skillList.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em]"
                    style={{ backgroundColor: `${palette.primary}14`, color: palette.primary }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {profile.education && profile.education.length > 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-[#75679c]">{labels.education}</h2>
              <ul className="mt-4 space-y-3 text-sm text-[#5c4f78]">
                {profile.education.slice(0, 4).map((edu, index) => (
                  <li key={`${edu.institution}-${index}`} className="border-l-2 border-[#cfc4e6] pl-3">
                    <p className="text-sm font-semibold text-[#2d2550]">{edu.institution}</p>
                    <p>{edu.degree}</p>
                    <p className="text-xs uppercase tracking-[0.3em] text-[#a498c1]">
                      {[edu.startYear, edu.endYear].filter(Boolean).join(" – ") || edu.period}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {topArticles.length > 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-[#75679c]">{labels.articles}</h2>
              <div className="mt-3 space-y-3 text-sm text-[#5c4f78]">
                {topArticles.map((article) => (
                  <article key={article.id} className="rounded-lg border border-slate-100 bg-[#f9f7fd] p-3">
                    <h3 className="text-sm font-semibold text-[#2d2550]">{article.title}</h3>
                    {article.publication ? (
                      <p className="text-xs uppercase tracking-[0.35em] text-[#a498c1]">{article.publication}</p>
                    ) : null}
                    {article.summary ? (
                      <p className="mt-2 text-xs leading-relaxed text-[#6d5f89]">{truncate(article.summary, 140)}</p>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {contactItems.length > 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-[#75679c]">{labels.contact}</h2>
              <div className="mt-3 space-y-2 text-sm text-[#5c4f78]">
                {contactItems.map((item, index) => (
                  <div key={`${item.value}-contact-${index}`} className="flex items-center gap-3">
                    <span className="text-[#a21d4c]">{item.icon}</span>
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
