import { Link } from 'react-router-dom'
import { Sunrise, MoonStar, CalendarHeart, HousePlus, Waypoints } from 'lucide-react'

const hourNow = () => new Date().getHours()

export default function Home({ profile }) {
  const evening = hourNow() >= 16
  const firstName = (profile.display_name || profile.email || '').split(/[\s@]/)[0]

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-grace-800">
        {evening ? 'Good evening' : 'Good morning'}
        {firstName ? `, ${firstName}` : ''}
      </h1>

      <Link
        to={evening ? '/daily/evening' : '/daily/morning'}
        className="card block border-2 border-grace-300 hover:border-grace-500"
      >
        <div className="flex items-center gap-4">
          {evening ? (
            <MoonStar className="h-10 w-10 text-grace-600" aria-hidden />
          ) : (
            <Sunrise className="h-10 w-10 text-gold-500" aria-hidden />
          )}
          <div>
            <p className="text-lg font-semibold text-night-900">
              {evening ? 'Evening reflection' : 'Morning intentions'}
            </p>
            <p className="text-grace-600">
              {evening
                ? 'GROW check-in, one-question pulse, and your declaration.'
                : 'Set today’s intention — type it or just speak it.'}
            </p>
          </div>
        </div>
      </Link>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link to="/sessions/request" className="card hover:border-grace-300">
          <CalendarHeart className="mb-2 h-7 w-7 text-grace-600" aria-hidden />
          <p className="font-semibold">Request a session</p>
          <p className="text-sm text-grace-600">Video, phone, or in person.</p>
        </Link>
        <Link to="/daily/trends" className="card hover:border-grace-300">
          <Waypoints className="mb-2 h-7 w-7 text-grace-600" aria-hidden />
          <p className="font-semibold">Your growth map</p>
          <p className="text-sm text-grace-600">30 days of practice, visualized.</p>
        </Link>
        <Link to="/housing" className="card hover:border-grace-300">
          <HousePlus className="mb-2 h-7 w-7 text-grace-600" aria-hidden />
          <p className="font-semibold">Housing &amp; resources</p>
          <p className="text-sm text-grace-600">Beds, programs, and local help.</p>
        </Link>
      </div>
    </div>
  )
}
