import { useEffect, useRef } from 'react';
import { getScrollController } from '../../lib/scrollNavigation';

interface SmoothScrollIndicatorProps {
  reducedMotion: boolean;
}

const railHeight = 116;
const thumbHeight = 26;
const idleDelay = 720;

function getScrollMetrics() {
  const scrollHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
  const viewportHeight = window.innerHeight;
  const maxScroll = Math.max(0, scrollHeight - viewportHeight);
  return { maxScroll, viewportHeight };
}

export function SmoothScrollIndicator({ reducedMotion }: SmoothScrollIndicatorProps) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const thumbRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const idleTimeoutRef = useRef<number | null>(null);
  const progressRef = useRef({ target: 0, rendered: 0, maxScroll: 0 });

  useEffect(() => {
    const rail = railRef.current;
    const thumb = thumbRef.current;
    if (!rail || !thumb) return undefined;

    const travel = railHeight - thumbHeight;

    const setActive = (active: boolean) => {
      rail.dataset.active = String(active);
    };

    const scheduleIdle = () => {
      if (idleTimeoutRef.current !== null) window.clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = window.setTimeout(() => {
        setActive(false);
        idleTimeoutRef.current = null;
      }, idleDelay);
    };

    const updateDocumentHeight = () => {
      const { maxScroll } = getScrollMetrics();
      progressRef.current.maxScroll = maxScroll;
      rail.dataset.hidden = String(maxScroll <= 1);
    };

    const readProgress = () => {
      const lenis = getScrollController();
      const maxScroll = progressRef.current.maxScroll;
      const renderedScroll = lenis ? lenis.scroll : window.scrollY;
      return maxScroll > 0 ? Math.min(1, Math.max(0, renderedScroll / maxScroll)) : 0;
    };

    const render = () => {
      const progress = progressRef.current;
      progress.target = readProgress();
      const easing = reducedMotion ? 1 : 0.34;
      progress.rendered += (progress.target - progress.rendered) * easing;
      const remaining = Math.abs(progress.target - progress.rendered);
      if (remaining < 0.0008) {
        progress.rendered = progress.target;
      }

      thumb.style.transform = `translate3d(0, ${progress.rendered * travel}px, 0)`;
      if (remaining < 0.0008 && rail.dataset.active !== 'true') {
        frameRef.current = null;
      } else {
        frameRef.current = window.requestAnimationFrame(render);
      }
    };

    const startRender = () => {
      if (frameRef.current === null) {
        frameRef.current = window.requestAnimationFrame(render);
      }
    };

    const handleScrollActivity = () => {
      updateDocumentHeight();
      setActive(true);
      scheduleIdle();
      startRender();
    };

    const handleResize = () => {
      updateDocumentHeight();
      startRender();
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(document.documentElement);
    resizeObserver.observe(document.body);

    const lenis = getScrollController();
    lenis?.on('scroll', handleScrollActivity);
    window.addEventListener('scroll', handleScrollActivity, { passive: true });
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    updateDocumentHeight();
    progressRef.current.target = readProgress();
    progressRef.current.rendered = progressRef.current.target;
    thumb.style.transform = `translate3d(0, ${progressRef.current.rendered * travel}px, 0)`;
    startRender();

    return () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
      if (idleTimeoutRef.current !== null) window.clearTimeout(idleTimeoutRef.current);
      lenis?.off('scroll', handleScrollActivity);
      window.removeEventListener('scroll', handleScrollActivity);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      resizeObserver.disconnect();
    };
  }, [reducedMotion]);

  return (
    <div ref={railRef} className="smooth-scroll-indicator" aria-hidden="true" data-active="false" data-hidden="false">
      <div ref={thumbRef} className="smooth-scroll-indicator-thumb" />
    </div>
  );
}
