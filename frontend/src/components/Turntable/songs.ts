export interface Song {
  id: string
  title: string
  artist: string
  youtubeId: string
}

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
  },
  {
    id: 'cat-stevens-yusuf',
    title: 'Everytime I Dream',
    artist: 'Cat Stevens / Yusuf',
    youtubeId: 'okpgpTp_zhI',
  },
  {
    id: 'jonas-sees-in-color',
    title: 'All My Friends',
    artist: 'Jonas Sees in Color',
    youtubeId: 'GuObwY2tQio',
  },
  {
    id: 'save-our-stereo',
    title: 'When A Heart Breaks',
    artist: 's.o.stereo',
    youtubeId: 'm58wuFWpxtM',
  },
  {
    id: 'donald-lawrence-tri-city-singers',
    title: 'Giants (Live)',
    artist: 'Donald Lawrence & The Tri-City Singers',
    youtubeId: '1Xyv5Ato7L8',
  },
  {
    id: 'flashlights',
    title: 'Failure',
    artist: 'Flashlights',
    youtubeId: 'qS81lrF6eYU',
  },
  {
    id: 'anthony-hamilton-cool',
    title: 'Cool',
    artist: 'Anthony Hamilton (ft. David Banner)',
    youtubeId: 'Y54W0HQ5qss',
  },
]
