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
handles API routes (`/api/contact`, `/api/questionnaire`, etc.). Each public
URL must be listed in `scripts/prerender.mjs` so Cloudflare can serve a real
`index.html` (including `/questionnaire` and `/client-upload`, which stay out
of the sitemap because they are `noindex`).

Optional Worker Settings > Variables:
- `CONTACT_TO_EMAIL` (default: `info@kicero.co.uk`) — contact form submissions
- `QUESTIONNAIRE_TO_EMAIL` (default: `forms@kicero.co.uk`) — questionnaire submission notifications
- `CONTACT_FROM_EMAIL` (default: `noreply@kicero.co.uk`) — SendGrid “from” address for outbound mail
- `CONTACT_FROM_NAME` (default: `Website Contact Form`)

SendGrid **click tracking** must stay off for questionnaire emails (links go directly to
`https://kicero.co.uk/client-upload?...`). Rewritten `url####.kicero.co.uk` tracking URLs
trigger browser impersonation warnings and can break signed upload tokens. The API sets
`tracking_settings.click_tracking.enable: false` per message; also disable it under SendGrid
→ Settings → Tracking → Click Tracking so older templates cannot re-enable it.

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
`publicRoutes` or `privateRoutes` in [`scripts/prerender.mjs`](scripts/prerender.mjs)
(use `privateRoutes` for `noindex` flows that should not appear in the sitemap).

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
   `https://kicero.co.uk/sitemap.xml`. After each deploy that touches JSON-LD,
   use **URL Inspection** on `/` and `/about` (test live URL) and **Request
   indexing** if discovery is slow.
2. **Bing Webmaster Tools** — same flow as above; sitemap autodiscovery picks
   it up from `robots.txt`.
3. **Google Business Profile** — create a profile (Scotland-based, UK service
   area). Even a UK-wide service business benefits significantly from a local
   listing.
4. **Wikidata / other `sameAs` profiles** — Wikidata ([Q139890611](https://www.wikidata.org/wiki/Q139890611))
   is included in Organization JSON-LD by default (`src/seo/seoConfig.ts`). For more
   URLs at build time, set `VITE_ORGANIZATION_SAME_AS` in `.env` (comma-separated:
   LinkedIn company, Companies House, …). Each profile should also list
   **https://kicero.co.uk** as its official website.
5. **Open Graph card** — default social image is `public/og-image.svg` (1200×630).
   For maximum scraper compatibility you can add a matching `og-image.png`.

## Toggling the development disclaimer

The "Project Under Development" banner on the homepage is now gated behind
`VITE_SHOW_DEV_DISCLAIMER`. Set it to `true` in `.env` to show it during
development and remove (or `false`) it in production.
