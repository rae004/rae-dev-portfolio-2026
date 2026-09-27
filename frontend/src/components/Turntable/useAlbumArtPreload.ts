import { useEffect } from 'react'
import type { Song } from './songs'

// Warms the browser cache with every song's cover on mount, so the first
// delivery never flies in a half-loaded jacket. Eight WebP covers is a few
// hundred KB — cheap next to the YouTube iframe we load anyway. The Image
// objects are kept referenced for the effect's lifetime so a GC pass can't
// cancel an in-flight fetch.
export const useAlbumArtPreload = (songs: Song[]) => {
  useEffect(() => {
    if (typeof Image === 'undefined') return
    const images = songs.flatMap(song => {
      if (!song.albumArt) return []
      const img = new Image()
      img.decoding = 'async'
      img.src = song.albumArt.url
      return [img]
    })
    return () => {
      images.forEach(img => {
        img.src = ''
      })
    }
  }, [songs])
}
