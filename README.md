# tacuae

Three versions of the Total Automation Co. LLC (TAC UAE) website, deployed to one server with Docker and GitHub Actions.

| Folder | What it is | Port on server |
|---|---|---|
| `tac-website` | Main site (blueprint hero) | 80 |
| `tac-site-b` | Alternative design | 8081 |
| `tac-site-c` | Animation edition + admin dashboard (`/admin`) | 8082 |

Each is a Vite + React + TypeScript + Tailwind site served by a small Express server.
See **[DEPLOY.md](DEPLOY.md)** for the CI/CD pipeline and server setup.
