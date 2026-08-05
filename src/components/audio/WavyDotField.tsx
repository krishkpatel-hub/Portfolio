import { RefObject, useEffect, useRef } from 'react';

interface WavyDotFieldProps {
  analyserRef: RefObject<AnalyserNode | null>;
  isPlaying: boolean;
  reducedMotion: boolean;
}

interface PointBuffers {
  x: Float32Array;
  y: Float32Array;
  depth: Float32Array;
  mask: Float32Array;
  count: number;
}

const emptyPoints: PointBuffers = {
  x: new Float32Array(0),
  y: new Float32Array(0),
  depth: new Float32Array(0),
  mask: new Float32Array(0),
  count: 0,
};

function averageBand(data: ArrayLike<number>, startRatio: number, endRatio: number) {
  const start = Math.floor(data.length * startRatio);
  const end = Math.max(start + 1, Math.floor(data.length * endRatio));
  let total = 0;

  for (let index = start; index < end; index += 1) {
    total += data[index];
  }

  return total / (end - start) / 255;
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function WavyDotField({ analyserRef, isPlaying, reducedMotion }: WavyDotFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number | null>(null);
  const pointsRef = useRef<PointBuffers>(emptyPoints);
  const frequencyDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const visibleRef = useRef(true);
  const isPlayingRef = useRef(isPlaying);
  const reducedMotionRef = useRef(reducedMotion);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const energyRef = useRef({ bass: 0, mid: 0, high: 0, overall: 0 });
  const pointerRef = useRef({ active: false, x: 0.5, y: 0.72, sx: 0.5, sy: 0.72 });
  const finePointerRef = useRef(false);
  const sizeRef = useRef({ width: 0, height: 0, dpr: 1, mobile: false, tablet: false });

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
  }, [reducedMotion]);

  useEffect(() => {
    analyserNodeRef.current = analyserRef.current;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const context = canvas.getContext('2d', { alpha: true });
    if (!context) return undefined;

    const buildField = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      const mobile = width < 640;
      const tablet = width >= 640 && width < 1024;
      const spacing = mobile ? 26 : tablet ? 22 : 18;
      const columns = Math.ceil(width / spacing) + 2;
      const rows = Math.ceil(height / spacing) + 2;
      const count = columns * rows;
      const x = new Float32Array(count);
      const y = new Float32Array(count);
      const depth = new Float32Array(count);
      const mask = new Float32Array(count);
      let pointIndex = 0;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { width, height, dpr, mobile, tablet };

      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const px = column * spacing - spacing * 0.5;
          const py = row * spacing - spacing * 0.5;
          const nx = px / width;
          const ny = py / height;
          const centerDepth = 1 - Math.hypot((nx - 0.5) * 1.35, (ny - 0.67) * 1.15);
          const sideFade = Math.min(nx / 0.16, (1 - nx) / 0.16, 1);
          const topFade = clamp01((ny - 0.1) / 0.34);
          const bottomFade = clamp01((1 - ny) / 0.12);
          const textFade = 1 - clamp01((0.5 - ny) / 0.36) * 0.58;
          const lowerBias = clamp01((ny - 0.18) / 0.62);

          x[pointIndex] = px;
          y[pointIndex] = py;
          depth[pointIndex] = Math.max(0.08, centerDepth);
          mask[pointIndex] = Math.max(0, sideFade * topFade * bottomFade * textFade * (0.28 + lowerBias * 0.72));
          pointIndex += 1;
        }
      }

      pointsRef.current = { x, y, depth, mask, count };
    };

    const draw = (time = 0) => {
      const { width, height, mobile, tablet } = sizeRef.current;
      if (!width || !height) return;

      context.clearRect(0, 0, width, height);

      const points = pointsRef.current;
      const reduced = reducedMotionRef.current;
      const playing = isPlayingRef.current;
      const seconds = time * 0.001;
      const analyser = analyserNodeRef.current;

      if (analyser && (!frequencyDataRef.current || frequencyDataRef.current.length !== analyser.frequencyBinCount)) {
        frequencyDataRef.current = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
      }

      let bassTarget = 0;
      let midTarget = 0;
      let highTarget = 0;

      if (analyser && frequencyDataRef.current && playing && !reduced) {
        analyser.getByteFrequencyData(frequencyDataRef.current);
        bassTarget = averageBand(frequencyDataRef.current, 0.01, 0.13);
        midTarget = averageBand(frequencyDataRef.current, 0.13, 0.46);
        highTarget = averageBand(frequencyDataRef.current, 0.46, 0.88);
      }

      const energy = energyRef.current;
      const easing = playing ? 0.085 : 0.035;
      energy.bass += (bassTarget - energy.bass) * easing;
      energy.mid += (midTarget - energy.mid) * easing;
      energy.high += (highTarget - energy.high) * easing;
      const overallTarget = Math.min(0.82, bassTarget * 0.45 + midTarget * 0.36 + highTarget * 0.18);
      energy.overall += (overallTarget - energy.overall) * easing;

      const pointer = pointerRef.current;
      pointer.sx += (pointer.x - pointer.sx) * 0.06;
      pointer.sy += (pointer.y - pointer.sy) * 0.06;

      const audioLift = Math.min(1, energy.overall * 1.35);
      const densityFactor = mobile ? 0.64 : tablet ? 0.82 : 1;
      const amplitude = reduced ? 0 : (mobile ? 5.2 : tablet ? 7.5 : 10.5) + audioLift * (mobile ? 8 : 18);
      const focalAX = width * (0.48 + Math.sin(seconds * 0.075) * 0.18);
      const focalAY = height * (0.68 + Math.cos(seconds * 0.055) * 0.1);
      const focalBX = width * (0.62 + Math.cos(seconds * 0.052) * 0.22);
      const focalBY = height * (0.78 + Math.sin(seconds * 0.067) * 0.08);
      const pointerX = pointer.sx * width;
      const pointerY = pointer.sy * height;
      const pointerEnabled = pointer.active && !reduced && finePointerRef.current;

      context.globalCompositeOperation = 'source-over';

      for (let index = 0; index < points.count; index += 1) {
        const baseX = points.x[index];
        const baseY = points.y[index];
        const nx = baseX / width;
        const ny = baseY / height;
        const visibility = points.mask[index] * Math.max(0.08, points.depth[index]);
        if (visibility <= 0.015) continue;

        const distanceA = Math.hypot(baseX - focalAX, baseY - focalAY);
        const distanceB = Math.hypot(baseX - focalBX, baseY - focalBY);
        const lowerWeight = clamp01((ny - 0.18) / 0.72);
        const centerWeight = 1 - clamp01(Math.abs(nx - 0.5) / 0.5);
        const bassWeight = lowerWeight * (0.38 + centerWeight * 0.62);

        const ambientWave =
          Math.sin(baseX * 0.009 + seconds * 0.34) * 0.46 +
          Math.cos(baseY * 0.012 - seconds * 0.27) * 0.38 +
          Math.sin((baseX + baseY) * 0.006 + seconds * 0.18) * 0.28;
        const bassWave =
          Math.sin(distanceA * 0.013 - seconds * (0.72 + energy.bass * 1.7)) *
          (0.8 + energy.bass * 2.85) *
          bassWeight;
        const midWave =
          Math.sin(baseY * 0.023 + baseX * 0.006 + seconds * (0.9 + energy.mid * 1.2)) *
          energy.mid *
          1.35;
        const diagonalWave =
          Math.cos((baseX - baseY) * 0.012 - seconds * 0.58) *
          (0.25 + energy.mid * 0.85);
        const radialDetail = Math.sin(distanceB * 0.024 + seconds * 0.42) * (0.2 + energy.bass * 0.55);
        const highShimmer = Math.sin((baseX + baseY) * 0.062 + seconds * 3.2) * energy.high * 0.42;
        const pointerDistance = pointerEnabled ? Math.hypot(baseX - pointerX, baseY - pointerY) : 9999;
        const pointerWave = pointerEnabled ? Math.max(0, 1 - pointerDistance / 180) * Math.sin(pointerDistance * 0.035 - seconds * 1.7) * 0.55 : 0;
        const wave = ambientWave + bassWave + midWave + diagonalWave + radialDetail + highShimmer + pointerWave;

        const displacement = wave * amplitude * visibility;
        const xDrift = reduced ? 0 : (Math.cos(baseY * 0.016 + seconds * 0.32) * (1.2 + energy.mid * 4) + pointerWave * 4) * visibility;
        const crest = clamp01((wave + 2.4) / 4.8);
        const radius = (0.42 + visibility * 0.72 + crest * 0.34 + energy.bass * bassWeight * 0.72 + energy.high * 0.12) * densityFactor;
        const alpha = Math.min(
          0.5,
          (0.045 + visibility * 0.2 + crest * 0.055 + energy.mid * 0.06 + energy.high * 0.025) * (mobile ? 0.72 : 1),
        );

        context.beginPath();
        context.fillStyle = `rgba(231, 229, 228, ${alpha})`;
        context.arc(baseX + xDrift, baseY + displacement, Math.max(0.28, radius), 0, Math.PI * 2);
        context.fill();
      }
    };

    const animate = (time: number) => {
      draw(time);

      if (!reducedMotionRef.current && (visibleRef.current || isPlayingRef.current)) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        frameRef.current = null;
      }
    };

    const start = () => {
      if (frameRef.current === null && !reducedMotionRef.current) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    const stop = () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };

    const finePointerQuery = window.matchMedia('(pointer: fine)');
    finePointerRef.current = finePointerQuery.matches;
    const handlePointerCapabilityChange = (event: MediaQueryListEvent) => {
      finePointerRef.current = event.matches;
      if (!event.matches) pointerRef.current.active = false;
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!finePointerRef.current) return;
      const rect = canvas.getBoundingClientRect();
      pointerRef.current.active = true;
      pointerRef.current.x = clamp01((event.clientX - rect.left) / rect.width);
      pointerRef.current.y = clamp01((event.clientY - rect.top) / rect.height);
    };

    const handlePointerLeave = () => {
      pointerRef.current.active = false;
      pointerRef.current.x = 0.5;
      pointerRef.current.y = 0.72;
    };

    finePointerQuery.addEventListener('change', handlePointerCapabilityChange);

    buildField();
    draw(0);

    const resizeObserver = new ResizeObserver(() => {
      buildField();
      draw(0);
    });
    resizeObserver.observe(canvas);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = Boolean(entry?.isIntersecting);
        if (visibleRef.current || isPlayingRef.current) start();
        if (!visibleRef.current && !isPlayingRef.current) stop();
      },
      { rootMargin: '260px 0px' },
    );
    intersectionObserver.observe(canvas);

    canvas.parentElement?.addEventListener('pointermove', handlePointerMove);
    canvas.parentElement?.addEventListener('pointerleave', handlePointerLeave);

    if (!reducedMotionRef.current) start();

    return () => {
      stop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      finePointerQuery.removeEventListener('change', handlePointerCapabilityChange);
      canvas.parentElement?.removeEventListener('pointermove', handlePointerMove);
      canvas.parentElement?.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [analyserRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (reducedMotion && frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, [reducedMotion]);

  return <canvas ref={canvasRef} className="hero-wavy-dot-field" aria-hidden="true" />;
}
