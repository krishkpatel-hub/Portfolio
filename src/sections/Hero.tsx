import { Code2, Mail, UserRound } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef } from 'react';
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
  const sectionRef = useRef<HTMLElement>(null);
  const portraitAreaRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  useMagnetic(ctaRef, Boolean(reducedMotion));

  const words = personal.name.split(' ');

  useEffect(() => {
    const section = sectionRef.current;
    const area = portraitAreaRef.current;
    if (!section || !area) return;

    type Bounds = { left: number; top: number; right: number; bottom: number };
    const intersects = (first: Bounds, second: Bounds) =>
      first.left < second.right && first.right > second.left && first.top < second.bottom && first.bottom > second.top;
    const trackedElements = [
      ...section.querySelectorAll<HTMLElement>('.hero-badges > span, .hero-intro p, .hero-intro a, .hero-cta a, .hero-soundtrack'),
      ...section.querySelectorAll<HTMLElement>('.hero-name span'),
    ];
    const header = document.querySelector<HTMLElement>('[data-site-header]');

    const measureMovement = () => {
      const hero = section.getBoundingClientRect();
      const portrait = area.getBoundingClientRect();
      const desktop = window.innerWidth >= 1100;
      const compact = window.innerWidth >= 700 && !desktop;
      const hoverPadding = desktop ? 16 : 2;
      const edgePadding = compact ? 16 : 18;
      const desiredX = desktop
        ? Math.min(60, Math.max(40, 40 + (window.innerWidth - 1280) / 32))
        : compact ? Math.min(20, Math.max(12, (window.innerWidth - 700) * 0.02 + 12))
          : Math.min(9, Math.max(6, window.innerWidth * 0.02));
      const desiredY = desktop
        ? Math.min(45, Math.max(30, 30 + (window.innerWidth - 1280) * 0.0234375))
        : compact ? Math.min(14, Math.max(8, (window.innerWidth - 700) * 0.015 + 8))
          : Math.min(8, Math.max(5, window.innerWidth * 0.016));
      const layout = area.parentElement?.getBoundingClientRect();
      const columns = compact && area.parentElement
        ? window.getComputedStyle(area.parentElement).gridTemplateColumns.split(' ')
        : [];
      const columnLeft = compact && layout
        ? layout.right - Number.parseFloat(columns.at(-1) ?? '0')
        : hero.left;
      const columnRight = compact && layout ? layout.right : hero.right;
      const bounds = {
        left: Math.min(desiredX, Math.max(0, portrait.left - columnLeft - edgePadding)),
        right: Math.min(desiredX, Math.max(0, columnRight - portrait.right - edgePadding)),
        up: Math.min(desiredY, Math.max(0, portrait.top - hero.top - (header?.offsetHeight ?? 0) - edgePadding)),
        down: Math.min(desiredY, Math.max(0, hero.bottom - portrait.bottom - edgePadding)),
      };
      const obstacles: Bounds[] = trackedElements.map((element) => {
        if (element.matches('.hero-name span')) {
          const range = document.createRange();
          range.selectNodeContents(element);
          const text = range.getBoundingClientRect();
          const transform = window.getComputedStyle(element).transform;
          const entranceOffset = transform === 'none' ? 0 : new DOMMatrixReadOnly(transform).m42;
          return { left: text.left, right: text.right, top: text.top - entranceOffset, bottom: text.bottom - entranceOffset };
        }
        return element.getBoundingClientRect();
      }).filter((obstacle) => obstacle.right > obstacle.left && obstacle.bottom > obstacle.top);
      if (header) {
        obstacles.push({ left: hero.left, right: hero.right, top: hero.top, bottom: hero.top + header.offsetHeight });
      }

      for (const obstacle of obstacles) {
        if (obstacle.left < portrait.right && obstacle.right > portrait.left) {
          if (obstacle.bottom <= portrait.top) {
            const gap = portrait.top - obstacle.bottom;
            bounds.up = Math.min(bounds.up, Math.max(0, gap - Math.min(16, gap)));
          } else if (obstacle.top >= portrait.bottom) {
            const gap = obstacle.top - portrait.bottom;
            bounds.down = Math.min(bounds.down, Math.max(0, gap - Math.min(16, gap)));
          }
        }
      }

      // The drift stays in upper-left and lower-right lobes, leaving the social-link corner clear.
      const pathIsClear = (scale: number) => {
        const upperLeft = {
          left: portrait.left - bounds.left * scale - hoverPadding,
          right: portrait.right + hoverPadding,
          top: portrait.top - bounds.up * scale - hoverPadding,
          bottom: portrait.bottom + hoverPadding,
        };
        const lowerRight = {
          left: portrait.left - hoverPadding,
          right: portrait.right + bounds.right * scale + hoverPadding,
          top: portrait.top - hoverPadding,
          bottom: portrait.bottom + bounds.down * scale + hoverPadding,
        };
        return obstacles.every((obstacle) => !intersects(upperLeft, obstacle) && !intersects(lowerRight, obstacle));
      };
      let scale = 1;
      if (!pathIsClear(scale)) {
        let low = 0;
        let high = 1;
        for (let index = 0; index < 12; index += 1) {
          const middle = (low + high) / 2;
          if (pathIsClear(middle)) low = middle;
          else high = middle;
        }
        scale = low;
      }
      area.style.setProperty('--portrait-left', `${bounds.left * scale}px`);
      area.style.setProperty('--portrait-right', `${bounds.right * scale}px`);
      area.style.setProperty('--portrait-up', `${bounds.up * scale}px`);
      area.style.setProperty('--portrait-down', `${bounds.down * scale}px`);
      section.dataset.portraitReady = 'true';
    };

    let visible = false;
    let cancelled = false;
    const syncAnimation = () => {
      section.dataset.portraitActive = String(visible && !document.hidden);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      syncAnimation();
    });
    observer.observe(section);
    const resizeObserver = new ResizeObserver(measureMovement);
    resizeObserver.observe(section);
    resizeObserver.observe(area);
    trackedElements.forEach((element) => resizeObserver.observe(element));
    if (header) resizeObserver.observe(header);
    document.addEventListener('visibilitychange', syncAnimation);
    void document.fonts.ready.then(() => {
      if (!cancelled) measureMovement();
    });
    measureMovement();

    return () => {
      cancelled = true;
      observer.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', syncAnimation);
      delete section.dataset.portraitActive;
      delete section.dataset.portraitReady;
    };
  }, []);

  return (
    <section id="top" ref={sectionRef} className="relative min-h-screen overflow-hidden pt-16">
      <HeroSoundtrack reducedMotion={Boolean(reducedMotion)} />
      <div className="absolute inset-x-0 top-28 h-px bg-[color:var(--line-strong)]" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 h-64 w-full bg-gradient-to-t from-black to-transparent" aria-hidden="true" />

      <div className="hero-copy-layout relative z-10 mx-auto min-h-[calc(100vh-4rem)] w-[min(1240px,calc(100%-2rem))] py-14 pb-44 md:pb-24">
        <motion.div
          className="hero-badges mb-8 flex flex-wrap items-center gap-3"
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

        <h1 className="hero-name max-w-6xl text-[clamp(4rem,16vw,12.5rem)] font-black uppercase leading-[0.78] tracking-normal text-[var(--text-strong)]">
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

        <div ref={portraitAreaRef} className="hero-portrait-area">
          <div className="hero-portrait-float">
            <div className="hero-portrait-hover">
              <figure className="hero-portrait-circle">
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
          </div>
        </div>

        <motion.div
          className="hero-intro mt-8 grid max-w-4xl gap-8 md:grid-cols-[1fr_auto]"
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

          <div className="hero-social-links flex items-end gap-3 md:flex-col md:items-stretch">
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
          className="hero-cta mt-12 flex flex-wrap items-center gap-4"
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
      >
        Scroll
        <span className="h-12 w-px bg-gradient-to-b from-white/70 to-transparent" />
      </motion.a>
    </section>
  );
}
