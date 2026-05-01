<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Kicero Website

This repository contains the Kicero marketing site and contact form integration.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create `.env` and set:
   - `SENDGRID_API_KEY`
   - `CONTACT_TO_EMAIL`
   - `CONTACT_FROM_EMAIL`
   - `CONTACT_FROM_NAME`
3. Run frontend:
   `npm run dev`
4. Run API server:
   `npm run dev:api`

## Cloudflare Deployment Notes

For production contact form delivery on Cloudflare Workers:

1. Log in:
   - `npx wrangler login`
2. Set SendGrid key as a Worker secret:
   - `npx wrangler secret put SENDGRID_API_KEY --name kicero`
3. Deploy:
   - `npm run cf:deploy`
4. Optional variables in Worker Settings > Variables (can also be set with Wrangler):
   - `CONTACT_TO_EMAIL` (default: `info@kicero.co.uk`)
   - `CONTACT_FROM_EMAIL` (default: `noreply@kicero.co.uk`)
   - `CONTACT_FROM_NAME` (default: `Website Contact Form`)

This project serves static assets and the `/api/contact` endpoint from one Worker service (`kicero`), so you can manage variables directly in Worker settings.
