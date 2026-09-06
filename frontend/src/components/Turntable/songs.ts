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
    id: 'anthony-hamilton',
    title: 'Back to Love',
    artist: 'Anthony Hamilton',
    youtubeId: 'Dq-1L2ldQr0',
  },
  {
    id: 'cat-stevens-yusuf',
    title: 'Roadsinger',
    artist: 'Cat Stevens / Yusuf',
    youtubeId: 'okpgpTp_zhI',
  },
]
