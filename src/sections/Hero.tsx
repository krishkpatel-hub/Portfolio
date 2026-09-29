import { Code2, Mail, UserRound } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { useRef } from 'react';
import { useMagnetic } from '../hooks/useMagnetic';
import { useHeroDepth } from '../hooks/useHeroDepth';
import type { PersonalDetails } from '../types/portfolio';
import { ExternalLink } from '../components/ui/ExternalLink';
import { HeroSoundtrack } from '../components/audio/HeroSoundtrack';
import '../styles/hero.css';

interface HeroProps {
  personal: PersonalDetails;
}

const iconMap = { github: Code2, linkedin: UserRound, email: Mail };

export function Hero({ personal }: HeroProps) {
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  useMagnetic(ctaRef, Boolean(reducedMotion));
  useHeroDepth(sectionRef);

  return (
    <section id="top" ref={sectionRef} className="portrait-hero">
      <div className="hero-stage">
        <div className="hero-composition">
          <div className="hero-status flex flex-wrap items-center gap-3">
            <span className="rounded-full border px-4 py-2 font-mono text-xs uppercase soft-border soft-muted">
              {personal.role}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-xs uppercase soft-border soft-muted">
              <span className="h-2 w-2 rounded-full bg-[var(--success)]" />
              {personal.status}
            </span>
          </div>

          <h1 className="hero-name">
            {personal.name.split(' ').map((word) => <span key={word}>{word}</span>)}
          </h1>

          <div className="hero-portrait-area">
            <div className="hero-orb-depth" aria-hidden="true">
              <svg className="hero-orb" viewBox="0 0 400 400" fill="none">
                <circle cx="200" cy="200" r="176" />
                <ellipse cx="200" cy="200" rx="66" ry="176" />
                <ellipse cx="200" cy="200" rx="133" ry="176" />
                <ellipse cx="200" cy="200" rx="176" ry="66" />
                <ellipse cx="200" cy="200" rx="176" ry="133" />
                <path d="M24 200h352M200 24v352" />
              </svg>
            </div>
            <figure className="hero-portrait">
              <img
                src="/krish-patel-profile.png"
                alt="Portrait of Krish Patel"
                width={1456}
                height={1534}
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
            </figure>
          </div>

          <div className="hero-introduction">
            <p className="hero-tagline">{personal.tagline}</p>
            <p className="hero-availability soft-muted">{personal.availability}</p>
          </div>

          <div className="hero-actions flex flex-wrap items-center gap-3">
            <a
              ref={ctaRef}
              href="#projects"
              className="rounded-full px-6 py-3 font-mono text-xs font-bold uppercase transition-transform primary-soft-action"
            >
              View projects
            </a>
            {personal.socials.map((link) => {
              const Icon = iconMap[link.type];
              return (
                <ExternalLink key={link.label} href={link.href} className="grid h-12 w-12 place-items-center rounded-md soft-control" aria-label={link.label}>
                  <Icon size={20} />
                </ExternalLink>
              );
            })}
          </div>
        </div>

        <div className="hero-secondary-depth" aria-hidden="true">
          <svg className="hero-secondary" viewBox="0 0 120 120" fill="none">
            <path d="m60 5 50 37-13 54-59 17L8 64 52 43Zm0 0-8 38 45 53M8 64l89 32M38 113l14-70 58-1M8 64l52-59" />
          </svg>
        </div>
        <HeroSoundtrack reducedMotion={Boolean(reducedMotion)} />
        <a href="#about" className="hero-scroll-cue font-mono text-[0.68rem] uppercase soft-muted">
          Scroll
          <span aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
