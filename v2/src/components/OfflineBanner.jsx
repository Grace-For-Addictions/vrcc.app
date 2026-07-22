import { useEffect, useState } from 'react'
import { CloudOff } from 'lucide-react'

export default function OfflineBanner() {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => {
      window.removeEventListener('online', up)
      window.removeEventListener('offline', down)
    }
  }, [])

  if (online) return null
  return (
    <div className="flex items-center justify-center gap-2 bg-night-800 px-4 py-2 text-sm text-white" role="status">
      <CloudOff className="h-4 w-4" aria-hidden />
      You're offline — everything you save will sync when you're back.
    </div>
  )
}
