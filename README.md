<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Kicero Website

The Kicero marketing site, contact form integration, and SEO infrastructure.

Kicero is a Scottish web design studio building affordable, high-end custom
websites for small businesses, startups and individuals across the UK.

## Run Locally

**Prerequisites:** Node.js 20+

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and fill in the values you need.
3. Run frontend: `npm run dev`
4. Run API server (contact form): `npm run dev:api`

## Build

The production build is now a **pre-rendered SPA**: each route ships as a
fully-rendered HTML file (with per-route `<title>`, meta, JSON-LD, etc.) that
hydrates to the React SPA on the client. This gives the marketing pages real
content for Google, Bing and social-card scrapers.

```bash
npm run build      # vite build + scripts/prerender.mjs (uses puppeteer)
npm run build:spa  # SPA-only build, no prerender (faster, dev iterations)
```

The first time you run `npm run build`, puppeteer will download a copy of
Chrome to `~/.cache/puppeteer` if it isn't already there.

## Deploy (Cloudflare Workers)

```bash
npx wrangler login
npx wrangler secret put SENDGRID_API_KEY --name kicero
npm run cf:deploy
```

The Worker (`worker.ts`) serves the prerendered static assets from `dist/` and
handles the `/api/contact` endpoint. SPA fallback is enabled
(`not_found_handling = "single-page-application"`) so unknown URLs fall back to
the home page where React Router renders the 404 page.

Optional Worker Settings > Variables:
- `CONTACT_TO_EMAIL` (default: `info@kicero.co.uk`)
- `CONTACT_FROM_EMAIL` (default: `noreply@kicero.co.uk`)
- `CONTACT_FROM_NAME` (default: `Website Contact Form`)

## SEO architecture

- **Per-route metadata** lives in [`src/seo/seoConfig.ts`](src/seo/seoConfig.ts).
- **Structured data (JSON-LD)** helpers live in
  [`src/seo/structuredData.ts`](src/seo/structuredData.ts) (Organization,
  LocalBusiness, WebSite, Service, Offer, BreadcrumbList, FAQ, BlogPosting,
  CreativeWork).
- The site-wide head (canonical, Organization/LocalBusiness/WebSite schemas) is
  applied by [`src/seo/SeoHead.tsx`](src/seo/SeoHead.tsx).
- Each page calls `usePageSeo()` from
  [`src/seo/usePageSeo.ts`](src/seo/usePageSeo.ts) for its own title,
  description, OG tags and additional schemas.
- The pre-render script lives at
  [`scripts/prerender.mjs`](scripts/prerender.mjs). It boots `vite preview`,
  visits every public route with puppeteer (using `?prerender=1` to skip the
  intro animation and analytics scripts), and writes per-route `index.html`
  files plus `dist/sitemap.xml`.
- `public/robots.txt` references the sitemap.
- `public/site.webmanifest`, `public/favicon.svg` and the PNG fallback live
  alongside the rest of the public assets.

To add a new prerendered page, add the route in
[`src/App.tsx`](src/App.tsx), an entry to `pageMeta` in
[`src/seo/seoConfig.ts`](src/seo/seoConfig.ts), and append the path to
the `routes` array in [`scripts/prerender.mjs`](scripts/prerender.mjs).

## Analytics (optional)

Both providers are off by default. Set the matching env var to enable.

- **Plausible** — set `VITE_PLAUSIBLE_DOMAIN` (e.g. `kicero.co.uk`). Override
  `VITE_PLAUSIBLE_SCRIPT` if you self-host. No cookie banner needed.
- **Microsoft Clarity** — set `VITE_CLARITY_PROJECT_ID` to your Clarity
  project ID for free heatmaps and session recordings.

Both scripts are skipped automatically during pre-render so they never end up
baked into the static HTML.

## Marketing setup checklist (one-off)

1. **Google Search Console** — add `https://kicero.co.uk`, verify, and submit
   `https://kicero.co.uk/sitemap.xml`.
2. **Bing Webmaster Tools** — same flow as above; sitemap autodiscovery picks
   it up from `robots.txt`.
3. **Google Business Profile** — create a profile (Scotland-based, UK service
   area). Even a UK-wide service business benefits significantly from a local
   listing.
4. **Social profiles** — once you spin up LinkedIn / X / Instagram, add their
   URLs to the `sameAs` array in
   [`src/seo/structuredData.ts`](src/seo/structuredData.ts) so they appear in
   the Knowledge Panel.
5. **Open Graph card** — `public/kicero-logo.png` is used as the default OG
   image. For best click-through, replace it with a 1200x630 PNG built from
   `public/og-image.svg` (or design a new card in Figma) and keep the same
   filename.

## Toggling the development disclaimer

The "Project Under Development" banner on the homepage is now gated behind
`VITE_SHOW_DEV_DISCLAIMER`. Set it to `true` in `.env` to show it during
development and remove (or `false`) it in production.
