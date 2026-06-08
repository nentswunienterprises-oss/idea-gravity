# Idea Gravity Public Website

A static public website for Idea Gravity, a division of Nenterprises (Pty) Ltd, built from `MANIFESTO.md`, `THE IDEA GRAVITY CONSTITUTION.md`, and the brand-system visual direction.

## Files

- `index.html` - page content, doctrine panels, pathway diagram, and constitution archive
- `offer.html` - Movement Communication offer page and Gravity Brief form
- `admin.html` - password-protected Gravity Brief dashboard
- `styles.css` - brand-system plates, responsive layout, orbit animation, and pathway composition
- `script.js` - mobile navigation, reveal effects, cursor glow
- `admin.js` - admin dashboard login, filtering, and status updates
- `assets/favicon.svg` — browser icon
- `assets/idea-gravity-card.svg` — Open Graph/social preview image

## Run locally

Install dependencies and start the local dev server:

```powershell
npm install
npm run dev
```

Then open the localhost URL shown in the terminal.

To verify a production build:

```powershell
npm run build
npm run preview
```

## Deploy to Vercel

The production site is live at:

- `https://ideagravity.co.za`
- `https://www.ideagravity.co.za`

This directory is linked to the Vercel project `ideagravity`.

Login once, then deploy production updates:

```powershell
npx vercel login
npx vercel link --project ideagravity --yes
npx vercel --prod --yes
```

If you prefer token-based deploys:

```powershell
$env:VERCEL_TOKEN="your_vercel_token"
npx vercel --prod --yes --token $env:VERCEL_TOKEN
```

## Gravity Brief Database

The `Submit Your Gravity Brief` form posts to `api/gravity-brief.js` and stores submissions in Supabase.

Create this table in Supabase SQL Editor:

```sql
create table if not exists public.gravity_briefs (
  id uuid primary key default gen_random_uuid(),
  organization text not null,
  contact_name text not null,
  email text not null,
  phone text not null,
  goal text not null,
  audience text not null,
  desired_actions text[] not null default '{}',
  channels text[] not null default '{}',
  support_type text not null,
  preferred_layer text not null,
  live_date text,
  deadline text,
  duration text,
  existing_materials text,
  budget_range text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);
```

If your table already exists, add these columns in the Supabase SQL editor:

```sql
alter table public.gravity_briefs add column if not exists live_date text;
alter table public.gravity_briefs add column if not exists duration text;
```

Then add these Vercel environment variables:

```powershell
npx vercel env add SUPABASE_URL production
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
npx vercel env add ADMIN_PASSWORD production
```

Redeploy after adding env vars:

```powershell
npx vercel --prod --yes
```

You can also open `index.html` directly in a browser, or serve the directory without npm:

```powershell
python -m http.server 8000
```

Then visit `http://localhost:8000`.
