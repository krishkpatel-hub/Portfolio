import { Code2, Mail, UserRound } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useRef } from 'react';
import { useMagnetic } from '../hooks/useMagnetic';
import type { PersonalDetails } from '../types/portfolio';
import { ExternalLink } from '../components/ui/ExternalLink';
import { HeroSoundtrack } from '../components/audio/HeroSoundtrack';

interface HeroProps {
  personal: PersonalDetails;
}

const iconMap = {
  github: Code2,
  linkedin: UserRound,
  email: Mail,
};

export function Hero({ personal }: HeroProps) {
  const reducedMotion = useReducedMotion();
  const ctaRef = useRef<HTMLAnchorElement>(null);
  useMagnetic(ctaRef, Boolean(reducedMotion));

  const words = personal.name.split(' ');

  return (
    <section id="top" className="relative min-h-screen overflow-hidden pt-16">
      <HeroSoundtrack reducedMotion={Boolean(reducedMotion)} />
      <div className="absolute inset-x-0 top-28 h-px bg-[color:var(--line-strong)]" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 h-64 w-full bg-gradient-to-t from-black to-transparent" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-[min(1180px,calc(100%-2rem))] flex-col justify-center py-14 pb-44 md:pb-24">
        <motion.div
          className="mb-8 flex flex-wrap items-center gap-3"
          initial={reducedMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="rounded-full border px-4 py-2 font-mono text-xs uppercase tracking-normal soft-border soft-muted">
            {personal.role}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-xs uppercase tracking-normal soft-border soft-muted">
            <span className="h-2 w-2 rounded-full bg-[var(--success)] shadow-[0_0_14px_rgba(143,255,189,0.65)]" />
            {personal.status}
          </span>
        </motion.div>

        <h1 className="max-w-6xl text-[clamp(4rem,16vw,12.5rem)] font-black uppercase leading-[0.78] tracking-normal text-[var(--text-strong)]">
          {words.map((word, index) => (
            <motion.span
              className="block overflow-hidden pb-4"
              key={word}
              initial={reducedMotion ? false : { y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.95, delay: 0.12 + index * 0.13, ease: [0.22, 1, 0.36, 1] }}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        <motion.div
          className="mt-8 grid max-w-4xl gap-8 md:grid-cols-[1fr_auto]"
          initial={reducedMotion ? false : { opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <div>
            <p className="max-w-2xl text-balance text-2xl font-semibold uppercase leading-tight text-[var(--text)] md:text-4xl">
              {personal.tagline}
            </p>
            <p className="mt-5 max-w-xl text-base leading-7 soft-muted md:text-lg">{personal.availability}</p>
          </div>

          <div className="flex items-end gap-3 md:flex-col md:items-stretch">
            {personal.socials.map((link) => {
              const Icon = iconMap[link.type];
              return (
                <ExternalLink
                  key={link.label}
                  href={link.href}
                  className="grid h-12 w-12 place-items-center rounded-md soft-control"
                  aria-label={link.label}
                >
                  <Icon size={20} />
                </ExternalLink>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          className="mt-12 flex flex-wrap items-center gap-4"
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.72 }}
        >
          <a
            ref={ctaRef}
            href="#projects"
            className="rounded-full px-6 py-3 font-mono text-xs font-bold uppercase tracking-normal transition-transform primary-soft-action"
          >
            View projects
          </a>
        </motion.div>
      </div>

      <motion.a
        href="#about"
        className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-3 font-mono text-[0.68rem] uppercase tracking-normal text-zinc-500 md:flex"
        animate={reducedMotion ? undefined : { y: [0, 8, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        Scroll
        <span className="h-12 w-px bg-gradient-to-b from-white/70 to-transparent" />
      </motion.a>
    </section>
  );
}
