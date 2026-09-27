export interface SongLabel {
  // Base colour of the record label; ink colour is derived from it.
  color: string
  // The real rights holder — printed with ℗ on the bottom arc. This is the
  // only ownership claim on the disc, and it's theirs, not ours.
  recordLabel: string
  year: number
  // Your role on the track, printed under the artist. Optional, but this
  // line is the whole point of the disc.
  credit?: string
}

export interface Song {
  id: string
  title: string
  artist: string
  youtubeId: string
  label: SongLabel
}

// PLACEHOLDER label data — fill in the real record label, release year and
// your credit for each track. Colours are a starting palette; change freely.
const DEFAULT_LABEL = 'Independent'

// Prototype data only — hardcoded until the WordPress media-projects API
// actually returns `_music_online_links` (see documentation/portfolio_content_plan.md
// and the media-projects REST controller). Swap this for a real data fetch
// once that plumbing is fixed.
export const TURNTABLE_SONGS: Song[] = [
  {
    id: 'anthony-hamilton-pass-me-over',
    title: 'Pass Me Over',
    artist: 'Anthony Hamilton',
    youtubeId: 'Dq-1L2ldQr0',
    label: {
      color: '#c8102e',
      recordLabel: 'So So Def & Zomba',
      year: 2005,
      credit: 'Engineer',
    },
  },
  {
    id: 'cat-stevens-yusuf',
    title: 'Everytime I Dream',
    artist: 'Cat Stevens / Yusuf',
    youtubeId: 'okpgpTp_zhI',
    label: {
      color: '#1f5fa8',
      recordLabel: 'Cat-O-Log Records',
      year: 2009,
      credit: 'Engineer',
    },
  },
  {
    id: 'jonas-sees-in-color',
    title: 'All My Friends',
    artist: 'Jonas Sees in Color',
    youtubeId: 'GuObwY2tQio',
    label: { color: '#f2b705', recordLabel: DEFAULT_LABEL, year: 2013, credit: 'Engineer' },
  },
  {
    id: 'save-our-stereo',
    title: 'When A Heart Breaks',
    artist: 's.o.stereo',
    youtubeId: 'm58wuFWpxtM',
    label: {
      color: '#2e8b57',
      recordLabel: 'Wildtuck Entertainment',
      year: 2011,
      credit: 'Engineer',
    },
  },
  {
    id: 'donald-lawrence-tri-city-singers',
    title: 'Giants (Live)',
    artist: 'Donald Lawrence & The Tri-City Singers',
    youtubeId: '1Xyv5Ato7L8',
    label: {
      color: '#5b2a86',
      recordLabel: 'Universal Music Group',
      year: 2006,
      credit: 'Engineer',
    },
  },
  {
    id: 'flashlights',
    title: 'Failure',
    artist: 'Flashlights',
    youtubeId: 'qS81lrF6eYU',
    label: {
      color: '#f2f0e9',
      recordLabel: 'Hard Rock Records',
      year: 2011,
      credit: 'Engineer',
    },
  },
  {
    id: 'anthony-hamilton-cool',
    title: 'Cool',
    artist: 'Anthony Hamilton (ft. David Banner)',
    youtubeId: 'Y54W0HQ5qss',
    label: {
      color: '#e8641b',
      recordLabel: 'So So Def & Zomba',
      year: 2008,
      credit: 'Engineer',
    },
  },
  {
    id: 'city-wolf',
    title: 'Where is my mind',
    artist: 'City Wolf',
    youtubeId: 'EM1Q0eUZipc',
    label: {
      color: '#1a1a1a',
      recordLabel: 'WaterTower Music',
      year: 2009,
      credit: 'Engineer',
    },
  },
]

// Catalog numbers are derived from list position — RD-001, RD-002, … — so
// they stay stable and unique without anyone maintaining them by hand.
export const catalogNumberFor = (songs: Song[], songId: string): string | undefined => {
  const index = songs.findIndex(s => s.id === songId)
  return index === -1 ? undefined : `RD-${String(index + 1).padStart(3, '0')}`
}
