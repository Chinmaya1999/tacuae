# TAC UAE platform

Website, configurators, quotations, customer and builder dashboards and admin for Total Automation Co. LLC.
React + TypeScript + Vite + Tailwind front end, Express API, MongoDB, deployed with Docker and GitHub Actions.

## Layout
```
app/
  client/            front end
    public/          images, icons, manifest
    src/
      app/           routes
      features/      one folder per business area: admin, auth, bms, dashboard, demo, quotations, studio, website
      shared/        components, helpers and data used by several features
  server/
    src/             API in layers: routes → middlewares → validators → controllers → services → models
    tests/           unit/ and integration/
    scripts/         demo data
  tests/e2e/         browser tests
  scripts/           local run, build and pipeline helpers
deploy/              server setup, Docker Compose, Caddy, deploy and live checks
docs/                architecture, deployment, requirement gaps
.github/             pipeline, rollback, dependency updates
```

## Start
```bash
cd app
npm install
npm run dev        # http://localhost:5173 (needs MongoDB installed)
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
