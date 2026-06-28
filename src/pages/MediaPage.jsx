import { useState, useRef } from 'react'
import { useAudioFiles } from '../hooks/useAudioFiles'
import { usePlaylist } from '../hooks/usePlaylist'
import { useAudio } from '../hooks/useAudio'
import { extractYouTubeId, formatBytes } from '../utils/time'

function AudioFileList({ files, playing, onPlay, onStop, onSelect, selectedForEnd }) {
  if (files.length === 0) {
    return (
      <p className="text-muted" style={{ padding: '24px 0' }}>
        No audio files found. Drop mp3/wav/ogg/flac files into your{' '}
        <code style={{ color: 'var(--clr-accent)', fontFamily: 'var(--font-mono)' }}>audio/</code>{' '}
        data folder — they'll appear here automatically.
      </p>
    )
  }
  return (
    <div>
      {files.map(f => (
        <div key={f.name} className={`audio-file-card${playing === f.name ? ' selected' : ''}`}>
          <div style={{ flex: 1 }}>
            <div className="audio-file-name">{f.name}</div>
            <div className="audio-file-size">{formatBytes(f.size_bytes)}</div>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => playing === f.name ? onStop() : onPlay(f.url, f.name)}
          >
            {playing === f.name ? '■ Stop' : '▶ Play'}
          </button>
          <button
            className={`btn btn-sm ${selectedForEnd === f.name ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => onSelect(f.name)}
            title="Use as session-end sound"
            style={{ fontSize: 11 }}
          >
            🔔 {selectedForEnd === f.name ? 'Alert' : 'Set Alert'}
          </button>
        </div>
      ))}
    </div>
  )
}

function PlaylistManager({ playlist, onAdd, onRemove, onPlay, currentId }) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [adding, setAdding] = useState(false)

  const handleAdd = async () => {
    if (!url.trim()) return
    const id = extractYouTubeId(url)
    if (!id) { alert('Invalid YouTube URL'); return }
    setAdding(true)
    await onAdd(url.trim(), title.trim() || url.trim())
    setUrl(''); setTitle('')
    setAdding(false)
  }

  return (
    <div>
      {/* Add form */}
      <div className="card mb-4">
        <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: 200 }}>
            <label>YouTube URL</label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label>Title (optional)</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Lo-fi beats"
            />
          </div>
          <div style={{ alignSelf: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleAdd} disabled={adding || !url}>
              Add
            </button>
          </div>
        </div>
      </div>

      {playlist.length === 0 ? (
        <p className="text-muted">No videos in playlist. Add a YouTube link above.</p>
      ) : (
        <div>
          {playlist.map(item => (
            <div key={item.id} className={`playlist-item${currentId === item.id ? ' active' : ''}`}>
              <div style={{ flex: 1 }}>
                <div className="playlist-item-title">{item.title}</div>
                <div style={{ fontSize: 11, color: 'var(--clr-text-muted)', marginTop: 2 }}>
                  {item.url.slice(0, 50)}…
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => onPlay(item)}>
                {currentId === item.id ? '■ Stop' : '▶ Play'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => onRemove(item.id)}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function YouTubeEmbed({ videoId }) {
  if (!videoId) return null
  const src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`
  return (
    <div className="card mt-4" style={{ padding: 0, overflow: 'hidden', borderRadius: 'var(--r-lg)' }}>
      <iframe
        src={src}
        title="YouTube video"
        width="100%"
        height="360"
        frameBorder="0"
        allow="autoplay; encrypted-media"
        referrerPolicy="no-referrer"
        allowFullScreen
      />
    </div>
  )
}

export function MediaPage({ addToast }) {
  const [tab, setTab] = useState('audio')
  const [playing, setPlaying] = useState(null)
  const [selectedForEnd, setSelectedForEnd] = useState(null)
  const [currentYT, setCurrentYT] = useState(null)
  const files = useAudioFiles()
  const { playlist, add, remove } = usePlaylist()
  const { playAmbient, stopAmbient } = useAudio()

  const handlePlay = (url, name) => {
    playAmbient(url)
    setPlaying(name)
  }

  const handleStop = () => {
    stopAmbient()
    setPlaying(null)
  }

  const handleYTPlay = (item) => {
    if (currentYT?.id === item.id) {
      setCurrentYT(null)
    } else {
      setCurrentYT(item)
    }
  }

  const handleSelectEnd = (name) => {
    setSelectedForEnd(prev => prev === name ? null : name)
    addToast(`"${name}" set as session-end alert`, 'success')
  }

  return (
    <div className="page">
      <h1 className="page-title">Media</h1>

      <div className="media-tabs">
        <button className={`media-tab${tab === 'audio' ? ' active' : ''}`} onClick={() => setTab('audio')}>
          Ambient Audio
        </button>
        <button className={`media-tab${tab === 'youtube' ? ' active' : ''}`} onClick={() => setTab('youtube')}>
          YouTube
        </button>
      </div>

      {tab === 'audio' && (
        <div>
          <p className="text-muted mb-4">
            Drop audio files into your <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--clr-accent)' }}>audio/</code> folder.
            They appear here automatically within 10 seconds.
          </p>
          <AudioFileList
            files={files}
            playing={playing}
            onPlay={handlePlay}
            onStop={handleStop}
            onSelect={handleSelectEnd}
            selectedForEnd={selectedForEnd}
          />
        </div>
      )}

      {tab === 'youtube' && (
        <div>
          <PlaylistManager
            playlist={playlist}
            onAdd={add}
            onRemove={remove}
            onPlay={handleYTPlay}
            currentId={currentYT?.id}
          />
          {currentYT && (
            <YouTubeEmbed videoId={extractYouTubeId(currentYT.url)} />
          )}
        </div>
      )}
    </div>
  )
}
