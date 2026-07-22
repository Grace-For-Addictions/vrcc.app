import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function NotificationBell({ profile }) {
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)
  const navigate = useNavigate()
  const unread = items.filter((n) => !n.read_at).length

  useEffect(() => {
    let active = true
    async function load() {
      const { data } = await supabase
        .from('v2_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)
      if (active && data) setItems(data)
    }
    load()
    const channel = supabase
      .channel('v2-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'v2_notifications', filter: `recipient_id=eq.${profile.id}` },
        (payload) => setItems((prev) => [payload.new, ...prev].slice(0, 20))
      )
      .subscribe()
    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [profile.id])

  useEffect(() => {
    if (!open) return undefined
    const close = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  async function openItem(n) {
    setOpen(false)
    if (!n.read_at) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)))
      await supabase.from('v2_notifications').update({ read_at: new Date().toISOString() }).eq('id', n.id)
    }
    if (n.link_path) navigate(n.link_path)
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex min-h-touch min-w-touch items-center justify-center rounded-xl text-grace-600 hover:bg-grace-100"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" aria-hidden />
        {unread > 0 && (
          <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-500 px-1 text-[10px] font-bold text-night-900">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 max-w-[90vw] rounded-2xl border border-grace-100 bg-white p-2 shadow-lg">
          {items.length === 0 && (
            <p className="p-4 text-sm text-grace-500">Nothing yet — you're all caught up.</p>
          )}
          {items.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => openItem(n)}
              className={`block w-full rounded-xl p-3 text-left hover:bg-grace-50 ${
                n.read_at ? 'opacity-60' : ''
              }`}
            >
              <p className="text-sm font-semibold text-night-900">{n.title}</p>
              <p className="text-sm text-grace-600">{n.body}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
