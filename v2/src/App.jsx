import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Auth from './components/Auth'
import Home from './pages/Home'
import RequestSession from './features/sessions/RequestSession'
import SessionList from './features/sessions/SessionList'
import CoachQueue from './features/sessions/CoachQueue'
import SessionFeedback from './features/sessions/SessionFeedback'
import MorningIntentions from './features/daily/MorningIntentions'
import EveningReflection from './features/daily/EveningReflection'
import TrendMap from './features/daily/TrendMap'
import ResourceHub from './features/housing/ResourceHub'
import ProgramDetail from './features/housing/ProgramDetail'
import ApplicationWizard from './features/housing/ApplicationWizard'
import MyApplications from './features/housing/MyApplications'
import BedBoard from './features/housing/BedBoard'
import { supabase, currentProfile } from './lib/supabase'

export default function App() {
  const [profile, setProfile] = useState(undefined) // undefined = loading, null = signed out

  useEffect(() => {
    currentProfile().then(setProfile)
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      currentProfile().then(setProfile)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  if (profile === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center text-grace-600">
        Loading…
      </div>
    )
  }
  if (profile === null) return <Auth />

  const isCoach = ['coach', 'admin'].includes(profile.role)
  const isHousingStaff = ['housing_manager', 'navigator', 'admin'].includes(profile.role)

  return (
    <Layout profile={profile}>
      <Routes>
        <Route path="/" element={<Home profile={profile} />} />
        <Route path="/sessions" element={<SessionList profile={profile} />} />
        <Route path="/sessions/request" element={<RequestSession profile={profile} />} />
        <Route path="/sessions/:id/feedback" element={<SessionFeedback profile={profile} />} />
        {isCoach && <Route path="/coach/queue" element={<CoachQueue profile={profile} />} />}
        <Route path="/daily/morning" element={<MorningIntentions profile={profile} />} />
        <Route path="/daily/evening" element={<EveningReflection profile={profile} />} />
        <Route path="/daily/trends" element={<TrendMap profile={profile} />} />
        <Route path="/housing" element={<ResourceHub profile={profile} />} />
        <Route path="/housing/programs/:id" element={<ProgramDetail profile={profile} />} />
        <Route path="/housing/programs/:id/apply" element={<ApplicationWizard profile={profile} />} />
        <Route path="/housing/applications" element={<MyApplications profile={profile} />} />
        {isHousingStaff && <Route path="/housing/manage" element={<BedBoard profile={profile} />} />}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
