import { RefObject, useEffect } from 'react';

export function useMagnetic<T extends HTMLElement>(ref: RefObject<T | null>, disabled = false) {
  useEffect(() => {
    const element = ref.current;
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    if (!element || disabled || !finePointer) return undefined;

    const handleMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      element.style.transform = `translate3d(${x * 0.16}px, ${y * 0.2}px, 0)`;
    };

    const handleLeave = () => {
      element.style.transform = 'translate3d(0, 0, 0)';
    };

    element.addEventListener('pointermove', handleMove);
    element.addEventListener('pointerleave', handleLeave);

    return () => {
      element.removeEventListener('pointermove', handleMove);
      element.removeEventListener('pointerleave', handleLeave);
    };
  }, [disabled, ref]);
}
