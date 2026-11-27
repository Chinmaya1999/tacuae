# TAC UAE Smart Experience Platform — gap analysis and implementation status

Compared against the Requirements & Proposal PDF (18 pages). App: `tac-site-c`. Status as of 26 Nov 2026,
**including** the "pricing → quotation" increment described below.

**Done** = meets the requirement · **Partial** = usable, with the stated gap · **Missing** · **Confirm** = blocked on TAC.
Priority: M must, S should, C could.

## 1. Architecture (kept as is)

| Layer | What exists |
|---|---|
| Web | React + TypeScript + Vite + Tailwind 4, React Router, Framer Motion, three.js / React Three Fiber, Zustand |
| API | Express 5: routes → middleware → validator → controller → service → model |
| Data | MongoDB (native driver, `tac_` collections); enquiries and page text in JSON files |
| Auth | Email + password (scrypt), signed HttpOnly session cookie, CSRF header, roles, rate limits |
| Already built before this work | Marketing site, enquiry inbox, customer/builder dashboards, 2D/3D room designer, simple estimate, manual quote per design, product price admin, simulated building-management (BMS) portal |
| Delivery | Docker, GitHub Actions, Caddy |

## 2. Added in this increment

| Workflow | Where |
|---|---|
| Product → Package (admin rules) | `constants/pricing.js`, `AdminPricing.tsx` |
| Package → Price (single engine, integer fils) | `services/pricing.engine.js` |
| Configuration → versioned quotation | `Configurator.tsx`, `services/quote.service.js` |
| Quotation → Sales (adjust, approve, finalise) | `AdminQuotations.tsx` |
| Unit template → bulk project quote | `ProjectQuote.tsx` |

The older "room design → manual quote" flow is unchanged and runs alongside.

## Demo layer (added for the client presentation)

Run `npm run demo` (own local database in `~/.tac-demo`; `-- --reset` for fresh data). The matrix below still
describes **production** readiness; the demo does not move a requirement to Done.

| Feature | In the demo | Works outside demo mode? |
|---|---|---|
| Simulation studio: 7 spaces, scenes, day/night, side-by-side, intercom, motion alarm | Real UI, simulated devices | Yes |
| Smart Score, savings, badges | Illustrative formula, editable assumptions | Yes (home quotations) |
| Booking, in-app notifications, analytics, product create/edit | Real, stored in MongoDB | Yes |
| Excel BOQ, branded proposal (browser PDF) | Real | Yes |
| Company team roles | Real server-side permissions; member creation shows a temporary password | Viewing yes, inviting no (needs email invitations) |
| Arabic / right-to-left | Dictionary preview of main screens; untranslated text stays English | No |
| OTP, Google, Apple | Simulated; only opens demo accounts | No |
| Assistant | Scripted keyword matching, not AI | No |
| CRM, WhatsApp, email, SMS, calendar | Log of what would be sent | No |
| Deposit payment | Button records a pretend deposit; no card data | No |
| iOS / Android apps | Not built. The website can be shown on a phone | No |

Never set `DEMO_MODE=true` on the live site.

## 3. Requirement matrix

### Public website
| ID | P | Status | Note |
|---|---|---|---|
| WEB-01 | M | Partial | Site exists in English. No Arabic/RTL, Blog or dedicated Solutions pages |
| WEB-02 | M | Partial | Admin edits product/project descriptions only; no CMS |
| WEB-03 | M | Partial | Portfolio pages; no filters or before/after media |
| WEB-04 | M | Partial | "Design my smart home" in navbar and footer; project-quote and expert CTAs in footer and mobile menu |
| WEB-05 | M | Missing | Product pages do not link to a simulation or configurator |
| WEB-06 | M | Partial | Sitemap, canonical, meta, organisation schema, some Wix redirects. Needs full old-URL list |
| WEB-07 | S | Partial | General enquiry form only |

### Accounts
| ID | P | Status | Note |
|---|---|---|---|
| AUTH-01 | M | Partial | Business sign-up captures company, licence, TRN, sector; only TRN format is validated, none mandatory |
| AUTH-02 | M | Partial | Email/password. OTP, Google, Apple need provider accounts (Confirm) |
| AUTH-03 | M | Missing | Multi-user company accounts |
| AUTH-04 | M | Done | Guest configures; draft survives registration (same browser) |
| AUTH-05 | M | Done | Admin verifies a business, then assigns trade/partner pricing |
| AUTH-06 | C | Missing | UAE PASS |

