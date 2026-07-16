import React from 'react'
import ReactDOM from 'react-dom/client'
import MvpRoot from '@/mvp/MvpRoot.jsx'
import '@/index.css'

// GFA VRCC — focused MVP on Supabase v6 (no Base44).
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MvpRoot />
  </React.StrictMode>
)
