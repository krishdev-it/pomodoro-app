import { useState, useEffect } from 'react'
import { api } from '../api/client'

export function useAudioFiles() {
  const [files, setFiles] = useState([])

  const fetchFiles = () => {
    api.get('/api/audio/files').then(d => setFiles(d.files)).catch(() => {})
  }

  useEffect(() => {
    fetchFiles()
    const id = setInterval(fetchFiles, 10_000)
    return () => clearInterval(id)
  }, [])

  return files
}
