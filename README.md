# Idea Gravity Public Website

A static public website for Idea Gravity, built from `MANIFESTO.md`, `THE IDEA GRAVITY CONSTITUTION.md`, and the brand-system visual direction.

## Files

- `index.html` — page content, doctrine panels, pathway diagram, and constitution archive
- `styles.css` — brand-system plates, responsive layout, orbit animation, and pathway composition
- `script.js` — mobile navigation, reveal effects, cursor glow
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

You can also open `index.html` directly in a browser, or serve the directory without npm:

```powershell
python -m http.server 8000
```

Then visit `http://localhost:8000`.
