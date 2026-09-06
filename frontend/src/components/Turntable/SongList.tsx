import type { Song } from './songs'

interface SongListProps {
  songs: Song[]
  selectedSongId: string | null
  disabled: boolean
  onSelect: (song: Song) => void
}

// Native radio inputs get keyboard navigation (arrow keys + Enter/Space)
// for free — no hand-rolled roving-tabindex needed.
const SongList = ({ songs, selectedSongId, disabled, onSelect }: SongListProps) => {
  return (
    <fieldset className='flex flex-row flex-wrap gap-2' disabled={disabled}>
      <legend className='sr-only'>Choose a song to play</legend>
      {songs.map(song => {
        const inputId = `turntable-song-${song.id}`
        const isSelected = song.id === selectedSongId
        return (
          <label
            key={song.id}
            htmlFor={inputId}
            className={`flex items-center gap-3 rounded-lg border px-4 py-2 cursor-pointer transition-colors ${
              isSelected
                ? 'border-primary bg-primary/10'
                : 'border-base-300 hover:border-primary/50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              id={inputId}
              type='radio'
              name='turntable-song'
              className='radio radio-primary radio-sm'
              checked={isSelected}
              disabled={disabled}
              onChange={() => onSelect(song)}
            />
            <span className='flex flex-col'>
              <span className='font-semibold'>{song.title}</span>
              <span className='text-sm text-base-content/70'>{song.artist}</span>
            </span>
          </label>
        )
      })}
    </fieldset>
  )
}

export default SongList
