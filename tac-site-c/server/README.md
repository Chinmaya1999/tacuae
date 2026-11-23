# TAC server

Express API + static host for the built site (`../dist`). Layered so each file has one job:

```
src/
  config/        env.js (all process.env), database.js (MongoDB), cors.js
  constants/     roles, statuses, cookie + collection names
  routes/        URL → middleware chain → controller (index.js mounts everything under /api)
  middlewares/   auth (session + roles + CSRF), validate, rateLimit, error
  validators/    clean + check request input; throw ApiError(400)
  controllers/   thin HTTP layer: read req.valid, call a service, send ApiResponse
  services/      business rules (auth, designs + quoting, enquiries, content, users)
  models/        data access only (MongoDB collections tac_users / tac_designs, JSON files for enquiries/content)
  integrations/  email (SMTP); payment/ and thirdPartyApi/ are empty slots
  utils/         ApiError, ApiResponse, asyncHandler, generateToken, csv, sanitize, fileStore
  jobs/          scheduled work (none yet)
  app.js         builds the Express app (no side effects, so tests can import it)
  server.js      connects, seeds the first admin, listens, shuts down cleanly
tests/           unit/ (validators, hashing, csv) · integration/ (boots the app) · fixtures/
```

Request flow: `route → middlewares → validate → controller → service → model`.
Run `npm start` (loads `.env`) and `npm test` from `tac-site-c/`. See `../.env.example` for settings.
