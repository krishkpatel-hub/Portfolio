import { RefObject, useEffect, useRef } from 'react';

interface AudioDotGridProps {
  analyserRef: RefObject<AnalyserNode | null>;
  isPlaying: boolean;
  reducedMotion: boolean;
}

interface GridPoint {
  x: number;
  y: number;
  depth: number;
}

function averageBand(data: ArrayLike<number>, startRatio: number, endRatio: number) {
  const start = Math.floor(data.length * startRatio);
  const end = Math.max(start + 1, Math.floor(data.length * endRatio));
  let total = 0;

  for (let index = start; index < end; index += 1) {
    total += data[index];
  }

  return total / (end - start) / 255;
}

export function AudioDotGrid({ analyserRef, isPlaying, reducedMotion }: AudioDotGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number | null>(null);
  const pointsRef = useRef<GridPoint[]>([]);
  const frequencyDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const visibleRef = useRef(true);
  const energyRef = useRef({ bass: 0, mid: 0, high: 0 });
  const lastSizeRef = useRef({ width: 0, height: 0, dpr: 1 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const context = canvas.getContext('2d');
    if (!context) return undefined;

    const buildGrid = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      lastSizeRef.current = { width, height, dpr };

      const mobile = width < 640;
      const spacing = mobile ? 22 : width < 1024 ? 18 : 15;
      const points: GridPoint[] = [];

      for (let y = spacing * 0.5; y < height + spacing; y += spacing) {
        for (let x = spacing * 0.5; x < width + spacing; x += spacing) {
          const nx = x / width - 0.5;
          const ny = y / height - 0.5;
          const depth = Math.max(0.12, 1 - Math.hypot(nx * 1.3, ny * 1.7));
          points.push({ x, y, depth });
        }
      }

      pointsRef.current = points;
    };

    const draw = (time = 0) => {
      const { width, height } = lastSizeRef.current;
      if (!width || !height) return;

      context.clearRect(0, 0, width, height);

      const analyser = analyserRef.current;
      if (analyser && !frequencyDataRef.current) {
        frequencyDataRef.current = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
      }

      let bassTarget = 0;
      let midTarget = 0;
      let highTarget = 0;

      if (analyser && frequencyDataRef.current && isPlaying && !reducedMotion) {
        analyser.getByteFrequencyData(frequencyDataRef.current);
        bassTarget = averageBand(frequencyDataRef.current, 0.01, 0.14);
        midTarget = averageBand(frequencyDataRef.current, 0.14, 0.48);
        highTarget = averageBand(frequencyDataRef.current, 0.48, 0.9);
      }

      const energy = energyRef.current;
      const easing = isPlaying ? 0.1 : 0.045;
      energy.bass += (bassTarget - energy.bass) * easing;
      energy.mid += (midTarget - energy.mid) * easing;
      energy.high += (highTarget - energy.high) * easing;

      const seconds = time * 0.001;
      const focalX = width * (0.5 + Math.sin(seconds * 0.08) * 0.16);
      const focalY = height * (0.76 + Math.cos(seconds * 0.06) * 0.08);
      const bottomBiasStart = height * 0.18;
      const points = pointsRef.current;

      for (let index = 0; index < points.length; index += 1) {
        const point = points[index];
        const dx = point.x - focalX;
        const dy = point.y - focalY;
        const distance = Math.hypot(dx, dy);
        const bottomBias = Math.min(1, Math.max(0, (point.y - bottomBiasStart) / (height - bottomBiasStart)));
        const edgeFade = Math.min(point.x / (width * 0.18), (width - point.x) / (width * 0.18), 1);
        const verticalFade = Math.min(1, Math.max(0.08, bottomBias));
        const visibility = point.depth * edgeFade * verticalFade;

        const ambient = reducedMotion ? 0 : Math.sin(point.x * 0.018 + seconds * 0.32) * 1.2;
        const broadWave = reducedMotion
          ? 0
          : Math.sin(distance * 0.018 - seconds * (1.1 + energy.bass * 2.2)) * (3 + energy.bass * 18);
        const rollingWave = reducedMotion
          ? 0
          : Math.sin(point.y * 0.026 + point.x * 0.008 + seconds * 1.35) * energy.mid * 10;
        const shimmer = reducedMotion
          ? 0
          : Math.sin((point.x + point.y) * 0.07 + seconds * 4.5) * energy.high * 2.4;

        const displacement = (ambient + broadWave + rollingWave + shimmer) * visibility;
        const radius = (reducedMotion ? 0.85 : 0.75 + energy.bass * 1.45 + energy.high * 0.45) * visibility;
        const alpha = Math.min(0.5, 0.08 + visibility * (0.22 + energy.mid * 0.18 + energy.high * 0.08));

        context.beginPath();
        context.fillStyle = `rgba(231, 229, 228, ${alpha})`;
        context.arc(point.x, point.y + displacement, Math.max(0.35, radius), 0, Math.PI * 2);
        context.fill();
      }
    };

    const animate = (time: number) => {
      draw(time);

      if (visibleRef.current || isPlaying) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        frameRef.current = null;
      }
    };

    const start = () => {
      if (frameRef.current === null) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    buildGrid();
    draw();

    const resizeObserver = new ResizeObserver(() => {
      buildGrid();
      draw();
    });
    resizeObserver.observe(canvas);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = Boolean(entry?.isIntersecting);
        if (visibleRef.current || isPlaying) start();
      },
      { rootMargin: '240px 0px' },
    );
    intersectionObserver.observe(canvas);

    if (!reducedMotion) start();

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [analyserRef, isPlaying, reducedMotion]);

  return <canvas ref={canvasRef} className="hero-audio-grid" aria-hidden="true" />;
}
