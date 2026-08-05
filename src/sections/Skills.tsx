import { CheckCircle2 } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Reveal } from '../components/ui/Reveal';
import type { SkillGroup } from '../types/portfolio';

interface SkillsProps {
  skills: SkillGroup[];
}

export function Skills({ skills }: SkillsProps) {
  const reducedMotion = useReducedMotion();

  return (
    <section id="skills" className="section-shell">
      <Reveal>
        <p className="section-kicker">ci.pipeline</p>
        <h2 className="section-title">Skills arranged like a passing build.</h2>
      </Reveal>

      <div className="mt-14 grid gap-4">
        {skills.map((group, index) => (
          <Reveal key={group.title} delay={index * 0.05}>
            <article className="rounded-lg border border-white/12 bg-white/[0.025] p-5 md:p-6">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                  <div className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-normal text-[var(--success)]">
                    <CheckCircle2 size={16} />
                    {group.status}
                  </div>
                  <h3 className="text-2xl font-semibold text-white">{group.title}</h3>
                </div>
                <span className="font-mono text-xs uppercase tracking-normal text-zinc-500">{group.completion}% complete</span>
              </div>

              <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-white"
                  initial={{ width: reducedMotion ? `${group.completion}%` : 0 }}
                  whileInView={{ width: `${group.completion}%` }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: reducedMotion ? 0.01 : 1.15, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {group.skills.map((skill) => (
                  <span key={skill} className="rounded-md border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs uppercase tracking-normal text-zinc-300">
                    {skill}
                  </span>
                ))}
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
