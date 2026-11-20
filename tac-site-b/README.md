# TAC UAE – redesigned website

React + TypeScript + Vite + Tailwind v4, Framer Motion, GSAP/ScrollTrigger, Lenis. Small Express server for the enquiry form.

```bash
npm install
npm run dev            # site on :5173 (proxies /api to :8787)
npm run api            # in a second terminal – enquiry endpoint for dev
npm run build          # type-check, build, per-route HTML shells, sitemap.xml, robots.txt
npm start              # production: serves dist/ + POST /api/enquiry on $PORT (default 8787)
```

## Enquiry email
Set these env vars on the server. Without `SMTP_HOST`, enquiries are only saved to `server/data/enquiries.jsonl` (no email is sent).
`SMTP_HOST SMTP_PORT SMTP_SECURE SMTP_USER SMTP_PASS MAIL_FROM MAIL_TO` (MAIL_TO defaults to info@tacuae.com).
Spam protection: hidden honeypot, minimum fill time, per-IP rate limit (5/hour), server-side validation.

## Analytics
Build with `VITE_GA_ID=G-XXXX npm run build` to enable GA4. Nothing loads otherwise.

## Hero video
Drop a compressed muted MP4 at `public/media/hero.mp4` (≤ 8 MB, 1080p). It is used automatically on desktop/tablet
(skipped on phones, reduced-motion and data-saver); otherwise the photographic hero with animated blueprint grid is shown.

## Content
All business content lives in `src/data/content.ts` and `src/data/source.json` (verbatim from the old tacuae.com).
Images: `python3 scripts/images.py <folder-of-originals>` regenerates responsive WebP + `src/data/images.json`.

## URLs
Old Wix URLs are preserved or 301-redirected: `/about-us /services /projects /contact` unchanged;
`/asin-products/<slug>` and `/asin-products-1/<slug>` → `/products/<slug>`.