### Simulation studio
| ID | P | Status | Note |
|---|---|---|---|
| SIM-01 | M | Partial | Generic 3D rooms; no majlis, lobby or villa-exterior scenes |
| SIM-02 | M | Partial | Lights, AC, curtains, lock, camera; no video intercom or motion-alarm behaviour |
| SIM-03 | M | Partial | Day/night and scenes exist; Welcome, Sleep, Away, Majlis Guests not defined |
| SIM-04 | S | Missing | Energy / comfort overlays |
| SIM-05 | S | Partial | Audio device only |
| SIM-06 | M | Missing | Side-by-side rooms (price comparison exists for projects) |
| SIM-07 | M | Partial | 2D fallback without WebGL; no 360° images/video (needs assets) |
| SIM-08, 09 | C | Missing | Floor-plan upload, AR |

### B2C configurator
| ID | P | Status | Note |
|---|---|---|---|
| B2C-01 | M | Done | 8 steps, progress, back/edit, browser autosave. 3D preview is on the last step, not beside every step |
| B2C-02 | M | Done | Add/remove devices per room |
| B2C-03 | M | Done | BOM, installation, programming, VAT, optional AMC (rates are 0 until TAC sets them) |
| B2C-04 | M | Partial | Admin-set "Most popular / Best value" tags; no answer-based recommendation |
| B2C-05 | S | Missing | Upgrade prompts |
| B2C-06 | C | Missing | Instalments |

### B2B configurator
| ID | P | Status | Note |
|---|---|---|---|
| B2B-01, 02, 03 | M | Done | Project set-up, unit mix, one template per type |
| B2B-04 | M | Partial | Common-area devices from the catalogue; BMS/HVAC/access as a text brief (no products yet) |
| B2B-05 | M | Partial | Volume tiers, trade/partner lists, discounts. No project-specific price list |
| B2B-06 | M | Partial | 3 scenarios with total, per unit, per sq ft, quantities. No simulation |
| B2B-07 | S | Partial | Phase subtotals before discount/VAT; common areas not phased |
| B2B-08 | M | Partial | BOQ as CSV, PDF through browser print. No Excel, submittal pack or branded proposal |
| B2B-09 | S | Partial | Quote comments; no team invites or line comments |
| B2B-10 | M | Done | "Request final quotation" sends the whole project to sales |

### Pricing
| ID | P | Status | Note |
|---|---|---|---|
| PRC-01, 02 | M | Done | Rules engine, editable without code |
| PRC-03 | M | Partial | Retail, trade, partner. No project-specific list |
| PRC-04 | M | Done | Volume tiers, discount limit, admin approval |
| PRC-05 | M | Done | VAT shown separately, TRN, AED with optional USD/EUR (manually entered rate) |
| PRC-06 | M | Partial | Validity, terms, exclusions are global, not per quote type |
| PRC-07 | M | Done | Indicative label; only sales/admin issue final |
| PRC-08 | S | Missing | Promotions |

