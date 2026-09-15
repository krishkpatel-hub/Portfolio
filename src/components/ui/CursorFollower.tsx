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
      target: null as EventTarget | null,
    };

    let frame: number | null = null;

    const stopFrame = () => {
      if (frame !== null) {
        cancelAnimationFrame(frame);
        frame = null;
      }
    };

    const setVisible = (visible: boolean) => {
      if (pointer.visible === visible) return;
      pointer.visible = visible;
      dot.dataset.visible = String(visible);
      ring.dataset.visible = String(visible);
    };

    const setInteractive = (target: EventTarget | null) => {
      const element = target instanceof Element ? target.closest(interactiveSelector) : null;
      const cursorMode = element?.getAttribute('data-cursor') ?? '';
      const interactive = Boolean(element);
      const label = cursorMode === 'view' ? 'VIEW' : cursorMode === 'drag' ? 'DRAG' : '';

      if (pointer.interactive === interactive && pointer.label === label) return;

      pointer.interactive = interactive;
      pointer.label = label;

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

    const animate = () => {
      const deltaX = pointer.targetX - pointer.ringX;
      const deltaY = pointer.targetY - pointer.ringY;
      pointer.ringX += deltaX * 0.22;
      pointer.ringY += deltaY * 0.22;

      if (Math.abs(deltaX) < 0.12 && Math.abs(deltaY) < 0.12) {
        pointer.ringX = pointer.targetX;
        pointer.ringY = pointer.targetY;
      }

      ring.style.transform = `translate3d(${pointer.ringX}px, ${pointer.ringY}px, 0) translate3d(-50%, -50%, 0)`;

      if (pointer.ringX === pointer.targetX && pointer.ringY === pointer.targetY) {
        frame = null;
      } else {
        frame = requestAnimationFrame(animate);
      }
    };

    const startFrame = () => {
      if (frame === null && pointer.visible) frame = requestAnimationFrame(animate);
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

      dot.style.transform = `translate3d(${pointer.targetX}px, ${pointer.targetY}px, 0) translate3d(-50%, -50%, 0)`;
      setVisible(true);
      if (pointer.target !== event.target) {
        pointer.target = event.target;
        setInteractive(event.target);
      }
      startFrame();
    };

    const handlePointerLeave = () => {
      setVisible(false);
      stopFrame();
    };
    const handlePointerEnter = () => {
      if (pointer.initialized) setVisible(true);
    };
    const handlePointerDown = () => updatePressed(true);
    const handlePointerUp = () => updatePressed(false);
    const handleBlur = () => {
      updatePressed(false);
      setVisible(false);
      stopFrame();
    };
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePressed(false);
        setVisible(false);
        stopFrame();
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave);
    window.addEventListener('pointerenter', handlePointerEnter);
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopFrame();
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
