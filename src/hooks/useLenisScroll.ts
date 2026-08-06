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
      lerp: 0.075,
      smoothWheel: true,
      syncTouch: false,
      infinite: false,
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      wheelMultiplier: 0.9,
      anchors: false,
      autoRaf: false,
      prevent: (node) => Boolean(node.closest('[data-lenis-prevent], [data-lenis-prevent-wheel], [data-lenis-prevent-touch]')),
    });
    setScrollController(lenis, false);

    const update = (time: number) => {
      lenis.raf(time * 1000);
    };

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);
    refreshAfterReady();

    return () => {
      setScrollController(null, reducedMotion);
      lenis.off('scroll', ScrollTrigger.update);
      gsap.ticker.remove(update);
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