### Quotations
| ID | P | Status | Note |
|---|---|---|---|
| QTE-01 | M | Done | History, compare, duplicate (limits: 300 per user, 50 versions) |
| QTE-02 | M | Partial | Secure link, WhatsApp, email (user's own apps), print PDF. 3D opens from home-quote links only |
| QTE-03, 04 | M | Done | Comment without account; indicative vs final |
| QTE-05 | S | Partial | Signed-in accept; no OTP, e-signature or deposit |
| QTE-06 | S | Missing | Reminders |
| QTE-07 | S | Partial | Survey date and status; no project tracking |

### Gamification, assistant, portals, admin, integrations, apps
| ID | P | Status | Note |
|---|---|---|---|
| GAM-01, 02, 08 | M | Missing | Needs TAC-approved scoring and energy assumptions |
| GAM-03–07 | S/C | Missing | |
| AST-01, 02, 03, 04 | M | Missing | Needs AI provider, content, WhatsApp number, calendar |
| AST-05, 06 | C/S | Missing | |
| PRT-01 | M | Partial | Designs and quotations; no score, appointments, message inbox |
| PRT-02 | M | Partial | Project quotations; no team or approvals |
| PRT-03, 04 | S | Missing | |
| PRT-05 | M | Missing | Notifications |
| ADM-01 | M | Partial | Prices per segment, active flag; no create product, SKU, images, datasheets, 3D link |
| ADM-02 | M | Partial | Rule builder; no named custom packages |
| ADM-03 | M | Partial | Quote inbox, assignment, notes, edits, approval. Enquiries stay a separate list |
| ADM-04 | M | Partial | Page text only |
| ADM-05 | M | Partial | Quote counts and value by status; no funnel |
| ADM-06 | M | Partial | Sales role and audit log; no pre-sales role or fine-grained permissions |
| INT-01, 05, 06 | M | Missing | CRM, calendar, GA4/Pixel/GTM (Confirm accounts) |
| INT-02, 04 | S | Missing | ERP, payments |
| INT-03 | M | Partial | SMTP for enquiries only |
| APP-01–04 | M/S | Missing | No Flutter apps. API uses cookies; apps will need token sign-in |

### Non-functional
| Area | Status |
|---|---|
| Price recalculation < 300 ms | Engine tested with 2,000 units; network time not measured |
| Pricing test coverage ≥ 70% | Met for the engine (run `node --test --experimental-test-coverage`) |
| LCP, 3D load, 5,000 users, uptime, backups, penetration test, WCAG 2.1 AA | Not measured |
| PDPL, UAE region, consent, export/delete | Missing / confirm hosting region |

## 4. Database changes (additive only)

* New: `tac_quotes` (versions and comments embedded), `tac_pricing_settings`, `tac_pricing_rules`, `tac_audit`.
* `tac_users`: optional `business`, `verified`, `priceTier`; new role `sales`.
* `tac_products`: optional `prices.trade`, `prices.partner`, `accessoryPrice`.
* No migration needed. Settings and starter rules are inserted once on first start and never overwritten.

## 5. API changes

| Prefix | Who | Endpoints |
|---|---|---|
| `/api/configurator` | anyone | `GET options`, `POST estimate`, `POST compare` |
| `/api/quotations` | customer, builder | list, create, read, update, delete, `duplicate`, `share`, `comments`, `request-review`, `accept` |
| `/api/shared/:token` | link holder | read, `comments` |
| `/api/sales/quotations` | sales, admin | list, read, assign/note, `comments`, `adjust`, `discount-decision` (admin), `review`, `finalize`, `survey` |
| `/api/admin/pricing` | admin | read, `PUT settings`, `PUT rules`, `DELETE rules` |

## 6. Before go-live

1. Replace placeholder product prices and the starter package rules.
2. Set installation, programming, commissioning, cabling, margins, tiers, discount limits, TRN, terms, exclusions.
3. Check product wired/wireless flags: some starter rules add wireless-only items to wired homes (shown as warnings).
4. Then enable **Show indicative prices to guests** (off by default).
5. Serve over HTTPS on a domain.

## 7. Decisions needed from TAC

* Real catalogue, pricing rule book, gate/garage and BMS products.
* CRM, payment gateway, WhatsApp Business, SMS, AI provider, calendar.
* Should a partner's shared link show partner prices to the partner's client? It currently shows the quotation as priced.
* Merge the older room-design quote flow into quotations, or keep both?
* The existing BMS monitoring portal goes beyond the proposal; keep it?
* Approved formulas for Smart Score and energy savings.

## 8. Recommended order for the rest

1. Arabic/RTL (touches every screen, so do it before adding many more).
2. Simulation: missing rooms and scenes, side-by-side.
3. Product catalogue manager, branded PDF and Excel BOQ.
4. Notifications, CRM, WhatsApp, booking, analytics.
5. Company accounts with team roles.
6. Gamification, AI assistant, then mobile apps.

## 9. Acceptance checks for this increment

| Check | Covered by |
|---|---|
| Catalogue price change leaves issued quotations unchanged | integration test |
| Customer cannot read another customer's quotation or admin pricing | integration test |
| Over-limit discount is not applied until an admin approves | integration test |
| Final quotation needs review, approval and priced lines | integration + unit tests |
| Guests see no amounts unless enabled | integration + unit tests |
| Trade pricing only for verified businesses | integration + unit tests |

Run: `TEST_MONGODB_URI=mongodb://127.0.0.1:27017/tac_test npm test` (the database is dropped; its name must contain `test`).

## 10. Repository notes

* CI and `README.md` still list `tac-website` and `tac-site-b`, which are not in this repository.
* A private key file sits in the project folder (git-ignored). `docs/DEPLOYMENT.md` advises keeping it elsewhere.
* The last line of `.gitignore` is a pasted shell command.
