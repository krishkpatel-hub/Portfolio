import { useEffect, type RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useHeroDepth(sectionRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const section = sectionRef.current;
    const stage = section?.querySelector<HTMLElement>('.hero-stage');
    if (!section || !stage) return;

    let visible = true;
    const updateVisibility = () => {
      section.dataset.animating = String(visible && !document.hidden);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      updateVisibility();
    });
    observer.observe(stage);
    document.addEventListener('visibilitychange', updateVisibility);
    updateVisibility();

    const media = gsap.matchMedia();
    media.add('(min-width: 1024px) and (min-height: 740px) and (prefers-reduced-motion: no-preference)', () => {
      section.dataset.depth = 'true';
      // CSS owns the bounded sticky stage; this timeline only transforms decoration.
      gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          id: 'hero-depth',
          trigger: section,
          start: 'top top',
          end: () => `+=${window.innerHeight * 0.5}`,
          scrub: true,
          invalidateOnRefresh: true,
        },
      })
        .to('.hero-portrait', { scale: 0.88, y: 32, duration: 1 }, 0)
        .to('.hero-portrait', { autoAlpha: 0, duration: 0.55 }, 0.45)
        .to('.hero-orb-depth', { x: -10, y: 14, opacity: 0.2, duration: 1 }, 0)
        .to('.hero-secondary-depth', { y: -12, duration: 1 }, 0);

      return () => { delete section.dataset.depth; };
    }, section);

    return () => {
      media.revert();
      observer.disconnect();
      document.removeEventListener('visibilitychange', updateVisibility);
      delete section.dataset.animating;
    };
  }, [sectionRef]);
}
