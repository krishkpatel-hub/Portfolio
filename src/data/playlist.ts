export interface PlaylistTrack {
  id: string;
  title: string;
  artist: string;
  source: string;
  sourceUrl?: string;
  license: string;
  attribution: string;
  duration?: number;
}

export const playlistLabel = 'Portfolio Soundtrack';

export const playlistTracks: PlaylistTrack[] = Array.from({ length: 8 }, (_, index) => {
  const trackNumber = index + 1;
  const padded = String(trackNumber).padStart(2, '0');

  return {
    id: `beat-${padded}`,
    title: `Beat ${padded}`,
    artist: 'Portfolio Soundtrack Library',
    license: 'Update license',
    attribution: 'Update attribution',
    sourceUrl: undefined,
    source: `/audio/beat-${padded}.mp3`,
  };
});
