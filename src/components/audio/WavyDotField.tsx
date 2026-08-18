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
  row: Float32Array;
  count: number;
  spacing: number;
  wrapWidth: number;
}

interface MeshEnergy {
  bass: number;
  mid: number;
  high: number;
  bassAverage: number;
  motion: number;
  cooldown: number;
}

interface MeshPhase {
  x: number;
  lastTime: number;
}

interface PulseBuffers {
  x: Float32Array;
  age: Float32Array;
  amplitude: Float32Array;
  active: Uint8Array;
  writeIndex: number;
}

const emptyPoints: PointBuffers = {
  x: new Float32Array(0),
  y: new Float32Array(0),
  depth: new Float32Array(0),
  mask: new Float32Array(0),
  row: new Float32Array(0),
  count: 0,
  spacing: 22,
  wrapWidth: 1,
};

const maxDevicePixelRatio = 1.5;
const targetFrameInterval = 1000 / 48;
const pulseCount = 8;

const meshTuning = {
  desktopSpacing: 15,
  tabletSpacing: 18,
  mobileSpacing: 24,
  idleSpeed: 6,
  playSpeed: 34,
  idleWaveHeight: 3.5,
  playWaveHeight: 13,
  bassWaveHeight: 26,
  bassLateralShift: 16,
  midRippleHeight: 8,
  highBrightness: 0.055,
  pulseSpeed: 520,
  pulseWidth: 210,
  pulseHeight: 32,
  pulseLateralShift: 20,
  pulseDamping: 0.76,
  bassPeakThreshold: 0.105,
  bassPeakFloor: 0.18,
  bassPeakCooldown: 0.28,
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function clamp01(value: number) {
  return clamp(value, 0, 1);
}

function wrap(value: number, length: number) {
  return ((value % length) + length) % length;
}

function smoothEnvelope(current: number, target: number, attack: number, release: number) {
  return current + (target - current) * (target > current ? attack : release);
}

export function WavyDotField({ analyserRef, isPlaying, reducedMotion }: WavyDotFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number | null>(null);
  const pointsRef = useRef<PointBuffers>(emptyPoints);
  const frequencyDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const visibleRef = useRef(true);
  const documentVisibleRef = useRef(true);
  const isPlayingRef = useRef(isPlaying);
  const reducedMotionRef = useRef(reducedMotion);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const energyRef = useRef<MeshEnergy>({ bass: 0, mid: 0, high: 0, bassAverage: 0, motion: 0, cooldown: 0 });
  const phaseRef = useRef<MeshPhase>({ x: 0, lastTime: 0 });
  const pulsesRef = useRef<PulseBuffers>({
    x: new Float32Array(pulseCount),
    age: new Float32Array(pulseCount),
    amplitude: new Float32Array(pulseCount),
    active: new Uint8Array(pulseCount),
    writeIndex: 0,
  });
  const sizeRef = useRef({ width: 0, height: 0, dpr: 1, mobile: false, tablet: false });
  const lastFrameTimeRef = useRef(0);

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
      const dpr = Math.min(window.devicePixelRatio || 1, maxDevicePixelRatio);
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      const mobile = width < 640;
      const tablet = width >= 640 && width < 1024;
      const spacing = reducedMotionRef.current
        ? mobile
          ? meshTuning.mobileSpacing + 10
          : meshTuning.tabletSpacing + 8
        : mobile
          ? meshTuning.mobileSpacing
          : tablet
            ? meshTuning.tabletSpacing
            : meshTuning.desktopSpacing;
      const columns = Math.ceil(width / spacing) + 8;
      const rows = Math.ceil(height / spacing) + 5;
      const count = columns * rows;
      const x = new Float32Array(count);
      const y = new Float32Array(count);
      const depth = new Float32Array(count);
      const mask = new Float32Array(count);
      const row = new Float32Array(count);
      const wrapWidth = columns * spacing;
      let pointIndex = 0;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { width, height, dpr, mobile, tablet };

      for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
        for (let column = 0; column < columns; column += 1) {
          const baseX = column * spacing;
          const baseY = rowIndex * spacing - spacing;
          const nx = baseX / width;
          const ny = baseY / height;
          const horizon = clamp01((ny - 0.02) / 0.95);
          const centerDepth = 1 - Math.hypot((nx - 0.5) * 0.84, (ny - 0.62) * 1.12);
          const sideFade = Math.min(nx / 0.12, (1 - nx) / 0.12, 1);
          const topFade = clamp01((ny - 0.06) / 0.28);
          const bottomFade = clamp01((1 - ny) / 0.14);
          const textFade = 1 - clamp01((0.55 - ny) / 0.42) * 0.68;
          const controlFade = 1 - clamp01((ny - 0.74) / 0.26) * 0.28;

          x[pointIndex] = baseX;
          y[pointIndex] = baseY;
          row[pointIndex] = rowIndex;
          depth[pointIndex] = clamp(0.22 + horizon * 0.78 + centerDepth * 0.24, 0.16, 1.22);
          mask[pointIndex] = Math.max(0, sideFade * topFade * bottomFade * textFade * controlFade);
          pointIndex += 1;
        }
      }

      pointsRef.current = { x, y, depth, mask, row, count, spacing, wrapWidth };
      phaseRef.current.x = wrap(phaseRef.current.x, wrapWidth);
    };

    const triggerPulse = (bass: number) => {
      const pulses = pulsesRef.current;
      const index = pulses.writeIndex;
      const { width } = sizeRef.current;

      pulses.x[index] = -width * 0.22;
      pulses.age[index] = 0;
      pulses.amplitude[index] = clamp((bass - energyRef.current.bassAverage) * 2.6, 0.18, 0.95);
      pulses.active[index] = 1;
      pulses.writeIndex = (index + 1) % pulseCount;
    };

    const updateAudio = (deltaSeconds: number) => {
      const reduced = reducedMotionRef.current;
      const playing = isPlayingRef.current;
      const analyser = analyserNodeRef.current;

      let bassTarget = 0;
      let midTarget = 0;
      let highTarget = 0;

      if (analyser && playing && !reduced) {
        if (!frequencyDataRef.current || frequencyDataRef.current.length !== analyser.frequencyBinCount) {
          frequencyDataRef.current = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
        }

        analyser.getByteFrequencyData(frequencyDataRef.current);
        bassTarget = averageBand(frequencyDataRef.current, 0.015, 0.12);
        midTarget = averageBand(frequencyDataRef.current, 0.14, 0.46);
        highTarget = averageBand(frequencyDataRef.current, 0.54, 0.88);
      }

      const energy = energyRef.current;
      energy.bass = smoothEnvelope(energy.bass, bassTarget, 0.36, 0.075);
      energy.mid = smoothEnvelope(energy.mid, midTarget, 0.22, 0.055);
      energy.high = smoothEnvelope(energy.high, highTarget, 0.18, 0.045);
      energy.motion = smoothEnvelope(energy.motion, playing && !reduced ? 1 : 0, 0.045, 0.035);
      energy.bassAverage += (bassTarget - energy.bassAverage) * 0.018;
      energy.cooldown = Math.max(0, energy.cooldown - deltaSeconds);

      const threshold = Math.max(meshTuning.bassPeakFloor, energy.bassAverage + meshTuning.bassPeakThreshold);
      if (playing && !reduced && energy.cooldown <= 0 && bassTarget > threshold && energy.bass > energy.bassAverage + 0.08) {
        triggerPulse(energy.bass);
        energy.cooldown = meshTuning.bassPeakCooldown;
      }
    };

    const updatePulses = (deltaSeconds: number) => {
      const pulses = pulsesRef.current;
      const { width } = sizeRef.current;

      for (let index = 0; index < pulseCount; index += 1) {
        if (!pulses.active[index]) continue;
        pulses.age[index] += deltaSeconds;
        pulses.x[index] += meshTuning.pulseSpeed * deltaSeconds;
        pulses.amplitude[index] *= Math.pow(meshTuning.pulseDamping, deltaSeconds * 8);

        if (pulses.x[index] > width * 1.28 || pulses.amplitude[index] < 0.018) {
          pulses.active[index] = 0;
          pulses.amplitude[index] = 0;
        }
      }
    };

    const draw = (time = 0) => {
      const { width, height, mobile, tablet } = sizeRef.current;
      if (!width || !height) return;

      const points = pointsRef.current;
      const reduced = reducedMotionRef.current;
      const energy = energyRef.current;
      const phase = phaseRef.current;
      const seconds = time * 0.001;
      const deltaSeconds = phase.lastTime ? clamp(seconds - phase.lastTime, 0.001, 0.05) : 1 / 48;
      phase.lastTime = seconds;

      updateAudio(deltaSeconds);
      updatePulses(deltaSeconds);

      const speed = reduced
        ? meshTuning.idleSpeed * 0.18
        : meshTuning.idleSpeed + (meshTuning.playSpeed - meshTuning.idleSpeed) * energy.motion;
      phase.x = wrap(phase.x + speed * deltaSeconds, points.wrapWidth);

      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = 'source-over';

      const motion = reduced ? 0 : energy.motion;
      const bass = reduced ? 0 : energy.bass;
      const mid = reduced ? 0 : energy.mid;
      const high = reduced ? 0 : energy.high;
      const densityScale = mobile ? 0.74 : tablet ? 0.88 : 1;
      const waveHeight = meshTuning.idleWaveHeight + meshTuning.playWaveHeight * motion + meshTuning.bassWaveHeight * bass;
      const lateralShift = reduced ? 0 : meshTuning.bassLateralShift * bass + 3 * motion;
      const perspectiveCenterX = width * 0.52;

      for (let index = 0; index < points.count; index += 1) {
        const baseX = points.x[index];
        const baseY = points.y[index];
        const renderX = wrap(baseX + phase.x, points.wrapWidth) - points.spacing * 4;
        if (renderX < -points.spacing * 2 || renderX > width + points.spacing * 2) continue;

        const ny = baseY / height;
        const depth = points.depth[index];
        const visibility = points.mask[index] * clamp(depth, 0.12, 1);
        if (visibility <= 0.012) continue;

        const perspective = 0.58 + depth * 0.52;
        const projectedX = perspectiveCenterX + (renderX - perspectiveCenterX) * perspective;
        const projectedY = baseY * (0.72 + depth * 0.28) + height * (1 - depth) * 0.08;
        const meshX = baseX + phase.x;
        const meshY = baseY;
        const broadWaveA = Math.sin(meshX * 0.010 + meshY * 0.006 + seconds * (0.55 + motion * 0.42));
        const broadWaveB = Math.sin(meshX * -0.0065 + meshY * 0.012 - seconds * (0.38 + motion * 0.28));
        const broadWaveC = Math.cos((meshX + meshY * 1.45) * 0.0048 + seconds * (0.24 + motion * 0.2));
        const midRipple = Math.sin(meshX * 0.026 + meshY * 0.018 + seconds * 1.16) * mid * meshTuning.midRippleHeight;

        let pulseWave = 0;
        let pulseShift = 0;
        const pulses = pulsesRef.current;
        for (let pulseIndex = 0; pulseIndex < pulseCount; pulseIndex += 1) {
          if (!pulses.active[pulseIndex]) continue;
          const distance = projectedX - pulses.x[pulseIndex];
          const envelope = Math.exp(-(distance * distance) / (meshTuning.pulseWidth * meshTuning.pulseWidth));
          const wave = Math.sin(distance * 0.035 - pulses.age[pulseIndex] * 3.6) * envelope * pulses.amplitude[pulseIndex];
          pulseWave += wave;
          pulseShift += Math.cos(distance * 0.018) * envelope * pulses.amplitude[pulseIndex];
        }

        const terrain = broadWaveA * 0.54 + broadWaveB * 0.34 + broadWaveC * 0.28;
        const lowerWeight = clamp01((ny - 0.1) / 0.82);
        const edgeReadability = 1 - clamp01((0.54 - ny) / 0.38) * 0.62;
        const yDisplacement =
          terrain * waveHeight * visibility * (0.42 + lowerWeight * 0.74) +
          midRipple * visibility +
          pulseWave * meshTuning.pulseHeight * visibility;
        const xDisplacement =
          (terrain * lateralShift + pulseShift * meshTuning.pulseLateralShift) * visibility +
          Math.sin(points.row[index] * 0.42 + seconds * 0.24) * 1.8 * motion * visibility;
        const crest = clamp01((terrain + 1.5) / 3 + pulseWave * 0.24 + bass * 0.16);
        const radius = Math.max(
          0.32,
          (0.34 + depth * 0.42 + crest * 0.34 + bass * 0.42 + Math.abs(pulseWave) * 0.52) * densityScale,
        );
        const alpha = Math.min(
          0.54,
          (0.05 + visibility * 0.2 + crest * 0.07 + bass * 0.08 + mid * 0.035 + high * meshTuning.highBrightness) *
            edgeReadability *
            (mobile ? 0.78 : 1),
        );

        context.beginPath();
        context.fillStyle = `rgba(231, 229, 228, ${alpha})`;
        context.arc(projectedX + xDisplacement, projectedY + yDisplacement, radius, 0, Math.PI * 2);
        context.fill();
      }
    };

    const animate = (time: number) => {
      const shouldRender = documentVisibleRef.current && (visibleRef.current || isPlayingRef.current);

      if (!shouldRender) {
        frameRef.current = null;
        return;
      }

      if (time - lastFrameTimeRef.current >= targetFrameInterval) {
        lastFrameTimeRef.current = time;
        draw(time);
      }

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

    const handleVisibilityChange = () => {
      documentVisibleRef.current = document.visibilityState !== 'hidden';
      if (documentVisibleRef.current && (visibleRef.current || isPlayingRef.current)) {
        start();
      } else {
        stop();
      }
    };

    buildField();
    draw(0);

    const resizeObserver = new ResizeObserver(() => {
      buildField();
      draw(0);
      start();
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

    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (!reducedMotionRef.current) start();

    return () => {
      stop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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
