import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scrollToHash, setScrollController } from '../lib/scrollNavigation';

gsap.registerPlugin(ScrollTrigger);

export function useLenisScroll(reducedMotion: boolean) {
  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';

    const refreshLayout = () => {
      ScrollTrigger.refresh();
    };

    const settleHash = (immediate = true) => {
      if (window.location.hash) {
        scrollToHash(window.location.hash, { history: 'none', immediate });
      }
    };

    const handleHistoryScroll = () => {
      window.requestAnimationFrame(() => settleHash(true));
    };

    const refreshAfterReady = () => {
      window.requestAnimationFrame(() => {
        refreshLayout();
        settleHash(true);
      });
    };

    window.addEventListener('popstate', handleHistoryScroll);
    window.addEventListener('hashchange', handleHistoryScroll);
    window.addEventListener('load', refreshAfterReady, { once: true });
    window.addEventListener('resize', refreshLayout);
    window.addEventListener('orientationchange', refreshLayout);

    document.fonts?.ready.then(refreshAfterReady).catch(() => undefined);

    if (reducedMotion) {
      setScrollController(null, true);
      refreshAfterReady();

      return () => {
        setScrollController(null, true);
        window.history.scrollRestoration = previousScrollRestoration;
        window.removeEventListener('popstate', handleHistoryScroll);
        window.removeEventListener('hashchange', handleHistoryScroll);
        window.removeEventListener('load', refreshAfterReady);
        window.removeEventListener('resize', refreshLayout);
        window.removeEventListener('orientationchange', refreshLayout);
      };
    }

    const lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1,
      infinite: false,
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      wheelMultiplier: 0.9,
      anchors: false,
      autoRaf: false,
      prevent: (node) => Boolean(node.closest('[data-lenis-prevent], [data-lenis-prevent-wheel], [data-lenis-prevent-touch]')),
    });
    let frame: number | null = null;

    const update = (time: number) => {
      frame = null;
      lenis.raf(time);
      if (lenis.isScrolling) startDriver();
    };

    const startDriver = () => {
      if (frame === null && document.visibilityState !== 'hidden') {
        frame = window.requestAnimationFrame(update);
      }
    };

    const stopDriver = () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = null;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') stopDriver();
      else if (lenis.isScrolling) startDriver();
    };

    setScrollController(lenis, false, startDriver);
    lenis.on('virtual-scroll', startDriver);
    lenis.on('scroll', ScrollTrigger.update);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    refreshAfterReady();

    return () => {
      setScrollController(null, reducedMotion);
      stopDriver();
      lenis.off('virtual-scroll', startDriver);
      lenis.off('scroll', ScrollTrigger.update);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      lenis.destroy();
      window.history.scrollRestoration = previousScrollRestoration;
      window.removeEventListener('popstate', handleHistoryScroll);
      window.removeEventListener('hashchange', handleHistoryScroll);
      window.removeEventListener('load', refreshAfterReady);
      window.removeEventListener('resize', refreshLayout);
      window.removeEventListener('orientationchange', refreshLayout);
    };
  }, [reducedMotion]);
}
