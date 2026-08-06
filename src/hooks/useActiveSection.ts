import { useEffect, useRef, useState } from 'react';
import { getHeaderOffset } from '../lib/scrollNavigation';

export function useActiveSection(sectionIds: string[]) {
  const [activeSection, setActiveSection] = useState(sectionIds[0] ?? '');
  const activeSectionRef = useRef(sectionIds[0] ?? '');

  useEffect(() => {
    activeSectionRef.current = sectionIds[0] ?? '';

    let frame: number | null = null;
    let sectionBounds = sectionIds
      .map((id) => {
        const element = document.getElementById(id);
        return element ? { id, top: 0, bottom: 0, element } : null;
      })
      .filter((section): section is { id: string; top: number; bottom: number; element: HTMLElement } => Boolean(section));

    const measure = () => {
      sectionBounds = sectionBounds.map((section) => {
        const rect = section.element.getBoundingClientRect();
        const top = rect.top + window.scrollY;
        return { ...section, top, bottom: top + rect.height };
      });
    };

    const updateActiveSection = () => {
      frame = null;
      if (!sectionBounds.length) return;

      const pageBottom = window.scrollY + window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const probe = window.scrollY + getHeaderOffset() + window.innerHeight * 0.26;
      const current =
        pageBottom >= documentHeight - 4
          ? sectionBounds[sectionBounds.length - 1]
          : sectionBounds.find((section, index) => {
              const nextTop = sectionBounds[index + 1]?.top ?? Number.POSITIVE_INFINITY;
              return probe >= section.top && probe < nextTop;
            });
      const nextActive = current?.id ?? sectionBounds[sectionBounds.length - 1]?.id ?? '';

      if (nextActive && nextActive !== activeSectionRef.current) {
        activeSectionRef.current = nextActive;
        setActiveSection(nextActive);
      }
    };

    const scheduleUpdate = () => {
      if (frame === null) {
        frame = window.requestAnimationFrame(updateActiveSection);
      }
    };

    const handleResize = () => {
      measure();
      scheduleUpdate();
    };

    measure();
    scheduleUpdate();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    document.fonts?.ready.then(handleResize).catch(() => undefined);

    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [sectionIds]);

  return activeSection;
}
