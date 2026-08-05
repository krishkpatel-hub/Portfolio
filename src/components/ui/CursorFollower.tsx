import { useEffect, useRef, useState } from 'react';

const interactiveSelector = [
  'a',
  'button',
  'input',
  'textarea',
  'select',
  '[role="button"]',
  '[data-cursor="interactive"]',
  '[data-cursor="view"]',
  '[data-cursor="drag"]',
].join(',');

export function CursorFollower() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const pointerQuery = window.matchMedia('(pointer: fine) and (hover: hover)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateEnabled = () => setEnabled(pointerQuery.matches && !motionQuery.matches);

    updateEnabled();
    pointerQuery.addEventListener('change', updateEnabled);
    motionQuery.addEventListener('change', updateEnabled);

    return () => {
      pointerQuery.removeEventListener('change', updateEnabled);
      motionQuery.removeEventListener('change', updateEnabled);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return undefined;

    const pointer = {
      targetX: 0,
      targetY: 0,
      ringX: 0,
      ringY: 0,
      initialized: false,
      visible: false,
      interactive: false,
      pressed: false,
      label: '',
    };

    let frame = 0;

    const setVisible = (visible: boolean) => {
      pointer.visible = visible;
      dot.dataset.visible = String(visible);
      ring.dataset.visible = String(visible);
    };

    const setInteractive = (target: EventTarget | null) => {
      const element = target instanceof Element ? target.closest(interactiveSelector) : null;
      const cursorMode = element?.getAttribute('data-cursor') ?? '';
      const interactive = Boolean(element);

      pointer.interactive = interactive;
      pointer.label = cursorMode === 'view' ? 'VIEW' : cursorMode === 'drag' ? 'DRAG' : '';

      dot.dataset.interactive = String(interactive);
      ring.dataset.interactive = String(interactive);
      ring.dataset.cursorLabel = pointer.label;
      ring.textContent = pointer.label;
    };

    const updatePressed = (pressed: boolean) => {
      pointer.pressed = pressed;
      dot.dataset.pressed = String(pressed);
      ring.dataset.pressed = String(pressed);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;

      pointer.targetX = event.clientX;
      pointer.targetY = event.clientY;

      if (!pointer.initialized) {
        pointer.ringX = event.clientX;
        pointer.ringY = event.clientY;
        pointer.initialized = true;
      }

      setVisible(true);
      setInteractive(event.target);
    };

    const handlePointerLeave = () => setVisible(false);
    const handlePointerEnter = () => {
      if (pointer.initialized) setVisible(true);
    };
    const handlePointerDown = () => updatePressed(true);
    const handlePointerUp = () => updatePressed(false);
    const handleBlur = () => {
      updatePressed(false);
      setVisible(false);
    };
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePressed(false);
        setVisible(false);
      }
    };

    const animate = () => {
      if (pointer.initialized) {
        pointer.ringX += (pointer.targetX - pointer.ringX) * 0.15;
        pointer.ringY += (pointer.targetY - pointer.ringY) * 0.15;

        dot.style.transform = `translate3d(${pointer.targetX}px, ${pointer.targetY}px, 0) translate3d(-50%, -50%, 0)`;
        ring.style.transform = `translate3d(${pointer.ringX}px, ${pointer.ringY}px, 0) translate3d(-50%, -50%, 0)`;
      }

      frame = requestAnimationFrame(animate);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave);
    window.addEventListener('pointerenter', handlePointerEnter);
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('pointerenter', handlePointerEnter);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
    </>
  );
}
