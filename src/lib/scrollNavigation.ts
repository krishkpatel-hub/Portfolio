import type Lenis from 'lenis';

type HistoryMode = 'push' | 'replace' | 'none';

interface ScrollOptions {
  history?: HistoryMode;
  immediate?: boolean;
}

const navDuration = 1.12;
const navEaseOut = (time: number) => 1 - (1 - time) ** 3;

let activeLenis: Lenis | null = null;
let reducedMotionActive = false;

export function setScrollController(lenis: Lenis | null, reducedMotion: boolean) {
  activeLenis = lenis;
  reducedMotionActive = reducedMotion;
}

export function getScrollController() {
  return activeLenis;
}

export function getHeaderOffset() {
  const header = document.querySelector<HTMLElement>('[data-site-header]');
  const measuredHeight = header?.getBoundingClientRect().height ?? 64;
  return Math.ceil(measuredHeight + 18);
}

export function getTargetIdFromHash(hash: string) {
  const rawHash = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!rawHash) return '';

  try {
    return decodeURIComponent(rawHash);
  } catch {
    return rawHash;
  }
}

export function getScrollTarget(hash: string) {
  const id = getTargetIdFromHash(hash);
  if (!id) return null;
  return document.getElementById(id);
}

function writeHash(hash: string, mode: HistoryMode) {
  if (mode === 'none' || !hash || window.location.hash === hash) return;
  const nextUrl = `${window.location.pathname}${window.location.search}${hash}`;
  if (mode === 'replace') {
    window.history.replaceState(null, '', nextUrl);
  } else {
    window.history.pushState(null, '', nextUrl);
  }
}

export function scrollToHash(hash: string, { history = 'push', immediate = false }: ScrollOptions = {}) {
  const target = getScrollTarget(hash);
  if (!target) return false;

  writeHash(hash, history);

  if (activeLenis && !reducedMotionActive) {
    activeLenis.scrollTo(target, {
      offset: -getHeaderOffset(),
      immediate,
      duration: immediate ? 0 : navDuration,
      easing: navEaseOut,
      lock: false,
      force: true,
      userData: { source: 'section-navigation' },
    });
    return true;
  }

  const top = target.getBoundingClientRect().top + window.scrollY - getHeaderOffset();
  window.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
  return true;
}
