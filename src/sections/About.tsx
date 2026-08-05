import { Terminal } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Reveal } from '../components/ui/Reveal';
import type { PortfolioData } from '../types/portfolio';

interface AboutProps {
  about: PortfolioData['about'];
  education: PortfolioData['education'];
  personal: PortfolioData['personal'];
}

export function About({ about, education, personal }: AboutProps) {
  const reducedMotion = useReducedMotion();

  return (
    <section id="about" className="section-shell">
      <Reveal>
        <p className="section-kicker">{about.annotation}</p>
        <h2 className="section-title">About the builder behind the interface.</h2>
      </Reveal>

      <div className="mt-14 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <Reveal className="space-y-6">
          <motion.figure
            className="portrait-frame relative max-w-[28rem] overflow-hidden rounded-lg"
            initial={reducedMotion ? false : { opacity: 0, clipPath: 'inset(0 0 18% 0)' }}
            whileInView={{ opacity: 1, clipPath: 'inset(0 0 0% 0)' }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: reducedMotion ? 0.01 : 0.85, ease: [0.22, 1, 0.36, 1] }}
          >
            <img
              src="/krish-patel-profile.png"
              alt="Portrait of Krish Patel"
              loading="lazy"
              onError={(event) => {
                event.currentTarget.closest('figure')?.setAttribute('hidden', '');
              }}
            />
          </motion.figure>

          <div className="flex flex-wrap gap-3">
            <span className="rounded-full border px-4 py-2 font-mono text-xs uppercase tracking-normal soft-border soft-muted">
              {personal.location}
            </span>
            <span className="rounded-full border px-4 py-2 font-mono text-xs uppercase tracking-normal soft-border soft-muted">
              {personal.status}
            </span>
          </div>

          <div className="space-y-6 text-lg leading-8 text-zinc-300">
            {about.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {about.highlights.map((highlight) => (
              <span key={highlight} className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-xs uppercase tracking-normal text-zinc-300">
                {highlight}
              </span>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="overflow-hidden rounded-lg border border-white/12 bg-[#09090a] shadow-[0_0_70px_rgba(255,255,255,0.05)]">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 font-mono text-xs uppercase tracking-normal text-zinc-500">
              <Terminal size={15} />
              summary.sh
            </div>
            <div className="space-y-5 p-5">
              {about.terminalFacts.map((fact) => (
                <div key={fact.label} className="flex items-center justify-between gap-6 border-b border-dashed border-white/10 pb-3 font-mono text-sm">
                  <span className="text-zinc-500">{fact.label}</span>
                  <span className="text-zinc-200">{fact.value}</span>
                </div>
              ))}
              <div>
                <p className="font-mono text-xs uppercase tracking-normal text-zinc-500">current_focus</p>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-300">
                  {about.currentFocus.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white/70" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-white/12 bg-white/[0.025] p-5">
            <p className="font-mono text-xs uppercase tracking-normal text-zinc-500">education.record</p>
            <h3 className="mt-3 text-2xl font-semibold text-white">{education.institution}</h3>
            <p className="mt-2 text-zinc-300">{education.degree}</p>
            <dl className="mt-5 grid gap-3 font-mono text-xs uppercase tracking-normal text-zinc-400 sm:grid-cols-2">
              <div className="rounded-md border border-white/10 p-3">
                <dt className="text-zinc-600">Dates</dt>
                <dd className="mt-1 text-zinc-200">{education.dates}</dd>
              </div>
              <div className="rounded-md border border-white/10 p-3">
                <dt className="text-zinc-600">Focus</dt>
                <dd className="mt-1 text-zinc-200">{education.focus}</dd>
              </div>
              <div className="rounded-md border border-white/10 p-3">
                <dt className="text-zinc-600">GPA</dt>
                <dd className="mt-1 text-zinc-200">{education.gpa}</dd>
              </div>
              <div className="rounded-md border border-white/10 p-3">
                <dt className="text-zinc-600">Recognition</dt>
                <dd className="mt-1 text-zinc-200">{education.recognition}</dd>
              </div>
            </dl>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
