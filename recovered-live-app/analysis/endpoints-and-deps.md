# Recovered external endpoints & dependencies

## Backend
- **Supabase** `ykykeioydvtxpyreshhs` — REST + realtime (wss). Public anon key embedded (by design).

## Third-party services (from bundle + CSP)
- **Stripe.js** (`js.stripe.com`) — payments wired (frame + script)
- **Ooma** (`office.ooma.com/meetings/gfa-vrcc-room-…`) — video meeting rooms
- **Maps:** `maps.iowa-recovery.org` (meeting finder, iframe), Leaflet (`unpkg.com/leaflet`),
  ArcGIS World Imagery + OpenStreetMap tiles
- **Weather:** `api.open-meteo.com`
- **Media:** Vimeo (`player.vimeo.com`)

## Iowa recovery resource directory (linked from within the app)
dhs.iowa.gov/ime · ivrs.iowa.gov · iwd.iowa.gov · iowalegalaid.org · 211iowa.org ·
iowa-recovery.org · oxfordhouse.org · samhsa.gov · weather.gov · ridedart.com ·
broadlawns.org · gciweb.org · changecourse.org · dmarcunited.org · graceforaddictions.org

## Dependency set (inferred from vendor chunks — for reconstructing package.json)
- `react` / `react-dom` (`vendor-react`)
- `recharts` (`vendor-charts`)
- `framer-motion` (`vendor-motion`)
- `three` (`vendor-three`) — WebGL/3D
- Radix-style UI primitives (`vendor-ui`)
- `@supabase/supabase-js` (`vendor-supabase`)
- `react-markdown` + `date-fns` + `leaflet` (referenced in bundle)
- Build: Vite (production, no sourcemaps); PWA manifest at `/manifest.json`

## Fonts (Google Fonts — the "Cosmic Grace" set)
Cinzel, Crimson Pro, Space Mono, Righteous, Courier Prime, Bungee, Sora, Poppins, Chakra Petch
