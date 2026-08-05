import { HeartHandshake } from 'lucide-react';
import { Reveal } from '../components/ui/Reveal';
import type { LeadershipEntry } from '../types/portfolio';
import { cn } from '../lib/utils';

interface LeadershipProps {
  leadership: LeadershipEntry[];
}

export function Leadership({ leadership }: LeadershipProps) {
  return (
    <section id="leadership" className="section-shell">
      <Reveal>
        <p className="section-kicker">service.records</p>
        <h2 className="section-title">Leadership and service beyond the codebase.</h2>
      </Reveal>

      <div className="mt-14 grid gap-5">
        {leadership.map((entry, index) => (
          <Reveal key={`${entry.organization}-${entry.role}`} delay={index * 0.04}>
            <article
              className={cn(
                'rounded-lg border border-white/12 bg-[#09090a] p-5 md:p-6',
                entry.secondary && 'bg-white/[0.018]',
              )}
            >
              <div className="flex flex-col justify-between gap-4 md:flex-row">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-normal text-zinc-500">
                    <HeartHandshake size={15} />
                    {entry.category}
                  </div>
                  <h3 className="text-2xl font-semibold text-white">{entry.role}</h3>
                  <p className="mt-2 text-zinc-400">{entry.organization}</p>
                </div>
                <div className="font-mono text-xs uppercase tracking-normal text-zinc-500 md:text-right">
                  <p>{entry.dates}</p>
                  <p className="mt-1">{entry.location}</p>
                </div>
              </div>

              <p className="mt-5 max-w-3xl leading-7 text-zinc-300">{entry.summary}</p>

              <details className="mt-5 group/details">
                <summary className="cursor-pointer list-none font-mono text-xs uppercase tracking-normal text-zinc-400 transition hover:text-white">
                  View details
                </summary>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-300">
                  {entry.achievements.map((achievement) => (
                    <li key={achievement} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white/70" />
                      {achievement}
                    </li>
                  ))}
                </ul>
              </details>

              {entry.technologies.length ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {entry.technologies.map((technology) => (
                    <span key={technology} className="rounded-md bg-white/[0.06] px-2.5 py-1.5 font-mono text-[0.68rem] uppercase tracking-normal text-zinc-400">
                      {technology}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
