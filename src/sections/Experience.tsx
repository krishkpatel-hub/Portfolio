import { ExternalLink } from '../components/ui/ExternalLink';
import { Reveal } from '../components/ui/Reveal';
import type { ExperienceEntry } from '../types/portfolio';

interface ExperienceProps {
  experience: ExperienceEntry[];
}

export function Experience({ experience }: ExperienceProps) {
  return (
    <section id="experience" className="section-shell">
      <Reveal>
        <p className="section-kicker">timeline.log</p>
        <h2 className="section-title">Experience with room for the real story.</h2>
      </Reveal>

      <div className="relative mt-16">
        <div className="absolute bottom-0 left-4 top-0 w-px bg-white/12 md:left-1/2" aria-hidden="true" />
        <div className="grid gap-8">
          {experience.map((entry, index) => (
            <Reveal key={`${entry.company}-${entry.role}`} delay={index * 0.04}>
              <article className={`relative md:grid md:grid-cols-2 md:gap-12 ${index % 2 === 0 ? '' : 'md:[&>div]:col-start-2'}`}>
                <span className="absolute left-4 top-6 h-3 w-3 -translate-x-1/2 rounded-full bg-white shadow-[0_0_22px_rgba(255,255,255,0.55)] md:left-1/2" aria-hidden="true" />
                <div className="ml-10 rounded-lg border border-white/12 bg-[#09090a] p-5 md:ml-0 md:p-6">
                  <div className="mb-5 flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-normal text-zinc-500">
                    <span>{entry.dates}</span>
                    <span>/</span>
                    <span>{entry.location}</span>
                  </div>
                  <h3 className="text-2xl font-semibold text-white">{entry.role}</h3>
                  <p className="mt-2 text-zinc-400">
                    {entry.link ? <ExternalLink href={entry.link} className="underline decoration-white/30 underline-offset-4">{entry.company}</ExternalLink> : entry.company}
                  </p>
                  <p className="mt-5 leading-7 text-zinc-300">{entry.description}</p>

                  <ul className="mt-5 space-y-3 text-sm leading-6 text-zinc-300">
                    {entry.achievements.slice(0, 3).map((achievement) => (
                      <li key={achievement} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white/70" />
                        {achievement}
                      </li>
                    ))}
                  </ul>

                  {entry.achievements.length > 3 ? (
                    <details className="mt-4">
                      <summary className="cursor-pointer list-none font-mono text-xs uppercase tracking-normal text-zinc-400 transition hover:text-white">
                        View complete internship details
                      </summary>
                      <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-300">
                        {entry.achievements.slice(3).map((achievement) => (
                          <li key={achievement} className="flex gap-3">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white/70" />
                            {achievement}
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : null}

                  {entry.metrics?.length ? (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {entry.metrics.map((metric) => (
                        <span key={metric} className="rounded-md border border-[var(--warning)]/20 px-3 py-2 font-mono text-xs uppercase tracking-normal text-[var(--warning)]">
                          {metric}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-5 flex flex-wrap gap-2">
                    {entry.technologies.map((technology) => (
                      <span key={technology} className="rounded-md bg-white/[0.06] px-2.5 py-1.5 font-mono text-[0.68rem] uppercase tracking-normal text-zinc-400">
                        {technology}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
