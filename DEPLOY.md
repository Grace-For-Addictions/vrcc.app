# Deploying VRCC to Cloudflare Pages

The app is a static Vite build (frontend) talking to Supabase (backend). Cloudflare
Pages hosts the frontend and rebuilds automatically on every push to `main`.

## One-time setup (Cloudflare dashboard)

1. Go to **Cloudflare dashboard → Workers & Pages → Create → Pages →
   Connect to Git**.
2. Pick the repository **`grace-for-addictions/vrcc.app`** and the **`main`** branch.
3. Build settings:
   - **Framework preset:** None (or "Vite")
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - (Node version is pinned to 20 via `.nvmrc` — no action needed.)
4. **Environment variables** (Settings → Environment variables → Production):
   - `VITE_SUPABASE_URL` = `https://ykykeioydvtxpyreshhs.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = the project's **publishable (anon)** key
     (Supabase dashboard → Project Settings → API → Project API keys → `anon` /
     publishable). This key is public by design; access is controlled by RLS.
5. Click **Save and Deploy**. First build takes ~1–2 minutes.

## Custom domain

After the first deploy, Pages gives a `*.pages.dev` URL. To use `vrcc.app`:
**Pages project → Custom domains → Set up a custom domain → `vrcc.app`**.
Since the domain is already on Cloudflare, DNS is configured automatically.

## What's in the repo for this

- `public/_redirects` — SPA fallback (`/* -> /index.html 200`).
- `.nvmrc` — pins Node 20 for the build.
- Frontend entry: `src/main.jsx` → `src/mvp/MvpRoot.jsx`.
- Supabase client + project ref: `src/mvp/supabase.js`.

## Backend note

The Supabase project `ykykeioydvtxpyreshhs` already has the schema, the Gate 19B
migrations, and the RLS policies applied. No backend deploy step is needed — the
frontend connects directly.
