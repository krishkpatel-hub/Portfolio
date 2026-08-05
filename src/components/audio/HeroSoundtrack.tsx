import {
  ListMusic,
  Loader2,
  Pause,
  Play,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AudioDotGrid } from './AudioDotGrid';
import { playlistLabel, playlistTracks, type PlaylistTrack } from '../../data/playlist';
import { cn } from '../../lib/utils';

interface HeroSoundtrackProps {
  reducedMotion: boolean;
}

type PlaybackState = 'paused' | 'playing' | 'loading' | 'unavailable';

const volumeKey = 'portfolio-soundtrack-volume';
const shuffleKey = 'portfolio-soundtrack-shuffle';

function formatTime(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '0:00';
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function getStoredVolume() {
  const stored = Number(window.localStorage.getItem(volumeKey));
  return Number.isFinite(stored) ? Math.min(1, Math.max(0, stored)) : 0.72;
}

function getStoredShuffle() {
  return window.localStorage.getItem(shuffleKey) === 'true';
}

function pickRandomTrackIndex(choices: Array<{ index: number }>) {
  return choices[Math.floor(Math.random() * choices.length)].index;
}

export function HeroSoundtrack({ reducedMotion }: HeroSoundtrackProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const playlistRef = useRef<HTMLDivElement | null>(null);
  const playTrackRef = useRef<(index?: number, fromAutoAdvance?: boolean) => Promise<void>>(async () => undefined);
  const getNextIndexRef = useRef<(direction: 1 | -1, allowShuffle?: boolean) => number>(() => 0);
  const markUnavailableRef = useRef<(track: PlaylistTrack) => void>(() => undefined);
  const currentIndexRef = useRef(0);
  const shuffleRef = useRef(false);
  const unavailableRef = useRef<Set<string>>(new Set());
  const intentionallyPlayingRef = useRef(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('paused');
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [durations, setDurations] = useState<Record<string, number>>({});
  const [unavailableIds, setUnavailableIds] = useState<string[]>([]);
  const [volume, setVolume] = useState(getStoredVolume);
  const [muted, setMuted] = useState(false);
  const [shuffleEnabled, setShuffleEnabled] = useState(getStoredShuffle);
  const [announcement, setAnnouncement] = useState('');

  const currentTrack = playlistTracks[currentIndex];
  const unavailable = unavailableIds.includes(currentTrack.id);
  const duration = durations[currentTrack.id] ?? currentTrack.duration ?? 0;

  const numberedTracks = useMemo(
    () =>
      playlistTracks.map((track, index) => ({
        ...track,
        number: String(index + 1).padStart(2, '0'),
      })),
    [],
  );

  useEffect(() => {
    shuffleRef.current = shuffleEnabled;
    window.localStorage.setItem(shuffleKey, String(shuffleEnabled));
  }, [shuffleEnabled]);

  useEffect(() => {
    window.localStorage.setItem(volumeKey, String(volume));
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.muted = muted;
  }, [muted]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    if (!playlistOpen) return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      if (!playlistRef.current?.contains(event.target as Node)) {
        setPlaylistOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPlaylistOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [playlistOpen]);

  const ensureAudioGraph = async () => {
    const audio = audioRef.current;
    if (!audio) return false;

    const audioWindow = window as typeof window & { webkitAudioContext?: typeof AudioContext };
    const AudioContextConstructor = audioWindow.AudioContext || audioWindow.webkitAudioContext;
    if (!AudioContextConstructor) return false;
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextConstructor();
    }

    if (!sourceNodeRef.current) {
      const context = audioContextRef.current;
      const analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.82;

      const source = context.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(context.destination);

      sourceNodeRef.current = source;
      analyserRef.current = analyser;
    }

    if (audioContextRef.current.state === 'suspended') {
      await Promise.race([
        audioContextRef.current.resume(),
        new Promise<void>((_, reject) => {
          window.setTimeout(() => reject(new Error('AudioContext resume timed out')), 1400);
        }),
      ]);
    }

    return audioContextRef.current.state === 'running';
  };

  const loadTrack = (track: PlaylistTrack, index: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.src = track.source;
    audio.currentTime = 0;
    audio.load();
    currentIndexRef.current = index;
    setCurrentIndex(index);
    setCurrentTime(0);
    setPlaybackState('loading');
    setAnnouncement(`${track.title} selected`);
  };

  const getNextIndex = (direction: 1 | -1, allowShuffle = shuffleRef.current) => {
    const unavailableIds = unavailableRef.current;
    const available = playlistTracks
      .map((track, index) => ({ track, index }))
      .filter(({ track }) => !unavailableIds.has(track.id));

    if (!available.length) return currentIndexRef.current;

    if (allowShuffle && available.length > 1) {
      const choices = available.filter(({ index }) => index !== currentIndexRef.current);
      return pickRandomTrackIndex(choices);
    }

    for (let offset = 1; offset <= playlistTracks.length; offset += 1) {
      const candidate = (currentIndexRef.current + direction * offset + playlistTracks.length) % playlistTracks.length;
      if (!unavailableIds.has(playlistTracks[candidate].id)) return candidate;
    }

    return currentIndexRef.current;
  };

  const markUnavailable = (track: PlaylistTrack) => {
    unavailableRef.current.add(track.id);
    setUnavailableIds(Array.from(unavailableRef.current));
    intentionallyPlayingRef.current = false;
    setPlaybackState('unavailable');
    setAnnouncement(`${track.title} unavailable`);
  };

  const playTrack = async (index = currentIndexRef.current, fromAutoAdvance = false) => {
    const audio = audioRef.current;
    const track = playlistTracks[index];
    if (!audio || !track) return;

    if (unavailableRef.current.has(track.id)) {
      markUnavailable(track);
      return;
    }

    try {
      setPlaybackState('loading');
      const graphReady = await ensureAudioGraph();
      if (!graphReady) {
        markUnavailable(track);
        return;
      }

      if (currentIndexRef.current !== index || audio.src !== new URL(track.source, window.location.href).href) {
        loadTrack(track, index);
      }

      intentionallyPlayingRef.current = true;
      await audio.play();
      setAnnouncement(`${track.title} playing`);
    } catch {
      intentionallyPlayingRef.current = false;
      if (fromAutoAdvance) {
        const nextIndex = getNextIndex(1, shuffleRef.current);
        if (nextIndex !== index) void playTrack(nextIndex, true);
      } else {
        markUnavailable(track);
      }
    }
  };

  useEffect(() => {
    playTrackRef.current = playTrack;
    getNextIndexRef.current = getNextIndex;
    markUnavailableRef.current = markUnavailable;
  });

  const pauseTrack = () => {
    intentionallyPlayingRef.current = false;
    audioRef.current?.pause();
    setPlaybackState('paused');
    setAnnouncement(`${currentTrack.title} paused`);
  };

  const selectTrack = (index: number) => {
    const shouldContinue = playbackState === 'playing' || playbackState === 'loading';
    loadTrack(playlistTracks[index], index);
    if (shouldContinue) void playTrack(index);
  };

  const handlePrevious = () => {
    const index = getNextIndex(-1, false);
    selectTrack(index);
  };

  const handleNext = () => {
    const index = getNextIndex(1, shuffleEnabled);
    selectTrack(index);
  };

  const handleSeek = (value: string) => {
    const audio = audioRef.current;
    const nextTime = Number(value);
    if (!audio || !Number.isFinite(nextTime)) return;
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.src = playlistTracks[0].source;
    audio.volume = getStoredVolume();
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      setPlaybackState((state) => (state === 'loading' ? 'paused' : state));
      if (Number.isFinite(audio.duration)) {
        setDurations((previous) => ({ ...previous, [playlistTracks[currentIndexRef.current].id]: audio.duration }));
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleWaiting = () => {
      if (intentionallyPlayingRef.current) setPlaybackState('loading');
    };

    const handlePlaying = () => {
      const activeTrack = playlistTracks[currentIndexRef.current];
      unavailableRef.current.delete(activeTrack.id);
      setUnavailableIds(Array.from(unavailableRef.current));
      setPlaybackState('playing');
    };

    const handlePause = () => {
      if (!audio.ended) setPlaybackState('paused');
    };

    const handleEnded = () => {
      void playTrackRef.current(getNextIndexRef.current(1, true), true);
    };

    const handleError = () => {
      markUnavailableRef.current(playlistTracks[currentIndexRef.current]);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.load();

    return () => {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audioRef.current = null;
      audioContextRef.current?.close().catch(() => undefined);
      audioContextRef.current = null;
      sourceNodeRef.current = null;
      analyserRef.current = null;
    };
  }, []);

  return (
    <>
      <AudioDotGrid analyserRef={analyserRef} isPlaying={playbackState === 'playing'} reducedMotion={reducedMotion} />
      <div className="hero-soundtrack" ref={playlistRef}>
        <div className="sr-only" aria-live="polite">
          {announcement}
        </div>

        {playlistOpen ? (
          <div className="soundtrack-playlist" role="dialog" aria-label={`${playlistLabel} playlist`}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="font-mono text-xs uppercase tracking-normal soft-dim">{playlistLabel}</p>
              <button type="button" className="soundtrack-icon-button" aria-label="Close playlist" onClick={() => setPlaylistOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto pr-1">
              {numberedTracks.map((track, index) => {
                const selected = index === currentIndex;
                const trackUnavailable = unavailableIds.includes(track.id);
                return (
                  <button
                    type="button"
                    key={track.id}
                    className={cn('soundtrack-track-button', selected && 'is-selected')}
                    aria-current={selected ? 'true' : undefined}
                    onClick={() => selectTrack(index)}
                    disabled={trackUnavailable}
                  >
                    <span className="font-mono text-[0.68rem] soft-dim">{track.number}</span>
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block truncate">{track.title}</span>
                      <span className="mt-0.5 block truncate font-mono text-[0.66rem] uppercase tracking-normal soft-dim">
                        {trackUnavailable ? 'Track unavailable' : selected && playbackState === 'playing' ? 'Now playing' : track.artist}
                      </span>
                    </span>
                    <span className="font-mono text-[0.66rem] soft-dim">{formatTime(durations[track.id] ?? 0)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="soundtrack-shell" aria-label={playlistLabel}>
          <button
            type="button"
            className="soundtrack-icon-button is-primary"
            aria-label={playbackState === 'playing' ? 'Pause soundtrack' : 'Play soundtrack'}
            onClick={() => (playbackState === 'playing' ? pauseTrack() : void playTrack())}
          >
            {playbackState === 'loading' ? <Loader2 className="animate-spin" size={17} /> : playbackState === 'playing' ? <Pause size={17} /> : <Play size={17} />}
          </button>

          <button type="button" className="soundtrack-icon-button" aria-label="Previous track" onClick={handlePrevious}>
            <SkipBack size={16} />
          </button>

          <button type="button" className="soundtrack-icon-button" aria-label="Next track" onClick={handleNext}>
            <SkipForward size={16} />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <p className="truncate font-mono text-[0.72rem] uppercase tracking-normal text-[var(--text)]">
                {unavailable || playbackState === 'unavailable' ? 'Track unavailable' : currentTrack.title}
              </p>
              <p className="shrink-0 font-mono text-[0.66rem] soft-dim">
                {formatTime(currentTime)} / {formatTime(duration)}
              </p>
            </div>
            <input
              className="soundtrack-range mt-2"
              type="range"
              aria-label="Seek soundtrack"
              min="0"
              max={Math.max(1, duration)}
              step="0.1"
              value={Math.min(currentTime, Math.max(1, duration))}
              onChange={(event) => handleSeek(event.target.value)}
            />
          </div>

          <button
            type="button"
            className={cn('soundtrack-icon-button', shuffleEnabled && 'is-active')}
            aria-label="Toggle shuffle"
            aria-pressed={shuffleEnabled}
            onClick={() => setShuffleEnabled((value) => !value)}
          >
            <Shuffle size={16} />
          </button>

          <button
            type="button"
            className="soundtrack-icon-button"
            aria-label={muted ? 'Unmute soundtrack' : 'Mute soundtrack'}
            aria-pressed={muted}
            onClick={() => setMuted((value) => !value)}
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          <input
            className="soundtrack-volume"
            type="range"
            aria-label="Soundtrack volume"
            min="0"
            max="1"
            step="0.01"
            value={muted ? 0 : volume}
            onChange={(event) => {
              setMuted(false);
              setVolume(Number(event.target.value));
            }}
          />

          <button
            type="button"
            className={cn('soundtrack-icon-button', playlistOpen && 'is-active')}
            aria-label={playlistOpen ? 'Close playlist' : 'Open playlist'}
            aria-expanded={playlistOpen}
            onClick={() => setPlaylistOpen((value) => !value)}
          >
            <ListMusic size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
