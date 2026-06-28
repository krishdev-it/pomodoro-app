import { useRef, useCallback, useEffect } from 'react'

function makeFallbackBeep() {
  try {
    const ctx = new OfflineAudioContext(1, 44100 * 0.4, 44100)
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.5, 0)
    gain.gain.exponentialRampToValueAtTime(0.001, 0.35)
    osc.start(0)
    osc.stop(0.35)
    return ctx.startRendering().then(buf => {
      const wav = audioBufferToWav(buf)
      return URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }))
    })
  } catch {
    return Promise.resolve(null)
  }
}

function audioBufferToWav(buffer) {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const format = 1
  const bitDepth = 16
  const bytesPerSample = bitDepth / 8
  const blockAlign = numChannels * bytesPerSample
  const data = buffer.getChannelData(0)
  const samples = new Int16Array(data.length)
  for (let i = 0; i < data.length; i++) {
    samples[i] = Math.max(-32768, Math.min(32767, Math.round(data[i] * 32767)))
  }
  const headerSize = 44
  const ab = new ArrayBuffer(headerSize + samples.byteLength)
  const view = new DataView(ab)
  const write = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }
  write(0, 'RIFF')
  view.setUint32(4, 36 + samples.byteLength, true)
  write(8, 'WAVE')
  write(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, format, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitDepth, true)
  write(36, 'data')
  view.setUint32(40, samples.byteLength, true)
  new Int16Array(ab, 44).set(samples)
  return ab
}

export function useAudio() {
  const ambientRef = useRef(new Audio())
  const endSoundRef = useRef(new Audio())
  const fallbackUrl = useRef(null)

  useEffect(() => {
    makeFallbackBeep().then(url => { fallbackUrl.current = url })
    return () => {
      ambientRef.current.pause()
      endSoundRef.current.pause()
    }
  }, [])

  const playAmbient = useCallback((url, volume = 0.5) => {
    const el = ambientRef.current
    el.src = url
    el.volume = volume
    el.loop = true
    el.play().catch(() => {})
  }, [])

  const stopAmbient = useCallback(() => {
    ambientRef.current.pause()
    ambientRef.current.currentTime = 0
  }, [])

  const setAmbientVolume = useCallback((v) => {
    ambientRef.current.volume = v
  }, [])

  const playEndSound = useCallback((url, volume = 0.8) => {
    const el = endSoundRef.current
    const src = url || fallbackUrl.current
    if (!src) return
    el.src = src
    el.volume = volume
    el.loop = false
    el.play().catch(() => {
      if (fallbackUrl.current && src !== fallbackUrl.current) {
        el.src = fallbackUrl.current
        el.play().catch(() => {})
      }
    })
  }, [])

  return { playAmbient, stopAmbient, setAmbientVolume, playEndSound }
}
