# TAC UAE website (Vite + React + TypeScript + Tailwind 4 + Framer Motion + Lenis + Express)

    npm install
    npm run dev          # site on :5173 (proxies /api to :8787)
    npm run api          # enquiry API on :8787 (needed for the form in dev)
    npm run build        # tsc + vite build + postbuild (per-route meta HTML, sitemap.xml, robots.txt)
    npm start            # serves dist/ + /api/enquiry on $PORT (default 8787)

## Enquiry form
POST /api/enquiry validates input, has a honeypot field, a minimum-fill-time check and an in-memory rate limit
(5/hour/IP). Every enquiry is appended to `server/enquiries.jsonl`. To also email it, set:
`SMTP_HOST SMTP_PORT SMTP_SECURE SMTP_USER SMTP_PASS SMTP_FROM ENQUIRY_TO` (default recipient info@tacuae.com).

## Content rules
All copy lives in `src/data/content.ts` and comes only from the original tacuae.com. Nothing is invented.

## To finish before launch
- Hero video: drop a compressed `public/videos/hero.mp4`. Until then the hero shows the Dubai skyline photo (Ken Burns). Video is skipped on touch devices, reduced-motion and data-saver.
- Product descriptions/specs, course schedule/certificate details and project descriptions were not on the original site — add them to content.ts when TAC supplies them.
- Images are TAC's originals from the old site (some small, e.g. products 361px). Replace with higher-resolution photography.
- Privacy / Terms pages are draft text; TAC must approve them. WhatsApp is omitted (no verified number).
- Redirects for legacy Wix URLs (/asin-products-1/*) are in server/index.mjs; mirror them in your host if not using this server.

## Version C — animation edition
Adds: animated scene for every service (`ServiceScene.tsx`), an animated illustration for each of the 12 products
(`ProductAnim.tsx`), photo⇄animation auto-crossfade (`MediaLoop`), an automatic 24-hour "day in a smart building"
scene (`DayCycle.tsx`) and an animated network canvas in the hero (`NetworkCanvas.tsx`).
Animations are illustrative concepts, labelled as such — they are not product photos or specifications.
