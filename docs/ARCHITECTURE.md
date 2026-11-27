# Architecture

One application, one container: Express serves the API under `/api` and the built React site on the same origin.

## Front end (`app/client/src`)
| Folder | Holds |
|---|---|
| `app/` | route table |
| `features/<name>/` | `pages/`, `components/`, `lib/`, `data/` for one business area |
| `shared/` | used by several features |

Put new code in its feature. Move it to `shared/` only when a second feature needs it.

## Server (`app/server/src`)
`route → middlewares → validator → controller → service → model`

Only `models/` talk to the database, only `config/env.js` reads environment variables, and every request body is
rebuilt by a validator. Security headers are in `middlewares/security.middleware.js`; add a third-party source there
before using it.

## Tests
| Command (in `app/`) | Covers | Needs |
|---|---|---|
| `npm run typecheck` | front-end types | – |
| `npm run test:unit` | pricing, validation, tokens, pipeline counter | – |
| `npm run test:integration` | API, accounts, designs, quotations, building management, admin, security | MongoDB |
| `npm run test:e2e` | pages and key journeys in a browser | MongoDB, `npm run build`, `npx playwright install chromium` |

Database tests need `TEST_MONGODB_URI` with "test" in the database name, e.g. `mongodb://127.0.0.1:27017/tac_test`.
Without it they are skipped. Not covered automatically: real Google and SMS sign-in, real e-mail delivery.
