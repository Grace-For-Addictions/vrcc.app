import { useCallback, useRef, useState } from 'react'

/**
 * useVoiceInput — records a voice note via MediaRecorder and, where the
 * browser supports it, live-transcribes with the Web Speech API so rural users
 * on slow connections can speak instead of type. Returns both the audio blob
 * (for upload to the voice-notes bucket) and any transcript text.
 */
export function useVoiceInput({ onTranscript } = {}) {
  const [recording, setRecording] = useState(false)
  const [blob, setBlob] = useState(null)
  const [error, setError] = useState(null)
  const recorderRef = useRef(null)
  const speechRef = useRef(null)
  const chunksRef = useRef([])

  const supported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

  const start = useCallback(async () => {
    setError(null)
    setBlob(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []
      const rec = new MediaRecorder(stream)
      rec.ondataavailable = (e) => chunksRef.current.push(e.data)
      rec.onstop = () => {
        setBlob(new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' }))
        stream.getTracks().forEach((t) => t.stop())
      }
      rec.start()
      recorderRef.current = rec

      const Speech = window.SpeechRecognition || window.webkitSpeechRecognition
      if (Speech && onTranscript) {
        const sr = new Speech()
        sr.continuous = true
        sr.interimResults = false
        sr.onresult = (e) => {
          const text = Array.from(e.results).map((r) => r[0].transcript).join(' ')
          onTranscript(text)
        }
        sr.start()
        speechRef.current = sr
      }
      setRecording(true)
    } catch (err) {
      setError(err.message || 'Microphone unavailable')
    }
  }, [onTranscript])

  const stop = useCallback(() => {
    recorderRef.current?.stop()
    speechRef.current?.stop()
    setRecording(false)
  }, [])

  return { supported, recording, blob, error, start, stop }
}
