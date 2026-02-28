import React, { useEffect, useRef } from 'react'

const Narrator = ({ textToSpeak }) => {
  const audioRef = useRef(null)

  useEffect(() => {
    if (!textToSpeak) return

    let objectUrl = null
    const fetchAudio = async () => {
      try {
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current = null
        }
        const response = await fetch('/api/narrate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: textToSpeak }),
        })
        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          console.warn('Narrator:', data.error || response.statusText)
          return
        }
        const blob = await response.blob()
        objectUrl = URL.createObjectURL(blob)
        const audio = new Audio(objectUrl)
        audioRef.current = audio
        await audio.play()
      } catch (err) {
        console.warn('Narrator:', err.message)
      }
    }
    fetchAudio()
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [textToSpeak])

  return null
}

export default Narrator
